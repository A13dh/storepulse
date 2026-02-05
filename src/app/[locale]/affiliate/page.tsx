
"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/utils/currency";
import api from "@/lib/api/client";
import { StatCard } from "@/components/dashboard/StatCard";
import { MousePointer2, CheckCircle, Wallet, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function AffiliateDashboardPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('Affiliate');
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const currentLocale = (locale === 'ar' ? 'ar' : 'fr');

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await api.get('/affiliates/dashboard');
                setData(res.data);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, []);

    const copyLink = () => {
        if (data?.referralLink) {
            navigator.clipboard.writeText(data.referralLink);
            toast.success(t('copyLink') + ' !');
        }
    };

    if (isLoading) return <div>...</div>;
    if (!data) return <div>Error loading data</div>;

    return (
        <div className="space-y-6">
            <Card className="bg-blue-50 border-[#1132d4]/20">
                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="font-semibold text-[#1132d4]">{t('referralLink')}</h3>
                        <p className="text-sm text-blue-700">Partagez ce lien pour gagner des commissions.</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <Input value={data.referralLink} readOnly className="bg-white" />
                        <Button onClick={copyLink} className="shrink-0 bg-[#1132d4]">
                            <Copy size={16} className="mr-2" />
                            {t('copyLink')}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title={t('clicks')}
                    value={data.summary.totalClicks}
                    icon={MousePointer2}
                />
                <StatCard
                    title={t('conversions')}
                    value={data.summary.conversions}
                    icon={CheckCircle}
                    trend={`${data.summary.conversionRate}% Rate`}
                />
                <StatCard
                    title={t('pending')}
                    value={formatCurrency(data.summary.pendingEarnings, currentLocale)}
                    icon={Wallet}
                />
                <StatCard
                    title={t('paid')}
                    value={formatCurrency(data.summary.paidEarnings, currentLocale)}
                    icon={CheckCircle}
                />
            </div>

            {data.summary.remainingToPayout > 0 && (
                <div className="p-4 rounded-md bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">
                    {t('minPayoutWarning')} ({formatCurrency(data.summary.remainingToPayout, currentLocale)} restants)
                </div>
            )}
        </div>
    );
}
