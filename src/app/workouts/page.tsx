import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Dumbbell, ArrowRight } from "lucide-react";

export default async function WorkoutsIndex() {
    const workouts = await prisma.workout.findMany({
        orderBy: { day_of_week: 'asc' },
        include: { _count: { select: { workout_exercises: true } } }
    });

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">All Workouts</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {workouts.map((workout) => (
                    <Link
                        key={workout.id}
                        href={`/workouts/${workout.id}`}
                        className="group bg-surface border border-white/5 rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <Dumbbell size={24} />
                            </div>
                            <div className="bg-white/5 px-3 py-1 rounded-full text-xs font-medium text-gray-400">
                                Day {workout.day_of_week}
                            </div>
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                            {workout.title}
                        </h2>
                        <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {workout.description || "No description available."}
                        </p>

                        <div className="flex items-center text-sm text-gray-500 gap-4">
                            <span>{workout._count.workout_exercises} Exercises</span>
                            <ArrowRight size={16} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
