"use client";

import { useDoorSign } from "@/features/door-sign/hooks/use-door-sign";
import { DoorSignDisplay } from "@/features/door-sign/components/door-sign-display";
import { Loader2 } from "lucide-react";

export function DisplayClient({ userId }) {
  const { state, currentPreset, loading } = useDoorSign(userId);

  const handleUnlock = () => {
    // Redirect to home dashboard
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-zinc-400">
        <div className="p-8 rounded-3xl border border-zinc-900 bg-zinc-950 flex flex-col items-center gap-4 shadow-2xl">
          <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
          <span className="text-sm font-semibold tracking-wider uppercase text-zinc-300">
            Loading Live Display...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col w-full">
      <DoorSignDisplay
        state={state}
        currentPreset={currentPreset}
        onUnlock={handleUnlock}
      />
    </div>
  );
}
