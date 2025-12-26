'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function logSet(formData: FormData) {
    // Legacy/Unused
}

export async function updateSet(
    logId: number,
    data: { reps?: number; weight?: number; completed?: boolean; notes?: string }
) {
    const updateData: any = {};
    if (data.reps !== undefined) updateData.reps_completed = data.reps;
    if (data.weight !== undefined) updateData.weight_used = data.weight;
    if (data.completed !== undefined) updateData.completed = data.completed;
    if (data.notes !== undefined) updateData.notes = data.notes;

    await prisma.exerciseLog.update({
        where: { id: logId },
        data: updateData
    });
    revalidatePath('/workouts/[id]');
}

export async function createSetLog(
    scheduledWorkoutId: number,
    exerciseId: number,
    setNumber: number,
    reps: number,
    weight: number
) {
    await prisma.exerciseLog.create({
        data: {
            scheduled_workout_id: scheduledWorkoutId,
            exercise_id: exerciseId,
            set_number: setNumber,
            reps_completed: reps,
            weight_used: weight,
            completed: true
        }
    });
    revalidatePath('/workouts/[id]');
}

// Update `toggleWorkoutCompletion` to use `updateMany` for safety (user isolation) if possible, but it lacks session context passed in.
// Actually, `toggleWorkoutCompletion` is called from Client Component which doesn't pass session.
// Server Action `auth()` call matches the caller.
// So I should add `const session = await auth()` to `toggleWorkoutCompletion` and `resetWorkout`.

export async function toggleWorkoutCompletion(
    workoutId: number,
    completed: boolean,
    data?: { duration?: number; rpe?: number; feeling?: string }
) {
    const session = await auth();
    if (!session?.user?.email) return;
    const userId = (session.user as any).id;

    const updateData: any = {
        is_completed: completed,
        completed_at: completed ? new Date() : null
    };

    if (completed && data) {
        if (data.duration) updateData.duration_seconds = data.duration;
        if (data.rpe) updateData.rpe = data.rpe;
        if (data.feeling) updateData.feeling = data.feeling;
    } else if (!completed) {
        // Reset if un-completing
        updateData.duration_seconds = null;
        updateData.rpe = null;
        updateData.feeling = null;
    }

    await prisma.scheduledWorkout.updateMany({
        where: { id: workoutId, user_id: userId },
        data: updateData
    });
    revalidatePath('/workouts/[id]');
    revalidatePath('/');
}

// Complex Actions
export async function createComplexLog(
    scheduledWorkoutId: number,
    complexName: string,
    roundNumber: number,
    weight: number,
    duration: number
) {
    await prisma.complexLog.create({
        data: {
            scheduled_workout_id: scheduledWorkoutId,
            complex_name: complexName,
            round_number: roundNumber,
            weight_used: weight,
            duration_seconds: duration,
            completed: true
        }
    });
    revalidatePath('/workouts/[id]');
}

export async function updateComplexLog(
    logId: number,
    data: { weight?: number; duration?: number; completed?: boolean }
) {
    await prisma.complexLog.update({
        where: { id: logId },
        data: {
            weight_used: data.weight,
            duration_seconds: data.duration,
            completed: data.completed
        }
    });
    revalidatePath('/workouts/[id]');
}

export async function resetWorkout(scheduledWorkoutId: number) {
    const session = await auth();
    if (!session?.user?.email) return;
    const userId = (session.user as any).id;

    await prisma.scheduledWorkout.updateMany({
        where: { id: scheduledWorkoutId, user_id: userId },
        data: {
            is_completed: false,
            duration_seconds: null,
            rpe: null,
            feeling: null
        }
    });

    revalidatePath('/schedule');
    revalidatePath(`/workouts/${scheduledWorkoutId}`);
    revalidatePath('/workouts');
}
