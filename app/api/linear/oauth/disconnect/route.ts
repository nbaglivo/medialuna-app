import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "linear_access_token";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE);

  return NextResponse.redirect(new URL("/settings", request.url));
}
