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

const LINEAR_API_URL = "https://api.linear.app/graphql";
const DEFAULT_EMAIL = "nicolas.baglivo@gmail.com";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email") ?? DEFAULT_EMAIL;
  const token = process.env.LINEAR_API_KEY;

  if (!token) {
    return Response.json({ error: "Missing LINEAR_API_KEY." }, { status: 500 });
  }

  const query = `
    query LinearIssuesByEmail($email: String!) {
      users(filter: { email: { eq: $email } }) {
        nodes {
          id
          name
          email
          assignedIssues(first: 50) {
            nodes {
              id
              identifier
              title
              url
              priority
              estimate
              state {
                name
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(LINEAR_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token
      },
      body: JSON.stringify({
        query,
        variables: { email }
      })
    });

    const payload = await response.json();

    if (!response.ok || payload?.errors?.length) {
      const message = payload?.errors?.[0]?.message ?? "Linear API request failed.";
      return Response.json({ error: message }, { status: 500 });
    }

    const user = payload?.data?.users?.nodes?.[0];
    const issues: LinearIssue[] = user?.assignedIssues?.nodes ?? [];

    return Response.json({ user, issues });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach Linear API.";
    return Response.json({ error: message }, { status: 500 });
  }
}
