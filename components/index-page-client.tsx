'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GearIcon } from '@radix-ui/react-icons';
import { useEffect, useState } from 'react';
import IntegrationMenu from '@/components/integration-panel';
import UnifiedProjectsList from '@/components/unified-projects-list';
import { 
  TaskSources, 
  type TaskSource, 
  type UnifiedProject, 
  type LinearProject,
  normalizeLinearProject 
} from '@/lib/task-source';
import { saveFocusSession } from '@/lib/focus-storage';


export default function IndexPageClient() {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<TaskSource | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<Set<string>>(new Set());

  const handleIntegrationSelect = (selectedIntegration: TaskSource) => {
    setActiveIntegration(selectedIntegration);
    // Keep the integration menu for future use (e.g., filtering)
  };

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

  const handleStartFocus = () => {
    if (selectedProjectIds.size === 0) return;
    
    // Save to session storage
    saveFocusSession(Array.from(selectedProjectIds));
    
    // Navigate to focus page
    router.push('/focus');
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedProjectIds(new Set());
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
                <button
                  onClick={toggleSelectionMode}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectionMode
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : 'bg-[#1e1e1e] text-zinc-300 border border-[#333] hover:bg-[#252525]'
                  }`}
                >
                  {selectionMode ? 'Cancel' : 'Select Focus'}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              <UnifiedProjectsList
                projects={allProjects}
                isLoading={isLoading}
                error={error}
                selectionMode={selectionMode}
                selectedProjectIds={selectedProjectIds}
                onProjectToggle={handleProjectToggle}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <IntegrationMenu
              onItemSelected={handleIntegrationSelect}
              activeIntegration={activeIntegration}
            />
          </div>
        </div>
      </div>

      {/* Focus Session Action Bar */}
      {selectionMode && selectedProjectIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#333] p-4 z-20">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <span className="text-sm text-zinc-300">
              {selectedProjectIds.size} project{selectedProjectIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleStartFocus}
              className="px-6 py-2.5 rounded-md bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
            >
              Start Focus Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
