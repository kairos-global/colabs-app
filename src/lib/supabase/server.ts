import { cookies } from "next/headers";
import { auth } from "@clerk/nextjs/server";
import { createServerClient, type SupabaseClient } from "@supabase/supabase-js";

let serverClient: SupabaseClient | null = null;

export function getServerSupabaseClient() {
  if (!serverClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      throw new Error("Supabase server client missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const { userId } = auth();
    const cookieStore = cookies();

    serverClient = createServerClient(url, serviceRoleKey, {
      global: {
        headers: {
          "X-User-Id": userId ?? "",
        },
      },
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    });
  }

  return serverClient;
}

