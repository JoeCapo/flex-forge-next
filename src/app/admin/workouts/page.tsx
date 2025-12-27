import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, ChevronRight } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function WorkoutsPage() {
    const workouts = await prisma.workout.findMany({
        orderBy: { day_of_week: 'asc' },
        include: { _count: { select: { workout_exercises: true } } }
    });

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Workout Routines</h1>
                {/* Simple create not fully implemented in UI, just concept */}
                <button className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-white font-medium hover:bg-primary/90 transition-colors opacity-50 cursor-not-allowed" title="Not fully implemented">
                    <Plus size={18} /> New Routine
                </button>
            </header>

            <div className="grid grid-cols-1 gap-2">
                {workouts.map((w) => (
                    <Link key={w.id} href={`/admin/workouts/${w.id}`} className="bg-surface border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:border-white/10 transition-colors">
                        <div>
                            <h3 className="font-bold text-white">Day {w.day_of_week} - {w.title}</h3>
                            <p className="text-sm text-gray-400">{w._count.workout_exercises} Exercises</p>
                        </div>
                        <ChevronRight className="text-gray-500 group-hover:text-white transition-colors" />
                    </Link>
                ))}
                {workouts.length === 0 && <p className="text-gray-500 text-center py-10">No routines found.</p>}
            </div>
        </div>
    );
}
