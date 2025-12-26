import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting production seed...');

  // Clear existing data
  // Note: Using $executeRawUnsafe for Truncate as it's not standard Prisma API
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE workout_exercises, workouts, exercises, scheduled_workouts, exercise_logs, complex_logs, programs RESTART IDENTITY CASCADE;`);

  // Load data
  const seedDataPath = path.join(__dirname, 'seed_data.json');
  if (!fs.existsSync(seedDataPath)) {
    console.error('Seed data file (seed_data.json) not found. Run "node prisma/import_excel.js" to generate it from Excel if needed, or ensure it is committed.');
    process.exit(1);
  }

  const allSeedData = JSON.parse(fs.readFileSync(seedDataPath, 'utf8'));

  // Create Admin User (Optional, if you want it in production seed)
  // Create Admin User
  await prisma.user.upsert({
    where: { email: 'admin@spartan.com' },
    update: {},
    create: {
      email: 'admin@spartan.com',
      name: 'Spartan Admin',
      password: 'admin', // Ideally hashed
      role: 'admin'
    }
  });

  // Create Program
  const program = await prisma.program.create({
    data: {
      name: allSeedData.program.name,
      description: allSeedData.program.description,
      duration_weeks: allSeedData.program.duration_weeks
    }
  });
  console.log(`Created Program: ${program.name}`);

  // Create Workouts
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
          // Try to parse integer seconds from strings like "90s", "3-4min" if possible, 
          // otherwise leave null. The UI handles text strings well.
          // If you want robust parsing, we could add regex here.
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

  console.log('Seeding finished successfully.');
}

function parseRestSeconds(restStr: string | null): number | null {
  if (!restStr) return null;
  const s = restStr.toLowerCase().replace(/\s/g, '');

  // "90s"
  if (s.endsWith('s')) {
    const val = parseInt(s.replace('s', ''));
    if (!isNaN(val)) return val;
  }

  // "2min", "3-4min" (take average or lower bound?) 
  // Let's take lower bound for simplicity
  if (s.includes('min')) {
    const numPart = s.replace('min', ''); // "3-4" or "2"
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
