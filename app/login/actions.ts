"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const hostedDomain = process.env.NEXT_PUBLIC_HOSTED_DOMAIN;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      queryParams: {
        prompt: "select_account",
        ...(hostedDomain && { hd: hostedDomain }), // only add if orgName defined
      },
    },
  });

  if (error) {
    console.error("OAuth error:", error);
    return redirect(`/error`);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function logout() {
  const supabase = await createClient();

  const { error } = await supabase.auth.signOut();
  if (error) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/login");
}
