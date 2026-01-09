'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function spinWheel() {
    return { success: false, error: 'Deprecation: Use WebSocket "spin" event instead.' }
}

async function attemptSpin() {
    return null; // Deprecated
}
