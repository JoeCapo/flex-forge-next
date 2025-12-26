'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, Trash2, Plus, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateWorkoutExercises } from '@/app/actions/admin';

type Exercise = {
    id: number;
    name: string;
    category: string;
};

type WorkoutExercise = {
    id: number; // For new ones this might be temp ID
    exercise_id: number;
    order: number;
    sets: string;
    reps: string;
    is_complex: boolean;
    complex_name?: string;
    group_label?: string;
    rest_seconds?: number | null;
    tempId?: string; // For key
};

export function WorkoutEditor({ workout, allExercises }: { workout: any, allExercises: Exercise[] }) {
    const [exercises, setExercises] = useState<any[]>(workout.workout_exercises);
    const [loading, setLoading] = useState(false);

    // Simplistic additions
    const handleAdd = (exerciseId: number) => {
        const ex = allExercises.find(e => e.id === exerciseId);
        if (!ex) return;

        setExercises([...exercises, {
            id: -1, // New
            exercise_id: exerciseId,
            exercise: ex,
            order: exercises.length + 1,
            sets: '3',
            reps: '10',
            is_complex: false,
            tempId: Math.random().toString()
        }]);
    };

    const handleSave = async () => {
        setLoading(true);
        // Call server action to replace all workout exercises
        await updateWorkoutExercises(workout.id, exercises);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-white">
                <h2 className="text-xl font-bold">Exercises</h2>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-primary text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-primary/90 transition-colors"
                >
                    <Save size={18} /> {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-2">
                {exercises.map((we, idx) => (
                    <div key={we.id > 0 ? we.id : we.tempId} className="bg-surface p-4 rounded-lg border border-white/5 space-y-3">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1">
                                <button disabled={idx === 0} onClick={() => {
                                    const newEx = [...exercises];
                                    [newEx[idx - 1], newEx[idx]] = [newEx[idx], newEx[idx - 1]];
                                    newEx.forEach((e, i) => e.order = i + 1);
                                    setExercises(newEx);
                                }} className="text-gray-500 hover:text-white disabled:opacity-20"><ChevronUp size={16} /></button>
                                <span className="text-gray-500 font-mono w-6 text-center">{idx + 1}</span>
                                <button disabled={idx === exercises.length - 1} onClick={() => {
                                    const newEx = [...exercises];
                                    [newEx[idx + 1], newEx[idx]] = [newEx[idx], newEx[idx + 1]];
                                    newEx.forEach((e, i) => e.order = i + 1);
                                    setExercises(newEx);
                                }} className="text-gray-500 hover:text-white disabled:opacity-20"><ChevronDown size={16} /></button>
                            </div>

                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg">{we.exercise.name}</h3>
                                <div className="text-xs text-gray-500 uppercase">{we.exercise.category}</div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-gray-500">SETS</label>
                                    <input value={we.sets} onChange={(e) => {
                                        const newEx = [...exercises];
                                        newEx[idx].sets = e.target.value;
                                        setExercises(newEx);
                                    }} className="w-16 bg-black/20 text-white rounded px-2 py-1 text-center border border-white/10" placeholder="Sets" />
                                </div>
                                <div className="flex flex-col">
                                    <label className="text-[10px] text-gray-500">REPS</label>
                                    <input value={we.reps} onChange={(e) => {
                                        const newEx = [...exercises];
                                        newEx[idx].reps = e.target.value;
                                        setExercises(newEx);
                                    }} className="w-16 bg-black/20 text-white rounded px-2 py-1 text-center border border-white/10" placeholder="Reps" />
                                </div>
                                <button onClick={() => {
                                    const newEx = exercises.filter((_, i) => i !== idx);
                                    newEx.forEach((e, i) => e.order = i + 1);
                                    setExercises(newEx);
                                }} className="text-red-500 hover:text-red-400 p-2"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        {/* Complex/Circuit Config */}
                        <div className="flex items-center gap-4 border-t border-white/5 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={we.is_complex}
                                    onChange={(e) => {
                                        const newEx = [...exercises];
                                        newEx[idx].is_complex = e.target.checked;
                                        if (!e.target.checked) newEx[idx].complex_name = '';
                                        // Auto-suggest complex name if prev is complex?
                                        if (e.target.checked && idx > 0 && exercises[idx - 1].is_complex) {
                                            newEx[idx].complex_name = exercises[idx - 1].complex_name;
                                        } else if (e.target.checked && !newEx[idx].complex_name) {
                                            // Default to "Circuit" if it looks like a finisher? Or just empty.
                                            // Let's just leave empty but updated placeholder help.
                                        }
                                        setExercises(newEx);
                                    }}
                                    className="w-4 h-4 rounded border-white/20 bg-black/20 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-400 select-none">Group (Complex/Circuit)</span>
                            </label>

                            {we.is_complex && (
                                <input
                                    value={we.complex_name || ''}
                                    onChange={(e) => {
                                        const newEx = [...exercises];
                                        newEx[idx].complex_name = e.target.value;
                                        setExercises(newEx);
                                    }}
                                    className="flex-1 bg-black/20 text-white rounded px-2 py-1 text-sm border border-white/10 focus:border-accent outline-none"
                                    placeholder="Name (e.g. 'Metcon Circuit', 'Barbell Complex')"
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-white/10 pt-4">
                <h3 className="text-white font-bold mb-2">Add Exercise</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {allExercises.slice(0, 10).map(ex => ( // Limit for MVP
                        <button
                            key={ex.id}
                            onClick={() => handleAdd(ex.id)}
                            className="bg-white/5 hover:bg-primary/20 text-gray-300 hover:text-white p-2 rounded text-sm transition-colors text-left truncate"
                        >
                            + {ex.name}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
