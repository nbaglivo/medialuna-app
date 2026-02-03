import Link from "next/link";
import { cookies } from "next/headers";

const TOKEN_COOKIE = "linear_access_token";
const ISSUE_STATE_COOKIE = "linear_issue_state";
const ISSUE_QUERY_COOKIE = "linear_issue_query";
const ISSUE_ASSIGNEE_COOKIE = "linear_issue_assignee";

export default async function ConfigPage() {
  const cookieStore = await cookies();
  const isConnected = Boolean(cookieStore.get(TOKEN_COOKIE)?.value);
  const stateFilter = cookieStore.get(ISSUE_STATE_COOKIE)?.value ?? "";
  const queryFilter = cookieStore.get(ISSUE_QUERY_COOKIE)?.value ?? "";
  const assigneeFilter = cookieStore.get(ISSUE_ASSIGNEE_COOKIE)?.value ?? "";

  return (
    <div className="w-full h-full flex items-center justify-center px-6">
      <div className="w-full max-w-xl rounded-xl border border-[#262626] bg-[#111] p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Configuration</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Connect your Linear account to sync tasks.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs uppercase tracking-[0.2em] text-zinc-500">Integrations</h2>

          <div className="rounded-lg border border-[#262626] bg-[#151515] p-4 space-y-4">
            <div className="flex items-center gap-2">
              <img src="https://linear.app/favicon.ico" alt="Linear icon" width={16} height={16} />
              <span className="text-sm font-medium text-white">Linear</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-zinc-400">
                {isConnected ? "Connected" : "Not connected"}
              </span>
              {isConnected ? (
                <Link
                  href="/api/linear/oauth/disconnect"
                  className="px-3 py-2 rounded-md bg-[#1e1e1e] hover:bg-[#252525] text-zinc-300 text-sm border border-[#333] transition-colors"
                >
                  Disconnect
                </Link>
              ) : (
                <Link
                  href="/api/linear/oauth/start"
                  className="px-3 py-2 rounded-md bg-white text-black text-sm font-medium hover:bg-zinc-200 transition-colors"
                >
                  Connect Linear
                </Link>
              )}
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
        </div>

        <div className="text-xs text-zinc-500">
          <Link href="https://linear.app/settings/integrations" target="_blank" className="underline">Learn more</Link>
        </div>
      </div>
    </div>
  );
}
