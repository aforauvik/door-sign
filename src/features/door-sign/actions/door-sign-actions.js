"use server";

import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Retrieves the URL and the anon key for initializing client-side Supabase realtime.
 * These are fetched dynamically to avoid exposure in static bundles.
 */
export async function getSupabaseConfig() {
  return {
    supabaseUrl: process.env.SUPABASE_URL || "",
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
  };
}

/**
 * Fetches the active door sign state row from the database for a specific user.
 * If the row does not exist, seeds a default initial row.
 */
export async function fetchDoorSignState(userId = "default") {
  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("door_sign_state")
      .select("*")
      .eq("id", userId)
      .single();

    if (error && error.code === "PGRST116") {
      // Row not found, create a default row
      const defaultRow = {
        id: userId,
        status_id: "available",
        finish_time: "",
        presets_overrides: {},
        custom_presets: [],
        pin: "",
        pin_enabled: false,
        theme: "dark",
      };
      const { data: inserted, error: insertError } = await supabase
        .from("door_sign_state")
        .insert(defaultRow)
        .select()
        .single();

      if (insertError) {
        console.error(`Failed to seed initial door sign state for ${userId}:`, insertError);
        return defaultRow;
      }
      return inserted;
    }

    if (error) {
      console.error(`Error fetching door sign state for ${userId}:`, error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`Exception in fetchDoorSignState for ${userId}:`, err);
    return null;
  }
}

/**
 * Securely updates the active status ID for a specific user.
 */
export async function updateDoorSignStatus(statusId, customText = "", customTitle = "", userId = "default") {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase
      .from("door_sign_state")
      .update({
        status_id: statusId,
        finish_time: "", // Reset finish time when status changes
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      console.error(`Error updating status for ${userId}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error(`Exception in updateDoorSignStatus for ${userId}:`, err);
    return { success: false, error: err.message };
  }
}

/**
 * Securely updates general settings configuration and custom options for a specific user.
 * Maps React camelCase state keys to PostgreSQL snake_case columns.
 */
export async function updateDoorSignSettings(updates, userId = "default") {
  try {
    const supabase = getSupabaseServerClient();
    
    const dbUpdates = {};
    if (updates.statusId !== undefined) dbUpdates.status_id = updates.statusId;
    if (updates.finishTime !== undefined) dbUpdates.finish_time = updates.finishTime;
    if (updates.presetsOverrides !== undefined) dbUpdates.presets_overrides = updates.presetsOverrides;
    if (updates.customPresets !== undefined) dbUpdates.custom_presets = updates.customPresets;
    if (updates.pin !== undefined) dbUpdates.pin = updates.pin;
    if (updates.pinEnabled !== undefined) dbUpdates.pin_enabled = updates.pinEnabled;
    if (updates.theme !== undefined) dbUpdates.theme = updates.theme;

    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("door_sign_state")
      .update(dbUpdates)
      .eq("id", userId);

    if (error) {
      console.error(`Error updating settings for ${userId}:`, error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    console.error(`Exception in updateDoorSignSettings for ${userId}:`, err);
    return { success: false, error: err.message };
  }
}
