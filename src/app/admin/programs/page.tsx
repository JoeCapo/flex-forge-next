import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Trash2, Calendar } from "lucide-react";
import { createProgram, deleteProgram } from "@/app/actions/admin";

export default async function AdminProgramsPage() {
    const programs = await prisma.program.findMany({
        orderBy: { created_at: 'desc' },
        include: { _count: { select: { workouts: true } } }
    });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">Programs</h1>

            <div className="bg-surface border border-white/5 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-4">Create New Program</h2>
                <form action={createProgram} className="flex gap-4 items-end">
                    <div className="flex-1 space-y-2">
                        <label className="text-sm text-gray-400">Program Name</label>
                        <input name="name" required className="w-full bg-black/20 text-white rounded px-4 py-2 border border-white/10" placeholder="e.g. Spartan Hypertrophy" />
                    </div>
                    <div className="flex-1 space-y-2">
                        <label className="text-sm text-gray-400">Description</label>
                        <input name="description" className="w-full bg-black/20 text-white rounded px-4 py-2 border border-white/10" placeholder="Optional description" />
                    </div>
                    <div className="w-24 space-y-2">
                        <label className="text-sm text-gray-400">Weeks</label>
                        <input name="duration_weeks" type="number" defaultValue="6" className="w-full bg-black/20 text-white rounded px-4 py-2 border border-white/10" />
                    </div>
                    <button className="bg-primary text-white px-6 py-2 rounded font-bold hover:bg-primary/90 transition-colors">
                        Create
                    </button>
                </form>
            </div>

            <div className="grid gap-4">
                {programs.map(prog => (
                    <div key={prog.id} className="bg-surface border border-white/5 rounded-xl p-6 flex justify-between items-center group hover:border-white/10 transition-colors">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{prog.name}</h3>
                            <p className="text-gray-400 text-sm mb-2">{prog.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Calendar size={14} /> {prog.duration_weeks} Weeks</span>
                                <span>{prog._count.workouts} Daily Workouts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link href={`/admin/programs/${prog.id}`} className="px-4 py-2 rounded bg-white/5 hover:bg-white/10 text-white transition-colors">
                                Edit Details
                            </Link>
                            <form action={deleteProgram.bind(null, prog.id)}>
                                <button className="text-red-500 hover:text-red-400 p-2"><Trash2 size={20} /></button>
                            </form>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
