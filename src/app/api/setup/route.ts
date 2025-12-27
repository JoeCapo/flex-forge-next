import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { saltAndHashPassword } from '@/lib/password';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Check if database is already set up by looking for existing users
        // If tables don't exist, this will throw an error, which we'll catch and proceed with setup
        let existingUsers = 0;
        try {
            existingUsers = await prisma.user.count();
        } catch (error: any) {
            // Tables don't exist yet, which is fine - we'll create them
            if (!error.message.includes('does not exist')) {
                throw error; // Re-throw if it's a different error
            }
        }

        if (existingUsers > 0) {
            return NextResponse.json({
                success: false,
                message: 'Database already initialized. Setup can only run once.',
            }, { status: 400 });
        }

        // Step 1: Push schema (create tables)
        // Note: This happens automatically when Prisma client connects and tables don't exist
        // But we'll verify by trying to query

        // Step 2: Create admin user
        const hashedPassword = await saltAndHashPassword('admin');
        await prisma.user.create({
            data: {
                email: 'admin@spartan.com',
                name: 'Spartan Admin',
                password: hashedPassword,
                role: 'admin'
            }
        });

        // Step 3: Load and seed workout data
        const seedDataPath = path.join(process.cwd(), 'prisma', 'seed_data.json');

        if (!fs.existsSync(seedDataPath)) {
            return NextResponse.json({
                success: false,
                message: 'Seed data file not found. Please ensure seed_data.json exists in prisma folder.',
            }, { status: 500 });
        }

        const allSeedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

        // Create Program
        const program = await prisma.program.create({
            data: {
                name: allSeedData.program.name,
                description: allSeedData.program.description,
                duration_weeks: allSeedData.program.duration_weeks
            }
        });

        // Create Workouts and Exercises
        for (const w of allSeedData.workouts) {
            const workout = await prisma.workout.create({
                data: {
                    title: w.title,
                    day_of_week: w.day_of_week,
                    description: w.description,
                    estimated_duration: w.estimated_duration,
                    program_id: program.id
                }
            });

            for (const ex of w.exercises) {
                // Upsert Exercise
                const exercise = await prisma.exercise.upsert({
                    where: { name: ex.name },
                    update: {},
                    create: {
                        name: ex.name,
                        category: ex.category || 'strength',
                        muscle_group: 'General',
                        equipment: 'Gym',
                        source: 'seed'
                    }
                });

                // Create WorkoutExercise link
                await prisma.workoutExercise.create({
                    data: {
                        workout_id: workout.id,
                        exercise_id: exercise.id,
                        section_label: ex.section_label,
                        group_label: ex.group_label,
                        order: ex.order,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_period: ex.rest_period,
                        rest_seconds: parseRestSeconds(ex.rest_period),
                        notes: ex.notes,
                        focus: ex.focus,
                        is_complex: ex.is_complex,
                        is_circuit: ex.is_circuit,
                        complex_name: ex.complex_name
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Database setup completed successfully!',
            data: {
                adminEmail: 'admin@spartan.com',
                adminPassword: 'admin',
                programsCreated: 1,
                workoutsCreated: allSeedData.workouts.length
            }
        });

    } catch (error: any) {
        console.error('Setup error:', error);
        return NextResponse.json({
            success: false,
            message: 'Setup failed',
            error: error.message
        }, { status: 500 });
    }
}

function parseRestSeconds(restStr: string | null): number | null {
    if (!restStr) return null;
    const s = restStr.toLowerCase().replace(/\s/g, '');

    // "90s"
    if (s.endsWith('s')) {
        const val = parseInt(s.replace('s', ''));
        if (!isNaN(val)) return val;
    }

    // "2min", "3-4min" (take lower bound)
    if (s.includes('min')) {
        const numPart = s.replace('min', '');
        if (numPart.includes('-')) {
            const [min] = numPart.split('-');
            const val = parseInt(min);
            if (!isNaN(val)) return val * 60;
        } else {
            const val = parseInt(numPart);
            if (!isNaN(val)) return val * 60;
        }
    }

    return null;
}
