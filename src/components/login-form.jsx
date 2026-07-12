"use client";

import {useState} from "react";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	signInWithIdTokenAction,
	signInWithOAuthAction,
} from "@/features/door-sign/actions/auth-actions";
import Link from "next/link";
import {useEffect} from "react";

export function LoginForm({className, googleClientId, ...props}) {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [googleLibraryLoaded, setGoogleLibraryLoaded] = useState(false);

	useEffect(() => {
		if (!googleClientId) {
			console.warn(
				"Google Client ID is missing. Falling back to OAuth redirect.",
			);
			return;
		}

		let initialized = false;
		let interval;

		const initGoogleSignIn = () => {
			if (typeof window !== "undefined" && window.google) {
				try {
					const container = document.getElementById("google-signin-btn-container");
					if (!container) return;

					container.innerHTML = "";

					const containerWidth = container.clientWidth || 336;
					const clampedWidth = Math.max(200, Math.min(400, containerWidth));

					if (!initialized) {
						window.google.accounts.id.initialize({
							client_id: googleClientId,
							callback: async (response) => {
								setLoading(true);
								setError("");
								try {
									const res = await signInWithIdTokenAction(response.credential);
									if (res.success) {
										window.location.href = "/";
									} else {
										setError(res.error || "Failed to sign in with Google.");
										setLoading(false);
									}
								} catch (err) {
									setError("An unexpected error occurred during Google sign-in.");
									setLoading(false);
								}
							},
						});
						initialized = true;
					}

					window.google.accounts.id.renderButton(
						container,
						{
							theme: "outline",
							size: "large",
							width: clampedWidth.toString(),
							text: "continue_with",
							shape: "rectangular",
						},
					);
					setGoogleLibraryLoaded(true);
				} catch (e) {
					console.error("Error initializing Google Identity Services:", e);
				}
			}
		};

		if (typeof window !== "undefined" && window.google) {
			initGoogleSignIn();
		} else {
			let attempts = 0;
			interval = setInterval(() => {
				attempts++;
				if (window.google) {
					clearInterval(interval);
					initGoogleSignIn();
				} else if (attempts > 30) {
					clearInterval(interval);
					console.error("Google Client library (gsi/client) failed to load.");
				}
			}, 100);
		}

		let resizeTimeout;
		const handleResize = () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				initGoogleSignIn();
			}, 150);
		};

		window.addEventListener("resize", handleResize);
		return () => {
			if (interval) clearInterval(interval);
			window.removeEventListener("resize", handleResize);
			clearTimeout(resizeTimeout);
		};
	}, [googleClientId]);

	const handleOAuthLogin = async (provider) => {
		setLoading(true);
		setError("");

		try {
			const res = await signInWithOAuthAction(provider);
			if (res.success && res.url) {
				window.location.href = res.url;
			} else {
				setError(res.error || `Failed to sign in with ${provider}.`);
				setLoading(false);
			}
		} catch (err) {
			setError("An unexpected error occurred. Please try again.");
			setLoading(false);
		}
	};

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card className="border-zinc-800 bg-zinc-950 text-zinc-100">
				<CardHeader className="text-center">
					<CardTitle className="text-xl font-bold text-zinc-200">
						Welcome Back
					</CardTitle>
					<CardDescription className="text-zinc-400">
						Sign in to avoid awkward pauses and interruptions!
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{error && (
						<div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center font-medium animate-fadeIn">
							{error}
						</div>
					)}

					<div className="flex flex-col gap-3">
						{googleClientId ? (
							<div className="relative w-full h-[40px]">
								{/* Custom visible Google button styled exactly like the GitHub button */}
								<Button
									type="button"
									onClick={() => handleOAuthLogin("google")}
									disabled={loading}
									className={cn(
										"absolute inset-0 w-full h-full bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-300 font-medium rounded-[8px] flex items-center justify-center gap-3 cursor-pointer shadow-sm text-[14px]",
										googleLibraryLoaded ? "pointer-events-none" : "pointer-events-auto"
									)}
								>
									<svg
										className="h-[18px] w-[18px] shrink-0"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
											fill="#4285F4"
										/>
										<path
											d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
											fill="#34A853"
										/>
										<path
											d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
											fill="#FBBC05"
										/>
										<path
											d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
											fill="#EA4335"
										/>
									</svg>
									<span>Continue with Google</span>
								</Button>
								{/* Transparent Google-rendered iframe directly on top */}
								<div
									id="google-signin-btn-container"
									className={cn(
										"absolute inset-0 w-full h-full opacity-0 [&>div]:!w-full [&_iframe]:!w-full transition-opacity duration-200",
										googleLibraryLoaded ? "z-10 pointer-events-auto cursor-pointer" : "z-0 pointer-events-none"
									)}
								/>
							</div>
						) : (
							<Button
								onClick={() => handleOAuthLogin("google")}
								disabled={loading}
								className="w-full h-[40px] bg-white hover:bg-zinc-100 text-zinc-950 font-medium rounded-[8px] border border-zinc-300 active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm text-[14px]"
							>
								<svg
									className="h-[18px] w-[18px] shrink-0"
									viewBox="0 0 24 24"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
										fill="#4285F4"
									/>
									<path
										d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
										fill="#34A853"
									/>
									<path
										d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
										fill="#FBBC05"
									/>
									<path
										d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
										fill="#EA4335"
									/>
								</svg>
								<span>Continue with Google</span>
							</Button>
						)}

						<Button
							onClick={() => handleOAuthLogin("github")}
							disabled={loading}
							className="w-full h-[40px] bg-white hover:bg-zinc-50 text-zinc-950 border border-zinc-300 font-medium rounded-[8px] active:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm text-[14px]"
						>
							<svg
								className="w-[18px] h-[18px] shrink-0 text-black"
								viewBox="0 0 16 16"
								fill="currentColor"
								aria-hidden="true"
								focusable="false"
								role="img"
								xmlns="http://www.w3.org/2000/svg"
							>
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
							</svg>
							<span>Sign in with Github</span>
						</Button>
					</div>

					<div className="text-center text-xs text-zinc-500 mt-4">
						New here? No signup needed — just click above to sign in.
					</div>

					<div className="text-center text-[11px] text-zinc-500 mt-3 leading-normal px-2">
						By signing in, you agree to our{" "}
						<a
							href="https://knocklater.com/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-zinc-300 transition-colors"
						>
							Terms of Service
						</a>{" "}
						and{" "}
						<a
							href="https://knocklater.com/"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-zinc-300 transition-colors"
						>
							Privacy Policy
						</a>.
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
