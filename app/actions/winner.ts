
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function claimPrize(winLogId: string, details: { name: string; phone: string; address: string }) {
    if (!winLogId) {
        return { success: false, error: 'Invalid win log ID' }
    }

    try {
        await prisma.winLog.update({
            where: { id: winLogId },
            data: {
                winnerName: details.name,
                winnerPhone: details.phone,
                winnerAddress: details.address,
            }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (error) {
        console.error('Error claiming prize:', error)
        return { success: false, error: 'Failed to claim prize' }
    }
}
