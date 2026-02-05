
"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/api/client";

export default function StoreLayout({
    children,
    params
}: {
    children: React.ReactNode,
    params: Promise<{ subdomain: string }>
}) {
    const { subdomain } = use(params);
    const [store, setStore] = useState<any>(null);

    useEffect(() => {
        // Mocking for Phase 3 based on subdomain
        setStore({
            name: subdomain.charAt(0).toUpperCase() + subdomain.slice(1) + " Store",
            subdomain: subdomain,
            governorate: "TUNIS"
        });
    }, [subdomain]);

    if (!store) return <div>Loading Store...</div>;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm py-4 px-6 md:px-12 flex justify-between items-center sticky top-0 z-40">
                <h1 className="text-xl font-bold tracking-tight text-gray-900">{store.name}</h1>
                <div className="flex gap-4">
                    <span className="text-sm border px-2 py-1 rounded-md">{store.governorate}</span>
                </div>
            </header>
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {children}
            </main>
            <footer className="bg-white border-t mt-12 py-8 text-center text-sm text-gray-500">
                Powered by StorePulse
            </footer>
        </div>
    );
}
