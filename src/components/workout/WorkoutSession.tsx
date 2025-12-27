'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, Save, Plus, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSetLog, updateSet, toggleWorkoutCompletion, createComplexLog, updateComplexLog } from '@/app/actions/workout';
import { useRouter } from 'next/navigation';

// Types
// Types
type WorkoutExercise = {
    id: number;
    exercise_id: number;
    order: number;
    sets: string;
    reps: string;
    is_complex: boolean;
    complex_name?: string;
    group_label?: string;
    rest_seconds?: number;
    notes?: string;
    focus?: string;
    target_time_seconds?: number;
    exercise: {
        name: string;
        category: string;
    };
};

type WorkoutData = {
    id: number;
    workout: {
        title: string;
        workout_exercises: WorkoutExercise[];
    };
    exercise_logs: any[];
    complex_logs: any[];
    is_completed: boolean;
    duration_seconds?: number | null;
    rpe?: number | null;
    feeling?: string | null;
};

type HistoryMap = Record<number, { weight: number, reps: number, date: Date }>;


// ... Grouping Logic (unchanged) ...
type GroupedItem =
    | { type: 'single'; data: WorkoutExercise }
    | { type: 'group'; label: string; items: WorkoutExercise[]; isComplex: boolean };

function groupExercises(exercises: WorkoutExercise[]): GroupedItem[] {
    const grouped: GroupedItem[] = [];
    let currentGroup: { label: string; items: WorkoutExercise[]; isComplex: boolean } | null = null;

    exercises.forEach((ex) => {
        const groupKey = ex.group_label || (ex.is_complex ? (ex.complex_name || 'Complex') : null);

        if (groupKey) {
            if (currentGroup && currentGroup.label === groupKey) {
                currentGroup.items.push(ex);
            } else {
                if (currentGroup) grouped.push({ type: 'group', label: currentGroup.label, items: currentGroup.items, isComplex: currentGroup.isComplex });
                currentGroup = { label: groupKey, items: [ex], isComplex: ex.is_complex };
            }
        } else {
            if (currentGroup) {
                grouped.push({ type: 'group', label: currentGroup.label, items: currentGroup.items, isComplex: currentGroup.isComplex });
                currentGroup = null;
            }
            grouped.push({ type: 'single', data: ex });
        }
    });
    if (currentGroup) {
        const group: { label: string; items: WorkoutExercise[]; isComplex: boolean } = currentGroup;
        grouped.push({ type: 'group', label: group.label, items: group.items, isComplex: group.isComplex });
    }

    return grouped;
}

const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
};

// GLOBAL STOPWATCH
function GlobalTimer({ seconds }: { seconds: number }) {
    return <div className="font-mono text-xl text-primary">{formatTime(seconds)}</div>;
}

// REST TIMER COMPONENT
function RestTimer({ seconds }: { seconds: number }) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsActive(false);
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const toggle = () => {
        if (!isActive && timeLeft === 0) setTimeLeft(seconds);
        setIsActive(!isActive);
    };

    const reset = () => {
        setIsActive(false);
        setTimeLeft(seconds);
    };

    return (
        <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-1.5 rounded-full hover:bg-white/10 text-primary transition-colors">
                {isActive ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span className={cn("font-mono text-xs w-10", isActive && "text-primary font-bold")}>
                {formatTime(timeLeft)}
            </span>
            <button onClick={reset} className="p-1.5 rounded-full hover:bg-white/10 text-gray-500 transition-colors">
                <RotateCcw size={14} />
            </button>
        </div>
    );
}

