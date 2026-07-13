/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {useState, useEffect, useRef} from "react";
import Image from "next/image";
import * as LucideIcons from "lucide-react";
import * as TablerIcons from "@tabler/icons-react";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {COLOR_THEMES} from "../constants/color-themes";

const tablerOverrides = {
	CheckCircle2: TablerIcons.IconCircleCheck,
	MinusCircle: TablerIcons.IconCircleMinus,
	Code2: TablerIcons.IconCode,
	MoreHorizontal: TablerIcons.IconDots,
	AlertTriangle: TablerIcons.IconAlertTriangle,
	DoorOpen: LucideIcons.DoorOpen,
	DoorClosed: LucideIcons.DoorClosed,
	Expand: TablerIcons.IconArrowsMaximize,
	HelpCircle: TablerIcons.IconHelpCircle || TablerIcons.IconHelp,
	Laptop: TablerIcons.IconDeviceLaptop,
	GraduationCap: TablerIcons.IconSchool,
	BookOpen: TablerIcons.IconBook,
	Unlock: TablerIcons.IconLockOpen,
	Tv: TablerIcons.IconDeviceTv,
	Mic: TablerIcons.IconMicrophone,
};

const Icons = new Proxy(
	{},
	{
		get(target, prop) {
			if (tablerOverrides[prop]) {
				return tablerOverrides[prop];
			}
			const tablerName = `Icon${prop}`;
			if (TablerIcons[tablerName]) {
				return TablerIcons[tablerName];
			}
			return TablerIcons.IconHelpCircle || TablerIcons.IconHelp;
		},
	},
);

// Dynamic Icon Component Loader
function StatusIcon({name, className}) {
	const IconComponent = Icons[name];
	if (!IconComponent) return <Icons.HelpCircle className={className} />;
	return <IconComponent className={className} />;
}

