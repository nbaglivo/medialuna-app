'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import {
  type DaySummaryStatistics,
  saveDaySummary,
  clearCurrentDay,
  getDayPlanSession,
  setWorkLogItems,
} from '@/lib/focus-storage';
import { TaskSources, type TaskSource, type UnifiedProject } from '@/lib/task-source';
import { getDayPlanProjects, getDayPlanWorkLog, updateDayPlanReflection, type WorkLogItem } from '@/app/actions/day-plan';

export default function DaySummary() {
  const router = useRouter();
  const [workItems, setWorkItems] = useState<WorkLogItem[]>([]);
  const [focusedProjects, setFocusedProjects] = useState<UnifiedProject[]>([]);
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [dayPlanId, setDayPlanId] = useState<string | null>(null);
  const reflectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const session = getDayPlanSession();
    if (!session) {
      router.replace('/');
      return;
    }

    setDayPlanId(session.dayPlanId);
    loadData(session.dayPlanId);
  }, [router]);

  useEffect(() => {
    if (isLoading) return;

    if (reflectionTimeoutRef.current) {
      clearTimeout(reflectionTimeoutRef.current);
    }

    reflectionTimeoutRef.current = setTimeout(() => {
      handleReflectionAutosave().catch(error => {
        console.error('Failed to autosave reflection:', error);
      });
    }, 500);

    return () => {
      if (reflectionTimeoutRef.current) {
        clearTimeout(reflectionTimeoutRef.current);
      }
    };
  }, [reflection, isLoading, focusedProjects]);

  const loadData = async (activeDayPlanId: string) => {
    setIsLoading(true);

    try {
      const [dayPlanProjects, dayPlanWorkLog] = await Promise.all([
        getDayPlanProjects(activeDayPlanId),
        getDayPlanWorkLog(activeDayPlanId),
      ]);

      const items = dayPlanWorkLog.map(item => ({
        id: item.id,
        description: item.description,
        timestamp: item.timestamp,
        projectId: item.projectId,
        unplannedReason: item.unplannedReason ?? undefined,
        mentionedIssues: item.mentionedIssues ?? undefined,
        duration: item.durationMinutes ?? undefined,
      }));

      setWorkItems(items);
      setWorkLogItems(items);

      const focused = dayPlanProjects.map(project => ({
        id: project.projectId,
        name: project.projectName ?? 'Unknown Project',
        url: '',
        source: (project.projectSource ? project.projectSource as TaskSource : TaskSources.App),
      }));

      setFocusedProjects(focused);
    } catch (error) {
      console.error('Error loading day plan data:', error);
    }

    setIsLoading(false);
  };

  const ensureDayPlanId = async () => {
    const session = getDayPlanSession();
    if (session) {
      setDayPlanId(session.dayPlanId);
      return session.dayPlanId;
    }
    return null;
  };

  const handleReflectionAutosave = async () => {
    const dayPlanIdValue = dayPlanId ?? await ensureDayPlanId();
    if (!dayPlanIdValue) return;

    await updateDayPlanReflection({
      dayPlanId: dayPlanIdValue,
      reflection,
    });
  };

  const calculateStatistics = (): DaySummaryStatistics => {
    const totalTasks = workItems.length;
    const totalMinutes = workItems.reduce((sum, item) => sum + (item.duration || 0), 0);
    
    // Group by project
    const projectMap = new Map<string, { count: number; minutes: number; name: string }>();
    let unplannedCount = 0;

    workItems.forEach(item => {
      if (item.projectId === null) {
        unplannedCount++;
      } else {
        const existing = projectMap.get(item.projectId) || { count: 0, minutes: 0, name: '' };
        const project = focusedProjects.find(p => p.id === item.projectId);
        projectMap.set(item.projectId, {
          count: existing.count + 1,
          minutes: existing.minutes + (item.duration || 0),
          name: project?.name || 'Unknown Project',
        });
      }
    });

    const projectBreakdown = Array.from(projectMap.entries()).map(([projectId, data]) => ({
      projectId,
      projectName: data.name,
      count: data.count,
      minutes: data.minutes,
    }));

    return {
      totalTasks,
      totalMinutes,
      projectBreakdown,
      unplannedCount,
    };
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${mins}m`;
    }
  };

  const generateShareText = (): string => {
    const stats = calculateStatistics();
    const lines: string[] = [];
    
    lines.push("Today's Work:");
    lines.push('');

    // Group tasks by project
    if (stats.projectBreakdown.length > 0) {
      lines.push('Projects:');
      stats.projectBreakdown.forEach(proj => {
        const projectTasks = workItems.filter(item => item.projectId === proj.projectId);
        projectTasks.forEach(task => {
          const duration = task.duration ? ` (${formatDuration(task.duration)})` : '';
          lines.push(`• [${proj.projectName}] ${task.description}${duration}`);
        });
      });
      lines.push('');
    }

    // Unplanned tasks
    const unplannedTasks = workItems.filter(item => item.projectId === null);
    if (unplannedTasks.length > 0) {
      lines.push('Unplanned:');
      unplannedTasks.forEach(task => {
        const reason = task.unplannedReason ? ` (${task.unplannedReason})` : '';
        const duration = task.duration ? ` - ${formatDuration(task.duration)}` : '';
        lines.push(`• ${task.description}${reason}${duration}`);
      });
      lines.push('');
    }

    // Add statistics
    if (stats.totalMinutes > 0) {
      lines.push(`Total time: ${formatDuration(stats.totalMinutes)}`);
      lines.push('');
    }

    // Add reflection
    if (reflection.trim()) {
      lines.push('Reflection:');
      lines.push(reflection.trim());
    }

    return lines.join('\n');
  };

  const handleCopyToClipboard = async () => {
    const text = generateShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleComplete = () => {
    setIsSaving(true);
    const stats = calculateStatistics();
    saveDaySummary(reflection, workItems, stats);
    clearCurrentDay();
    router.push('/');
  };

  const handleCancel = () => {
    const session = getDayPlanSession();
    router.push(session ? '/day-work' : '/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-2 text-zinc-400">
          <div className="size-4 border-2 border-t-transparent border-zinc-400 rounded-full animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (workItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-zinc-400 mb-4">No work logged today</p>
        <button
          onClick={handleCancel}
          className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const stats = calculateStatistics();
  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const dayEmoji = '😂';
  const plannedMinutes = stats.projectBreakdown.reduce((sum, proj) => sum + proj.minutes, 0);
  const plannedTasks = stats.projectBreakdown.reduce((sum, proj) => sum + proj.count, 0);
  const reflectionPreview = reflection.trim() || 'Today was...';

  const formatDurationClock = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <div className="flex items-start gap-4 mb-10">
          <button
            onClick={handleCancel}
            className="mt-1 p-2 rounded-full hover:bg-[#252525] transition-colors"
            title="Back to focus"
          >
            <ArrowLeftIcon className="text-zinc-400 size-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold">{dayName}</h1>
              <span className="text-2xl">{dayEmoji}</span>
            </div>
            <p className="text-sm text-zinc-400 mt-2">{reflectionPreview}</p>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <main className="space-y-6">
            {/* Reflection */}
            <section className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Today was..."
                className="w-full h-28 text-sm bg-transparent placeholder-zinc-500 focus:outline-none resize-none"
              />
            </section>

            {/* Highlights */}
            <section className="space-y-3">
              <div>
                <h2 className="text-xl font-semibold">Highlights</h2>
                <p className="text-sm text-zinc-500">What were the noteworthy things you did today?</p>
              </div>
              <div className="space-y-3">
                {workItems.map((item) => {
                  const project = focusedProjects.find(p => p.id === item.projectId);
                  const isUnplanned = item.projectId === null;

                  return (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4"
                    >
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <span className="inline-flex size-2 rounded-full bg-amber-400/80" />
                        <span className="flex items-center gap-1">
                          {project?.icon && <span>{project.icon}</span>}
                          {project?.name || (isUnplanned ? 'Unplanned' : 'Unknown project')}
                        </span>
                      </div>
                      <p className="mt-2 text-base text-white">{item.description}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {isUnplanned && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                            Unplanned
                          </span>
                        )}
                        {item.unplannedReason && (
                          <span className="text-xs text-zinc-500">{item.unplannedReason}</span>
                        )}
                        {item.duration && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                            {formatDuration(item.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button className="w-full text-left rounded-xl border border-dashed border-[#2a2a2a] bg-transparent px-4 py-3 text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-colors">
                  + Add a highlight...
                </button>
              </div>
            </section>

            {/* Other activities */}
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">Other activities</h3>
                <span className="text-zinc-500 text-sm">Visible only to you.</span>
              </div>
              <p className="text-sm text-zinc-500">
                Things you’ve interacted with today.
              </p>
              <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] px-4 py-6 text-center text-sm text-zinc-400">
                All activities have been included as highlights.
              </div>
            </section>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleCopyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#1e1e1e] text-white border border-[#333] hover:bg-[#252525] transition-colors"
              >
                {copySuccess ? (
                  <>
                    <CheckIcon className="size-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-4" />
                    Copy to Clipboard
                  </>
                )}
              </button>

              <button
                onClick={handleComplete}
                disabled={isSaving}
                className="flex-1 px-4 py-3 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Complete & Close'}
              </button>
            </div>

            <div className="text-center">
              <button
                onClick={handleCancel}
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Cancel and go back
              </button>
            </div>
          </main>

          <aside className="space-y-6">
            {/* User identity */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-lg bg-[#2a2a2a] flex items-center justify-center text-sm font-semibold text-white">
                  N
                </div>
                <div>
                  <p className="text-sm text-zinc-400">N</p>
                  <p className="text-sm font-medium text-white">Nicolas Baglivo</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-zinc-500">Worked</div>
                <div className="text-sm font-semibold">{formatDurationClock(stats.totalMinutes)}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs uppercase tracking-widest text-zinc-500">Planned</div>
                <div className="text-sm font-semibold">{formatDurationClock(plannedMinutes)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-[#2a2a2a] bg-[#151515] p-3">
                  <div className="text-lg font-semibold">{stats.totalTasks}</div>
                  <div className="text-xs text-zinc-500 mt-1">Total tasks</div>
                </div>
                <div className="rounded-lg border border-[#2a2a2a] bg-[#151515] p-3">
                  <div className="text-lg font-semibold">{plannedTasks}</div>
                  <div className="text-xs text-zinc-500 mt-1">Planned</div>
                </div>
                <div className="rounded-lg border border-[#2a2a2a] bg-[#151515] p-3">
                  <div className="text-lg font-semibold">{stats.unplannedCount}</div>
                  <div className="text-xs text-zinc-500 mt-1">Unplanned</div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-xl border border-[#2a2a2a] bg-[#1a1a1a] p-4">
              <h3 className="text-sm font-semibold text-zinc-200 mb-3">Timeline</h3>
              <div className="space-y-3">
                {workItems.map((item) => {
                  const project = focusedProjects.find(p => p.id === item.projectId);
                  const label = project?.name || (item.projectId === null ? 'Unplanned' : 'Unknown');

                  return (
                    <div key={item.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-2 size-2 rounded-full bg-purple-400/80" />
                      <div className="flex-1">
                        <p className="text-zinc-200">{item.description}</p>
                        <p className="text-xs text-zinc-500">{label}</p>
                      </div>
                      <div className="text-xs text-zinc-500">
                        {item.duration ? formatDuration(item.duration) : '—'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
