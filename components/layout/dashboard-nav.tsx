// components/layout/dashboard-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import {
    LayoutDashboard,
    FileText,
    Users,
    Settings,
    Image,
    Menu,
    X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
        exact: true
    },
    {
        href: '/contents',
        label: 'Contents',
        icon: FileText
    },
    {
        href: '/media',
        label: 'Media',
        icon: Image
    },
    {
        href: '/users',
        label: 'Users',
        icon: Users
    },
    {
        href: '/settings',
        label: 'Settings',
        icon: Settings
    },
];

export function DashboardNav() {
    const pathname = usePathname();
    const { logout } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center">
                        <div className="shrink-0 flex items-center">
                            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
                                CMS Editor
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {navItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href ||
                                    (item.href !== '/dashboard' && pathname.startsWith(item.href));

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                                            ? 'border-indigo-500 text-gray-900'
                                            : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                                            }`}
                                    >
                                        <Icon className="h-4 w-4 mr-2" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        <Button variant="outline" onClick={logout}>
                            Logout
                        </Button>
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? (
                                <X className="h-6 w-6" />
                            ) : (
                                <Menu className="h-6 w-6" />
                            )}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="sm:hidden">
                    <div className="pt-2 pb-3 space-y-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href ||
                                (item.href !== '/dashboard' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                                        }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <div className="flex items-center">
                                        <Icon className="h-5 w-5 mr-3" />
                                        {item.label}
                                    </div>
                                </Link>
                            );
                        })}
                        <div className="pl-3 pr-4 py-2">
                            <Button variant="outline" onClick={logout} className="w-full">
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}