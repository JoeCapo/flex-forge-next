import Link from "next/link";
import { Dumbbell, Calendar, Layout } from "lucide-react";

export const dynamic = 'force-dynamic';

export default function AdminDashboard() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/admin/programs" className="bg-surface border border-white/5 p-6 rounded-xl hover:border-primary/50 transition-colors group">
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary">Programs</h2>
                    <p className="text-gray-400 text-sm">Manage Routines & Weekly Blocks</p>
                </Link>
                <Link href="/admin/exercises" className="bg-surface border border-white/5 p-6 rounded-xl hover:border-primary/50 transition-colors group">
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary">Exercises</h2>
                    <p className="text-gray-400 text-sm">Manage exercise library</p>
                </Link>
                <Link href="/admin/workouts" className="bg-surface border border-white/5 p-6 rounded-xl hover:border-primary/50 transition-colors group">
                    <h2 className="text-xl font-bold text-white mb-2 group-hover:text-primary">All Workouts</h2>
                    <p className="text-gray-400 text-sm">View all raw workouts</p>
                </Link>
            </div>
        </div>
    );
}
