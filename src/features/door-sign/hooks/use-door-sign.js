"use client";

import { useState, useEffect } from "react";
import { STATUS_PRESETS } from "../constants/status-presets";
import { getSupabaseClient } from "@/lib/supabase/client";
import {
  getSupabaseConfig,
  fetchDoorSignState,
  updateDoorSignStatus,
  updateDoorSignSettings,
} from "../actions/door-sign-actions";

const DEFAULT_STATE = {
  statusId: "available",
  customText: "",
  customTitle: "",
  presetsOverrides: {}, // Keyed by presetId: { title, subtext }
  pin: "",
  pinEnabled: false,
  theme: "dark", // 'dark' | 'light'
  finishTime: "",
  customPresets: [], // Array of { id, label, defaultSubText, icon: "Clock", isCustom: true }
  lastUpdated: null,
};

export function useDoorSign(userId = "default") {
  const [state, setState] = useState(DEFAULT_STATE);
  const [loading, setLoading] = useState(true);

  // Helper to map database snake_case row to React camelCase state
  const mapDbToState = (dbRow) => {
    if (!dbRow) return DEFAULT_STATE;
    return {
      statusId: dbRow.status_id,
      customText: "",
      customTitle: "",
      presetsOverrides: dbRow.presets_overrides || {},
      pin: dbRow.pin || "",
      pinEnabled: dbRow.pin_enabled || false,
      theme: dbRow.theme || "dark",
      finishTime: dbRow.finish_time || "",
      customPresets: dbRow.custom_presets || [],
      lastUpdated: dbRow.updated_at,
    };
  };

  useEffect(() => {
    let active = true;
    let channel = null;
    let supabaseInstance = null;

    const initSupabase = async () => {
      try {
        // 1. Fetch initial state from the database using active userId
        const initialState = await fetchDoorSignState(userId);
        if (!active) return;
        if (initialState) {
          setState(mapDbToState(initialState));
        }

        // 2. Retrieve dynamic credentials
        const { supabaseUrl, supabaseAnonKey } = await getSupabaseConfig();
        if (!active) return;
        if (!supabaseUrl || !supabaseAnonKey) {
          console.warn("Supabase credentials not found. Realtime synchronization disabled.");
          setLoading(false);
          return;
        }

        // 3. Initialize Supabase client and subscribe to realtime updates matching userId
        const supabase = getSupabaseClient(supabaseUrl, supabaseAnonKey);
        if (!active) return;
        if (supabase) {
          supabaseInstance = supabase;
          const channelName = `door_sign_state_changes_${userId}`;
          
          // Clean up any existing channel with the same name/topic in cache first
          const existingChannels = supabase.getChannels ? supabase.getChannels() : [];
          const existing = existingChannels.find(
            (ch) => ch.topic === `realtime:${channelName}` || ch.name === channelName
          );
          if (existing) {
            await supabase.removeChannel(existing);
          }

          channel = supabase
            .channel(channelName)
            .on(
              "postgres_changes",
              {
                event: "UPDATE",
                schema: "public",
                table: "door_sign_state",
                filter: `id=eq.${userId}`,
              },
              (payload) => {
                if (active && payload.new) {
                  setState(mapDbToState(payload.new));
                }
              }
            )
            .subscribe();
        }
      } catch (err) {
        console.error("Failed to initialize Supabase Realtime:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    initSupabase();

    return () => {
      active = false;
      if (channel && supabaseInstance) {
        supabaseInstance.removeChannel(channel);
      }
    };
  }, [userId]);

  const updateStatus = async (statusId, customText = "", customTitle = "") => {
    // Optimistic local update
    setState((prev) => ({
      ...prev,
      statusId,
      finishTime: "",
      lastUpdated: new Date().toISOString(),
    }));

    // Server Action write
    await updateDoorSignStatus(statusId, customText, customTitle, userId);
  };

  const updateSettings = async (updates) => {
    // Optimistic local update
    setState((prev) => ({
      ...prev,
      ...updates,
    }));

    // Server Action write
    await updateDoorSignSettings(updates, userId);
  };

  const allPresets = [...STATUS_PRESETS, ...(state.customPresets || [])];
  const currentPreset = allPresets.find((p) => p.id === state.statusId) || allPresets[0];

  return {
    state,
    currentPreset,
    loading,
    updateStatus,
    updateSettings,
    presets: allPresets,
  };
}
