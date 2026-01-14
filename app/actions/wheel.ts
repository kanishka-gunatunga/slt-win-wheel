'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWheels() {
    try {
        const wheels = await prisma.wheel.findMany({
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { segments: true } } }
        })
        return wheels
    } catch (error) {
        console.error('Failed to fetch wheels:', error)
        return []
    }
}

export async function getWheelBySlug(slug: string) {
    try {
        const wheel = await prisma.wheel.findUnique({
            where: { slug },
            include: { segments: { orderBy: { probability: 'asc' } } }
        })
        return wheel
    } catch (error) {
        console.error('Failed to fetch wheel by slug:', error)
        return null
    }
}

export async function createWheel(data: { name: string; slug: string }) {
    try {
        const wheel = await prisma.wheel.create({
            data: {
                name: data.name,
                slug: data.slug,
                isEnabled: true
            }
        })
        revalidatePath('/admin/wheels')
        return { success: true, wheel }
    } catch (error) {
        console.error('Failed to create wheel:', error)
        return { success: false, error: 'Failed to create wheel' }
    }
}

export async function updateWheel(id: string, data: { name?: string; slug?: string; isEnabled?: boolean }) {
    try {
        const wheel = await prisma.wheel.update({
            where: { id },
            data
        })
        revalidatePath('/admin/wheels')
        revalidatePath(`/wheel/${wheel.slug}`)
        return { success: true, wheel }
    } catch (error) {
        console.error('Failed to update wheel:', error)
        return { success: false, error: 'Failed to update wheel' }
    }
}

export async function deleteWheel(id: string) {
    try {
        await prisma.wheel.delete({
            where: { id }
        })
        revalidatePath('/admin/wheels')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete wheel:', error)
        return { success: false, error: 'Failed to delete wheel' }
    }
}
