import {LoginForm} from "@/components/login-form";
import Image from "next/image";
import Script from "next/script";

export default function LoginPage() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 p-6 md:p-10 text-zinc-100">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="beforeInteractive"
      />
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a
          href="#"
          className="flex items-center gap-2 self-center font-medium text-zinc-200"
        >
          <Image
            src="/logo.svg"
            alt="Knock Later Logo"
            width={50}
            height={50}
          />
        </a>
        <LoginForm googleClientId={googleClientId} />
      </div>
    </div>
  );
}
