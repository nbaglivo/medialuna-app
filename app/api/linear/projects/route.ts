import { cookies } from "next/headers";
import { LinearClient } from "@linear/sdk";

export const dynamic = "force-dynamic";

type LinearProject = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  state: string;
  progress: number;
  icon?: string | null;
  color?: string | null;
  targetDate?: string | null;
  startDate?: string | null;
};

const TOKEN_COOKIE = "linear_access_token";

function createLinearClient(token: string) {
  if (token.startsWith("lin_api_")) {
    return new LinearClient({ apiKey: token });
  }

  return new LinearClient({ accessToken: token });
}

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
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

    if (usesOAuthToken) {
      const viewer = await client.viewer;
      user = { id: viewer.id, name: viewer.name, email: viewer.email };
    }

    const projectsResponse = await client.projects({ first: 50 });
    const rawProjects = projectsResponse.nodes ?? [];

    const projects: LinearProject[] = rawProjects.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description ?? null,
      url: project.url,
      state: project.state,
      progress: project.progress,
      icon: project.icon ?? null,
      color: project.color ?? null,
      targetDate: project.targetDate ?? null,
      startDate: project.startDate ?? null
    }));

    return Response.json({ user, projects, connected: usesOAuthToken });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to reach Linear API.";
    return Response.json({ error: message }, { status: 500 });
  }
}
