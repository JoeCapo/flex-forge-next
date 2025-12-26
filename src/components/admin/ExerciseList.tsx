'use client';

import { useState } from 'react';
import { createExercise, deleteExercise } from '@/app/actions/admin';
import { Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function ExerciseList({ exercises }: { exercises: any[] }) {
    const [isAdding, setIsAdding] = useState(false);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">Exercises</h1>
                <button
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-primary px-4 py-2 rounded-lg text-white font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus size={18} /> Add Exercise
                </button>
            </header>

            <AnimatePresence>
                {isAdding && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <form action={async (formData) => {
                            await createExercise(formData);
                            setIsAdding(false);
                        }} className="bg-surface border border-white/10 p-4 rounded-xl space-y-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input name="name" placeholder="Exercise Name" required className="bg-background/50 border border-white/10 p-2 rounded text-white" />
                                <input name="muscle_group" placeholder="Muscle Group" required className="bg-background/50 border border-white/10 p-2 rounded text-white" />
                                <select name="category" className="bg-background/50 border border-white/10 p-2 rounded text-white">
                                    <option value="strength">Strength</option>
                                    <option value="hypertrophy">Hypertrophy</option>
                                    <option value="complex">Complex</option>
                                </select>
                                <input name="equipment" placeholder="Equipment (optional)" className="bg-background/50 border border-white/10 p-2 rounded text-white" />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-400 hover:text-white">Cancel</button>
                                <button type="submit" className="bg-accent px-4 py-2 rounded text-white font-medium">Save Exercise</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 gap-2">
                {exercises.map((ex) => (
                    <div key={ex.id} className="bg-surface border border-white/5 p-4 rounded-xl flex justify-between items-center group hover:border-white/10 transition-colors">
                        <div>
                            <h3 className="font-bold text-white">{ex.name}</h3>
                            <p className="text-sm text-gray-400">{ex.muscle_group} • {ex.category}</p>
                        </div>
                        <button
                            onClick={() => deleteExercise(ex.id)}
                            className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                ))}
                {exercises.length === 0 && <p className="text-gray-500 text-center py-10">No exercises found.</p>}
            </div>
        </div>
    );
}
