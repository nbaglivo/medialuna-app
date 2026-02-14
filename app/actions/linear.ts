"use server";

import { getDataFromLinear, LinearData } from "@/lib/linear";
import { cookies } from "next/headers";

export type LinearDataResult = LinearData & { connected: true } | { user: null, projects: [], connected: false };

const TOKEN_COOKIE = "linear_access_token";

export async function getLinearData(): Promise<LinearDataResult> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(TOKEN_COOKIE)?.value;
  const token = cookieToken;

  if (!token) {
    return { user: null, projects: [], connected: false };
  }

  const data = await getDataFromLinear(token);

  return { ...data, connected: true };
}
