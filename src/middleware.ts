import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
// import { NextRequest, NextResponse } from 'next/server';

export default createMiddleware(routing);

export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'

};