import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// Get allowed domains from environment variables
const allowedDomains = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS?.split(
  ","
).map((domain) => domain.trim());

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get("next") ?? "/";

  if (!allowedDomains) {
    console.error(
      "NEXT_PUBLIC_ALLOWED_EMAIL_DOMAINS must be set in the environment variables"
    );
    return NextResponse.redirect(`${origin}/error`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user?.email) {
      // Check if the user's email domain is allowed
      const userEmail = data.user.email;
      const isAllowedDomain = allowedDomains.some((domain) =>
        userEmail.endsWith(`@${domain}`)
      );

      if (!isAllowedDomain) {
        // Not an allowed email, sign them out and delete the user
        try {
          // HACK: This is a workaround solution as there's currently no way (that I am aware of) to prevent
          // OAuth users from being added to the database before we can check their email domain.
          // Ideally, we would validate the email domain before creating the user account,
          // but Supabase OAuth flow creates the user first, then gives us access to their details via callback.
          // So we have to delete unauthorized users after they've already been created.
          const adminClient = createAdminClient();
          if (data.user.id) {
            await adminClient.auth.admin.deleteUser(data.user.id);
          }
        } catch (deleteError) {
          console.error("Error deleting unauthorized user:", deleteError);
        }
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/auth/unauthorized?message=ORGANIZATION_EMAIL_REQUIRED`
        );
      }

      // User has an allowed email domain, proceed
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  return NextResponse.redirect(`${origin}/error`);
}
