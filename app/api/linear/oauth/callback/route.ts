import { NextResponse } from "next/server";
import { LinearClient } from "@linear/sdk";

const LINEAR_TOKEN_URL = "https://api.linear.app/oauth/token";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing code or state." },
        { status: 400 }
      );
    }

    // Decode state (contains returnTo)
    let decodedState: { id: string; returnTo: string };

    try {
      decodedState = JSON.parse(
        Buffer.from(state, "base64url").toString()
      );
    } catch {
      return NextResponse.json(
        { error: "Invalid state." },
        { status: 400 }
      );
    }

    const returnTo = decodedState.returnTo;

    if (!returnTo) {
      return NextResponse.json(
        { error: "Missing return URL in state." },
        { status: 400 }
      );
    }

    const clientId = process.env.LINEAR_CLIENT_ID;
    const clientSecret = process.env.LINEAR_CLIENT_SECRET;
    const redirectUri = process.env.LINEAR_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      return NextResponse.json(
        { error: "Missing OAuth environment variables." },
        { status: 500 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(LINEAR_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
        code
      }).toString()
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      return NextResponse.json(
        { error: "Failed to exchange code.", details: errorBody },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "No access token returned from Linear." },
        { status: 500 }
      );
    }

    // Optional: verify token by calling Linear
    const linear = new LinearClient({ accessToken });
    const viewer = await linear.viewer;

    if (!viewer) {
      return NextResponse.json(
        { error: "Failed to validate Linear token." },
        { status: 500 }
      );
    }

    // Redirect back to preview/prod origin
    const response = NextResponse.redirect(
      `${returnTo}/settings?integration=linear`
    );

    // Store token in secure HttpOnly cookie
    response.cookies.set("linear_access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return response;

  } catch (error) {
    console.error("Linear OAuth callback error:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
