'use client';

import { useState } from 'react';
import { updateProgramTheme } from '@/app/actions/admin';
import { Save, RefreshCw } from 'lucide-react';

interface ThemeEditorProps {
    programId: number;
    initialTheme: any;
}

export function ProgramThemeEditor({ programId, initialTheme }: ThemeEditorProps) {
    const [theme, setTheme] = useState(initialTheme || {
        primary: '#FF5500',
        accent: '#00C2FF',
        background: '#0A0A0A',
        surface: '#171717'
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        await updateProgramTheme(programId, theme);
        setSaving(false);
    };

    const handleChange = (key: string, value: string) => {
        setTheme((prev: any) => ({ ...prev, [key]: value }));
        // Live Preview via CSS injection temporarily?
        document.documentElement.style.setProperty(`--${key === 'background' || key === 'surface' ? '' : 'color-'}${key}`, value);
    };

    return (
        <div className="bg-surface border border-white/5 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Theme Configuration</h3>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                    {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Theme
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Primary Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={theme.primary}
                            onChange={(e) => handleChange('primary', e.target.value)}
                            className="bg-transparent border-none w-10 h-10 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={theme.primary}
                            onChange={(e) => handleChange('primary', e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white w-full"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Accent Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={theme.accent}
                            onChange={(e) => handleChange('accent', e.target.value)}
                            className="bg-transparent border-none w-10 h-10 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={theme.accent}
                            onChange={(e) => handleChange('accent', e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white w-full"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm text-gray-400">Background Color</label>
                    <div className="flex items-center gap-3">
                        <input
                            type="color"
                            value={theme.background}
                            onChange={(e) => handleChange('background', e.target.value)}
                            className="bg-transparent border-none w-10 h-10 cursor-pointer"
                        />
                        <input
                            type="text"
                            value={theme.background}
                            onChange={(e) => handleChange('background', e.target.value)}
                            className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white w-full"
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-black/20 border border-white/5">
                <h4 className="text-sm text-gray-400 mb-2">Live Preview (Current Page)</h4>
                <div className="flex gap-4">
                    <button className="bg-primary text-white px-4 py-2 rounded-lg font-bold">Primary Button</button>
                    <button className="bg-surface border border-white/10 text-accent px-4 py-2 rounded-lg font-bold">Accent Text</button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary to-accent"></div>
                </div>
            </div>
        </div>
    );
}
