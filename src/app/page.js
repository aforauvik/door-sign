import {redirect} from "next/navigation";
import {getSessionUser} from "@/features/door-sign/actions/auth-actions";
import {DoorSignContainer} from "@/features/door-sign/components/door-sign-container";

export const dynamic = "force-dynamic";

export const metadata = {
	title: "Knock Later | Digital Door Sign",
	description: "Digital door sign for your office",
};

export default async function Home() {
	const user = await getSessionUser();

	if (!user) {
		redirect("/login");
	}

	return (
		<main className="flex-1 flex flex-col w-full h-full min-h-screen">
			<DoorSignContainer
				userId={user.id}
				user={{
					id: user.id,
					email: user.email,
					user_metadata: user.user_metadata,
				}}
			/>
		</main>
	);
}
