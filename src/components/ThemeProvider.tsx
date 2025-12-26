'use client';

import { useEffect } from 'react';

interface Theme {
    primary?: string;
    accent?: string;
    background?: string;
    surface?: string;
}

interface ThemeProviderProps {
    theme?: Theme | null;
    children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps) {
    useEffect(() => {
        if (!theme) return;

        const root = document.documentElement;

        if (theme.primary) root.style.setProperty('--color-primary', theme.primary);
        if (theme.accent) root.style.setProperty('--color-accent', theme.accent);
        if (theme.background) root.style.setProperty('--background', theme.background);
        if (theme.surface) root.style.setProperty('--surface', theme.surface);

    }, [theme]);

    return <>{children}</>;
}
