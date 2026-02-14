"use server";

import { getProjectsByView, getUser, LinearProject, LinearUser } from "@/lib/linear";
import { cookies } from "next/headers";

type LinearData = {
  user: LinearUser | null;
  projects: LinearProject[];
  connected: true;
};

type NotConnectedData = {
  user: null;
  projects: [];
  connected: false;
};

const TOKEN_COOKIE = "linear_access_token";

export async function getLinearData(): Promise<LinearData |  NotConnectedData> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const token = cookieToken;

  if (!token) {
    return { user: null, projects: [], connected: false };
  }

  const [user, projects] = await Promise.all([
    getUser(token),
    // For now only return the projects in the view with the id "In Focus"
    getProjectsByView(token, "d3e45859-3847-4ed8-af51-4b712b5b519f"),
  ]);

  return { user, projects, connected: true };
}