export function DoorSignControl({
	state,
	presets,
	updateStatus,
	updateSettings,
	onLaunch,
	onSignOut,
	user,
}) {
	const [selectedId, setSelectedId] = useState(state.statusId);
	const [pinEnabled, setPinEnabled] = useState(state.pinEnabled);
	const [pinCode, setPinCode] = useState(state.pin || "1234");
	const [activeTheme, setActiveTheme] = useState(state.theme || "dark");
	const [pinError, setPinError] = useState("");
	const [finishTime, setFinishTime] = useState(state.finishTime || "");
	const [startTime, setStartTime] = useState("");
	const [editingPreset, setEditingPreset] = useState(null);
	const [launchModalPreset, setLaunchModalPreset] = useState(null);
	const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
	const popoverRef = useRef(null);

	const activePreset = presets.find((p) => p.id === selectedId) || presets[0];

	// Parse a time string (e.g. "2:00 PM") into separate components
	const parseTime = (timeStr) => {
		if (!timeStr || timeStr.toLowerCase() === "now")
			return {hour: "", minute: "", ampm: "", isSet: false};
		const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
		if (!match) return {hour: "", minute: "", ampm: "", isSet: false};
		return {
			hour: match[1],
			minute: match[2],
			ampm: match[3].toUpperCase(),
			isSet: true,
		};
	};

	const getCurrentTimeComponents = () => {
		const d = new Date();
		// Round to next 5 minutes
		const minutes = Math.ceil(d.getMinutes() / 5) * 5;
		d.setMinutes(minutes);

		let hours = d.getHours();
		const ampm = hours >= 12 ? "PM" : "AM";
		hours = hours % 12;
		hours = hours ? hours.toString() : "12";
		const minutesStr = d.getMinutes().toString().padStart(2, "0");

		return {hour: hours, minute: minutesStr, ampm};
	};

	const startTimeParsed = parseTime(startTime);
	const finishTimeParsed = parseTime(finishTime);

	// Check if end time is backward from start time
	const isTimeRangeInvalid = () => {
		if (!finishTime) return false;

		const getMinutes = (timeString) => {
			if (!timeString || timeString.toLowerCase() === "now") {
				const d = new Date();
				return d.getHours() * 60 + d.getMinutes();
			}
			const match = timeString.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
			if (!match) return 0;

			let hours = parseInt(match[1], 10);
			const minutes = parseInt(match[2], 10);
			const ampm = match[3].toUpperCase();

			if (ampm === "PM" && hours < 12) hours += 12;
			if (ampm === "AM" && hours === 12) hours = 0;

			return hours * 60 + minutes;
		};

		const startMins = getMinutes(startTime);
		const endMins = getMinutes(finishTime);

		return endMins <= startMins;
	};

	const rangeInvalid = isTimeRangeInvalid();

	const handleStartTimePickerChange = (newHour, newMinute, newAmpm) => {
		const current = getCurrentTimeComponents();
		const h = newHour || startTimeParsed.hour || current.hour;
		const m = newMinute || startTimeParsed.minute || current.minute;
		const a = newAmpm || startTimeParsed.ampm || current.ampm;
		setStartTime(`${h}:${m} ${a}`);
	};

	const handleFinishTimePickerChange = (newHour, newMinute, newAmpm) => {
		const current = getCurrentTimeComponents();
		const h = newHour || finishTimeParsed.hour || current.hour;
		const m = newMinute || finishTimeParsed.minute || current.minute;
		const a = newAmpm || finishTimeParsed.ampm || current.ampm;
		handleFinishTimeChange(`${h}:${m} ${a}`);
	};

	// Keep state updated if parent state changes
	useEffect(() => {
		setSelectedId(state.statusId);
		setPinEnabled(state.pinEnabled);
		setPinCode(state.pin || "1234");
		setActiveTheme(state.theme || "dark");
		setFinishTime(state.finishTime || "");
	}, [state]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (popoverRef.current && !popoverRef.current.contains(event.target)) {
				setIsMoreOpen(false);
			}
		};
		if (isMoreOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMoreOpen]);

	const handleStatusSelect = (id) => {
		const preset = presets.find((p) => p.id === id);
		setFinishTime(state.statusId === id ? state.finishTime || "" : "");
		setStartTime("");
		setLaunchModalPreset(preset);
	};

	const getReturnTimeStr = (minutesToAdd, baseTimeStr = "") => {
		const d = new Date();

		if (baseTimeStr && baseTimeStr.toLowerCase() !== "now") {
			const match = baseTimeStr.match(/^(\d+):(\d+)\s*(AM|PM)$/i);
			if (match) {
				let hours = parseInt(match[1], 10);
				const minutes = parseInt(match[2], 10);
				const ampm = match[3].toUpperCase();

				if (ampm === "PM" && hours < 12) hours += 12;
				if (ampm === "AM" && hours === 12) hours = 0;

				d.setHours(hours, minutes, 0, 0);
			}
		}

		d.setMinutes(d.getMinutes() + minutesToAdd);

		let hours = d.getHours();
		const minutes = d.getMinutes().toString().padStart(2, "0");
		const ampm = hours >= 12 ? "PM" : "AM";
		hours = hours % 12;
		hours = hours ? hours : 12; // the hour '0' should be '12'

		return `${hours}:${minutes} ${ampm}`;
	};

	const handleFinishTimeChange = (timeStr) => {
		setFinishTime(timeStr);
	};

	const handleActivatePreset = () => {
		if (launchModalPreset) {
			const presetId = launchModalPreset.id;
			setLaunchModalPreset(null);

			if (startTime) {
				// Future Schedule
				updateSettings({
					scheduledStatusId: presetId,
					scheduledStartTime: startTime,
					scheduledFinishTime: finishTime || "",
				});
			} else {
				// Immediate Activation
				updateSettings({
					statusId: presetId,
					finishTime: finishTime || "",
					scheduledStatusId: null,
					scheduledStartTime: null,
					scheduledFinishTime: null,
				});
			}
		}
	};

	const handleCancelPresetDialog = () => {
		setLaunchModalPreset(null);
		setFinishTime(state.finishTime || "");
		setStartTime("");
	};

	const handleDirectLaunch = () => {
		// Request wake lock using the user gesture from this click
		if (typeof window !== "undefined" && "wakeLock" in navigator) {
			navigator.wakeLock
				.request("screen")
				.then((lock) => {
					console.log("Wake lock pre-acquired on direct launch click:", lock);
				})
				.catch((err) => {
					console.warn(
						"Failed to pre-acquire wake lock on direct launch click:",
						err,
					);
				});
		}
		onLaunch();
	};

	const isLight = activeTheme === "light";

	// Light/Dark Theme Classes
	const containerClass = isLight
		? "bg-zinc-50 text-zinc-900"
		: "bg-zinc-950 text-zinc-100";
	const headerTextClass = isLight ? "text-zinc-900" : "text-white";
	const descTextClass = isLight ? "text-zinc-500" : "text-zinc-400";
	const sectionTitleClass = isLight ? "text-zinc-800" : "text-zinc-200";
	const dividerClass = isLight ? "border-zinc-200" : "border-zinc-800";

	const cardClass = isLight
		? "border-zinc-100 bg-white"
		: "border-zinc-800 bg-zinc-900/40 backdrop-blur-md";

	const inputClass = isLight
		? "border-zinc-100 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:border-zinc-300"
		: "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-800 focus-visible:border-zinc-700";

	const launchBtnClass = isLight
		? "bg-zinc-900 text-white hover:bg-zinc-800 active:scale-95"
		: "bg-zinc-100 text-zinc-950 hover:bg-white active:scale-95";

	const launchDisplayBtnClass = isLight
		? "bg-emerald-600 text-white hover:bg-emerald-500 font-semibold active:scale-95"
		: "bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold active:scale-95";

	const presetGridClass = isLight
		? "border-zinc-100 bg-white"
		: "border-zinc-800 bg-zinc-900/40 backdrop-blur-md";

	// Modal Theme Classes
	const modalContentClass = isLight
		? "max-w-[420px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[420px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalLaunchContentClass = isLight
		? "max-w-[440px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[440px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalHeaderClass = isLight
		? "pb-4 border-b border-zinc-150"
		: "pb-4 border-b border-zinc-900";
	const modalTitleClass = isLight
		? "text-lg font-medium text-zinc-800"
		: "text-lg font-medium text-zinc-300";
	const modalLabelClass = isLight
		? "text-sm font-semibold"
		: "text-sm font-semibold";
	const modalSubLabelClass = isLight
		? "text-[11px] text-zinc-400"
		: "text-[11px] text-zinc-500";
	const modalCancelBtnClass = isLight
		? "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100"
		: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900";
	const previewBoxClass = isLight
		? "p-4 rounded-xl bg-zinc-50 border border-zinc-200"
		: "p-4 rounded-xl bg-zinc-900/60 border border-zinc-800";
	const previewLabelClass = isLight
		? "text-xs text-zinc-400 uppercase tracking-widest font-semibold mb-1"
		: "text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-1";
	const previewSubtextClass = isLight
		? "text-sm text-zinc-500 mt-1"
		: "text-sm text-zinc-400 mt-1";
	const modalTimeBtnClass = isLight
		? "rounded-lg px-3 bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-900 font-medium"
		: "rounded-lg px-3 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white";

	return (
		<div
			className={`flex flex-col min-h-screen font-sans p-6 md:p-12 transition-colors duration-300 ${containerClass}`}
		>
			<header
				className={`max-w-5xl mx-auto w-full pb-5 mb-8 flex flex-row items-center justify-between gap-4 border-b ${dividerClass}`}
			>
				<div>
					<div className="flex items-center gap-2">
						{/* <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> */}
						<Image
							src={isLight ? "logo-black.svg" : "logo-white.svg"}
							alt="Knock Later Logo"
							width={40}
							height={40}
							className="h-8 w-8"
						/>
						<h1
							className={`text-lg ml-1 font-bold tracking-tight hidden md:block ${headerTextClass}`}
						>
							Knock Later
						</h1>
					</div>
				</div>
				<div className="flex items-center gap-2">
					<Button
						className={`px-4 py-5 text-sm font-semibold transition-all duration-500 border-1 ${
							isLight
								? "bg-zinc-950 text-white border-zinc-950 hover:bg-zinc-900 hover:border-zinc-900"
								: "bg-white text-zinc-950 border-white hover:bg-zinc-100 hover:border-zinc-100"
						}`}
						onClick={handleDirectLaunch}
					>
						<Icons.Expand className="h-4 w-4" />
						Launch Display
					</Button>

					{/* More Actions Popover */}
					<div className="relative" ref={popoverRef}>
						<Button
							className={`px-3 py-5 ${isLight ? "text-black bg-zinc-100 hover:bg-zinc-200" : "text-white bg-zinc-900 hover:bg-zinc-800"}`}
							onClick={() => setIsMoreOpen(!isMoreOpen)}
						>
							<Icons.Settings className="h-4 w-4" />
						</Button>

						{isMoreOpen && (
							<div
								className={`absolute right-0 mt-2 w-64 rounded-2xl border p-2 shadow-xl z-50 animate-in fade-in-50 zoom-in-95 duration-100 ${
									isLight
										? "bg-white border-zinc-200 text-zinc-900 shadow-zinc-200/50"
										: "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-black/40"
								}`}
							>
								<div className="flex flex-col gap-1">
									{/* User Profile Header */}
									{user && (
										<>
											<div className="flex items-center gap-2.5 px-3 py-2">
												{user.user_metadata?.avatar_url ? (
													<img
														src={user.user_metadata.avatar_url}
														alt={user.user_metadata.full_name || "Profile"}
														className="h-9 w-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
														referrerPolicy="no-referrer"
													/>
												) : (
													<div className="h-9 w-9 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
														{(
															user.user_metadata?.full_name ||
															user.email ||
															"U"
														)
															.charAt(0)
															.toUpperCase()}
													</div>
												)}
												<div className="flex flex-col min-w-0">
													<span
														className={`text-xs font-semibold truncate ${isLight ? "text-zinc-800" : "text-zinc-200"}`}
													>
														{user.user_metadata?.full_name || "Sign User"}
													</span>
													<span
														className={`text-[10px] truncate ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
													>
														{user.email}
													</span>
												</div>
											</div>
											<hr className={`${dividerClass} my-0.5`} />
										</>
									)}
									{/* Theme Switcher Item */}
									<div className="flex items-center justify-between w-full px-3 py-2 rounded-xl">
										<div className="flex items-center gap-2.5">
											{activeTheme === "light" ? (
												<Icons.Sun className="h-4 w-4 text-amber-500 shrink-0" />
											) : (
												<Icons.Moon className="h-4 w-4 text-zinc-455 shrink-0" />
											)}
											<span
												className={`text-xs font-semibold ${
													isLight ? "text-zinc-700" : "text-zinc-300"
												}`}
											>
												{activeTheme === "light" ? "Light Mode" : "Dark Mode"}
											</span>
										</div>
										<Switch
											checked={activeTheme === "light"}
											onCheckedChange={(checked) => {
												const newTheme = checked ? "light" : "dark";
												setActiveTheme(newTheme);
												updateSettings({theme: newTheme});
											}}
										/>
									</div>

									<hr className={`${dividerClass} my-0.5`} />

									{/* PIN Lock Option */}
									<button
										onClick={() => {
											setIsMoreOpen(false);
											setIsPinSettingsOpen(true);
										}}
										className={`flex items-center justify-between w-full px-3 py-2 rounded-md cursor-pointer text-left transition-all ${
											isLight
												? "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900"
												: "hover:bg-zinc-800/80 text-zinc-300 hover:text-zinc-100"
										}`}
									>
										<div className="flex items-center gap-2.5">
											{pinEnabled ? (
												<Icons.Lock className="h-4 w-4 text-emerald-500 shrink-0" />
											) : (
												<Icons.Unlock className="h-4 w-4 text-zinc-455 shrink-0" />
											)}
											<span className="text-xs font-semibold">PIN Lock</span>
										</div>
										<div className="flex items-center gap-1 text-[10px] text-zinc-550">
											<span>{pinEnabled ? "Enabled" : "Disabled"}</span>
											<Icons.ChevronRight className="h-3.5 w-3.5 text-zinc-450" />
										</div>
									</button>

									<hr className={`${dividerClass} my-0.5`} />

									{/* Log Out Option */}
									<button
										onClick={() => {
											setIsMoreOpen(false);
											onSignOut();
										}}
										className={`flex items-center justify-between w-full px-3 py-2 rounded-md text-left transition-all cursor-pointer ${
											isLight
												? "hover:bg-red-50 text-red-650 hover:text-red-700"
												: "hover:bg-red-950/30 text-red-455 hover:text-red-400"
										}`}
									>
										<div className="flex items-center gap-2.5">
											<Icons.Power className="h-4 w-4 shrink-0" />
											<span className="text-xs font-semibold">Log Out</span>
										</div>
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			</header>

			<main className="max-w-5xl mx-auto w-full space-y-8 flex flex-col">
				{/* Welcome greeting */}
				<div className="flex flex-col gap-1">
					<h2
						className={`text-2xl md:text-3xl font-bold tracking-tight ${headerTextClass}`}
					>
						Welcome back,{" "}
						{user?.user_metadata?.full_name ||
							user?.email?.split("@")[0] ||
							"User"}
					</h2>
					<p className={`${descTextClass} text-sm`}>
						Let everyone know what's happening!
					</p>
				</div>

				{state.scheduledStatusId && (
					<div
						className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
							isLight
								? "bg-blue-50/50 border-blue-100 text-blue-800"
								: "bg-blue-950/15 border-blue-900/30 text-blue-300"
						}`}
					>
						<div className="flex items-center gap-3">
							<div
								className={`p-2 rounded-lg ${isLight ? "bg-blue-100/60 text-blue-600" : "bg-blue-950/40 text-blue-400"}`}
							>
								<Icons.Calendar className="h-5 w-5" />
							</div>
							<div className="flex flex-col">
								<span className="text-sm font-bold leading-snug">
									Upcoming Scheduled Status
								</span>
								<span
									className={`text-xs ${isLight ? "text-blue-650" : "text-blue-400"} mt-0.5`}
								>
									Preset{" "}
									<strong
										className={`font-semibold ${isLight ? "text-blue-900" : "text-white"}`}
									>
										"
										{state.presetsOverrides?.[state.scheduledStatusId]?.title ||
											presets.find((p) => p.id === state.scheduledStatusId)
												?.label ||
											state.scheduledStatusId}
										"
									</strong>{" "}
									is scheduled to run from{" "}
									<strong
										className={`font-extrabold ${isLight ? "text-blue-900" : "text-white"}`}
									>
										{state.scheduledStartTime}
									</strong>{" "}
									to{" "}
									<strong
										className={`font-extrabold ${isLight ? "text-blue-900" : "text-white"}`}
									>
										{state.scheduledFinishTime || "Unspecified"}
									</strong>
								</span>
							</div>
						</div>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => {
								updateSettings({
									scheduledStatusId: null,
									scheduledStartTime: null,
									scheduledFinishTime: null,
								});
							}}
							className="rounded-lg h-9 px-3.5 font-bold text-red-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 border border-transparent hover:border-red-500/10"
						>
							Cancel Schedule
						</Button>
					</div>
				)}

				{/* Presets Grid */}
				<section className="space-y-6">
					<div className="flex items-center justify-between">
						<h2
							className={`text-base font-semibold flex items-center gap-2 ${sectionTitleClass}`}
						>
							{selectedId === "available" ? (
								<Icons.DoorOpen className="h-5 w-5" />
							) : (
								<Icons.DoorClosed className="h-5 w-5" />
							)}
							Status Presets
						</h2>
						<Button
							variant={isLight ? "outline" : "secondary"}
							onClick={() => setIsAddPresetOpen(true)}
							size="sm"
						>
							<Icons.Plus className="h-4 w-4" />
							Add Preset
						</Button>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-4">
						{presets.map((preset) => {
							const isActive = selectedId === preset.id;

							const presetColor = preset.color || "emerald";
							const themeConfig =
								COLOR_THEMES[presetColor]?.[isLight ? "light" : "dark"] ||
								COLOR_THEMES.emerald[isLight ? "light" : "dark"];

							// Active Card Classes mapping
							const activeCardBorder = themeConfig.activeCardBorder;
							const activeIconClass = themeConfig.activeIcon;
							const activeMoreBtnClass = themeConfig.activeMoreBtn;
							const activeBadgeClass = themeConfig.activeBadge;
							const activeBadgeSubtextClass = themeConfig.activeBadgeSubtext;
							const activePulseClass = themeConfig.pulseBg;
							const activeTitleClass = themeConfig.activeTitle;

							return (
								<Card
									key={preset.id}
									onClick={() => handleStatusSelect(preset.id)}
									className={`relative cursor-pointer rounded-2xl border flex flex-col justify-between p-4 overflow-hidden select-none h-[160px] transition-all duration-200 ${
										isActive
											? activeCardBorder
											: isLight
												? "border-zinc-100 bg-white hover:border-zinc-200"
												: "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
									}`}
								>
									{/* Top-left: Small Icon */}
									<div
										className={`p-2 rounded-lg w-fit transition-colors ${
											isActive
												? activeIconClass
												: isLight
													? "bg-zinc-100 text-zinc-500 border border-zinc-200"
													: "bg-zinc-950 text-zinc-400 border border-zinc-900"
										}`}
									>
										<StatusIcon name={preset.icon} className="h-5 w-5" />
									</div>

									{/* Top-right: More Settings Button */}
									<Button
										variant="ghost"
										size="icon"
										onClick={(e) => {
											e.stopPropagation();
											setEditingPreset(preset);
										}}
										className={`absolute top-3 right-3 h-6 w-6 rounded-md transition-all ${
											isActive
												? activeMoreBtnClass
												: isLight
													? "bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 border border-zinc-200"
													: "bg-zinc-950 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 border border-zinc-900"
										}`}
									>
										<Icons.MoreHorizontal className="h-3.5 w-3.5" />
									</Button>

									{/* Bottom-left: Stacked Title & Subtitle */}
									<div className="flex flex-col text-left gap-1 mt-auto">
										{isActive && (
											<span
												className={`text-[10px] uppercase font-bold tracking-wider ${activeBadgeClass} flex items-center gap-1.5 mb-0.5 flex-wrap`}
											>
												<span
													className={`h-1.5 w-1.5 rounded-full ${activePulseClass} animate-pulse`}
												/>
												Active
												{state.finishTime && preset.id !== "available" && (
													<span
														className={`normal-case font-semibold ${activeBadgeSubtextClass} ml-1`}
													>
														• Until {state.finishTime}
													</span>
												)}
											</span>
										)}
										{!isActive && state.scheduledStatusId === preset.id && (
											<span className="text-[10px] uppercase font-bold tracking-wider text-blue-500 flex items-center gap-1.5 mb-0.5 flex-wrap">
												<Icons.Calendar className="h-3 w-3 animate-pulse" />
												Scheduled
												<span className="normal-case font-semibold text-blue-600 dark:text-blue-400/90 ml-1">
													• {state.scheduledStartTime} -{" "}
													{state.scheduledFinishTime || "Unspecified"}
												</span>
											</span>
										)}
										<span
											className={`font-semibold text-sm leading-tight transition-colors ${
												isActive
													? activeTitleClass
													: isLight
														? "text-zinc-800"
														: "text-zinc-200"
											}`}
										>
											{state.presetsOverrides?.[preset.id]?.title ||
												preset.label}
										</span>
										<span className="text-xs text-zinc-500 line-clamp-2 leading-tight">
											{state.presetsOverrides?.[preset.id]?.subtext ||
												preset.defaultSubText}
										</span>
									</div>
								</Card>
							);
						})}
					</div>
				</section>
			</main>

			{editingPreset && (
				<PresetEditDialog
					isOpen={!!editingPreset}
					onClose={() => setEditingPreset(null)}
					preset={editingPreset}
					initialTitle={
						state.presetsOverrides?.[editingPreset.id]?.title ||
						editingPreset.label
					}
					initialSubtext={state.presetsOverrides?.[editingPreset.id]?.subtext}
					initialColor={
						state.presetsOverrides?.[editingPreset.id]?.color ||
						editingPreset.color
					}
					isLight={isLight}
					onSave={(subtext, updatedTitle, updatedColor, updatedIcon) => {
						if (editingPreset.id === "available") {
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {
									...currentOverrides[editingPreset.id],
									subtext,
									color: updatedColor,
								},
							};
							updateSettings({presetsOverrides: newOverrides});
						} else if (editingPreset.isCustom && updatedTitle) {
							const currentCustom = state.customPresets || [];
							const newCustom = currentCustom.map((p) =>
								p.id === editingPreset.id
									? {
											...p,
											label: updatedTitle,
											color: updatedColor || p.color,
											icon: updatedIcon || p.icon,
										}
									: p,
							);
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {
									...currentOverrides[editingPreset.id],
									title: updatedTitle,
									subtext,
									color: updatedColor,
								},
							};
							updateSettings({
								customPresets: newCustom,
								presetsOverrides: newOverrides,
							});
						} else {
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {
									...currentOverrides[editingPreset.id],
									title: updatedTitle,
									subtext,
									color: updatedColor,
								},
							};
							updateSettings({presetsOverrides: newOverrides});
						}
					}}
					onDelete={() => {
						if (editingPreset.isCustom) {
							const currentCustom = state.customPresets || [];
							const newCustom = currentCustom.filter(
								(p) => p.id !== editingPreset.id,
							);
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {...currentOverrides};
							delete newOverrides[editingPreset.id];
							const newStatusId =
								state.statusId === editingPreset.id
									? "available"
									: state.statusId;
							updateSettings({
								customPresets: newCustom,
								presetsOverrides: newOverrides,
								statusId: newStatusId,
							});
						} else {
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {
									...currentOverrides[editingPreset.id],
									isDeleted: true,
								},
							};
							const newStatusId =
								state.statusId === editingPreset.id
									? "available"
									: state.statusId;
							updateSettings({
								presetsOverrides: newOverrides,
								statusId: newStatusId,
							});
						}
					}}
				/>
			)}

			{launchModalPreset && (
				<Dialog
					open={!!launchModalPreset}
					onOpenChange={(open) => !open && handleCancelPresetDialog()}
				>
					<DialogContent className={modalLaunchContentClass}>
						<DialogHeader className={modalHeaderClass}>
							<DialogTitle className={modalTitleClass}>
								Confirm Status Activation
							</DialogTitle>
						</DialogHeader>

						<div className="py-4 space-y-6">
							{/* Display Preview */}
							<div className={previewBoxClass}>
								<div className={previewLabelClass}>Status Preview</div>
								<div
									className={`text-lg font-bold ${launchModalPreset.id === "available" ? "text-emerald-500" : "text-red-500"}`}
								>
									{launchModalPreset.id === "available"
										? "Available"
										: state.presetsOverrides?.[launchModalPreset.id]?.title ||
											launchModalPreset.label}
								</div>
								<div className={previewSubtextClass}>
									{state.presetsOverrides?.[launchModalPreset.id]?.subtext ||
										launchModalPreset.defaultSubText}
								</div>
							</div>

							{/* Time controls (Only shown if status is not 'available') */}
							{launchModalPreset.id !== "available" && (
								<div className="space-y-4">
									{/* Start Time Section */}
									<div className="space-y-3">
										<div className="flex flex-col gap-1">
											<label className={modalLabelClass}>
												Status Start Time
											</label>
											<p className={modalSubLabelClass}>
												Indicate when you expect this status to begin (or leave
												as Now)
											</p>
										</div>

										<div className="flex w-full gap-2">
											{[
												{mins: 0, label: "Now"},
												{mins: 15, label: "+15m"},
												{mins: 30, label: "+30m"},
												{mins: 60, label: "+1h"},
												{mins: 120, label: "+2h"},
											].map(({mins, label}) => {
												const targetTimeStr =
													mins === 0 ? "" : getReturnTimeStr(mins);
												const isSelected =
													(!startTime && mins === 0) ||
													startTime === targetTimeStr;
												return (
													<Button
														key={mins}
														variant="outline"
														onClick={() => {
															setStartTime(targetTimeStr);
															// Reset finish time when changing start time to avoid stale offsets
															setFinishTime("");
														}}
														className={`${modalTimeBtnClass} flex-1 h-9 text-xs sm:text-sm font-semibold rounded-md ${
															isSelected
																? isLight
																	? "bg-emerald-100/80 border-emerald-300 text-emerald-800"
																	: "bg-emerald-950/60 border-emerald-800 text-emerald-400"
																: ""
														}`}
													>
														{label}
													</Button>
												);
											})}
										</div>

										<div className="flex items-center gap-3 py-0 mt-1.5">
											<div
												className={`h-px flex-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`}
											/>
											<span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
												or
											</span>
											<div
												className={`h-px flex-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`}
											/>
										</div>

										<div className="flex gap-2 justify-center items-center mt-1.5 w-full">
											{/* Start Hour Select */}
											<div className="relative flex-1 flex items-center">
												<Icons.Clock className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
												<Select
													value={
														startTimeParsed.isSet ? startTimeParsed.hour : ""
													}
													onValueChange={(val) => {
														handleStartTimePickerChange(val, "", "");
														setFinishTime("");
													}}
												>
													<SelectTrigger
														className={`pl-9 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="Hour" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														{Array.from({length: 12}, (_, i) =>
															(i + 1).toString(),
														).map((h) => (
															<SelectItem
																key={h}
																value={h}
																className={
																	isLight
																		? "hover:bg-zinc-100 text-zinc-900"
																		: "hover:bg-zinc-900 text-zinc-200"
																}
															>
																{h}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<span className="text-sm font-bold text-zinc-400">:</span>

											{/* Start Minute Select */}
											<div className="relative flex-1 flex items-center">
												<Select
													value={
														startTimeParsed.isSet ? startTimeParsed.minute : ""
													}
													onValueChange={(val) => {
														handleStartTimePickerChange("", val, "");
														setFinishTime("");
													}}
												>
													<SelectTrigger
														className={`pl-3 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="Min" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														{Array.from({length: 12}, (_, i) =>
															(i * 5).toString().padStart(2, "0"),
														).map((m) => (
															<SelectItem
																key={m}
																value={m}
																className={
																	isLight
																		? "hover:bg-zinc-100 text-zinc-900"
																		: "hover:bg-zinc-900 text-zinc-200"
																}
															>
																{m}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* Start AM/PM Select */}
											<div className="relative flex-1 flex items-center">
												<Select
													value={
														startTimeParsed.isSet ? startTimeParsed.ampm : ""
													}
													onValueChange={(val) => {
														handleStartTimePickerChange("", "", val);
														setFinishTime("");
													}}
												>
													<SelectTrigger
														className={`pl-3 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="AM/PM" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														<SelectItem
															value="AM"
															className={
																isLight
																	? "hover:bg-zinc-100 text-zinc-900"
																	: "hover:bg-zinc-900 text-zinc-200"
															}
														>
															AM
														</SelectItem>
														<SelectItem
															value="PM"
															className={
																isLight
																	? "hover:bg-zinc-100 text-zinc-900"
																	: "hover:bg-zinc-900 text-zinc-200"
															}
														>
															PM
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>

									{/* Divider line between start and end times */}
									<div
										className={`h-px w-full ${isLight ? "bg-zinc-200" : "bg-zinc-800"} my-4`}
									/>

									{/* End Time Section */}
									<div className="space-y-3">
										<div className="flex flex-col gap-1">
											<label className={modalLabelClass}>Status End Time</label>
											<p className={modalSubLabelClass}>
												{startTime
													? "Indicate when you expect to finish this status"
													: "Indicate when you expect to finish this status"}
											</p>
										</div>

										<div className="flex w-full gap-2">
											{[15, 30, 45, 60, 120].map((mins) => {
												const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
												const targetTimeStr = getReturnTimeStr(mins, startTime);
												const isSelected = finishTime === targetTimeStr;
												return (
													<Button
														key={mins}
														variant="outline"
														onClick={() => setFinishTime(targetTimeStr)}
														className={`${modalTimeBtnClass} flex-1 h-9 text-xs sm:text-sm font-semibold rounded-md ${
															isSelected
																? isLight
																	? "bg-emerald-100/80 border-emerald-300 text-emerald-800"
																	: "bg-emerald-950/60 border-emerald-800 text-emerald-400"
																: ""
														}`}
													>
														+{label}
													</Button>
												);
											})}
										</div>

										<div className="flex items-center gap-3 py-0 mt-1.5">
											<div
												className={`h-px flex-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`}
											/>
											<span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400 dark:text-zinc-500">
												or
											</span>
											<div
												className={`h-px flex-1 ${isLight ? "bg-zinc-200" : "bg-zinc-800"}`}
											/>
										</div>

										<div className="flex gap-2 justify-center items-center mt-1.5 w-full">
											{/* End Hour Select */}
											<div className="relative flex-1 flex items-center">
												<Icons.Clock className="absolute left-3 h-4 w-4 text-zinc-500 pointer-events-none z-10" />
												<Select
													value={
														finishTimeParsed.isSet ? finishTimeParsed.hour : ""
													}
													onValueChange={(val) =>
														handleFinishTimePickerChange(val, "", "")
													}
												>
													<SelectTrigger
														className={`pl-9 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="Hour" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														{Array.from({length: 12}, (_, i) =>
															(i + 1).toString(),
														).map((h) => (
															<SelectItem
																key={h}
																value={h}
																className={
																	isLight
																		? "hover:bg-zinc-100 text-zinc-900"
																		: "hover:bg-zinc-900 text-zinc-200"
																}
															>
																{h}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											<span className="text-sm font-bold text-zinc-400">:</span>

											{/* End Minute Select */}
											<div className="relative flex-1 flex items-center">
												<Select
													value={
														finishTimeParsed.isSet
															? finishTimeParsed.minute
															: ""
													}
													onValueChange={(val) =>
														handleFinishTimePickerChange("", val, "")
													}
												>
													<SelectTrigger
														className={`pl-3 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="Min" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														{Array.from({length: 12}, (_, i) =>
															(i * 5).toString().padStart(2, "0"),
														).map((m) => (
															<SelectItem
																key={m}
																value={m}
																className={
																	isLight
																		? "hover:bg-zinc-100 text-zinc-900"
																		: "hover:bg-zinc-900 text-zinc-200"
																}
															>
																{m}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</div>

											{/* End AM/PM Select */}
											<div className="relative flex-1 flex items-center">
												<Select
													value={
														finishTimeParsed.isSet ? finishTimeParsed.ampm : ""
													}
													onValueChange={(val) =>
														handleFinishTimePickerChange("", "", val)
													}
												>
													<SelectTrigger
														className={`pl-3 pr-3 !h-9 w-full rounded-md border ${
															isLight
																? "border-zinc-200 bg-zinc-50 text-zinc-900 data-[placeholder]:text-zinc-400"
																: "border-zinc-800 bg-zinc-950 text-zinc-200 data-[placeholder]:text-zinc-400"
														} text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/25 cursor-pointer`}
													>
														<SelectValue placeholder="AM/PM" />
													</SelectTrigger>
													<SelectContent
														className={
															isLight
																? "bg-white text-zinc-900 border-zinc-200"
																: "bg-zinc-950 text-zinc-200 border-zinc-800"
														}
													>
														<SelectItem
															value="AM"
															className={
																isLight
																	? "hover:bg-zinc-100 text-zinc-900"
																	: "hover:bg-zinc-900 text-zinc-200"
															}
														>
															AM
														</SelectItem>
														<SelectItem
															value="PM"
															className={
																isLight
																	? "hover:bg-zinc-100 text-zinc-900"
																	: "hover:bg-zinc-900 text-zinc-200"
															}
														>
															PM
														</SelectItem>
													</SelectContent>
												</Select>
											</div>
										</div>
									</div>

									{/* Visual Confirmation Card */}
									{(startTime || finishTime) && !rangeInvalid && (
										<div
											className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-sm font-semibold transition-all ${
												startTime
													? isLight
														? "bg-blue-50/50 border-blue-100 text-blue-800"
														: "bg-blue-950/20 border-blue-900/30 text-blue-400"
													: isLight
														? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
														: "bg-emerald-950/20 border-emerald-900/30 text-emerald-400"
											}`}
										>
											<div className="flex items-center gap-2">
												<Icons.Clock
													className={`h-4 w-4 shrink-0 ${startTime ? "text-blue-500" : "text-emerald-500"}`}
												/>
												<span>
													{startTime ? (
														<>
															Scheduled to run:{" "}
															<strong
																className={`text-base font-extrabold ${startTime ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"}`}
															>
																{startTime}
															</strong>{" "}
															to{" "}
															<strong
																className={`text-base font-extrabold ${startTime ? "text-blue-600 dark:text-blue-400" : "text-emerald-600 dark:text-emerald-400"}`}
															>
																{finishTime || "Unspecified"}
															</strong>
														</>
													) : (
														<>
															Status will end at:{" "}
															<strong className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
																{finishTime}
															</strong>
														</>
													)}
												</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => {
													setFinishTime("");
													setStartTime("");
												}}
												className="rounded-lg px-2.5 h-8 text-red-500 hover:text-red-400 hover:bg-red-500/10 font-semibold transition-all shrink-0"
											>
												Clear
											</Button>
										</div>
									)}

									{/* Invalid Time Range Alert */}
									{rangeInvalid && (
										<div
											className={`flex items-center gap-2.5 p-3 rounded-xl border text-sm font-semibold transition-all ${
												isLight
													? "bg-red-50/50 border-red-100 text-red-800"
													: "bg-red-950/20 border-red-900/30 text-red-400"
											}`}
										>
											<Icons.AlertTriangle className="h-4 w-4 shrink-0 text-red-500 animate-bounce" />
											<span>End time must be later than start time.</span>
										</div>
									)}
								</div>
							)}
						</div>

						<DialogFooter
							className={`flex gap-2 sm:justify-end border-t ${isLight ? "border-zinc-150" : "border-zinc-900"} pt-4 mt-2`}
						>
							<Button
								variant="ghost"
								onClick={handleCancelPresetDialog}
								className={modalCancelBtnClass}
							>
								Cancel
							</Button>
							<Button
								onClick={handleActivatePreset}
								disabled={rangeInvalid}
								className={`font-semibold transition-all duration-300 ${
									rangeInvalid
										? isLight
											? "bg-zinc-200 text-zinc-400 cursor-not-allowed hover:bg-zinc-200"
											: "bg-zinc-800 text-zinc-600 cursor-not-allowed hover:bg-zinc-800"
										: isLight
											? "bg-zinc-950 text-white hover:bg-zinc-900"
											: "bg-white text-zinc-950 hover:bg-zinc-100"
								}`}
							>
								Activate
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}
			{isAddPresetOpen && (
				<AddPresetDialog
					isOpen={isAddPresetOpen}
					onClose={() => setIsAddPresetOpen(false)}
					isLight={isLight}
					onSave={({label, defaultSubText, color, icon}) => {
						const newId = `custom-${Date.now()}`;
						const newPreset = {
							id: newId,
							label,
							defaultSubText,
							color: color || "green",
							icon: icon || "Clock",
							isCustom: true,
						};
						const currentCustom = state.customPresets || [];
						updateSettings({
							customPresets: [...currentCustom, newPreset],
						});
					}}
				/>
			)}
			{isPinSettingsOpen && (
				<PinSettingsDialog
					isOpen={isPinSettingsOpen}
					onClose={() => setIsPinSettingsOpen(false)}
					isLight={isLight}
					initialPinEnabled={state.pinEnabled}
					initialPin={state.pin}
					onSave={({pinEnabled, pin}) => {
						updateSettings({pinEnabled, pin});
					}}
				/>
			)}
		</div>
	);
}

function PinSettingsDialog({
	isOpen,
	onClose,
	isLight,
	initialPinEnabled,
	initialPin,
	onSave,
}) {
	const [pinEnabled, setPinEnabled] = useState(initialPinEnabled);
	const [pinCode, setPinCode] = useState(initialPin || "1234");
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setPinEnabled(initialPinEnabled);
			setPinCode(initialPin || "1234");
			setError("");
		}
	}, [isOpen, initialPinEnabled, initialPin]);

	const handleSave = () => {
		if (pinEnabled) {
			if (!/^\d{4}$/.test(pinCode)) {
				setError("PIN must be exactly 4 digits.");
				return;
			}
		}
		setError("");
		onSave({
			pinEnabled,
			pin: pinEnabled ? pinCode : "",
		});
		onClose();
	};

	// Modal Theme Classes
	const modalContentClass = isLight
		? "max-w-[420px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[420px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalHeaderClass = isLight
		? "pb-4 border-b border-zinc-150"
		: "pb-4 border-b border-zinc-900";
	const modalTitleClass = isLight
		? "text-lg font-medium text-zinc-800"
		: "text-lg font-medium text-zinc-300";
	const modalLabelClass = isLight
		? "text-xs font-semibold text-zinc-700"
		: "text-xs font-semibold text-zinc-400";
	const inputClass = isLight
		? "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:border-zinc-300"
		: "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-800 focus-visible:border-zinc-700";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className={modalContentClass}>
				<DialogHeader className={modalHeaderClass}>
					<DialogTitle
						className={modalTitleClass}
						style={{display: "flex", alignItems: "center", gap: "0.5rem"}}
					>
						<Icons.Lock className="h-5 w-5 text-emerald-500" />
						Configure PIN Lock
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-6 py-4">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<label className={modalLabelClass}>PIN Lock Access</label>
							<p
								className={`text-[11px] ${isLight ? "text-zinc-500" : "text-zinc-400"}`}
							>
								Secure display; requires PIN to edit.
							</p>
						</div>
						<Switch checked={pinEnabled} onCheckedChange={setPinEnabled} />
					</div>

					{pinEnabled && (
						<div className="flex flex-col gap-1 animate-fadeIn">
							<label className={modalLabelClass}>4-Digit Passcode</label>
							<Input
								type="text"
								maxLength={4}
								value={pinCode}
								onChange={(e) => {
									const val = e.target.value.replace(/\D/g, "");
									setPinCode(val);
									setError("");
								}}
								placeholder="e.g. 1234"
								className={`text-center font-mono tracking-widest text-lg rounded-md ${inputClass}`}
							/>
							{error && <p className="text-xs text-red-500 mt-1">{error}</p>}
						</div>
					)}
				</div>

				<DialogFooter
					className={`flex gap-2 sm:justify-end border-t ${isLight ? "border-zinc-150" : "border-zinc-900"} pt-4 mt-2`}
				>
					<Button
						variant="ghost"
						onClick={onClose}
						className={
							isLight
								? "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 font-semibold"
								: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-semibold"
						}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
					>
						Save Settings
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function PresetEditDialog({
	isOpen,
	onClose,
	preset,
	initialTitle,
	initialSubtext,
	initialColor,
	isLight,
	onSave,
	onDelete,
}) {
	const getNormalizedColor = (c) => {
		if (c === "emerald") return "green";
		if (c === "amber") return "orange";
		if (c === "rose") return "red";
		return c || "green";
	};

	const [title, setTitle] = useState(initialTitle || preset?.label || "");
	const [subtext, setSubtext] = useState(initialSubtext || "");
	const [color, setColor] = useState(
		getNormalizedColor(initialColor || preset?.color),
	);
	const [selectedIconName, setSelectedIconName] = useState(
		preset?.icon || "Clock",
	);
	const [error, setError] = useState("");

	useEffect(() => {
		setTitle(initialTitle || preset?.label || "");
		setSubtext(initialSubtext || "");
		setColor(getNormalizedColor(initialColor || preset?.color));
		setSelectedIconName(preset?.icon || "Clock");
		setError("");
	}, [preset, initialTitle, initialSubtext, initialColor]);

	const handleSave = () => {
		const trimmedTitle = title.trim();
		if (preset?.id !== "available") {
			if (!trimmedTitle) {
				setError("Title is required.");
				return;
			}
			if (trimmedTitle.length > 20) {
				setError("Title must be 20 characters or less.");
				return;
			}
		}
		if (subtext.trim().length > 75) {
			setError("Subtext must be 75 characters or less.");
			return;
		}
		onSave(subtext, trimmedTitle, color, selectedIconName);
		onClose();
	};

	// Modal Theme Classes
	const modalContentClass = isLight
		? "max-w-[420px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[420px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalHeaderClass = isLight
		? "pb-4 border-b border-zinc-150"
		: "pb-4 border-b border-zinc-900";
	const modalTitleClass = isLight
		? "text-lg font-medium text-zinc-800"
		: "text-lg font-medium text-zinc-300";
	const modalLabelClass = isLight
		? "text-xs font-semibold text-zinc-700"
		: "text-xs font-semibold text-zinc-400";
	const modalCancelBtnClass = isLight
		? "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 font-semibold"
		: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900";
	const inputClass = isLight
		? "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:border-zinc-300"
		: "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-500 focus-visible:ring-1 focus-visible:ring-zinc-800 focus-visible:border-zinc-700";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className={modalContentClass}>
				<DialogHeader className={modalHeaderClass}>
					<DialogTitle className={modalTitleClass}>
						Edit {preset?.isCustom ? "Custom" : preset?.label} Preset
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{preset?.id !== "available" && (
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<label className={modalLabelClass}>Preset Title</label>
								<span
									className={`text-[10px] font-medium ${title.length > 20 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}
								>
									{title.length}/20
								</span>
							</div>
							<Input
								type="text"
								maxLength={20}
								value={title}
								onChange={(e) => {
									setTitle(e.target.value);
									setError("");
								}}
								placeholder="e.g. Lunch Break"
								className={inputClass}
							/>
							{error && <p className="text-xs text-red-500">{error}</p>}
						</div>
					)}

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className={modalLabelClass}>Custom Subtext</label>
							<span
								className={`text-[10px] font-medium ${subtext.length > 75 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}
							>
								{subtext.length}/75
							</span>
						</div>
						<Input
							type="text"
							maxLength={75}
							value={subtext}
							onChange={(e) => setSubtext(e.target.value)}
							placeholder={
								preset?.defaultSubText
									? `e.g. ${preset.defaultSubText}`
									: "e.g. Please do not disturb"
							}
							className={inputClass}
						/>
					</div>

					{preset?.id !== "available" && (
						<div className="space-y-2">
							<label className={modalLabelClass}>Color Theme</label>
							<div className="flex items-center gap-3.5 mt-1">
								{[
									{
										name: "green",
										value: "green",
										bg: "bg-emerald-500",
										ring: "ring-emerald-500/30",
									},
									{
										name: "orange",
										value: "orange",
										bg: "bg-amber-500",
										ring: "ring-amber-500/30",
									},
									{
										name: "blue",
										value: "blue",
										bg: "bg-blue-500",
										ring: "ring-blue-500/30",
									},
									{
										name: "red",
										value: "red",
										bg: "bg-red-500",
										ring: "ring-red-500/30",
									},
								].map((item) => (
									<button
										key={item.value}
										type="button"
										onClick={() => setColor(item.value)}
										className={`h-7 w-7 rounded-full ${item.bg} transition-all duration-200 cursor-pointer relative flex items-center justify-center ${
											color === item.value
												? `ring-4 ${item.ring} scale-110 shadow-md`
												: "opacity-80 hover:opacity-100 hover:scale-105"
										}`}
										title={`Select ${item.name}`}
									>
										{color === item.value && (
											<span className="h-2 w-2 rounded-full bg-white shadow-xs" />
										)}
									</button>
								))}
							</div>
						</div>
					)}

					{preset?.isCustom && (
						<div className="space-y-2">
							<label className={modalLabelClass}>Preset Icon</label>
							<div className="flex items-center gap-3.5 mt-1 flex-wrap">
								{[
									{name: "Laptop", icon: Icons.Laptop},
									{name: "Users", icon: Icons.Users},
									{name: "Video", icon: Icons.Video},
									{name: "Mic", icon: Icons.Mic},
									{name: "MinusCircle", icon: Icons.MinusCircle},
									{name: "Coffee", icon: Icons.Coffee},
									{name: "Phone", icon: Icons.Phone},
									{name: "Pray", icon: Icons.Pray},
									{name: "Clock", icon: Icons.Clock},
									{name: "BookOpen", icon: Icons.BookOpen},
									{name: "GraduationCap", icon: Icons.GraduationCap},
									{name: "Tv", icon: Icons.Tv},
									{name: "Briefcase", icon: Icons.Briefcase},
									{name: "Code2", icon: Icons.Code2},
								].map((item) => {
									const IconComponent = item.icon;
									return (
										<button
											key={item.name}
											type="button"
											onClick={() => setSelectedIconName(item.name)}
											className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
												selectedIconName === item.name
													? isLight
														? "bg-zinc-950 text-white border-zinc-950 shadow-sm scale-105"
														: "bg-white text-zinc-950 border-white shadow-md scale-105"
													: isLight
														? "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
														: "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
											}`}
											title={item.name}
										>
											<IconComponent className="h-4 w-4" />
										</button>
									);
								})}
							</div>
						</div>
					)}
				</div>

				<DialogFooter
					className={`flex gap-2 sm:justify-between border-t ${isLight ? "border-zinc-150" : "border-zinc-900"} pt-4 mt-2`}
				>
					{preset?.id !== "available" ? (
						<Button
							variant="ghost"
							onClick={() => {
								onDelete();
								onClose();
							}}
							className="text-red-500 hover:text-red-650 hover:bg-red-500/10 font-semibold"
						>
							Delete Preset
						</Button>
					) : (
						<div />
					)}
					<div className="flex gap-2">
						<Button
							variant="ghost"
							onClick={onClose}
							className={modalCancelBtnClass}
						>
							Cancel
						</Button>
						<Button
							onClick={handleSave}
							className={`font-semibold transition-all duration-300 ${
								isLight
									? "bg-zinc-950 text-white hover:bg-zinc-900"
									: "bg-white text-zinc-950 hover:bg-zinc-100"
							}`}
						>
							Save
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function AddPresetDialog({isOpen, onClose, isLight, onSave}) {
	const [title, setTitle] = useState("");
	const [subtext, setSubtext] = useState("");
	const [color, setColor] = useState("green");
	const [selectedIconName, setSelectedIconName] = useState("Clock");
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setTitle("");
			setSubtext("");
			setColor("green");
			setSelectedIconName("Clock");
			setError("");
		}
	}, [isOpen]);

	const handleSave = () => {
		const trimmedTitle = title.trim();
		if (!trimmedTitle) {
			setError("Title is required.");
			return;
		}
		if (trimmedTitle.length > 20) {
			setError("Title must be 20 characters or less.");
			return;
		}
		if (subtext.trim().length > 75) {
			setError("Subtext must be 75 characters or less.");
			return;
		}
		onSave({
			label: trimmedTitle,
			defaultSubText: subtext.trim() || "Please do not disturb.",
			color,
			icon: selectedIconName,
		});
		onClose();
	};

	// Modal Theme Classes
	const modalContentClass = isLight
		? "max-w-[420px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[420px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalHeaderClass = isLight
		? "pb-4 border-b border-zinc-150"
		: "pb-4 border-b border-zinc-900";
	const modalTitleClass = isLight
		? "text-lg font-medium text-zinc-800"
		: "text-lg font-medium text-zinc-300";
	const modalLabelClass = isLight
		? "text-xs font-semibold text-zinc-700"
		: "text-xs font-semibold text-zinc-400";
	const inputClass = isLight
		? "border-zinc-200 bg-zinc-50 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-200 focus-visible:border-zinc-300"
		: "border-zinc-800 bg-zinc-950 text-zinc-200 placeholder:text-zinc-650 focus-visible:ring-1 focus-visible:ring-zinc-800 focus-visible:border-zinc-700";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className={modalContentClass}>
				<DialogHeader className={modalHeaderClass}>
					<DialogTitle
						className={modalTitleClass}
						style={{display: "flex", alignItems: "center", gap: "0.5rem"}}
					>
						<Icons.Clock className="h-5 w-5" />
						Create Custom Preset
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className={modalLabelClass}>Preset Title</label>
							<span
								className={`text-[10px] font-medium ${title.length > 20 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}
							>
								{title.length}/20
							</span>
						</div>
						<Input
							type="text"
							maxLength={20}
							value={title}
							onChange={(e) => {
								setTitle(e.target.value);
								setError("");
							}}
							placeholder="e.g. Lunch Break, Focus Time"
							className={inputClass}
						/>
						{error && <p className="text-xs text-red-500">{error}</p>}
					</div>

					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className={modalLabelClass}>Default Subtext</label>
							<span
								className={`text-[10px] font-medium ${subtext.length > 75 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}
							>
								{subtext.length}/75
							</span>
						</div>
						<Input
							type="text"
							maxLength={75}
							value={subtext}
							onChange={(e) => setSubtext(e.target.value)}
							placeholder="e.g. Having lunch. Back soon!"
							className={inputClass}
						/>
					</div>

					<div className="space-y-2">
						<label className={modalLabelClass}>Color Theme</label>
						<div className="flex items-center gap-3.5 mt-1">
							{[
								{
									name: "green",
									value: "green",
									bg: "bg-emerald-500",
									ring: "ring-emerald-500/30",
								},
								{
									name: "orange",
									value: "orange",
									bg: "bg-amber-500",
									ring: "ring-amber-500/30",
								},
								{
									name: "blue",
									value: "blue",
									bg: "bg-blue-500",
									ring: "ring-blue-500/30",
								},
								{
									name: "red",
									value: "red",
									bg: "bg-red-500",
									ring: "ring-red-500/30",
								},
							].map((item) => (
								<button
									key={item.value}
									type="button"
									onClick={() => setColor(item.value)}
									className={`h-7 w-7 rounded-full ${item.bg} transition-all duration-200 cursor-pointer relative flex items-center justify-center ${
										color === item.value
											? `ring-4 ${item.ring} scale-110 shadow-md`
											: "opacity-80 hover:opacity-100 hover:scale-105"
									}`}
									title={`Select ${item.name}`}
								>
									{color === item.value && (
										<span className="h-2 w-2 rounded-full bg-white shadow-xs" />
									)}
								</button>
							))}
						</div>
					</div>

					<div className="space-y-2">
						<label className={modalLabelClass}>Preset Icon</label>
						<div className="flex items-center gap-3.5 mt-1 flex-wrap">
							{[
								{name: "Laptop", icon: Icons.Laptop},
								{name: "Users", icon: Icons.Users},
								{name: "Video", icon: Icons.Video},
								{name: "Mic", icon: Icons.Mic},
								{name: "MinusCircle", icon: Icons.MinusCircle},
								{name: "Coffee", icon: Icons.Coffee},
								{name: "Phone", icon: Icons.Phone},
								{name: "Pray", icon: Icons.Pray},
								{name: "Clock", icon: Icons.Clock},
								{name: "BookOpen", icon: Icons.BookOpen},
								{name: "GraduationCap", icon: Icons.GraduationCap},
								{name: "Tv", icon: Icons.Tv},
								{name: "Briefcase", icon: Icons.Briefcase},
								{name: "Code2", icon: Icons.Code2},
							].map((item) => {
								const IconComponent = item.icon;
								return (
									<button
										key={item.name}
										type="button"
										onClick={() => setSelectedIconName(item.name)}
										className={`h-9 w-9 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
											selectedIconName === item.name
												? isLight
													? "bg-zinc-950 text-white border-zinc-950 shadow-sm scale-105"
													: "bg-white text-zinc-950 border-white shadow-md scale-105"
												: isLight
													? "bg-zinc-50 border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900"
													: "bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
										}`}
										title={item.name}
									>
										<IconComponent className="h-4 w-4" />
									</button>
								);
							})}
						</div>
					</div>
				</div>

				<DialogFooter
					className={`flex gap-2 sm:justify-end border-t ${isLight ? "border-zinc-150" : "border-zinc-900"} pt-4 mt-2`}
				>
					<Button
						variant="ghost"
						onClick={onClose}
						className={
							isLight
								? "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 font-semibold"
								: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 font-semibold"
						}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						className={`font-semibold transition-all duration-300 ${
							isLight
								? "bg-zinc-950 text-white hover:bg-zinc-900"
								: "bg-white text-zinc-950 hover:bg-zinc-100"
						}`}
					>
						Create Preset
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
