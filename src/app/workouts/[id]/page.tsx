import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { WorkoutSession } from "@/components/workout/WorkoutSession";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function WorkoutPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    const { id } = await params;
    const workoutId = parseInt(id);

    // ...


    // 1. First, check if there's already an active/incomplete ScheduledWorkout for this workout
    //    For now, we'll just look for one created today or recently, or just create one if "starting".
    //    To keep it simple: We will find the Workout first to ensure it exists.
    const userId = (session.user as any).id;

    const workoutDef = await prisma.workout.findUnique({ where: { id: workoutId } });
    if (!workoutDef) {
        return <div className="p-8 text-white">Workout Definition not found</div>;
    }

    // 2. Find or Create ScheduledWorkout
    // Strategy: Look for ANY scheduled workout for this workout_id from today (completed or not).
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let workoutData = await prisma.scheduledWorkout.findFirst({
        where: {
            workout_id: workoutId,
            user_id: userId,
            scheduled_date: {
                gte: today
            }
        },
        include: {
            workout: {
                include: {
                    workout_exercises: {
                        include: {
                            exercise: true
                        },
                        orderBy: {
                            order: 'asc'
                        }
                    }
                }
            },
            exercise_logs: true,
            complex_logs: true
        }
    });

    if (!workoutData) {
        // Create a new one
        console.log("Creating new scheduled workout for ID", workoutId);
        workoutData = await prisma.scheduledWorkout.create({
            data: {
                workout_id: workoutId,
                user_id: userId,
                scheduled_date: new Date(),
                week_number: 1, // Defaulting for now
                is_completed: false
            },
            include: {
                workout: {
                    include: {
                        workout_exercises: {
                            include: { exercise: true },
                            orderBy: { order: 'asc' }
                        }
                    }
                },
                exercise_logs: true,
                complex_logs: true
            }
        });
    }

    // 3. Fetch History (Previous Logs)
    // For each exercise in this workout, find the most recent log from a *different* scheduled workout (or just previous date).
    const exerciseIds = workoutData.workout.workout_exercises.map(we => we.exercise_id);

    // We want the latest log for each exercise, excluding the current session's logs (if any, though usually meaningful history is from past).
    // Actually, we just want the latest log for these exercises where scheduledWorkout.is_completed = true (or just distinct from current).
    // Let's just get the latest log for each exercise overall, sorted by date.

    const historyLogs = await prisma.exerciseLog.findMany({
        where: {
            exercise_id: { in: exerciseIds },
            scheduled_workout: {
                user_id: userId,
                is_completed: true, // Only count finished workouts as history
                id: { not: workoutData.id } // Exclude current session
            }
        },
        orderBy: {
            created_at: 'desc'
        },
        distinct: ['exercise_id'], // Get one per exercise
        select: {
            exercise_id: true,
            weight_used: true,
            reps_completed: true,
            created_at: true
        }
    });

    const historyMap: Record<number, { weight: number, reps: number, date: Date }> = {};
    historyLogs.forEach(log => {
        historyMap[log.exercise_id] = {
            weight: Number(log.weight_used),
            reps: log.reps_completed,
            date: log.created_at
        };
    });

    // Serialize Decimal to Number for Client Component
    const sanitizedWorkoutData = {
        ...workoutData,
        exercise_logs: workoutData.exercise_logs.map(log => ({
            ...log,
            weight_used: log.weight_used ? Number(log.weight_used) : 0
        })),
        complex_logs: workoutData.complex_logs.map(log => ({
            ...log,
            weight_used: log.weight_used ? Number(log.weight_used) : 0
        }))
    };

    return <WorkoutSession data={sanitizedWorkoutData as any} history={historyMap} />;
}
