'use client';

import { RotateCcw, Loader2 } from "lucide-react";
import { resetWorkout } from "@/app/actions/workout";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetButton({ scheduledWorkoutId }: { scheduledWorkoutId: number }) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleReset = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (confirm("Are you sure you want to reset this workout? Progress will be lost.")) {
            setIsLoading(true);
            try {
                await resetWorkout(scheduledWorkoutId);
                router.refresh();
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <button
            onClick={handleReset}
            disabled={isLoading}
            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-gray-400 hover:text-white rounded-full transition-all border border-white/5 z-10"
            title="Redo Workout"
        >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
        </button>
    );
}
