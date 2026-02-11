"use server";

import { cookies } from "next/headers";
import { LinearClient } from "@linear/sdk";

export type LinearProject = {
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

export type LinearDataResult = {
  user: { id: string; name?: string; email?: string } | null;
  projects: LinearProject[];
  connected: boolean;
};

const TOKEN_COOKIE = "linear_access_token";

function createLinearClient(token: string) {
  if (token.startsWith("lin_api_")) {
    return new LinearClient({ apiKey: token });
  }

  return new LinearClient({ accessToken: token });
}

export async function getLinearData(): Promise<LinearDataResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const token = cookieToken;

  if (!token) {
    throw new Error("Linear is not connected. Connect your account in Settings.");
  }

  const usesOAuthToken = Boolean(cookieToken && !cookieToken.startsWith("lin_api_"));

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
    startDate: project.startDate ?? null,
  }));

  return { user, projects, connected: usesOAuthToken };
}
