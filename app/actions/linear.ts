"use server";

import { getProjects, getProjectViews, getUser, LinearProject, LinearProjectView, LinearUser } from "@/lib/linear";
import { cookies } from "next/headers";

type LinearData = {
  user: LinearUser | null;
  projects: LinearProject[];
  projectViews: LinearProjectView[];
  connected: true;
};

type NotConnectedData = {
  user: null;
  projects: [];
  projectViews: [];
  connected: false;
};

const TOKEN_COOKIE = "linear_access_token";

export async function getLinearData(): Promise<LinearData |  NotConnectedData> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const token = cookieToken;

  if (!token) {
    return { user: null, projects: [], projectViews: [], connected: false };
  }

  const [user, projects, projectViews] = await Promise.all([
    getUser(token),
    getProjects(token),
    getProjectViews(token),
  ]);

  return { user, projects, projectViews, connected: true };
}
