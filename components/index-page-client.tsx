'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UnifiedProjectsList from '@/components/unified-projects-list';
import { type UnifiedProject } from '@/lib/task-source';
import { startDayPlan, closeDayPlan, type OpenDayPlan } from '@/app/actions/day-plan';

type IndexPageClientProps = {
  allProjects: UnifiedProject[];
  statusOptions: string[];
  openDayPlan: OpenDayPlan | null;
};

export default function IndexPageClient({ allProjects, statusOptions, openDayPlan }: IndexPageClientProps) {
  const router = useRouter();
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isStarting, setIsStarting] = useState(false);
  const [isClosingPlan, setIsClosingPlan] = useState(false);
  const [showOpenPlanPrompt, setShowOpenPlanPrompt] = useState(!!openDayPlan);

  const filteredProjects =
    selectedStatus === 'All'
      ? allProjects
      : allProjects.filter((project) => project.state === selectedStatus);

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjectIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleUnselectAll = () => {
    setSelectedProjectIds(new Set());
  };

  const handleStartFocus = async () => {
    if (selectedProjectIds.size === 0) return;

    setIsStarting(true);

    try {
      const planDate = new Date().toISOString().split('T')[0];
      const selectedProjects = allProjects.filter(project => selectedProjectIds.has(project.id));
      await startDayPlan({
        planDate,
        projects: selectedProjects.map(project => ({
          projectId: project.id,
          projectSource: project.source,
          projectName: project.name,
        })),
      });

      // Navigate to day work page
      router.push('/day-work');
    } catch (error) {
      console.error('Failed to start day plan:', error);
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (selectedStatus !== 'All' && !statusOptions.includes(selectedStatus)) {
      setSelectedStatus('All');
    }
  }, [selectedStatus, statusOptions]);

  const handleContinueOpenPlan = () => {
    router.push('/day-work');
  };

  const handleCloseOpenPlan = async () => {
    if (!openDayPlan) return;

    setIsClosingPlan(true);
    try {
      await closeDayPlan(openDayPlan.id);
      setShowOpenPlanPrompt(false);
    } catch (error) {
      console.error('Failed to close day plan:', error);
    } finally {
      setIsClosingPlan(false);
    }
  };

  // Show the open plan prompt if there's an active day plan
  if (showOpenPlanPrompt && openDayPlan) {
    const planDate = new Date(openDayPlan.planDate);
    const formattedDate = planDate.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    return (
      <div className="flex flex-col items-center justify-center h-full w-full px-4">
        <div className="max-w-md w-full bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
          <div className="mb-6">
            <div className="size-16 mx-auto mb-4 rounded-full bg-purple-500/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-8 text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">You have an open day</h2>
            <p className="text-zinc-400 text-sm">
              You started a day plan on {formattedDate}. Would you like to continue working on it or close it and start fresh?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleContinueOpenPlan}
              className="w-full px-4 py-3 rounded-lg bg-purple-500 text-white font-medium hover:bg-purple-600 transition-colors"
            >
              Continue Working
            </button>
            <button
              onClick={handleCloseOpenPlan}
              disabled={isClosingPlan}
              className="w-full px-4 py-3 rounded-lg bg-[#252525] text-zinc-300 font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClosingPlan ? 'Closing...' : 'Close and Start Fresh'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full px-4 md:px-8 lg:px-16 overflow-y-auto">
      <div className="flex-1 flex flex-col mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] h-full gap-2 bg-background text-foreground">
          <div className="h-full overflow-y-auto flex flex-col space-y-4 px-2 sm:px-4">
            <div className="flex-shrink-0">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Projects</h2>
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                    These are the projects you are involved in. Select the projects you want to focus on for today.
                  </p>
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <label className="text-xs text-zinc-400" htmlFor="project-status-filter">
                    Status
                  </label>
                  <select
                    id="project-status-filter"
                    value={selectedStatus}
                    onChange={(event) => setSelectedStatus(event.target.value)}
                    className="w-40 rounded-md border border-[#333] bg-[#1e1e1e] px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="All">All</option>
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              <UnifiedProjectsList
                projects={filteredProjects}
                selectedProjectIds={selectedProjectIds}
                onProjectToggle={handleProjectToggle}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Focus Session Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-zinc-300">
              {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              type="button"
              onClick={handleUnselectAll}
              disabled={selectedProjectIds.size === 0}
              className="text-xs text-zinc-400 transition-colors hover:text-zinc-200 disabled:cursor-not-allowed disabled:text-zinc-600"
            >
              Unselect all
            </button>
          </div>
          <button
            onClick={handleStartFocus}
            disabled={selectedProjectIds.size === 0 || isStarting}
            className="px-6 py-2.5 border border-[#333] cursor-pointer rounded-md text-white text-sm font-medium transition-colors"
          >
            {isStarting ? 'Starting...' : 'Start Day'}
          </button>
        </div>
      </div>
    </div>
  );
}
