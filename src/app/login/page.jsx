import {LoginForm} from "@/components/login-form";
import Image from "next/image";

export default function LoginPage() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 md:p-10 text-zinc-100">
			<div className="flex w-full max-w-sm flex-col gap-6">
				<a
					href="#"
					className="flex items-center gap-2 self-center font-medium text-zinc-200"
				>
					<Image
						src="/logo-white.svg"
						alt="Knock Later Logo"
						width={50}
						height={50}
					/>
				</a>
				<LoginForm />
			</div>
		</div>
	);
}
