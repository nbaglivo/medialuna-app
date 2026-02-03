import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { TaskSources, type TaskSource } from '@/lib/task-source';

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type IntegrationMenuProps = {
  onItemSelected: (selectedIntegration: TaskSource) => void;
  activeIntegration: TaskSource | null;
};

const IntegrationMenu = ({
  onItemSelected,
  activeIntegration
}: IntegrationMenuProps) => {
  return (
    <div className="flex flex-col items-center w-10 sm:w-12 border-l border-[#262626] h-full">
      <div className="flex-1 flex flex-col mx-1 sm:mx-2 items-center pt-6 sm:pt-10 gap-3 sm:gap-5">
            <button
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
                activeIntegration === TaskSources.App
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSources.App)}
              aria-label="In-app tasks"
            >
              <img src="/logo-transparent.png" alt="medialuna icon" width={32} height={32} className="" />
              {activeIntegration === TaskSources.App && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-purple-500 rounded-r-sm" />
              )}
            </button>

            <button
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
                activeIntegration === TaskSources.Github
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSources.Github)}
              aria-label="GitHub Integration"
            >
              <GitHubLogoIcon className="size-4" />
              {activeIntegration === TaskSources.Github && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-pink-500 rounded-r-sm" />
              )}
            </button>
      
            <button
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
                activeIntegration === TaskSources.Linear
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSources.Linear)}
              aria-label="Linear Integration"
            >
              <div className="font-bold">
                <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
              </div>
              {activeIntegration === TaskSources.Linear && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-indigo-500 rounded-r-sm" />
              )}
            </button>
      </div>
    </div>
  );
};

export default IntegrationMenu;
