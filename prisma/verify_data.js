const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const workout = await prisma.workout.findFirst({
        include: {
            workout_exercises: {
                include: { exercise: true },
                orderBy: { order: 'asc' }
            }
        }
    });

    if (!workout) {
        console.log("No workouts found!");
        return;
    }

    console.log(`Workout: ${workout.title}`);
    console.log("Exercises:");
    workout.workout_exercises.forEach(we => {
        console.log(`- [Group: ${we.group_label || 'None'}] ${we.exercise.name}`);
        if (we.notes) console.log(`  Notes: ${we.notes}`);
        if (we.focus) console.log(`  Focus: ${we.focus}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
