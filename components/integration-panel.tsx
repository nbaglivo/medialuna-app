import { GitHubLogoIcon, CheckIcon } from "@radix-ui/react-icons";
import Image from "next/image";

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

enum TaskSource {
  Github = 'github',
  Linear = 'linear',
  App = 'app'
}

type IntegrationMenuProps = {
  onItemSelected: (selectedIntegration: TaskSource) => void;
  activeIntegration: TaskSource | null;
}

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
                activeIntegration === TaskSource.App
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSource.App)}
              aria-label="In-app tasks"
            >
              <CheckIcon className="size-4" />
              {activeIntegration === TaskSource.App && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-purple-500 rounded-r-sm" />
              )}
            </button>

            <button
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
                activeIntegration === TaskSource.Github
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSource.Github)}
              aria-label="GitHub Integration"
            >
              <GitHubLogoIcon className="size-4" />
              {activeIntegration === TaskSource.Github && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-pink-500 rounded-r-sm" />
              )}
            </button>
      
            <button
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
                activeIntegration === TaskSource.Linear
                  ? "bg-zinc-700"
                  : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
              )}
              onClick={() => onItemSelected(TaskSource.Linear)}
              aria-label="Linear Integration"
            >
              <div className="font-bold">
                <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
              </div>
              {activeIntegration === TaskSource.Linear && (
                <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-indigo-500 rounded-r-sm" />
              )}
            </button>
      </div>
    </div>
  );
};

export default IntegrationMenu;
