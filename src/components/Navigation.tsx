'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Calendar, Dumbbell, Shield, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Schedule', href: '/schedule', icon: Calendar },
    { name: 'Workouts', href: '/workouts', icon: Dumbbell },
    { name: 'Admin', href: '/admin/dashboard', icon: Shield }, // Visible but protected
];

export function Navigation() {
    const pathname = usePathname();

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-surface/50 backdrop-blur-xl border-r border-white/5 z-40">
                <div className="p-6 flex items-center gap-3">
                    <img src="/logo.png" alt="Flex Forge" className="w-8 h-8 object-contain" />
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                            Flex Forge
                        </h1>
                        <p className="text-[10px] text-gray-500 font-medium tracking-wider uppercase">Spartan Elite</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 py-4 space-y-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative",
                                    isActive
                                        ? "text-white"
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="desktopNavHighlight"
                                        className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl border border-primary/20"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                                <item.icon size={20} className={cn("relative z-10", isActive && "text-primary")} />
                                <span className="relative z-10 font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    {/* User profile or logout would go here */}
                    <div className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white transition-colors cursor-pointer">
                        <Settings size={20} />
                        <span className="font-medium">Settings</span>
                    </div>
                </div>
            </aside>

            {/* Mobile Bottom Nav */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface/80 backdrop-blur-xl border-t border-white/5 pb-safe z-40">
                <div className="flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex flex-col items-center justify-center w-full h-full space-y-1",
                                    isActive ? "text-primary" : "text-gray-500"
                                )}
                            >
                                <div className="relative p-1">
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavHighlight"
                                            className="absolute inset-0 bg-primary/20 blur-md rounded-full"
                                        />
                                    )}
                                    <item.icon size={20} className="relative z-10" />
                                </div>
                                <span className="text-[10px] font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
}
