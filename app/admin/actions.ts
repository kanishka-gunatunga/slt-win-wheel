'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getSegments() {
    return await prisma.segment.findMany({
        orderBy: { probability: 'asc' }, // Order by probability or label
    })
}

export type UpdateSegmentData = {
    label?: string
    color?: string
    stock?: number
    probability?: number
    imageUrl?: string | null
}

export type CreateSegmentData = {
    label: string
    color: string
    stock: number
    probability: number
    imageUrl?: string
}

export async function updateSegment(id: string, data: UpdateSegmentData) {
    try {
        const updated = await prisma.segment.update({
            where: { id },
            data,
        })

        // Revalidate paths to update server-rendered views
        revalidatePath('/admin')
        revalidatePath('/wheel') // In case we use ISR or server fetch there

        return { success: true, data: updated }
    } catch (error) {
        console.error('Failed to update segment:', error)
        return { success: false, error: 'Failed to update segment' }
    }
}

export async function createSegment(data: CreateSegmentData) {
    try {
        const newSegment = await prisma.segment.create({
            data,
        })
        revalidatePath('/admin')
        revalidatePath('/wheel')
        return { success: true, data: newSegment }
    } catch (error) {
        console.error('Failed to create segment:', error)
        return { success: false, error: 'Failed to create segment' }
    }
}

export async function deleteSegment(id: string) {
    try {
        await prisma.segment.delete({
            where: { id },
        })
        revalidatePath('/admin')
        revalidatePath('/wheel')
        return { success: true }
    } catch (error) {
        console.error('Failed to delete segment:', error)
        return { success: false, error: 'Failed to delete segment' }
    }
}

export async function getWinLogs() {
    try {
        const logs = await prisma.winLog.findMany({
            orderBy: { wonAt: 'desc' },
        })

        const segments = await prisma.segment.findMany();
        const segmentMap = new Map(segments.map(s => [s.id, s]));

        return logs.map(log => ({
            ...log,
            segmentName: segmentMap.get(log.segmentId)?.label || 'Unknown',
            segmentColor: segmentMap.get(log.segmentId)?.color || '#000000'
        }))

    } catch (error) {
        console.error('Error fetching win logs:', error)
        return []
    }
}
