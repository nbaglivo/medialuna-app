import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const LINEAR_OAUTH_URL = "https://linear.app/oauth/authorize";
const STATE_COOKIE = "linear_oauth_state";

export async function GET() {
  const clientId = process.env.LINEAR_CLIENT_ID;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: "Missing LINEAR_CLIENT_ID or LINEAR_REDIRECT_URI." },
      { status: 500 }
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10
  });

  const url = new URL(LINEAR_OAUTH_URL);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
