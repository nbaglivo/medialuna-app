import { cookies } from "next/headers";
import { LinearClient } from "@linear/sdk";

export const dynamic = "force-dynamic";

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
};

const DEFAULT_EMAIL = "nicolas.baglivo@gmail.com";
const TOKEN_COOKIE = "linear_access_token";
const ISSUE_STATE_COOKIE = "linear_issue_state";
const ISSUE_QUERY_COOKIE = "linear_issue_query";
const ISSUE_ASSIGNEE_COOKIE = "linear_issue_assignee";

function createLinearClient(token: string) {
  if (token.startsWith("lin_api_")) {
    return new LinearClient({ apiKey: token });
  }

  return new LinearClient({ accessToken: token });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? DEFAULT_EMAIL;
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const stateFilter = cookieStore.get(ISSUE_STATE_COOKIE)?.value?.trim() ?? "";
  const queryFilter = cookieStore.get(ISSUE_QUERY_COOKIE)?.value?.trim().toLowerCase() ?? "";
  const assigneeFilter = cookieStore.get(ISSUE_ASSIGNEE_COOKIE)?.value?.trim() ?? "";
  const token = cookieToken;

  if (!token) {
    return Response.json(
      { error: "Linear is not connected. Connect your account in Settings." },
      { status: 401 }
    );
  }

  const usesOAuthToken = Boolean(cookieToken && !cookieToken.startsWith("lin_api_"));

  try {
    const client = createLinearClient(token);

    let user: { id: string; name?: string; email?: string } | null = null;
    let rawIssues: any[] = [];

    if (usesOAuthToken) {
      const viewer = await client.viewer;
      user = { id: viewer.id, name: viewer.name, email: viewer.email };
      const assigned = await viewer.assignedIssues({ first: 50 });
      rawIssues = assigned.nodes ?? [];
    } else {
      const assigneeEmail = assigneeFilter || email;
      const users = await client.users({
        filter: {
          email: {
            eq: assigneeEmail
          }
        }
      });
      const selected = users.nodes?.[0];
      user = selected ? { id: selected.id, name: selected.name, email: selected.email } : null;
      if (selected) {
        const assigned = await selected.assignedIssues({ first: 50 });
        rawIssues = assigned.nodes ?? [];
      }
    }

    const filteredIssues = rawIssues.filter((issue) => {
      if (stateFilter) {
        const stateName = issue.state?.name ?? "";
        if (stateName.toLowerCase() !== stateFilter.toLowerCase()) {
          return false;
        }
      }

      if (queryFilter) {
        const haystack = `${issue.identifier ?? ""} ${issue.title ?? ""}`.toLowerCase();
        if (!haystack.includes(queryFilter)) {
          return false;
        }
      }

      if (assigneeFilter && usesOAuthToken) {
        const viewerEmail = (user?.email ?? "").toLowerCase();
        if (viewerEmail && viewerEmail !== assigneeFilter.toLowerCase()) {
          return false;
        }
      }

      return true;
    });

    const issues: LinearIssue[] = filteredIssues.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      url: issue.url,
      priority: issue.priority ?? null,
      estimate: issue.estimate ?? null,
      state: issue.state ? { name: issue.state.name } : null
    }));

    return Response.json({ user, issues, connected: usesOAuthToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach Linear API.";
    return Response.json({ error: message }, { status: 500 });
  }
}
