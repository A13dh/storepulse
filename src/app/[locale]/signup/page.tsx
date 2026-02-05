
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { signupSchema, SignupFormData } from "@/lib/validators/auth";
import api from "@/lib/api/client";
import { useAuth } from "@/contexts/AuthContext"; // To login immediately or just redirect
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Store, UserCheck } from "lucide-react";

export default function SignupPage() {
    const t = useTranslations('Auth');
    const tc = useTranslations('Common');
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialRole = searchParams.get('role') === 'AFFILIATE' ? 'AFFILIATE' : 'STORE_OWNER';

    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth(); // If we auto-login

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            role: initialRole,
            email: '',
            password: '',
            confirmPassword: ''
        }
    });

    const selectedRole = watch('role');

    const onSubmit = async (data: SignupFormData) => {
        setIsLoading(true);
        try {
            const response = await api.post('/auth/signup', {
                email: data.email,
                password: data.password,
                role: data.role,
                language: 'FR' // Default, maybe detect locale?
            });

            const { token, user } = response.data;

            // Auto login
            login(token, user);

            toast.success(tc('success'));

            if (user.role === 'STORE_OWNER') {
                router.push('/dashboard/store'); // Go to setup
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">{t('createAccount')}</CardTitle>
                    <CardDescription className="text-center">{t('roleSelection')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div
                                onClick={() => setValue('role', 'STORE_OWNER')}
                                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${selectedRole === 'STORE_OWNER' ? 'border-[#1132d4] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                            >
                                <div className={`p-2 rounded-full ${selectedRole === 'STORE_OWNER' ? 'bg-[#1132d4] text-white' : 'bg-gray-100'}`}>
                                    <Store size={20} />
                                </div>
                                <span className={`text-sm font-medium ${selectedRole === 'STORE_OWNER' ? 'text-[#1132d4]' : 'text-gray-600'}`}>{t('storeOwner')}</span>
                            </div>

                            <div
                                onClick={() => setValue('role', 'AFFILIATE')}
                                className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center gap-2 transition-all ${selectedRole === 'AFFILIATE' ? 'border-[#1132d4] bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                            >
                                <div className={`p-2 rounded-full ${selectedRole === 'AFFILIATE' ? 'bg-[#1132d4] text-white' : 'bg-gray-100'}`}>
                                    <UserCheck size={20} />
                                </div>
                                <span className={`text-sm font-medium ${selectedRole === 'AFFILIATE' ? 'text-[#1132d4]' : 'text-gray-600'}`}>{t('affiliate')}</span>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('emailLabel')}</label>
                            <Input {...register('email')} placeholder="m@example.com" type="email" />
                            {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('passwordLabel')}</label>
                            <Input {...register('password')} type="password" />
                            {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">{t('confirmPasswordLabel')}</label>
                            <Input {...register('confirmPassword')} type="password" />
                            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? tc('loading') : tc('signup')}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center">
                    <p className="text-sm text-gray-500">
                        {t('alreadyHaveAccount')} <Link href="/login" className="text-[#1132d4] hover:underline">{tc('login')}</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
