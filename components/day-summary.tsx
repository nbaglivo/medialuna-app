'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, CheckIcon, CopyIcon } from '@radix-ui/react-icons';
import {
  type WorkLogItem,
  type DaySummaryStatistics,
  getWorkLog,
  saveDaySummary,
  clearCurrentDay,
  getFocusSession,
} from '@/lib/focus-storage';
import { type UnifiedProject, type LinearProject, normalizeLinearProject } from '@/lib/task-source';

export default function DaySummary() {
  const router = useRouter();
  const [workItems, setWorkItems] = useState<WorkLogItem[]>([]);
  const [focusedProjects, setFocusedProjects] = useState<UnifiedProject[]>([]);
  const [reflection, setReflection] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    // Get work items
    const items = getWorkLog();
    setWorkItems(items);

    // Get focused projects
    const session = getFocusSession();
    if (session) {
      try {
        const linearResponse = await fetch('/api/linear/projects');
        if (linearResponse.ok) {
          const linearPayload = await linearResponse.json();
          const linearProjects: LinearProject[] = linearPayload.projects ?? [];
          const normalizedLinear = linearProjects.map(normalizeLinearProject);
          
          const focused = normalizedLinear.filter(project => 
            session.projectIds.includes(project.id)
          );
          setFocusedProjects(focused);
        }
      } catch (error) {
        console.error('Error loading projects:', error);
      }
    }

    setIsLoading(false);
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
    router.push('/focus');
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
          onClick={() => router.push('/focus')}
          className="px-4 py-2 rounded-md bg-purple-500 text-white hover:bg-purple-600 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const stats = calculateStatistics();

  return (
    <div className="">
      {/* Header */}
      <div className="border-b border-[#333] px-4 py-4 sm:px-6">
        <div className="">
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="p-2 rounded-full hover:bg-[#252525] transition-colors"
              title="Back to focus"
            >
              <ArrowLeftIcon className="text-zinc-400 size-4" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white">Daily Shutdown</h1>
              <p className="text-sm text-zinc-400 mt-0.5">
                Wrap up your day and reflect on your work
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 sm:px-6">
        <div className="space-y-6 flex-col">

          {/* Reflection Section */}
          <div className="">
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Today was..."
              className="w-full h-32 px-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-transparent resize-none"
            />
          </div>

          <div className="flex gap-4">
            {/* Statistics Panel */}
            <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Today's Statistics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-[#111] rounded-lg p-4 border border-[#333]">
                  <div className="text-2xl font-bold text-white">{stats.totalTasks}</div>
                  <div className="text-xs text-zinc-400 mt-1">Total Tasks</div>
                </div>
                
                <div className="bg-[#111] rounded-lg p-4 border border-[#333]">
                  <div className="text-2xl font-bold text-purple-400">
                    {stats.projectBreakdown.reduce((sum, p) => sum + p.count, 0)}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">Planned</div>
                </div>
                
                <div className="bg-[#111] rounded-lg p-4 border border-[#333]">
                  <div className="text-2xl font-bold text-amber-400">{stats.unplannedCount}</div>
                  <div className="text-xs text-zinc-400 mt-1">Unplanned</div>
                </div>
                
                {stats.totalMinutes > 0 && (
                  <div className="bg-[#111] rounded-lg p-4 border border-[#333]">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatDuration(stats.totalMinutes)}
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">Total Time</div>
                  </div>
                )}
              </div>

              {/* Project Breakdown */}
              {stats.projectBreakdown.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-300">Projects Worked On</h3>
                  {stats.projectBreakdown.map((proj) => {
                    const project = focusedProjects.find(p => p.id === proj.projectId);
                    const percentage = Math.round((proj.count / stats.totalTasks) * 100);
                    
                    return (
                      <div key={proj.projectId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            {project?.icon && <span>{project.icon}</span>}
                            <span className="text-white">{proj.projectName}</span>
                          </div>
                          <div className="text-zinc-400">
                            {proj.count} task{proj.count !== 1 ? 's' : ''}
                            {proj.minutes > 0 && ` • ${formatDuration(proj.minutes)}`}
                          </div>
                        </div>
                        <div className="h-2 bg-[#111] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Work Items List */}
            <div className="rounded-lg border border-[#333] bg-[#1a1a1a] p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Tasks Completed</h2>
              <div className="space-y-2">
                {workItems.map((item) => {
                  const project = focusedProjects.find(p => p.id === item.projectId);
                  const isUnplanned = item.projectId === null;

                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 p-3 rounded-lg border border-[#333] bg-[#111]"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="size-5 rounded-full bg-green-500/10 border-2 border-green-500/50 flex items-center justify-center">
                          <CheckIcon className="size-3 text-green-400" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{item.description}</p>
                        
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {isUnplanned ? (
                            <>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                Unplanned
                              </span>
                              {item.unplannedReason && (
                                <span className="text-xs text-zinc-500">
                                  {item.unplannedReason}
                                </span>
                              )}
                            </>
                          ) : project ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 border border-purple-500/20 text-purple-400">
                              {project.icon && <span>{project.icon}</span>}
                              {project.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 border border-zinc-500/20 text-zinc-500">
                              Unknown project
                            </span>
                          )}
                          {item.duration && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 border border-blue-500/20 text-blue-400">
                              {formatDuration(item.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
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
        </div>
      </div> 
    </div>
  );
}
