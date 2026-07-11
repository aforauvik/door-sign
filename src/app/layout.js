import {Open_Sans, Geist_Mono} from "next/font/google";
import "./globals.css";

const openSans = Open_Sans({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

import {PwaRegister} from "@/components/pwa-register";

export const metadata = {
	title: "Knock Later | Digital Door Sign",
	description: "Digital door sign for your office",
	manifest: "/manifest.json",
	appleWebApp: {
		capable: true,
		statusBarStyle: "default",
		title: "Knock Later",
	},
	icons: {
		apple: "/apple-touch-icon.png",
	},
};

export default function RootLayout({children}) {
	return (
		<html
			lang="en"
			className={`${openSans.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">
				<PwaRegister />
				{children}
			</body>
		</html>
	);
}
