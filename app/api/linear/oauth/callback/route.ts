import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LinearClient } from "@linear/sdk";

const TOKEN_URL = "https://api.linear.app/oauth/token";
const STATE_COOKIE = "linear_oauth_state";
const TOKEN_COOKIE = "linear_access_token";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code) {
    return NextResponse.json({ error: "Missing OAuth code." }, { status: 400 });
  }

  if (!state || !storedState || state !== storedState) {
    return NextResponse.json({ error: "Invalid OAuth state." }, { status: 400 });
  }

  const clientId = process.env.LINEAR_CLIENT_ID;
  const clientSecret = process.env.LINEAR_CLIENT_SECRET;
  const redirectUri = process.env.LINEAR_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.json(
      { error: "Missing LINEAR_CLIENT_ID, LINEAR_CLIENT_SECRET, or LINEAR_REDIRECT_URI." },
      { status: 500 }
    );
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    });

    const response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.error_description ?? "Failed to exchange OAuth code.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    if (!payload?.access_token) {
      return NextResponse.json({ error: "Missing access token in response." }, { status: 500 });
    }

    const linearClient = new LinearClient({ accessToken: payload.access_token });
    await linearClient.viewer;

    cookieStore.set(TOKEN_COOKIE, payload.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: payload.expires_in ?? 60 * 60 * 24 * 30
    });

    cookieStore.delete(STATE_COOKIE);

    return NextResponse.redirect(new URL("/config", request.url));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth exchange failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
