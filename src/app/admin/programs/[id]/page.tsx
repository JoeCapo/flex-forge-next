import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Dumbbell } from "lucide-react";
import { redirect } from "next/navigation";
import { ProgramThemeEditor } from "@/components/admin/ProgramThemeEditor";

export default async function AdminProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const program = await prisma.program.findUnique({
        where: { id: parseInt(id) },
        include: {
            workouts: {
                orderBy: { day_of_week: 'asc' },
                include: { _count: { select: { workout_exercises: true } } }
            }
        }
    });

    if (!program) redirect('/admin/programs');

    return (
        <div className="space-y-8">
            <div>
                <Link href="/admin/programs" className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
                    <ArrowLeft size={18} /> Back to Programs
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-white">{program.name}</h1>
                        <p className="text-gray-400">{program.description} • {program.duration_weeks} Weeks Duration</p>
                    </div>
                </div>
            </div>

            <ProgramThemeEditor programId={program.id} initialTheme={program.theme} />

            <div className="space-y-4">
                <h2 className="text-xl font-bold text-white">Weekly Schedule</h2>
                <div className="grid gap-3">
                    {program.workouts.map((workout) => (
                        <Link
                            key={workout.id}
                            href={`/admin/workouts/${workout.id}`}
                            className="bg-surface border border-white/5 rounded-xl p-4 flex items-center justify-between hover:border-primary/50 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center font-bold text-gray-400 group-hover:text-white transition-colors">
                                    Day {workout.day_of_week}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white group-hover:text-primary transition-colors">{workout.title}</h3>
                                    <p className="text-xs text-gray-500">{workout._count.workout_exercises} Exercises</p>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                        </Link>
                    ))}
                    {program.workouts.length === 0 && (
                        <div className="text-gray-500 italic p-4">No workouts found. Something went wrong during creation.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
