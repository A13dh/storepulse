"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
    id: string;
    email: string;
    role: 'STORE_OWNER' | 'AFFILIATE' | 'CUSTOMER' | 'ADMIN';
    language: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    session: Session | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<{ error?: string }>;
    signup: (email: string, password: string, role?: string) => Promise<{ error?: string }>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = getSupabaseClient();

    useEffect(() => {
        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setSupabaseUser(session?.user ?? null);

            if (session?.user) {
                // Fetch additional user data from our database
                await fetchUserProfile(session.user.id);
            }
            setLoading(false);
        };

        getInitialSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                setSession(session);
                setSupabaseUser(session?.user ?? null);

                if (session?.user) {
                    await fetchUserProfile(session.user.id);
                } else {
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const fetchUserProfile = async (supabaseUserId: string) => {
        try {
            const response = await fetch('/api/auth/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ supabaseUserId }),
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData.user);
            }
        } catch (error) {
            console.error('Error fetching user profile:', error);
        }
    };

    const login = async (email: string, password: string): Promise<{ error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                return { error: error.message };
            }

            if (data.user) {
                await fetchUserProfile(data.user.id);
            }

            return {};
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    const signup = async (email: string, password: string, role: string = 'STORE_OWNER'): Promise<{ error?: string }> => {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        role: role,
                    },
                },
            });

            if (error) {
                return { error: error.message };
            }

            // Create user in our database via API
            if (data.user) {
                const response = await fetch('/api/auth/create-profile', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        supabaseUserId: data.user.id,
                        email: data.user.email,
                        role: role,
                    }),
                });

                if (!response.ok) {
                    const result = await response.json();
                    return { error: result.error || 'Failed to create user profile' };
                }

                await fetchUserProfile(data.user.id);
            }

            return {};
        } catch (error) {
            return { error: 'An unexpected error occurred' };
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSupabaseUser(null);
        setSession(null);
        const locale = pathname?.split('/')[1] || 'fr';
        router.push(`/${locale}/login`);
    };

    return (
        <AuthContext.Provider value={{
            user,
            supabaseUser,
            session,
            loading,
            login,
            signup,
            logout,
            isAuthenticated: !!session
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
