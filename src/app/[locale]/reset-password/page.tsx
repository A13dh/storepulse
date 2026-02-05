
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const resetSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Mismatch",
    path: ["confirmPassword"]
});

export default function ResetPasswordPage() {
    const t = useTranslations('Auth');
    const tc = useTranslations('Common');
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(resetSchema)
    });

    if (!token) {
        return <div>Invalid Token</div>;
    }

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: data.password
            });
            toast.success(tc('success'));
            router.push('/login');
        } catch (error) {
            toast.error(tc('error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-center">{t('newPassword')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label>{t('passwordLabel')}</label>
                            <Input {...register('password')} type="password" />
                        </div>
                        <div className="space-y-2">
                            <label>{t('confirmPasswordLabel')}</label>
                            <Input {...register('confirmPassword')} type="password" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? tc('loading') : tc('save')}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
