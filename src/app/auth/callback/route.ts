import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if profile exists, create if not
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!existingProfile) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          email: data.user.email,
          full_name:
            data.user.user_metadata?.full_name ||
            data.user.email?.split("@")[0],
          user_type: "individual",
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
