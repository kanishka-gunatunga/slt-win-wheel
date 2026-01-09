import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from './lib/auth'

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Protect all /admin routes except /admin/login
    if (path.startsWith('/admin') && path !== '/admin/login') {
        const cookie = request.cookies.get('session')?.value
        const session = await decrypt(cookie || '')

        if (!session) {
            return NextResponse.redirect(new URL('/admin/login', request.nextUrl))
        }
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/admin/:path*'],
}
