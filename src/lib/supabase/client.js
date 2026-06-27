import { createClient } from "@supabase/supabase-js";

let clientInstance = null;

export function getSupabaseClient(url, anonKey) {
  if (!clientInstance && url && anonKey) {
    clientInstance = createClient(url, anonKey);
  }
  return clientInstance;
}
