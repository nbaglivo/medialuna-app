'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PlusIcon, GearIcon } from '@radix-ui/react-icons';
import { useEffect, useMemo, useState } from 'react';
import AppTaskPanel from '@/components/app-task-panel';
import IntegrationMenu from '@/components/integration-panel';
import LinearTaskPanel from '@/components/linear-task-panel';
import GithubTaskPanel from '@/components/github-task-panel';
import { TaskSources, type TaskSource } from '@/lib/task-source';

type LinearIssue = {
  id: string;
  identifier: string;
  title: string;
  url: string;
  priority?: number | null;
  estimate?: number | null;
  state?: {
    name: string;
  } | null;
  project?: {
    name: string;
  } | null;
};

type IndexPageClientProps = {
  initialIntegration: TaskSource;
  initialSearchParams: string;
};

export default function IndexPageClient({
  initialIntegration,
  initialSearchParams
}: IndexPageClientProps) {
  const router = useRouter();
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [linearIssues, setLinearIssues] = useState<LinearIssue[]>([]);
  const [linearError, setLinearError] = useState<string | null>(null);
  const [linearNeedsConnection, setLinearNeedsConnection] = useState(false);
  const [activeIntegration, setActiveIntegration] = useState<TaskSource>(initialIntegration);
  const [totalHours, setTotalHours] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSearchParams, setCurrentSearchParams] = useState(
    () => new URLSearchParams(initialSearchParams)
  );

  const handleIntegrationSelect = (selectedIntegration: TaskSource) => {
    setActiveIntegration(selectedIntegration);

    const nextParams = new URLSearchParams(currentSearchParams.toString());
    nextParams.set('integration', selectedIntegration);
    setCurrentSearchParams(nextParams);
    router.replace(`/?${nextParams.toString()}`);
  };

  useEffect(() => {
    if (activeIntegration !== TaskSources.Linear) {
      return;
    }

    const abortController = new AbortController();

    async function loadLinearIssues() {
      setIsLoading(true);
      setLinearError(null);
      setLinearNeedsConnection(false);

      try {
        const response = await fetch('/api/linear/issues', {
          signal: abortController.signal
        });
        const payload = await response.json();

        if (!response.ok) {
          if (response.status === 401) {
            setLinearNeedsConnection(true);
            setLinearIssues([]);
            return;
          }
          throw new Error(payload?.error ?? 'Failed to load Linear issues.');
        }

        setLinearIssues(payload.issues ?? []);
      } catch (error) {
        if (!abortController.signal.aborted) {
          const message = error instanceof Error ? error.message : 'Failed to load Linear issues.';
          setLinearError(message);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadLinearIssues();

    return () => {
      abortController.abort();
    };
  }, [activeIntegration]);

  const visibleTasks = useMemo(() => {
    if (activeIntegration !== TaskSources.Linear) {
      return [];
    }

    return linearIssues;
  }, [activeIntegration, linearIssues]);

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
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_auto] h-full gap-2 bg-background text-foreground">
          <div className={`h-full overflow-y-auto flex flex-col space-y-4 px-2 sm:px-4 transition-all duration-300 ease-in-out ${!isPanelVisible ? 'lg:col-span-2' : ''}`}>
            <div className="flex-shrink-0">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Today's Plan</h2>
              <p className="text-zinc-400 mt-1 text-sm sm:text-base">Total hours committed today: {totalHours.toFixed(1)}h</p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="text-muted-foreground">Loading tasks...</div>
              ) : linearError ? (
                <div className="text-sm text-red-400">{linearError}</div>
              ) : (
                // <TaskList
                //   tasks={dailyPlanTasks}
                //   onCompleteTask={completeTask}
                //   onMoveToBacklog={handleRemoveFromDailyPlan}
                // />
                <div className="text-muted-foreground">Tasks list</div>
              )}
            </div>

            <div className="flex-shrink-0">
              <button
                // onClick={() => navigate("/add-task")}
                // variant="outline"
                className="w-full flex items-center py-1 px-3 rounded-md bg-[#1e1e1e] hover:bg-[#252525] text-zinc-400 hover:text-zinc-300 transition-colors border border-[#333] text-sm sm:text-base"
              >
                <PlusIcon className="mr-2 size-4" />
                Add new task
              </button>
            </div>
          </div>

          <div className={`overflow-y-auto transition-all duration-300 ease-in-out ${isPanelVisible
              ? 'opacity-100 translate-x-0 w-full lg:w-[432px] xl:w-[432px]'
              : 'opacity-0 translate-x-full w-0 hidden lg:block'
            }`}>
            {activeIntegration === TaskSources.Github && (
              <GithubTaskPanel />
            )}
            {activeIntegration === TaskSources.Linear && (
              <LinearTaskPanel
                issues={visibleTasks}
                isLoading={isLoading}
                error={linearError}
                needsConnection={linearNeedsConnection}
              />
            )}
            {activeIntegration === TaskSources.App && (
              <AppTaskPanel />
            )}
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
