import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Returns a Supabase client configured with the service role key.
 * This is for administrative database operations (bypassing RLS).
 * It is synchronous and does not require cookie storage.
 */
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Returns a Supabase client configured with the anon key and cookie storage.
 * This is for user authentication operations (e.g. logins, OAuth code exchanges).
 */
export async function getSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase server environment variables.");
  }

  let cookieStore = null;
  try {
    cookieStore = await cookies();
  } catch (e) {
    console.error("[getSupabaseAuthClient cookies error]:", e);
  }

  const authConfig = {
    persistSession: true,
    flowType: "pkce",
  };

  if (cookieStore) {
    authConfig.storage = {
      getItem(key) {
        return cookieStore.get(key)?.value;
      },
      setItem(key, value, options) {
        cookieStore.set(key, value, {
          ...options,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
      },
      removeItem(key, options) {
        cookieStore.delete({
          name: key,
          path: "/",
          ...options,
        });
      },
    };
  }

  return createClient(url, anonKey, {
    auth: authConfig,
  });
}
