'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createExercise(formData: FormData) {
    const name = formData.get('name') as string;
    const category = formData.get('category') as string;
    const muscle_group = formData.get('muscle_group') as string;
    const equipment = formData.get('equipment') as string;

    await prisma.exercise.create({
        data: {
            name,
            category,
            muscle_group,
            equipment,
            source: 'admin'
        }
    });

    revalidatePath('/admin/exercises');
}

export async function deleteExercise(id: number) {
    await prisma.exercise.delete({ where: { id } });
    revalidatePath('/admin/exercises');
}

export async function createWorkout(title: string, day: number) {
    // Standalone workout creation (Legacy or specific need)
    const workout = await prisma.workout.create({
        data: {
            title,
            day_of_week: day
        }
    });
    redirect(`/admin/workouts/${workout.id}`);
}

export type WorkoutExerciseInput = {
    id: number;
    exercise_id: number;
    order: number;
    sets: string;
    reps: string;
    is_complex: boolean;
    is_circuit: boolean; // New Input
    complex_name?: string;
    group_label?: string;
    rest_seconds?: number | null;
};

export async function updateWorkoutExercises(workoutId: number, exercises: WorkoutExerciseInput[]) {
    await prisma.$transaction(async (tx) => {
        await tx.workoutExercise.deleteMany({
            where: { workout_id: workoutId }
        });

        for (const ex of exercises) {
            await tx.workoutExercise.create({
                data: {
                    workout_id: workoutId,
                    exercise_id: ex.exercise_id,
                    order: ex.order,
                    sets: ex.sets,
                    reps: ex.reps,
                    section_label: ex.group_label || (ex.is_complex ? (ex.complex_name || 'Complex') : 'Main Workout'),
                    group_label: ex.group_label,
                    is_complex: ex.is_complex,
                    is_circuit: ex.is_circuit, // Persist
                    complex_name: (ex.is_complex || ex.is_circuit) ? ex.complex_name : null,
                    rest_seconds: ex.rest_seconds
                }
            });
        }
    });

    revalidatePath(`/admin/workouts/${workoutId}`);
    revalidatePath(`/workouts/${workoutId}`);
}

// Program Actions
export async function createProgram(formData: FormData) {
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const duration_weeks = parseInt(formData.get('duration_weeks') as string) || 6;

    const program = await prisma.program.create({
        data: {
            name,
            description,
            duration_weeks
        }
    });

    // Auto-create 7 Days
    for (let i = 1; i <= 7; i++) {
        await prisma.workout.create({
            data: {
                title: `Day ${i} - ${name}`,
                day_of_week: i,
                program_id: program.id,
                description: `Workout for Day ${i}`
            }
        });
    }

    redirect(`/admin/programs/${program.id}`);
}

export async function deleteProgram(id: number) {
    await prisma.program.delete({ where: { id } });
    revalidatePath('/admin/programs');
}

export async function updateProgramTheme(programId: number, theme: any) {
    await prisma.program.update({
        where: { id: programId },
        data: { theme }
    });
    revalidatePath(`/admin/programs/${programId}`);
    revalidatePath('/'); // Global refresh might be needed for ThemeProvider
}
