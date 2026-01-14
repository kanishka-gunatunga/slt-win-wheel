import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import RealtimeWheel from '@/components/RealtimeWheel'
import { getWheelStatus } from '@/app/actions/settings'
import WheelClosed from '@/components/WheelClosed'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

interface Props {
    params: Promise<{ slug: string }>
}

export default async function WheelPage({ params }: Props) {
    const { slug } = await params

    // Fetch specific wheel
    const wheel = await prisma.wheel.findUnique({
        where: { slug }
    })

    if (!wheel) return notFound()

    const isEnabled = await getWheelStatus(wheel.id)

    if (!isEnabled) {
        return <WheelClosed />
    }

    const segments = await prisma.segment.findMany({
        where: { wheelId: wheel.id },
        orderBy: { probability: 'asc' },
    })

    return (
        <div className="min-h-screen bg-[#0F172B] flex flex-col items-center py-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            </div>

            <div className="w-full max-w-4xl px-4 flex justify-center items-center mb-10 z-10">
                {/* Title optionally */}
            </div>

            <div className="flex justify-center items-center z-10 scale-[0.55] sm:scale-75 md:scale-100 transition-transform duration-300">
                <RealtimeWheel initialSegments={segments} wheelSlug={wheel.slug} />
            </div>
        </div>
    )
}
