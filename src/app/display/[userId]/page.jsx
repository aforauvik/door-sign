import { DisplayClient } from "./display-client";

export const metadata = {
  title: "Office Door Display",
  description: "Live digital door display status screen",
};

export default async function DisplayPage({ params }) {
  const { userId } = await params;

  return (
    <main className="flex-1 flex flex-col w-full h-full min-h-screen">
      <DisplayClient userId={userId} />
    </main>
  );
}
