"use client";

import {useState, useEffect, useCallback} from "react";
import {STATUS_PRESETS} from "../constants/status-presets";
import {getSupabaseClient} from "@/lib/supabase/client";
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
				const {supabaseUrl, supabaseAnonKey} = await getSupabaseConfig();
				if (!active) return;
				if (!supabaseUrl || !supabaseAnonKey) {
					console.warn(
						"Supabase credentials not found. Realtime synchronization disabled.",
					);
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
					const existingChannels = supabase.getChannels
						? supabase.getChannels()
						: [];
					const existing = existingChannels.find(
						(ch) =>
							ch.topic === `realtime:${channelName}` || ch.name === channelName,
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
							},
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

	const updateStatus = useCallback(async (statusId, customText = "", customTitle = "") => {
		// Optimistic local update
		setState((prev) => ({
			...prev,
			statusId,
			finishTime: "",
			lastUpdated: new Date().toISOString(),
		}));

		// Server Action write
		await updateDoorSignStatus(statusId, customText, customTitle, userId);
	}, [userId]);

	const updateSettings = useCallback(async (updates) => {
		// Optimistic local update
		setState((prev) => ({
			...prev,
			...updates,
		}));

		// Server Action write
		await updateDoorSignSettings(updates, userId);
	}, [userId]);

	useEffect(() => {
		if (state.statusId === "available" || !state.finishTime) return;

		const checkExpiry = () => {
			const now = new Date();
			const match = state.finishTime.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
			if (!match) return;

			let hours = parseInt(match[1], 10);
			const minutes = parseInt(match[2], 10);
			const ampm = match[3].toUpperCase();

			if (ampm === "PM" && hours < 12) hours += 12;
			if (ampm === "AM" && hours === 12) hours = 0;

			const target = new Date(now.getTime());
			target.setHours(hours, minutes, 0, 0);

			// Check if status is from a different calendar day
			const lastUpdatedDate = state.lastUpdated ? new Date(state.lastUpdated) : null;
			const isDifferentDay = lastUpdatedDate && (
				lastUpdatedDate.getDate() !== now.getDate() ||
				lastUpdatedDate.getMonth() !== now.getMonth() ||
				lastUpdatedDate.getFullYear() !== now.getFullYear()
			);

			if (isDifferentDay) {
				updateStatus("available");
				return;
			}

			let diff = target.getTime() - now.getTime();
			// If target is in the past by more than 6 hours, assume it was set for tomorrow morning
			if (diff < -6 * 60 * 60 * 1000) {
				target.setDate(target.getDate() + 1);
				diff = target.getTime() - now.getTime();
			}

			if (diff <= 0) {
				updateStatus("available");
			}
		};

		// Run check immediately and then every 10 seconds
		checkExpiry();
		const interval = setInterval(checkExpiry, 10000);
		return () => clearInterval(interval);
	}, [state.statusId, state.finishTime, state.lastUpdated, updateStatus]);

	const allPresets = [
		...STATUS_PRESETS.filter((p) => !state.presetsOverrides?.[p.id]?.isDeleted),
		...(state.customPresets || []),
	].map((preset) => {
		const override = state.presetsOverrides?.[preset.id];
		if (override) {
			return {
				...preset,
				label: override.title || preset.label,
				defaultSubText: override.subtext || preset.defaultSubText,
			};
		}
		return preset;
	});
	const currentPreset =
		allPresets.find((p) => p.id === state.statusId) || allPresets[0];

	return {
		state,
		currentPreset,
		loading,
		updateStatus,
		updateSettings,
		presets: allPresets,
	};
}
