import { prisma } from "@/lib/prisma";
import { ExerciseList } from "@/components/admin/ExerciseList";

export const dynamic = 'force-dynamic';

export default async function ExercisesPage() {
    const exercises = await prisma.exercise.findMany({
        orderBy: { name: 'asc' }
    });

    return <ExerciseList exercises={exercises} />;
}