function RoundStopwatch({ onStop }: { onStop: (s: number) => void }) {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => setSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    return (
        <div className="flex items-center gap-1">
            <div className="font-mono text-white text-sm bg-black/40 px-2 rounded min-w-[3rem] text-center border border-white/10">
                {formatTime(seconds)}
            </div>
            <button
                onClick={() => {
                    if (isActive) onStop(seconds);
                    setIsActive(!isActive);
                }}
                className={cn("p-1 rounded transition-colors", isActive ? "text-red-500 bg-red-500/10" : "text-green-500 bg-green-500/10")}
            >
                {isActive ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            </button>
            <button onClick={() => { setIsActive(false); setSeconds(0); }} className="text-gray-500 p-1"><RotateCcw size={14} /></button>
        </div>
    );
}


export function WorkoutSession({ data, history }: { data: WorkoutData, history?: HistoryMap }) {
    const router = useRouter();
    const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
    const [isComplete, setIsComplete] = useState(data.is_completed);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Timer State
    const [elapsedSeconds, setElapsedSeconds] = useState(data.duration_seconds || 0);
    const [isTimerRunning, setIsTimerRunning] = useState(!data.is_completed);

    // Feedback State
    const [rpe, setRpe] = useState(5);
    const [feeling, setFeeling] = useState('');

    const groupedExercises = groupExercises(data.workout.workout_exercises);

    // Timer Effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isTimerRunning && !isComplete) {
            interval = setInterval(() => setElapsedSeconds(s => s + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, isComplete]);

    const handleSaveSet = async (exerciseId: number, setNum: number, reps: number, weight: number, logId?: number) => {
        if (logId) {
            await updateSet(logId, { reps, weight });
        } else {
            await createSetLog(data.id, exerciseId, setNum, reps, weight);
        }
        router.refresh();
    };

    const handleFinishClick = () => {
        setIsTimerRunning(false); // Pause timer
        setIsModalOpen(true);
    };

    const handleCancelFinish = () => {
        setIsModalOpen(false);
        setIsTimerRunning(true); // Resume timer
    };

    const confirmFinish = async () => {
        await toggleWorkoutCompletion(data.id, true, {
            duration: elapsedSeconds,
            rpe,
            feeling
        });
        setIsComplete(true);
        setIsTimerRunning(false);
        setIsModalOpen(false);
        router.refresh();
    };

    const handleRedo = async () => {
        if (confirm("Are you sure you want to redo? This will mark the workout as incomplete.")) {
            await toggleWorkoutCompletion(data.id, false);
            setIsComplete(false);
            setIsTimerRunning(true); // Restart timer
            setRpe(5);
            setFeeling('');
            // Optionally reset timer? setElapsedSeconds(0); 
            // Or continue from current. Let's reset for fresh start usually, or keep. 
            // User just said "redo", implying start over or continue. I will keep time but resume.
            router.refresh();
        }
    };

    if (isComplete) {
        return (
            <div className="min-h-screen bg-black text-white p-4 pb-24 flex flex-col items-center justify-center">
                <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 size={40} className="text-green-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold font-oswald text-primary mb-2">WORKOUT COMPLETE</h1>
                        <p className="text-gray-400">Great job crushing {data.workout.title}!</p>
                    </div>

                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 space-y-4 max-w-sm mx-auto">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400">Duration</span>
                            <span className="font-mono text-xl">{formatTime(data.duration_seconds || elapsedSeconds)}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                            <span className="text-gray-400">RPE</span>
                            <div className="flex gap-1">
                                {[...Array(data.rpe || rpe)].map((_, i) => <div key={i} className="w-2 h-6 bg-primary rounded-sm" />)}
                            </div>
                        </div>
                        {data.feeling && (
                            <div className="text-left">
                                <span className="text-gray-400 text-sm block mb-1">Feedback</span>
                                <p className="text-sm">{data.feeling}</p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleRedo}
                        className="text-gray-500 hover:text-white underline text-sm"
                    >
                        Redo Workout?
                    </button>

                    <button
                        onClick={() => router.push('/workouts')}
                        className="bg-primary text-black font-bold py-3 px-8 rounded-full hover:brightness-110 transition-all"
                    >
                        BACK TO HOME
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 pb-24 relative">
            {/* HEADER */}
            <header className="flex justify-between items-start mb-6 sticky top-0 bg-black/80 backdrop-blur-md py-4 z-40 border-b border-white/5 -mx-4 px-4">
                <div>
                    <h1 className="text-2xl font-bold font-oswald text-primary">{data.workout.title}</h1>
                    <p className="text-xs text-gray-500">Workout #{data.id}</p>
                </div>
                <GlobalTimer seconds={elapsedSeconds} />
            </header>

            <div className="space-y-4 max-w-xl mx-auto">
                {groupedExercises.map((item, index) => {
                    if (item.type === 'single') {
                        const we = item.data;
                        const isExpanded = expandedExercise === we.id;
                        const logs = data.exercise_logs.filter(l => l.exercise_id === we.exercise_id).sort((a: any, b: any) => a.set_number - b.set_number);
                        const exerciseHistory = history ? history[we.exercise_id] : undefined;

                        return (
                            <ExerciseCard
                                key={we.id}
                                we={we}
                                isExpanded={isExpanded}
                                onExpand={() => setExpandedExercise(isExpanded ? null : we.id)}
                                logs={logs}
                                onSaveSet={(s: number, r: number, w: number, lid?: number) => handleSaveSet(we.exercise_id, s, r, w, lid)}
                                history={exerciseHistory}
                            />
                        );
                    } else {
                        // Group/Complex Card
                        const groupLabel = item.label;
                        const triggerId = item.items[0].id;
                        const isExpanded = expandedExercise === triggerId;
                        const isComplexMode = item.items.some(x => x.is_complex || (x as any).is_circuit);
                        const complexLogs = isComplexMode ? data.complex_logs.filter(l => l.complex_name === groupLabel || l.complex_name === item.items[0].complex_name).sort((a: any, b: any) => a.round_number - b.round_number) : [];

                        return (
                            <GroupCard
                                key={`group-${index}`}
                                label={groupLabel}
                                exercises={item.items}
                                isExpanded={isExpanded}
                                onExpand={() => setExpandedExercise(isExpanded ? null : triggerId)}
                                isComplex={isComplexMode}
                                logs={complexLogs}
                                allLogs={data.exercise_logs}
                                workoutId={data.id}
                                onSaveSet={handleSaveSet}
                                router={router}
                                history={history}
                            />
                        );
                    }
                })}
            </div>

            {/* FINISH BUTTON */}
            <div className="px-4 py-8 flex justify-center">
                <button
                    onClick={handleFinishClick}
                    className="w-full bg-primary text-black font-bold font-oswald text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                    <CheckCircle2 size={24} />
                    FINISH WORKOUT
                </button>
            </div>

            {/* COMPLETION MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 bottom-0 sm:bottom-auto absolute sm:relative"
                        >
                            <h2 className="text-2xl font-bold text-center font-oswald">WORKOUT COMPLETE?</h2>

                            <div className="text-center">
                                <p className="text-gray-400 mb-1">Time Elapsed</p>
                                <p className="text-4xl font-mono text-primary font-bold">{formatTime(elapsedSeconds)}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">Rate Perceived Exertion (1-10)</label>
                                    <div className="flex justify-between gap-1">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                            <button
                                                key={n}
                                                onClick={() => setRpe(n)}
                                                className={cn(
                                                    "w-8 h-8 rounded text-sm font-bold transition-colors",
                                                    rpe === n ? "bg-primary text-black" : "bg-zinc-800 text-gray-500 hover:bg-zinc-700"
                                                )}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between text-[10px] text-gray-500 mt-1 px-1">
                                        <span>Easy</span>
                                        <span>Hard</span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-400 mb-2">How did it feel? (Optional)</label>
                                    <textarea
                                        value={feeling}
                                        onChange={(e) => setFeeling(e.target.value)}
                                        placeholder="Felt strong, knee bothered me, etc..."
                                        className="w-full bg-zinc-800 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-primary placeholder:text-gray-600 min-h-[80px]"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={handleCancelFinish}
                                    className="flex-1 py-4 rounded-xl font-bold bg-zinc-800 text-gray-400 hover:bg-zinc-700 transition-colors"
                                >
                                    BACK
                                </button>
                                <button
                                    onClick={confirmFinish}
                                    className="flex-1 py-4 rounded-xl font-bold bg-primary text-black hover:brightness-110 transition-colors"
                                >
                                    CONFIRM FINISH
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function GroupCard({ label, exercises, isExpanded, onExpand, isComplex, logs, allLogs, workoutId, onSaveSet, router, history }: any) {
    const handleSaveRound = async (roundNum: number, weight: number, duration: number, logId?: number) => {
        if (logId) {
            await updateComplexLog(logId, { weight, duration });
        } else {
            // Use label as complex name
            await createComplexLog(workoutId, label, roundNum, weight, duration);
        }
        router.refresh();
    };

    // For complexes, use the rest time from the first exercise as the group rest time
    const groupRestSeconds = isComplex && exercises.length > 0 ? exercises[0].rest_seconds : null;

    return (
        <motion.div className="bg-surface border border-accent/20 rounded-xl overflow-hidden mb-4" initial={false}>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors bg-accent/5" onClick={onExpand}>
                <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg", isExpanded ? "bg-accent text-white" : "bg-accent/20 text-accent")}>
                        {label.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-white uppercase tracking-wider">{label}</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-accent/80">{exercises.map((e: any) => e.exercise.name).join(', ')}</p>
                            {groupRestSeconds && <RestTimer seconds={groupRestSeconds} />}
                        </div>
                    </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-accent" /> : <ChevronDown size={20} className="text-accent" />}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 space-y-4">

                            {/* If Complex (Round Based) */}
                            {isComplex ? (
                                <>
                                    <div className="bg-black/20 rounded-lg p-3 space-y-2">
                                        {exercises.map((ex: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center text-sm text-gray-300 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                                                <span>{ex.exercise.name}</span>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-gray-500">{ex.sets} x {ex.reps}</span>
                                                    {ex.rest_seconds && <RestTimer seconds={ex.rest_seconds} />}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                                            <div className="col-span-2 text-center">Rnd</div>
                                            <div className="col-span-3 text-center">Lbs</div>
                                            <div className="col-span-4 text-center">Time</div>
                                            <div className="col-span-3 text-right">Log</div>
                                        </div>
                                        {Array.from({ length: 5 }).map((_, i) => { // TODO: Configurable rounds
                                            const roundNum = i + 1;
                                            const log = logs.find((l: any) => l.round_number === roundNum);
                                            return <ComplexRoundRow key={roundNum} roundNum={roundNum} log={log} onSave={(w: number, d: number) => handleSaveRound(roundNum, w, d, log?.id)} />;
                                        })}
                                    </div>
                                </>
                            ) : (
                                /* Standard Group (just listed together like superset) */
                                <div className="space-y-4">
                                    {exercises.map((we: any) => (
                                        <ExerciseCard
                                            key={we.id}
                                            we={we}
                                            isExpanded={true}
                                            onExpand={() => { }} // Always expanded inside group
                                            logs={allLogs.filter((l: any) => l.exercise_id === we.exercise_id).sort((a: any, b: any) => a.set_number - b.set_number)}
                                            onSaveSet={(s: number, r: number, w: number, lid?: number) => onSaveSet(we.exercise_id, s, r, w, lid)}
                                            embedded={true}
                                            history={history ? history[we.exercise_id] : undefined}
                                        />
                                    ))}
                                </div>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function ExerciseCard({ we, isExpanded, onExpand, logs, onSaveSet, embedded = false, history }: any) {
    return (
        <motion.div className={cn("rounded-xl overflow-hidden", embedded ? "bg-black/20 border-none" : "bg-surface border border-white/5")} initial={false}>
            <div className={cn("p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors", embedded && "py-2")} onClick={onExpand}>
                <div className="flex items-center gap-4">
                    {!embedded && (
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg", isExpanded ? "bg-primary/20 text-primary" : "bg-white/5 text-gray-500")}>
                            {we.order}
                        </div>
                    )}
                    <div className="flex flex-col gap-1">
                        <h3 className="font-bold text-white">{we.exercise.name}</h3>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span>{we.sets} sets × {we.reps} reps</span>
                            {we.rest_seconds && <RestTimer seconds={we.rest_seconds} />}
                        </div>
                        {(we.notes || we.focus) && (
                            <div className="text-xs text-accent mt-1 p-2 bg-accent/5 rounded border border-accent/10">
                                {we.focus && <p><span className="font-bold">Focus:</span> {we.focus}</p>}
                                {we.notes && <p><span className="font-bold">Notes:</span> {we.notes}</p>}
                            </div>
                        )}
                        {history && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                                Last: {history.weight}lbs x {history.reps}
                            </div>
                        )}
                    </div>
                </div>
                {!embedded && (isExpanded ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />)}
            </div>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
                        <div className="p-4 pt-0 space-y-2 border-t border-white/5">
                            {!embedded && <div className="h-2"></div>}
                            {/* Header Row */}
                            <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase tracking-wider mb-2 px-2">
                                <div className="col-span-2 text-center">Set</div>
                                <div className="col-span-3 text-center">Lbs</div>
                                <div className="col-span-3 text-center">Reps</div>
                                <div className="col-span-4 text-right">Log</div>
                            </div>
                            {Array.from({ length: Math.max(logs.length, parseInt(we.sets) || 3) }).map((_, i) => {
                                const setNum = i + 1;
                                const log = logs.find((l: any) => l.set_number === setNum);
                                return <SetRow key={setNum} setNum={setNum} log={log} onSave={(r: number, w: number) => onSaveSet(setNum, r, w, log?.id)} history={history} />;
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div >
    );
}

function ComplexRoundRow({ roundNum, log, onSave }: any) {
    const [weight, setWeight] = useState(log?.weight_used?.toString() || '');
    const [duration, setDuration] = useState(log?.duration_seconds?.toString() || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onSave(Number(weight), Number(duration));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className={cn("grid grid-cols-12 gap-2 items-center bg-background/50 p-2 rounded-lg", log?.completed && "opacity-50")}>
            <div className="col-span-2 text-center font-bold text-accent">R{roundNum}</div>
            <div className="col-span-3">
                <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-center text-white focus:border-accent outline-none" placeholder="Lbs" />
            </div>
            <div className="col-span-4 flex items-center gap-1">
                <input type="number" value={duration} onChange={e => setDuration(e.target.value)} className="w-16 bg-surface border border-white/10 rounded px-2 py-1 text-center text-white focus:border-accent outline-none" placeholder="Secs" />
                <RoundStopwatch onStop={(s) => setDuration(s.toString())} />
            </div>
            <div className="col-span-3 flex justify-end gap-2">
                <button onClick={handleSave} className={cn("p-2 rounded hover:bg-white/10 transition-colors", saved ? "text-secondary" : "text-accent")}>
                    {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                </button>
            </div>
        </div>
    );
}

function SetRow({ setNum, log, onSave, history }: { setNum: number, log?: any, onSave: (r: number, w: number) => void, history?: any }) {
    const [reps, setReps] = useState(log?.reps_completed?.toString() || '');
    const [weight, setWeight] = useState(log?.weight_used?.toString() || '');
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        onSave(Number(reps), Number(weight));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div className={cn("grid grid-cols-12 gap-2 items-center bg-background/50 p-2 rounded-lg", log?.completed && "opacity-50")}>
            <div className="col-span-2 text-center font-bold text-gray-500">#{setNum}</div>
            <div className="col-span-3">
                <input
                    type="number"
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-center text-white focus:border-primary outline-none"
                    placeholder={!weight && history ? `${history.weight}` : "Lbs"}
                />
            </div>
            <div className="col-span-3">
                <input
                    type="number"
                    value={reps}
                    onChange={e => setReps(e.target.value)}
                    className="w-full bg-surface border border-white/10 rounded px-2 py-1 text-center text-white focus:border-primary outline-none"
                    placeholder="Reps"
                />
            </div>
            <div className="col-span-4 flex justify-end gap-2">
                <button
                    onClick={handleSave}
                    className={cn("p-2 rounded hover:bg-white/10 transition-colors", saved ? "text-secondary" : "text-primary")}
                >
                    {saved ? <CheckCircle2 size={20} /> : <Save size={20} />}
                </button>
            </div>
        </div>
    );
}
