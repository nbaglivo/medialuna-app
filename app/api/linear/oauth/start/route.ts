import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const clientId = process.env.LINEAR_CLIENT_ID!;
  const redirectUri = process.env.LINEAR_REDIRECT_URI!;

  const origin = request.headers.get("origin") ?? `https://${process.env.VERCEL_URL}`;

  const statePayload = {
    id: crypto.randomUUID(),
    returnTo: origin
  };

  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  const url = new URL("https://linear.app/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", "read");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
