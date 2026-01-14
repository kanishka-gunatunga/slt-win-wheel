'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getWheelStatus(wheelIdOrSlug?: string) {
    try {
        if (!wheelIdOrSlug) {
            // Fallback for transition or global setting if we still use it
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'wheel_enabled' }
            })
            return setting ? setting.value === 'true' : true
        }

        const wheel = await prisma.wheel.findFirst({
            where: {
                OR: [
                    { id: wheelIdOrSlug },
                    { slug: wheelIdOrSlug }
                ]
            },
            select: { isEnabled: true }
        })

        return wheel?.isEnabled ?? false // Default to closed if not found? Or open? Safe is closed.
    } catch (error) {
        console.error('Failed to fetch wheel status:', error)
        return true
    }
}

export async function toggleWheelStatus(wheelId: string, enabled: boolean) {
    try {
        // We now update the specific wheel
        await prisma.wheel.update({
            where: { id: wheelId },
            data: { isEnabled: enabled }
        })

        revalidatePath('/wheel') // Global revalidate might be too broad but okay
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Failed to toggle wheel status:', error)
        return { success: false, error: 'Failed to update status' }
    }
}
