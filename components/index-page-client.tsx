'use client';

import Link from 'next/link';
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

type IndexPageClientProps = {
  initialIntegration: TaskSource;
  initialSearchParams: string;
};

export default function IndexPageClient({
  initialIntegration,
  initialSearchParams
}: IndexPageClientProps) {
  const [allProjects, setAllProjects] = useState<UnifiedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIntegration, setActiveIntegration] = useState<TaskSource | null>(null);

  const handleIntegrationSelect = (selectedIntegration: TaskSource) => {
    setActiveIntegration(selectedIntegration);
    // Keep the integration menu for future use (e.g., filtering)
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
      <div className="flex fixed right-2 top-2 sm:right-4 sm:top-4 justify-end mb-2 space-x-2 z-10">
        <Link
          href="/config"
          className="p-2 rounded-full hover:bg-[#252525] transition-colors"
          title="Settings"
        >
          <GearIcon className="text-zinc-400 size-4" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col mt-8 sm:mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] h-full gap-2 bg-background text-foreground">
          <div className="h-full overflow-y-auto flex flex-col space-y-4 px-2 sm:px-4">
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Projects</h2>
              <p className="text-zinc-400 mt-1 text-sm sm:text-base">
                All projects your are involved in.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto pb-4">
              <UnifiedProjectsList
                projects={allProjects}
                isLoading={isLoading}
                error={error}
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
    </div>
  );
}
