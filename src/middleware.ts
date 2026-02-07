import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['fr', 'ar'],

    // Used when no locale matches
    defaultLocale: 'fr'
});

export async function middleware(request: NextRequest) {
    // First, update the Supabase session
    const supabaseResponse = await updateSession(request);

    // Then apply i18n middleware
    const intlResponse = intlMiddleware(request);

    // Merge cookies from Supabase session into the i18n response
    if (supabaseResponse.cookies) {
        supabaseResponse.cookies.getAll().forEach(cookie => {
            intlResponse.cookies.set(cookie.name, cookie.value);
        });
    }

    return intlResponse;
}

export const config = {
    // Match only internationalized pathnames, exclude static files and API
    matcher: ['/', '/(fr|ar)/:path*']
};
