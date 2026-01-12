import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import RealtimeWheel from '@/components/RealtimeWheel'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function WheelPage() {
    const segments = await prisma.segment.findMany({
        orderBy: { probability: 'asc' },
    })

    return (
        <div className="min-h-screen bg-slt-theme flex flex-col items-center py-10">
            <div className="w-full max-w-4xl px-4 flex justify-between items-center mb-10">
                <h1 className="text-4xl font-extrabold text-brand-gradient drop-shadow-sm">Win Wheel</h1>
                {/* <Link href="/admin">
                    <Button variant="outline">Admin Panel</Button>
                </Link> */}
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border">
                <RealtimeWheel initialSegments={segments} />
            </div>

            {/* <div className="mt-12 text-center text-gray-400 max-w-md text-sm">
                <p>Real-time updates powered by Supabase.</p>
                <p>Changes in the admin panel reflect instantly.</p>
            </div> */}
        </div>
    )
}
