
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { loginSchema, LoginFormData } from "@/lib/validators/auth";
import api from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function LoginPage() {
    const t = useTranslations('Auth');
    const tc = useTranslations('Common');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/login', {
                email: data.email,
                password: data.password
            });

            const { token, user } = response.data;
            login(token, user);
            toast.success(t('welcomeBack'));

            if (user.role === 'STORE_OWNER') {
                router.push('/dashboard');
            } else {
                router.push('/affiliate');
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.error || tc('error'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">{tc('login')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('emailLabel')}</label>
                            <Input {...register('email')} type="email" placeholder="m@example.com" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium">{t('passwordLabel')}</label>
                                <Link href="/forgot-password" className="text-xs text-[#1132d4] hover:underline">
                                    {t('forgotPassword')}?
                                </Link>
                            </div>
                            <Input {...register('password')} type="password" />
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? tc('loading') : tc('login')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-500">
                        {t('noAccount')} <Link href="/signup" className="text-[#1132d4] hover:underline">{tc('signup')}</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
