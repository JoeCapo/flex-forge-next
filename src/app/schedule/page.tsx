import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronRight, Calendar, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { auth } from "@/auth";
import { ResetButton } from "@/components/schedule/ScheduleActionButtons";

export default async function SchedulePage() {
    const session = await auth();

    // For MVP, just grab the first program. In future, user could have 'active_program_id' profile setting.
    const program = await prisma.program.findFirst({
        include: {
            workouts: {
                orderBy: { day_of_week: 'asc' },
                include: { _count: { select: { workout_exercises: true } } }
            }
        }
    });

    if (!program) {
        return (
            <div className="p-4 text-center text-gray-400">
                <p>No active program found.</p>
                <Link href="/admin/programs" className="text-primary mt-4 inline-block">Go to Admin to create one</Link>
            </div>
        );
    }

    // Fetch Completed Workouts for this week
    // Assuming "Week 1" logic or just generic "Since Monday" logic.
    const today = new Date();
    const day = today.getDay(); // 0-6 (Sun-Sat)
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);

    const scheduledWorkouts = session?.user?.email ? await prisma.scheduledWorkout.findMany({
        where: {
            workout: { program_id: program.id },
            user_id: (session.user as any).id,
            scheduled_date: { gte: monday }
        }
    }) : [];

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

    return (
        <div className="p-6 space-y-8 pb-24">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">Schedule</h1>
                <div className="bg-surface border border-white/5 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold text-primary">{program.name}</h2>
                            <p className="text-sm text-gray-400">{program.description}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {program.duration_weeks} Weeks</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> 4-6 days/week</span>
                    </div>
                </div>
            </header>

            <div className="space-y-4">
                {days.map((dayName, index) => {
                    const dayNum = index + 1;
                    const workout = program.workouts.find(w => w.day_of_week === dayNum);
                    const isToday = index === currentDayIndex;

                    if (!workout) {
                        return (
                            <div key={dayName} className="bg-surface/50 border border-white/5 rounded-xl p-4 flex items-center gap-4 opacity-50">
                                <div className="w-12 text-center text-xs font-bold text-gray-500 uppercase">{dayName}</div>
                                <div className="text-gray-500 text-sm">Rest Day</div>
                            </div>
                        );
                    }

                    // Find if displayed match in scheduled items
                    const scheduled = scheduledWorkouts.find(sw => sw.workout_id === workout.id);
                    const isCompleted = scheduled?.is_completed;

                    return (
                        <div key={dayName} className="relative group">
                            <Link
                                href={`/workouts/${workout.id}`}
                                className={cn(
                                    "block bg-surface border rounded-xl p-4 transition-all hover:border-primary/50 relative overflow-hidden pr-12",
                                    isToday ? "border-primary shadow-lg shadow-primary/10" : "border-white/5",
                                    isCompleted ? "border-green-500/50" : ""
                                )}
                            >
                                {isToday && <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg">TODAY</div>}
                                {isCompleted && <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-2 py-1 rounded-bl-lg flex items-center gap-1"><CheckCircle2 size={10} /> DONE</div>}

                                <div className="flex items-center gap-4">
                                    <div className={cn("w-12 text-center text-xs font-bold uppercase", isToday ? "text-primary" : "text-gray-500")}>
                                        {dayName}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={cn("font-bold transition-colors", isCompleted ? "text-green-500" : "text-white group-hover:text-primary")}>
                                            {workout.title}
                                        </h3>
                                        <p className="text-xs text-gray-400">{workout._count.workout_exercises} Exercises • {workout.estimated_duration}</p>
                                    </div>
                                    <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                                </div>
                            </Link>

                            {/* Actions overlay/container */}
                            {isCompleted && scheduled && (
                                <div className="absolute right-14 top-1/2 -translate-y-1/2">
                                    <ResetButton scheduledWorkoutId={scheduled.id} />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    );
}
