import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const ISSUE_STATE_COOKIE = "linear_issue_state";
const ISSUE_QUERY_COOKIE = "linear_issue_query";
const ISSUE_ASSIGNEE_COOKIE = "linear_issue_assignee";

export async function POST(request: Request) {
  const formData = await request.formData();
  const action = formData.get("action");
  const cookieStore = await cookies();

  if (action === "clear") {
    cookieStore.delete(ISSUE_STATE_COOKIE);
    cookieStore.delete(ISSUE_QUERY_COOKIE);
    cookieStore.delete(ISSUE_ASSIGNEE_COOKIE);
    return NextResponse.redirect(new URL("/settings", request.url));
  }

  const state = (formData.get("state") ?? "").toString().trim();
  const query = (formData.get("query") ?? "").toString().trim();
  const assignee = (formData.get("assignee") ?? "").toString().trim();

  if (state) {
    cookieStore.set(ISSUE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  } else {
    cookieStore.delete(ISSUE_STATE_COOKIE);
  }

  if (query) {
    cookieStore.set(ISSUE_QUERY_COOKIE, query, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  } else {
    cookieStore.delete(ISSUE_QUERY_COOKIE);
  }

  if (assignee) {
    cookieStore.set(ISSUE_ASSIGNEE_COOKIE, assignee, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });
  } else {
    cookieStore.delete(ISSUE_ASSIGNEE_COOKIE);
  }

  return NextResponse.redirect(new URL("/settings", request.url));
}
