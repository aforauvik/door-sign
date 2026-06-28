/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import {useState, useEffect, useRef} from "react";
import Image from "next/image";
import * as Icons from "lucide-react";
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
}) {
	const [selectedId, setSelectedId] = useState(state.statusId);
	const [pinEnabled, setPinEnabled] = useState(state.pinEnabled);
	const [pinCode, setPinCode] = useState(state.pin || "1234");
	const [activeTheme, setActiveTheme] = useState(state.theme || "dark");
	const [pinError, setPinError] = useState("");
	const [finishTime, setFinishTime] = useState(state.finishTime || "");
	const [editingPreset, setEditingPreset] = useState(null);
	const [launchModalPreset, setLaunchModalPreset] = useState(null);
	const [isAddPresetOpen, setIsAddPresetOpen] = useState(false);
	const [isMoreOpen, setIsMoreOpen] = useState(false);
	const [isPinSettingsOpen, setIsPinSettingsOpen] = useState(false);
	const popoverRef = useRef(null);

	const activePreset = presets.find((p) => p.id === selectedId) || presets[0];
	const defaultPresets = presets.filter((p) => !p.isCustom);
	const customPresets = presets.filter((p) => p.isCustom);

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
		setLaunchModalPreset(preset);
	};

	const getReturnTimeStr = (minutesToAdd) => {
		const d = new Date();
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
			updateStatus(presetId, "", "");
			updateSettings({
				finishTime: finishTime,
			});
		}
	};

	const handleCancelPresetDialog = () => {
		setLaunchModalPreset(null);
		setFinishTime(state.finishTime || "");
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
	const dividerClass = isLight ? "border-zinc-100" : "border-zinc-800";

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
		? "text-xs font-semibold text-zinc-700"
		: "text-xs font-semibold text-zinc-400";
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
			<header className="max-w-5xl mx-auto w-full mb-8 flex flex-row items-center justify-between gap-4">
				<div>
					<div className="flex items-center gap-2">
						{/* <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" /> */}
						<Image
							src="/logo.svg"
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
					{/* <p className={`${descTextClass} text-sm mt-1`}>
						Select your status and configure display preferences.
					</p> */}
				</div>
				<div className="flex items-center gap-2">
					<Button
						className="px-4 py-5 text-sm font-semibold dark:text-white text-emerald-600 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-500/30 transition-all duration-500 border-1"
						onClick={handleDirectLaunch}
					>
						<Icons.DoorClosed className="h-4 w-4" />
						Launch Display
					</Button>

					{/* More Actions Popover */}
					<div className="relative" ref={popoverRef}>
						<Button
							className="px-3 py-5"
							variant={isLight ? "outline" : "secondary"}
							onClick={() => setIsMoreOpen(!isMoreOpen)}
						>
							<Icons.MoreHorizontal className="h-4 w-4" />
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
				{/* Presets Grid */}
				<section className="space-y-6">
					<div className="flex items-center justify-between">
						<h2
							className={`text-lg font-semibold flex items-center gap-2 ${sectionTitleClass}`}
						>
							<Icons.Layout className="h-5 w-5 text-zinc-400" />
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
					<div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
						{defaultPresets.map((preset) => {
							const isActive = selectedId === preset.id;

							return (
								<Card
									key={preset.id}
									onClick={() => handleStatusSelect(preset.id)}
									className={`relative cursor-pointer rounded-2xl border flex flex-col justify-between p-4 overflow-hidden select-none h-[160px] transition-all duration-200 ${
										isActive
											? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20"
											: isLight
												? "border-zinc-100 bg-white hover:border-zinc-200"
												: "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
									}`}
								>
									{/* Top-left: Small Icon */}
									<div
										className={`p-2 rounded-lg w-fit transition-colors ${
											isActive
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
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
												? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
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
											<span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center gap-1.5 mb-0.5 flex-wrap">
												<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
												Active
												{state.finishTime && preset.id !== "available" && (
													<span className="normal-case font-semibold text-emerald-600 dark:text-emerald-400/90 ml-1">
														• Until {state.finishTime}
													</span>
												)}
											</span>
										)}
										<span
											className={`font-semibold text-sm leading-tight transition-colors ${
												isActive
													? isLight
														? "text-emerald-700 font-bold"
														: "text-white font-bold"
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

					{/* Custom Presets Grid */}
					{customPresets.length > 0 && (
						<div className={`space-y-6 pt-6 border-t ${dividerClass}`}>
							<div className="flex items-center justify-between">
								<h2
									className={`text-lg font-semibold flex items-center gap-2 ${sectionTitleClass}`}
								>
									<Icons.Clock className="h-5 w-5 text-zinc-400" />
									Custom Presets
								</h2>
							</div>
							<div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
								{customPresets.map((preset) => {
									const isActive = selectedId === preset.id;

									return (
										<Card
											key={preset.id}
											onClick={() => handleStatusSelect(preset.id)}
											className={`relative cursor-pointer rounded-2xl border flex flex-col justify-between p-4 overflow-hidden select-none h-[160px] transition-all duration-200 ${
												isActive
													? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/20"
													: isLight
														? "border-zinc-100 bg-white hover:border-zinc-200"
														: "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700"
											}`}
										>
											{/* Top-left: Small Icon */}
											<div
												className={`p-2 rounded-lg w-fit transition-colors ${
													isActive
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15"
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
														? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"
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
													<span className="text-[10px] uppercase font-bold tracking-wider text-emerald-500 flex items-center gap-1.5 mb-0.5 flex-wrap">
														<span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
														Active
														{state.finishTime && preset.id !== "available" && (
															<span className="normal-case font-semibold text-emerald-600 dark:text-emerald-400/90 ml-1">
																• Until {state.finishTime}
															</span>
														)}
													</span>
												)}
												<span
													className={`font-semibold text-sm leading-tight transition-colors ${
														isActive
															? isLight
																? "text-emerald-700 font-bold"
																: "text-white font-bold"
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
						</div>
					)}
				</section>
			</main>

			{editingPreset && (
				<PresetEditDialog
					isOpen={!!editingPreset}
					onClose={() => setEditingPreset(null)}
					preset={editingPreset}
					initialSubtext={state.presetsOverrides?.[editingPreset.id]?.subtext}
					isLight={isLight}
					onSave={(subtext, updatedTitle) => {
						if (editingPreset.isCustom && updatedTitle) {
							const currentCustom = state.customPresets || [];
							const newCustom = currentCustom.map((p) =>
								p.id === editingPreset.id ? {...p, label: updatedTitle} : p,
							);
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {subtext},
							};
							updateSettings({
								customPresets: newCustom,
								presetsOverrides: newOverrides,
							});
						} else {
							const currentOverrides = state.presetsOverrides || {};
							const newOverrides = {
								...currentOverrides,
								[editingPreset.id]: {subtext},
							};
							updateSettings({presetsOverrides: newOverrides});
						}
					}}
					onDelete={() => {
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

							{/* End Time controls (Only shown if status is not 'available') */}
							{launchModalPreset.id !== "available" && (
								<div className="space-y-3">
									<div className="flex flex-col gap-1">
										<label className={modalLabelClass}>
											Approximate End Time (Optional)
										</label>
										<p className={modalSubLabelClass}>
											Indicate when you expect to finish this status.
										</p>
									</div>

									<div className="flex flex-wrap gap-2">
										{[15, 30, 45, 60, 120].map((mins) => {
											const label = mins >= 60 ? `${mins / 60}h` : `${mins}m`;
											return (
												<Button
													key={mins}
													variant="outline"
													size="sm"
													onClick={() =>
														handleFinishTimeChange(getReturnTimeStr(mins))
													}
													className={modalTimeBtnClass}
												>
													+{label}
												</Button>
											);
										})}
										{finishTime && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleFinishTimeChange("")}
												className="rounded-lg px-3 text-red-500 hover:text-red-400 hover:bg-red-500/10"
											>
												Clear
											</Button>
										)}
									</div>

									<div className="relative">
										<Icons.Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
										<Input
											type="text"
											value={finishTime}
											onChange={(e) => handleFinishTimeChange(e.target.value)}
											placeholder="e.g. 3:00 PM, in 30 mins"
											className={`pl-10 ${inputClass}`}
										/>
									</div>
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
								className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
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
					onSave={({label, defaultSubText}) => {
						const newId = `custom-${Date.now()}`;
						const newPreset = {
							id: newId,
							label,
							defaultSubText,
							icon: "Clock",
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
	initialSubtext,
	isLight,
	onSave,
	onDelete,
}) {
	const [title, setTitle] = useState(preset?.label || "");
	const [subtext, setSubtext] = useState(initialSubtext || "");
	const [error, setError] = useState("");

	useEffect(() => {
		setTitle(preset?.label || "");
		setSubtext(initialSubtext || "");
		setError("");
	}, [preset, initialSubtext]);

	const handleSave = () => {
		const trimmedTitle = title.trim();
		if (preset?.isCustom) {
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
		onSave(subtext, trimmedTitle);
		onClose();
	};

	const handleReset = () => {
		onSave("");
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
					{preset?.isCustom && (
						<div className="space-y-2">
							<div className="flex justify-between items-center">
								<label className={modalLabelClass}>Preset Title</label>
								<span className={`text-[10px] font-medium ${title.length > 20 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}>
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
							<span className={`text-[10px] font-medium ${subtext.length > 75 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}>
								{subtext.length}/75
							</span>
						</div>
						<Input
							type="text"
							maxLength={75}
							value={subtext}
							onChange={(e) => setSubtext(e.target.value)}
							placeholder={`e.g. Writing code. (Default: "${preset?.defaultSubText}")`}
							className={inputClass}
						/>
					</div>
				</div>

				<DialogFooter
					className={`flex gap-2 sm:justify-between border-t ${isLight ? "border-zinc-150" : "border-zinc-900"} pt-4 mt-2`}
				>
					{preset?.isCustom ? (
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
						<Button
							variant="ghost"
							onClick={handleReset}
							className="text-red-500 hover:text-red-650 hover:bg-red-500/10 font-semibold"
						>
							Reset to Default
						</Button>
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
							className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
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
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setTitle("");
			setSubtext("");
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
						<Icons.Clock className="h-5 w-5 text-emerald-500" />
						Create Custom Preset
					</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="space-y-2">
						<div className="flex justify-between items-center">
							<label className={modalLabelClass}>Preset Title</label>
							<span className={`text-[10px] font-medium ${title.length > 20 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}>
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
							<span className={`text-[10px] font-medium ${subtext.length > 75 ? "text-red-500" : isLight ? "text-zinc-400" : "text-zinc-550"}`}>
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
						Create Preset
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
