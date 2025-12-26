import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Link from "next/link";
import { Play, Calendar, TrendingUp, Dumbbell, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function Dashboard() {
  const session = await auth();
  const today = new Date();

  // Find scheduled workout for today
  // Note: Simple date comparison for now. In prod, handle timezones carefully.
  // Prisma date filtering usually requires start/end of day ranges for DateTime fields.
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));

  const todaysWorkout = session?.user ? await prisma.scheduledWorkout.findFirst({
    where: {
      user_id: (session.user as any).id,
      scheduled_date: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    include: {
      workout: true,
    },
  }) : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Welcome Back{session?.user?.name ? `, ${session.user.name}` : ''}
          </h1>
          <p className="text-gray-400">Let's crush today's goals.</p>
        </div>
        <form action={async () => {
          'use server';
          await signOut({ redirectTo: '/login' });
        }}>
          <button type="submit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-colors text-sm font-medium">
            <LogOut size={16} /> Sign Out
          </button>
        </form>
      </header>

      {/* Hero Section: Today's Workout */}
      <section className="relative overflow-hidden rounded-3xl bg-surface border border-white/5 p-8 md:p-12">
        <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6 border border-primary/20">
            Today's Focus
          </div>

          {todaysWorkout ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
                  {todaysWorkout.workout.title}
                </h2>
                <div className="text-gray-400 flex items-center gap-4">
                  <span>{todaysWorkout.workout.estimated_duration || "45-60 mins"}</span>
                  <span className="w-1 h-1 bg-gray-600 rounded-full" />
                  <span>Week {todaysWorkout.week_number}</span>
                </div>
              </div>

              <Link
                href={`/workouts/${todaysWorkout.id}`}
                className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition-colors"
              >
                <Play size={20} fill="currentColor" />
                Start Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Rest Day</h2>
                <p className="text-gray-400">No workout scheduled for today.</p>
              </div>
              <Link
                href="/schedule"
                className="inline-flex items-center gap-2 bg-surface border border-white/10 hover:bg-white/5 text-white px-6 py-3 rounded-xl font-medium transition-colors"
              >
                <Calendar size={20} />
                View Schedule
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats / Upcoming */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Placeholder Stats */}
        <div className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-primary/20 transition-colors group">
          <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Weekly Streak</h3>
          <p className="text-2xl font-bold text-white">0 Days</p>
        </div>

        <div className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-primary/20 transition-colors group">
          <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <Dumbbell size={20} />
          </div>
          <h3 className="text-gray-400 text-sm font-medium mb-1">Workouts Completed</h3>
          <p className="text-2xl font-bold text-white">0</p>
        </div>

        <Link href="/schedule" className="bg-surface border border-white/5 p-6 rounded-2xl hover:border-primary/20 transition-colors group flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <h3 className="text-gray-400 text-sm font-medium mb-1">Next Up</h3>
            </div>
          </div>
          <p className="text-lg font-medium text-white group-hover:text-primary transition-colors">Check Schedule &rarr;</p>
        </Link>
      </div>
    </div>
  );
}
