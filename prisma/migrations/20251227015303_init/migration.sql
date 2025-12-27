-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "muscle_group" TEXT NOT NULL,
    "equipment" TEXT,
    "instructions" TEXT,
    "focus_area" TEXT,
    "source" TEXT NOT NULL DEFAULT 'spreadsheet',
    "api_id" TEXT,
    "user_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workouts" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "description" TEXT,
    "estimated_duration" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "program_id" INTEGER,

    CONSTRAINT "workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration_weeks" INTEGER NOT NULL DEFAULT 6,
    "theme" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_exercises" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "section_label" TEXT NOT NULL,
    "group_label" TEXT,
    "order" INTEGER NOT NULL,
    "sets" TEXT NOT NULL,
    "reps" TEXT NOT NULL,
    "rest_period" TEXT,
    "rest_seconds" INTEGER,
    "notes" TEXT,
    "focus" TEXT,
    "is_complex" BOOLEAN NOT NULL DEFAULT false,
    "is_circuit" BOOLEAN NOT NULL DEFAULT false,
    "complex_name" TEXT,
    "complex_rounds" TEXT,
    "complex_weight" TEXT,
    "complex_rest" TEXT,
    "target_time_seconds" INTEGER,

    CONSTRAINT "workout_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scheduled_workouts" (
    "id" SERIAL NOT NULL,
    "workout_id" INTEGER NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "week_number" INTEGER NOT NULL,
    "started_at" TIMESTAMP(3),
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "duration_seconds" INTEGER,
    "rpe" INTEGER,
    "feeling" TEXT,
    "notes" TEXT,
    "slug" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "scheduled_workouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_logs" (
    "id" SERIAL NOT NULL,
    "scheduled_workout_id" INTEGER NOT NULL,
    "exercise_id" INTEGER NOT NULL,
    "set_number" INTEGER NOT NULL,
    "reps_completed" INTEGER NOT NULL,
    "weight_used" DECIMAL(65,30) NOT NULL,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercise_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complex_logs" (
    "id" SERIAL NOT NULL,
    "scheduled_workout_id" INTEGER NOT NULL,
    "complex_name" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL,
    "weight_used" DECIMAL(65,30) NOT NULL,
    "duration_seconds" INTEGER,
    "notes" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complex_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_name_key" ON "exercises"("name");

-- CreateIndex
CREATE UNIQUE INDEX "programs_name_key" ON "programs"("name");

-- CreateIndex
CREATE INDEX "workout_exercises_workout_id_idx" ON "workout_exercises"("workout_id");

-- CreateIndex
CREATE INDEX "workout_exercises_exercise_id_idx" ON "workout_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "scheduled_workouts_slug_key" ON "scheduled_workouts"("slug");

-- CreateIndex
CREATE INDEX "scheduled_workouts_workout_id_idx" ON "scheduled_workouts"("workout_id");

-- CreateIndex
CREATE INDEX "scheduled_workouts_user_id_idx" ON "scheduled_workouts"("user_id");

-- CreateIndex
CREATE INDEX "exercise_logs_scheduled_workout_id_idx" ON "exercise_logs"("scheduled_workout_id");

-- CreateIndex
CREATE INDEX "exercise_logs_exercise_id_idx" ON "exercise_logs"("exercise_id");

-- CreateIndex
CREATE INDEX "complex_logs_scheduled_workout_id_idx" ON "complex_logs"("scheduled_workout_id");

-- AddForeignKey
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_exercises" ADD CONSTRAINT "workout_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_workouts" ADD CONSTRAINT "scheduled_workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scheduled_workouts" ADD CONSTRAINT "scheduled_workouts_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_scheduled_workout_id_fkey" FOREIGN KEY ("scheduled_workout_id") REFERENCES "scheduled_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_logs" ADD CONSTRAINT "exercise_logs_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complex_logs" ADD CONSTRAINT "complex_logs_scheduled_workout_id_fkey" FOREIGN KEY ("scheduled_workout_id") REFERENCES "scheduled_workouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
