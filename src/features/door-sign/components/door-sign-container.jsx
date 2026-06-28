"use client";

import {useState, useEffect} from "react";
import {useDoorSign} from "../hooks/use-door-sign";
import {DoorSignDisplay} from "./door-sign-display";
import {DoorSignControl} from "./door-sign-control";
import {PinDialog} from "./pin-dialog";
import {Loader2} from "lucide-react";
import {signOutAction} from "../actions/auth-actions";

export function DoorSignContainer({ userId }) {
	const {state, currentPreset, loading, updateStatus, updateSettings, presets} =
		useDoorSign(userId);

	const [view, setView] = useState("control"); // 'control' | 'display'
	const [viewInitialized, setViewInitialized] = useState(false);
	const [isPinDialogOpen, setIsPinDialogOpen] = useState(false);

	useEffect(() => {
		if (typeof window !== "undefined") {
			const savedView = localStorage.getItem("door-sign-view");
			if (savedView) {
				setView(savedView);
			}
			setViewInitialized(true);
		}
	}, []);

	const handleUnlockTrigger = () => {
		if (state.pinEnabled && state.pin) {
			setIsPinDialogOpen(true);
		} else {
			setView("control");
			localStorage.setItem("door-sign-view", "control");
		}
	};

	const handleCorrectPin = () => {
		setIsPinDialogOpen(false);
		setView("control");
		localStorage.setItem("door-sign-view", "control");
	};

	const handleSignOut = async () => {
		await signOutAction();
		window.location.reload();
	};

	if (loading || !viewInitialized) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
				<div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center gap-4 shadow-2xl">
					<Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
					<span className="text-sm font-semibold tracking-wider uppercase">
						Loading...
					</span>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen flex flex-col w-full">
			{view === "display" ? (
				<DoorSignDisplay
					state={state}
					currentPreset={currentPreset}
					onUnlock={handleUnlockTrigger}
				/>
			) : (
				<DoorSignControl
					state={state}
					presets={presets}
					updateStatus={updateStatus}
					updateSettings={updateSettings}
					onLaunch={() => {
						setView("display");
						localStorage.setItem("door-sign-view", "display");
					}}
					onSignOut={handleSignOut}
				/>
			)}

			<PinDialog
				key={isPinDialogOpen ? "open" : "closed"}
				isOpen={isPinDialogOpen}
				onClose={() => setIsPinDialogOpen(false)}
				onCorrectPin={handleCorrectPin}
				savedPin={state.pin}
				theme={state.theme}
			/>
		</div>
	);
}
