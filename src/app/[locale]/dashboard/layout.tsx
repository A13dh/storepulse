
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { LayoutDashboard, Store, Package, ShoppingCart, Users, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const t = useTranslations('Common');
    const pathname = usePathname();
    const router = useRouter();

    if (loading) return <div className="h-screen flex items-center justify-center">{t('loading')}</div>;

    // Protect route
    if (!user || user.role !== 'STORE_OWNER') {
        // If affiliate, redirect to affiliate dashboard? 
        // If not logged in, login.
        // Logic handled in useEffect of AuthContext or here. 
        // For visual layout, we assume authorized or redirecting.
        return null;
    }

    const navItems = [
        { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard, exact: true },
        { href: '/dashboard/store', label: t('store'), icon: Store },
        { href: '/dashboard/products', label: t('products'), icon: Package },
        { href: '/dashboard/orders', label: t('orders'), icon: ShoppingCart },
        { href: '/dashboard/affiliates', label: t('affiliates'), icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r min-h-screen flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                    <div className="w-8 h-8 bg-[#1132d4] rounded-lg mr-2"></div>
                    <span className="font-bold text-lg">StorePulse</span>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = item.exact
                            ? pathname === item.href
                            : pathname?.startsWith(item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                    isActive
                                        ? "bg-blue-50 text-[#1132d4]"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t space-y-1">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
                    >
                        <LogOut size={18} />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1">
                <header className="h-16 bg-white border-b flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold">
                        {navItems.find(i => i.href === pathname)?.label || 'Dashboard'}
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700">{user.email}</span>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
