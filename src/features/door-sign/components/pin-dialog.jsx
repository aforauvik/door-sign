"use client";

import {useState, useEffect} from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {Delete, X} from "lucide-react";

export function PinDialog({isOpen, onClose, onCorrectPin, savedPin, theme}) {
	const [pinInput, setPinInput] = useState("");
	const [error, setError] = useState(false);
	const [shake, setShake] = useState(false);

	const handleKeyPress = (num) => {
		if (error) setError(false);
		if (pinInput.length < 4) {
			const newPin = pinInput + num;
			setPinInput(newPin);

			// Auto submit on 4 digits
			if (newPin.length === 4) {
				if (newPin === savedPin) {
					onCorrectPin();
				} else {
					setError(true);
					setShake(true);
					setPinInput("");
					setTimeout(() => setShake(false), 500);
				}
			}
		}
	};

	const handleBackspace = () => {
		setPinInput((prev) => prev.slice(0, -1));
		setError(false);
	};

	const handleClear = () => {
		setPinInput("");
		setError(false);
	};

	const isLight = theme === "light";

	const modalContentClass = isLight
		? "max-w-[360px] border-zinc-200 bg-white text-zinc-900 sm:rounded-2xl shadow-xl"
		: "max-w-[360px] border-zinc-800 bg-zinc-950 text-zinc-100 sm:rounded-2xl shadow-2xl shadow-black/80";

	const modalHeaderClass = isLight ? "flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-100" : "flex flex-row items-center justify-between space-y-0 pb-4";
	const modalTitleClass = isLight ? "text-lg font-medium text-zinc-800" : "text-lg font-medium text-zinc-300";

	const keypadBtnClass = isLight
		? "h-16 text-xl font-semibold border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-800 rounded-xl transition-all active:scale-95"
		: "h-16 text-xl font-semibold border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:text-white rounded-xl transition-all active:scale-95";

	const clearBtnClass = isLight
		? "h-16 text-sm font-medium text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 rounded-xl"
		: "h-16 text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-xl";

	const secondaryBtnClass = isLight
		? "h-16 text-zinc-400 hover:text-zinc-650 hover:bg-zinc-50 rounded-xl flex items-center justify-center"
		: "h-16 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-xl flex items-center justify-center";

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className={modalContentClass}>
				<DialogHeader className={modalHeaderClass}>
					<DialogTitle className={modalTitleClass}>
						Enter Code
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col items-center justify-center py-4">
					{/* PIN Indicators */}
					<div
						className={`flex gap-4 mb-8 ${
							shake ? "animate-bounce" : ""
						} transition-transform duration-200`}
						style={
							shake
								? {
										animation: "shake 0.5s ease-in-out",
									}
								: {}
						}
					>
						{[0, 1, 2, 3].map((index) => (
							<div
								key={index}
								className={`h-4 w-4 rounded-full border-2 transition-all duration-150 ${
									error
										? "border-red-500 bg-red-500"
										: index < pinInput.length
											? "border-emerald-500 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
											: isLight
												? "border-zinc-300 bg-transparent"
												: "border-zinc-700 bg-transparent"
								}`}
							/>
						))}
					</div>

					{error && (
						<p className="text-sm font-medium text-red-500 mb-4 animate-pulse">
							Incorrect PIN. Try again.
						</p>
					)}

					{/* NumPad Grid */}
					<div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
						{[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
							<Button
								key={num}
								variant="outline"
								onClick={() => handleKeyPress(num.toString())}
								className={keypadBtnClass}
							>
								{num}
							</Button>
						))}

						<Button
							variant="ghost"
							onClick={handleClear}
							className={clearBtnClass}
						>
							Clear
						</Button>

						<Button
							variant="outline"
							onClick={() => handleKeyPress("0")}
							className={keypadBtnClass}
						>
							0
						</Button>

						<Button
							variant="ghost"
							onClick={handleBackspace}
							className={secondaryBtnClass}
						>
							<Delete className="h-5 w-5" />
						</Button>
					</div>
				</div>

				{/* Shake Keyframe Injection */}
				<style jsx global>{`
					@keyframes shake {
						0%,
						100% {
							transform: translateX(0);
						}
						10%,
						30%,
						50%,
						70%,
						90% {
							transform: translateX(-6px);
						}
						20%,
						40%,
						60%,
						80% {
							transform: translateX(6px);
						}
					}
				`}</style>
			</DialogContent>
		</Dialog>
	);
}
