
"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Wallet, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const t = useTranslations('Common');
    const pathname = usePathname();

    if (loading) return <div>{t('loading')}</div>;

    if (!user || user.role !== 'AFFILIATE') {
        return null;
    }

    const navItems = [
        { href: '/affiliate', label: t('dashboard'), icon: LayoutDashboard, exact: true },
        { href: '/affiliate/payouts', label: 'Paiements', icon: Wallet },
    ];

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
            <aside className="w-full md:w-64 bg-white border-r min-h-screen flex flex-col">
                <div className="h-16 flex items-center px-6 border-b">
                    <div className="w-8 h-8 bg-[#1132d4] rounded-lg mr-2"></div>
                    <span className="font-bold text-lg">AffiliateHub</span>
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
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50">
                        <LogOut size={18} />
                        {t('logout')}
                    </button>
                </div>
            </aside>

            <main className="flex-1">
                <header className="h-16 bg-white border-b flex items-center justify-between px-6">
                    <h1 className="text-xl font-semibold">Affiliate</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">{user.email}</span>
                    </div>
                </header>
                <div className="p-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
