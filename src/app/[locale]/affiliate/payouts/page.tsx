
"use client";

import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export default function PayoutsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = use(params);
    const t = useTranslations('Affiliate');
    const tc = useTranslations('Common');
    const [payouts, setPayouts] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState('150');
    const [method, setMethod] = useState<'FLOUCI' | 'PAYPAL'>('FLOUCI');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const dashRes = await api.get('/affiliates/dashboard');
            setStats(dashRes.data);
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    const handleRequest = async () => {
        try {
            await api.post('/payouts/request', {
                amount: parseFloat(amount),
                payoutMethod: method
            });
            toast.success('Paiement demandé !');
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || tc('error'));
        }
    };

    const canRequest = stats && stats.summary.remainingToPayout <= 0 && stats.summary.pendingEarnings >= 150;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">{t('payoutHistory')}</h2>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    disabled={!canRequest}
                >
                    {t('requestPayout')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Historique</CardTitle>
                    <CardDescription>Vos paiements récents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Montant</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead>Méthode</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {payouts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                                        Aucun paiement pour le moment.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                payouts.map(p => (
                                    <TableRow key={p.id}>
                                        <TableCell>{p.date}</TableCell>
                                        <TableCell>{p.amount}</TableCell>
                                        <TableCell>{p.status}</TableCell>
                                        <TableCell>{p.method}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
                        <h3 className="text-xl font-bold">Demander un paiement</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Montant (Min 150 DT)</label>
                            <Input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min={150}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Méthode</label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={method}
                                onChange={e => setMethod(e.target.value as any)}
                            >
                                <option value="FLOUCI">Flouci</option>
                                <option value="PAYPAL">PayPal</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-2 pt-4">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>{tc('cancel')}</Button>
                            <Button onClick={handleRequest}>{tc('submit')}</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
