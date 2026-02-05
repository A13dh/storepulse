
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import api from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

const forgotSchema = z.object({
    email: z.string().email()
});

export default function ForgotPasswordPage() {
    const t = useTranslations('Auth');
    const tc = useTranslations('Common');
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<{ email: string }>({
        resolver: zodResolver(forgotSchema)
    });

    const onSubmit = async (data: { email: string }) => {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', data);
            setSuccess(true);
            toast.success(tc('success'));
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
                    <CardTitle className="text-xl font-bold text-center">
                        {success ? tc('success') : t('resetPasswordTitle')}
                    </CardTitle>
                    {!success && <CardDescription className="text-center">{t('resetPasswordDesc')}</CardDescription>}
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center space-y-4">
                            <p className="text-sm text-gray-600">
                                Si un compte existe cette adresse, vous recevrez un email avec les instructions.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Input {...register('email')} type="email" placeholder="m@example.com" />
                                {errors.email && <p className="text-xs text-red-500">Email invalide</p>}
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? tc('loading') : t('sendResetLink')}
                            </Button>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="justify-center">
                    <Link href="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-900">
                        <ArrowLeft size={16} className="mr-2" />
                        {tc('login')}
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
