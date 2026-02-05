'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UnifiedProjectsList from '@/components/unified-projects-list';
import {
  type UnifiedProject, 
  type LinearProject,
  normalizeLinearProject 
} from '@/lib/task-source';
import { saveDayPlanSession, saveFocusSession } from '@/lib/focus-storage';
import { startDayPlan } from '@/app/actions/day-plan';


export default function IndexPageClient() {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());
  const [isStarting, setIsStarting] = useState(false);

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

  const handleStartFocus = async () => {
    if (selectedProjectIds.size === 0) return;

    setIsStarting(true);

    try {
      const planDate = new Date().toISOString().split('T')[0];
      const selectedProjects = allProjects.filter(project => selectedProjectIds.has(project.id));
      const { dayPlanId } = await startDayPlan({
        planDate,
        projects: selectedProjects.map(project => ({
          projectId: project.id,
          projectSource: project.source,
          projectName: project.name,
        })),
      });

      saveDayPlanSession(dayPlanId, planDate);

      // Save to session storage
      saveFocusSession(Array.from(selectedProjectIds));

      // Navigate to day work page
      router.push('/day-work');
    } catch (error) {
      console.error('Failed to start day plan:', error);
      setIsStarting(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();

    async function loadAllProjects() {
      setIsLoading(true);
      setError(null);
      
      const projectsFromAllSources: UnifiedProject[] = [];

      // Fetch Linear projects
      try {
        const linearResponse = await fetch('/api/linear/projects', {
          signal: abortController.signal
        });

        if (linearResponse.ok) {
          const linearPayload = await linearResponse.json();
          const linearProjects: LinearProject[] = linearPayload.projects ?? [];
          const normalizedLinear = linearProjects.map(normalizeLinearProject);
          projectsFromAllSources.push(...normalizedLinear);
        } else if (linearResponse.status !== 401) {
          // Ignore 401 (not connected), but log other errors
          console.warn('Failed to load Linear projects:', linearResponse.status);
        }
      } catch (error) {
        if (!abortController.signal.aborted) {
          console.warn('Error loading Linear projects:', error);
        }
      }

      // TODO: Add GitHub projects fetch when API is ready
      // TODO: Add App projects fetch when API is ready

      if (!abortController.signal.aborted) {
        setAllProjects(projectsFromAllSources);
        setIsLoading(false);
      }
    }

    loadAllProjects();

    return () => {
      abortController.abort();
    };
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] h-full gap-2 bg-background text-foreground">
          <div className="h-full overflow-y-auto flex flex-col space-y-4 px-2 sm:px-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Projects</h2>
                  <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                    All projects your are involved in.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              <UnifiedProjectsList
                projects={allProjects}
                isLoading={isLoading}
                error={error}
                selectionMode={true}
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
            <span className="text-sm text-zinc-300">
              {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} selected
            </span>
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
