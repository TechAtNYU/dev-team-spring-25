import { NextResponse } from "next/server";
import { createClient } from "@shared/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  const error = searchParams.get("error_description");
  if (error && error === "Database error saving new user") {
    return NextResponse.redirect(
      `${origin}/auth/unauthorized?message=ORGANIZATION_EMAIL_REQUIRED`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // User has an allowed email domain, proceed
      const forwardedHost = request.headers.get("x-forwarded-host");

      if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/error`);
}
