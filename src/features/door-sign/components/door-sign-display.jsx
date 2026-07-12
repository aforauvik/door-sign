"use client";

import {useState, useEffect} from "react";
import Image from "next/image";
import * as Icons from "lucide-react";
import {Button} from "@/components/ui/button";
import NoSleep from "nosleep.js";
import {COLOR_THEMES} from "../constants/color-themes";

export function DoorSignDisplay({
	state,
	currentPreset,
	presets = [],
	onUnlock,
}) {
	const [time, setTime] = useState("");
	const [date, setDate] = useState("");

	// Live Clock Effect
	useEffect(() => {
		const updateTime = () => {
			const now = new Date();

			// Time format
			let hours = now.getHours();
			const minutes = now.getMinutes().toString().padStart(2, "0");
			const ampm = hours >= 12 ? "PM" : "AM";
			hours = hours % 12;
			hours = hours ? hours : 12;
			setTime(`${hours}:${minutes} ${ampm}`);

			// Date format
			const options = {weekday: "long", month: "short", day: "numeric"};
			setDate(now.toLocaleDateString("en-US", options));
		};

		updateTime();
		const interval = setInterval(updateTime, 1000);
		return () => clearInterval(interval);
	}, []);

	// Screen Wake Lock Effect to prevent device from sleeping
	useEffect(() => {
		let wakeLock = null;
		let noSleepInstance = null;

		const requestWakeLock = async () => {
			if (wakeLock !== null) return;
			try {
				if ("wakeLock" in navigator) {
					wakeLock = await navigator.wakeLock.request("screen");
					wakeLock.addEventListener("release", () => {
						wakeLock = null;
						console.log("Wake Lock released");
					});
					console.log("Wake Lock acquired successfully");
				} else {
					enableNoSleepFallback();
				}
			} catch (err) {
				console.warn(
					"Failed to acquire screen wake lock, falling back to NoSleep:",
					err,
				);
				enableNoSleepFallback();
			}
		};

		const enableNoSleepFallback = () => {
			if (noSleepInstance) return;
			try {
				noSleepInstance = new NoSleep();
				noSleepInstance.enable().catch((err) => {
					// Silent catch of expected aborts/interruptions, warn on others
					if (
						err &&
						(err.name === "AbortError" ||
							err.message?.includes("play()") ||
							err.message?.includes("pause()") ||
							err.message?.includes("The operation was aborted"))
					) {
						console.log(
							"NoSleep.js fallback play/pause aborted or interrupted (expected on page changes/unmount)",
						);
					} else {
						console.warn("NoSleep.js fallback promise rejection:", err);
					}
				});
				console.log("NoSleep.js fallback enabled successfully");
			} catch (err) {
				console.warn("Failed to initialize NoSleep.js:", err);
			}
		};

		// Intercept and ignore play/pause AbortErrors from NoSleep.js during HMR/StrictMode double-mount
		const handleRejection = (event) => {
			if (
				event.reason &&
				(event.reason.name === "AbortError" ||
					(event.reason.message &&
						(event.reason.message.includes("play()") ||
							event.reason.message.includes("The operation was aborted") ||
							event.reason.message.includes("pause()"))))
			) {
				event.preventDefault();
				console.log(
					"Ignored play/pause interruption or AbortError from NoSleep.js",
				);
			}
		};

		// Try immediately on mount
		requestWakeLock();

		// Try on visibility changes
		const handleVisibilityChange = async () => {
			if (document.visibilityState === "visible") {
				await requestWakeLock();
			}
		};

		// Try on any user interaction (essential fallback for user gesture requirements)
		const handleInteraction = async () => {
			await requestWakeLock();
			if (!wakeLock) {
				enableNoSleepFallback();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		document.addEventListener("click", handleInteraction);
		document.addEventListener("touchstart", handleInteraction);
		document.addEventListener("mousedown", handleInteraction);
		window.addEventListener("unhandledrejection", handleRejection);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
			document.removeEventListener("click", handleInteraction);
			document.removeEventListener("touchstart", handleInteraction);
			document.removeEventListener("mousedown", handleInteraction);
			window.removeEventListener("unhandledrejection", handleRejection);
			if (wakeLock) {
				wakeLock
					.release()
					.then(() => {
						wakeLock = null;
					})
					.catch((err) => {
						console.warn("Failed to release wake lock:", err);
					});
			}
			if (noSleepInstance) {
				noSleepInstance.disable();
				noSleepInstance = null;
			}
		};
	}, []);

	const {theme, statusId, customText} = state;
	const {label, defaultSubText, hasPulse} = currentPreset;

	const computedLabel = label;

	// Theme-specific styles
	const isLight = theme === "light";
	const isAvailable = statusId === "available";
	const isGlow = false;

	let containerClass = "";
	let clockClass = "";
	let dateClass = "";
	let subTextClass = "";
	let cardBorderClass = "";
	let labelClass = "";
	let endsAroundClass = "";
	let timerIconClass = "";
	let valueColorClass = "";
	let settingsBtnClass = "";

	const color = currentPreset.color || "emerald";
	const themeConfig = COLOR_THEMES[color]?.[isLight ? "light" : "dark"] || COLOR_THEMES.emerald[isLight ? "light" : "dark"];

	if (isLight) {
		containerClass = `${themeConfig.bg} text-black`;
		clockClass = "text-black";
		dateClass = "text-black";
		subTextClass = "text-black";
		cardBorderClass = themeConfig.border;
		labelClass = themeConfig.text;
		endsAroundClass = "text-black";
		timerIconClass = themeConfig.timer;
		valueColorClass = themeConfig.text;
		settingsBtnClass = `bg-white/60 text-zinc-600 border ${themeConfig.border}/80 hover:bg-white hover:text-zinc-900`;
	} else {
		// Dark Mode: Premium dark background with readable elements
		containerClass = "bg-zinc-950 text-zinc-100";
		clockClass = "text-zinc-100";
		dateClass = "text-zinc-400";
		subTextClass = "text-zinc-300";
		cardBorderClass = "border-zinc-900";
		labelClass = themeConfig.text;
		endsAroundClass = "text-zinc-300";
		timerIconClass = themeConfig.timer;
		valueColorClass = themeConfig.text;
		settingsBtnClass =
			"bg-zinc-900/60 text-zinc-400 border border-zinc-800/85 hover:bg-zinc-800 hover:text-zinc-200";
	}

	const pulseBgClass = themeConfig.pulseBg;
	const pulsePingClass = themeConfig.pulsePing;

	const computedSubText =
		state.presetsOverrides?.[statusId]?.subtext || customText || defaultSubText;

	return (
		<div
			className={`relative flex flex-col justify-between min-h-screen w-full overflow-hidden p-6 md:p-12 transition-colors duration-500 ${containerClass}`}
		>
			{/* Background Neon Glowing Orbs (only active in Glow Theme) */}
			{isGlow && (
				<div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
					<div
						className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full bg-radial-gradient ${glowOrbs} blur-[120px] opacity-70 transition-all duration-700 ease-in-out`}
						style={{
							background: "radial-gradient(circle, var(--tw-gradient-stops))",
						}}
					/>
				</div>
			)}

			{/* Top Header Row (Left: Logo + Name, Right: Clock + Date) */}
			<header className="z-10 flex flex-row items-center justify-between w-full">
				<div className="flex items-center gap-2">
					<Image
						src={isLight ? "/logo-black.svg" : "/logo-white.svg"}
						alt="Knock Later Logo"
						width={40}
						height={40}
						className="h-8 w-8"
					/>
					<span className={`text-base font-bold ${clockClass}`}>
						Knock Later
					</span>
				</div>
				<div className="flex flex-col items-end gap-0.5 text-right">
					<span
						className={`text-base md:text-lg font-semibold tracking-tight ${dateClass}`}
					>
						{date}
					</span>
					<span
						className={`text-lg md:text-xl font-bold tracking-tight ${clockClass}`}
					>
						{time}
					</span>
				</div>
			</header>

			<hr
				className={`z-10 w-full ml-0 mr-auto border-t ${cardBorderClass} my-4`}
			/>

			{/* Main Status Display Area */}
			<main className="z-10 flex-1 flex flex-col items-start justify-center w-full ml-0 mr-auto my-6">
				{/* Status Pulse */}
				<div className="relative flex h-8 w-8 mb-6">
					<span
						className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulsePingClass} opacity-75`}
						style={{animationDuration: "2s"}}
					></span>
					<span
						className={`relative inline-flex rounded-full h-8 w-8 ${pulseBgClass}`}
					></span>
				</div>

				{/* Status Label */}
				<div className="flex flex-col gap-1 mb-6">
					<h2 className="text-4xl md:text-8xl lg:text-10xl font-black tracking-tight select-none leading-tight">
						<span className={`${labelClass} transition-colors duration-350`}>
							{computedLabel}
						</span>
					</h2>

					{/* Status Details / Subtext */}
					<p
						className={`text-lg md:text-2xl lg:text-4xl font-medium leading-relaxed mt-2 ${subTextClass}`}
					>
						{computedSubText}
					</p>
				</div>

				{/* Approximate Finish Time */}
				{state.finishTime && statusId !== "available" && (
					<div
						className={`mt-6 ${endsAroundClass} border-t border-b border-red-500 p-2 text-sm md:text-base font-medium flex items-center gap-2.5`}
					>
						<Icons.Timer
							className={`h-5 w-5 ${timerIconClass} animate-pulse`}
							style={{animationDuration: "2s"}}
						/>
						<span className="text-2xl">
							Available After:{" "}
							<span className={`font-bold ${valueColorClass}`}>
								{state.finishTime}
							</span>
						</span>
					</div>
				)}

				{/* Upcoming Scheduled Status */}
				{state.scheduledStatusId && (
					<div
						className={`mt-6 border-t border-b ${isLight ? "border-blue-300 text-blue-800" : "border-blue-900 text-blue-400"} p-2 text-sm md:text-base font-medium flex items-center gap-2.5`}
					>
						<Icons.Calendar
							className={`h-5 w-5 ${isLight ? "text-blue-500" : "text-blue-400"} animate-pulse`}
							style={{animationDuration: "2s"}}
						/>
						<span className="text-2xl">
							Next status:{" "}
							<span
								className={`font-extrabold ${isLight ? "text-blue-900" : "text-white"}`}
							>
								"
								{state.presetsOverrides?.[state.scheduledStatusId]?.title ||
									presets.find((p) => p.id === state.scheduledStatusId)
										?.label ||
									state.scheduledStatusId}
								"
							</span>{" "}
							at{" "}
							<span
								className={`font-bold ${isLight ? "text-blue-900" : "text-white"}`}
							>
								{state.scheduledStartTime}
							</span>
						</span>
					</div>
				)}
			</main>

			<hr
				className={`z-10 w-full ml-0 mr-auto border-t ${cardBorderClass} my-4`}
			/>

			{/* Footer Controls Unlock (Small & subtle bottom bar) */}
			<footer className="z-10 flex justify-start w-full ml-0 mr-auto">
				<Button
					variant="ghost"
					size="lg"
					onClick={onUnlock}
					className={settingsBtnClass}
				>
					<Icons.Lock className="h-3 w-3" />
					Settings Panel
				</Button>
			</footer>
		</div>
	);
}
