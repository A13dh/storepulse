
"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency";
import api from "@/lib/api/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { DollarSign, ShoppingCart, Users, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('Dashboard');
    const [stats, setStats] = useState({
        totalSales: 0,
        totalOrders: 0,
        activeAffiliates: 0,
        revenueToday: 0
    });

    const [isLoading, setIsLoading] = useState(true);
    const currentLocale = (locale === 'ar' ? 'ar' : 'fr');

    useEffect(() => {
        async function fetchData() {
            try {
                const storesRes = await api.get('/stores/me');
                const stores = storesRes.data.stores;
                if (stores.length > 0) {
                    const storeId = stores[0].id;
                    const ordersRes = await api.get(`/orders?storeId=${storeId}`);
                    const orders = ordersRes.data.orders;

                    const totalSales = orders.reduce((acc: number, o: any) => acc + Number(o.total), 0);

                    setStats({
                        totalSales,
                        totalOrders: orders.length,
                        activeAffiliates: 0,
                        revenueToday: 0
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const data = [
        { name: 'Mon', total: 400 },
        { name: 'Tue', total: 300 },
        { name: 'Wed', total: 200 },
        { name: 'Thu', total: 600 },
        { name: 'Fri', total: 500 },
        { name: 'Sat', total: 900 },
        { name: 'Sun', total: 700 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={t('totalSales')}
                    value={formatCurrency(stats.totalSales, currentLocale)}
                    icon={DollarSign}
                />
                <StatCard
                    title={t('totalOrders')}
                    value={stats.totalOrders}
                    icon={ShoppingCart}
                />
                <StatCard
                    title={t('activeAffiliates')}
                    value={stats.activeAffiliates}
                    icon={Users}
                />
                <StatCard
                    title={t('revenueToday')}
                    value={formatCurrency(stats.revenueToday, currentLocale)}
                    icon={TrendingUp}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data}>
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}DT`} />
                                    <Bar dataKey="total" fill="#1132d4" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
