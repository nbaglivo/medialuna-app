import Link from "next/link";
import { cookies } from "next/headers";
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { TaskSources, type TaskSource } from '@/lib/task-source';
const TOKEN_COOKIE = "linear_access_token";
const ISSUE_STATE_COOKIE = "linear_issue_state";
const ISSUE_QUERY_COOKIE = "linear_issue_query";
const ISSUE_ASSIGNEE_COOKIE = "linear_issue_assignee";

type ReadonlyRequestCookiesType = Awaited<ReturnType<typeof cookies>>;

export default async function ConfigPage({ searchParams }: { searchParams: Promise<{ integration: TaskSource | null }> }) {
  const cookieStore = await cookies();
  const integration = (await searchParams).integration;

  return (
    <div className="w-full h-full flex px-6 py-12">
      <div className="w-full max-w-xl flex gap-6">
        <div className="border-r border-[#262626] ">
          <IntegrationMenu activeIntegration={integration} />
        </div>
        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Integrations</h2>
          <div className="flex flex-col gap-4 min-w-md rounded-lg border border-[#262626] bg-[#151515] p-4 space-y-4">
            {integration === TaskSources.Linear && <LinearIntegrationConfig cookieStore={cookieStore} />}
            {integration === TaskSources.Github && <GitHubIntegrationConfig />}
          </div>
        </div>
      </div>
    </div>
  );
}

async function LinearIntegrationConfig({ cookieStore }: { cookieStore: ReadonlyRequestCookiesType }) {
  const isConnected = Boolean((await cookieStore.get(TOKEN_COOKIE))?.value);
  const stateFilter = (await cookieStore.get(ISSUE_STATE_COOKIE))?.value ?? "";
  const queryFilter = (await cookieStore.get(ISSUE_QUERY_COOKIE))?.value ?? "";
  const assigneeFilter = (await cookieStore.get(ISSUE_ASSIGNEE_COOKIE))?.value ?? "";

  return (
    <div>
      <div className="flex items-center gap-2">
        <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
        <span className="text-sm font-medium text-white">Linear</span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-zinc-400">
          {isConnected ? "Connected" : "Not connected"}
        </span>
        {isConnected ? (
          <a
            href="/api/linear/oauth/disconnect"
            className="px-3 py-2 rounded-md bg-[#1e1e1e] hover:bg-[#252525] text-zinc-300 text-sm border border-[#333] transition-colors"
          >
            Disconnect
          </a>
        ) : (
          <a
            href="/api/linear/oauth/start"
            className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Connect Linear
          </a>
        )}
      </div>

      <div className="text-xs text-zinc-500 mt-2">
        <Link href="https://linear.app/settings/integrations" target="_blank" className="underline">Learn more</Link>
      </div>

      <div className="border-t border-[#262626] pt-4 space-y-3">
        <h3 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Issue Filters</h3>
        <form action="/api/linear/settings" method="post" className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="linear-state" className="text-xs text-zinc-400">
              State name (e.g. Todo, In Progress)
            </label>
            <input
              id="linear-state"
              name="state"
              defaultValue={stateFilter}
              className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 text-sm text-zinc-200"
              placeholder="All states"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="linear-query" className="text-xs text-zinc-400">
              Title or identifier contains
            </label>
            <input
              id="linear-query"
              name="query"
              defaultValue={queryFilter}
              className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 text-sm text-zinc-200"
              placeholder="e.g. MED-123"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="linear-assignee" className="text-xs text-zinc-400">
              Assigned user email (API key only)
            </label>
            <input
              id="linear-assignee"
              name="assignee"
              defaultValue={assigneeFilter}
              className="w-full rounded-md border border-[#333] bg-[#1e1e1e] px-3 py-2 text-sm text-zinc-200"
              placeholder="user@company.com"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              name="action"
              value="save"
              className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
            >
              Save filters
            </button>
            <button
              type="submit"
              name="action"
              value="clear"
              className="px-3 py-2 rounded-md bg-[#1e1e1e] hover:bg-[#252525] text-zinc-300 text-sm border border-[#333] transition-colors"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

async function GitHubIntegrationConfig({ cookieStore }: { cookieStore: ReadonlyRequestCookiesType }) {
  return (
    <div>
      <div className="flex flex-col gap-12">
        <div className="flex justify-center gap-2">
          <GitHubLogoIcon className="size-4" />
          <span className="text-sm font-medium text-white">GitHub</span>
        </div>
        <button className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors">Request Integration</button>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

type IntegrationMenuProps = {
  activeIntegration: TaskSource | null;
};

const IntegrationMenu = ({
  activeIntegration
}: IntegrationMenuProps) => {
  return (
    <div className="flex flex-col items-start w-10 sm:w-12 h-full">

      <div className="flex-1 flex flex-col mx-1 sm:mx-2 items-center pt-6 sm:pt-10 gap-3 sm:gap-5">
        <Link href="/config?integration=linear"
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
            activeIntegration === TaskSources.Linear
              ? "bg-zinc-700"
              : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
          )}
          aria-label="Linear Integration"
        >
          <div className="font-bold">
            <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
          </div>
          {activeIntegration === TaskSources.Linear && (
            <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-indigo-500 rounded-r-sm" />
          )}
        </Link>
        <Link href="/config?integration=github"
          className={cn(
            "w-7 h-7 sm:w-8 sm:h-8 rounded-md flex items-center justify-center",
            activeIntegration === TaskSources.Github
              ? "bg-zinc-700"
              : "text-zinc-400 hover:bg-[#262626] hover:text-zinc-300"
          )}
          aria-label="GitHub Integration"
        >
          <GitHubLogoIcon className="size-4" />
          {activeIntegration === TaskSources.Github && (
            <span className="absolute -left-1 w-1 h-4 sm:h-5 bg-indigo-500 rounded-r-sm" />
          )}
        </Link>
      </div>
    </div>
  );
};
