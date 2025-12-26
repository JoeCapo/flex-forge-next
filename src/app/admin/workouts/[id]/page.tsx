import { prisma } from "@/lib/prisma";
import { WorkoutEditor } from "@/components/admin/WorkoutEditor";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminWorkoutEditPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session) redirect('/login');

    const { id } = await params;

    const workout = await prisma.workout.findUnique({
        where: { id: parseInt(id) },
        include: {
            workout_exercises: {
                include: { exercise: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!workout) return <div className="p-8 text-white">Workout not found</div>;

    const exercises = await prisma.exercise.findMany({
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Edit Workout: {workout.title}</h1>
            <WorkoutEditor workout={workout} allExercises={exercises} />
        </div>
    );
}
