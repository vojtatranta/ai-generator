import { Database } from "@/web/database.types";
import { createServerClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  return client;
}

export type AIResult = Database["public"]["Tables"]["ai_results"]["Row"];
export type FileType = Database["public"]["Tables"]["files"]["Row"];
export type FileChunk = Database["public"]["Tables"]["file_chunks"]["Row"];

export type PlanSubscription =
  Database["public"]["Tables"]["subscriptions"]["Row"];

export type User = NonNullable<
  Awaited<
    ReturnType<
      Awaited<ReturnType<typeof createSupabaseServerClient>>["auth"]["getUser"]
    >
  >["data"]["user"]
>;

export async function getMaybeUser(): Promise<User | null> {
  const supabaseServerClient = await createSupabaseServerClient();
  return getMaybeUserWithClient(supabaseServerClient);
}

export async function getMaybeUserWithClient(
  client: SupabaseClient<Database>,
): Promise<User | null> {
  const user = await client.auth.getUser();

  if (!user.data.user) {
    return null;
  }

  return {
    ...user.data.user,
    // id: "2824b5d9-b2af-4f52-ba34-91f879954cef",
  };
}

export async function getUser(): Promise<User> {
  const supabaseServerClient = await createSupabaseServerClient();
  const user = await supabaseServerClient.auth.getUser();

  if (!user.data.user) {
    redirect("/login");
  }

  return {
    ...user.data.user,
    // id: "2824b5d9-b2af-4f52-ba34-91f879954cef",
  };
}
