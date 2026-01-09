'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { encrypt } from '@/lib/auth'

const ONE_DAY = 24 * 60 * 60 * 1000

export async function login(prevState: any, formData: FormData) {
    const username = formData.get('username') as string
    const password = formData.get('password') as string

    if (!username || !password) {
        return { success: false, error: 'Username and password are required' }
    }

    try {
        const admin = await prisma.admin.findUnique({
            where: { username }
        })

        if (!admin) {
            return { success: false, error: 'Invalid credentials' }
        }

        const passwordsMatch = await compare(password, admin.password)

        if (!passwordsMatch) {
            return { success: false, error: 'Invalid credentials' }
        }

        // Create session
        const expires = new Date(Date.now() + ONE_DAY)
        const session = await encrypt({ user: { id: admin.id, username: admin.username }, expires })

        const cookieStore = await cookies()
        cookieStore.set('session', session, { expires, httpOnly: true, sameSite: 'lax', path: '/' })
    } catch (error) {
        console.error('Login error:', error)
        return { success: false, error: 'Something went wrong' }
    }

    redirect('/admin')
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('session')
    redirect('/admin/login')
}
