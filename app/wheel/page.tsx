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
        <div className="min-h-screen bg-[#0F172B] flex flex-col items-center py-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {/* Optional: Add stars or subtle bg effects if needed, but plain dark is requested */}
            </div>

            <div className="w-full max-w-4xl px-4 flex justify-center items-center mb-10 z-10">
                {/* Title removed or styled differently? User didn't specify title change, but Figma shows just the wheel. 
                    I'll keep the title but make it white/subtle or remove if "WinWheel 1" implies the whole view. 
                    Figma has "WinWheel 1" as frame name. 
                    I will comment out the header to match the clean Figma look if implied, 
                    but safest is to keep it readable. I'll make it White. */}
                {/* <h1 className="text-4xl font-extrabold text-white drop-shadow-sm">Win Wheel</h1> */}
            </div>

            <div className="flex justify-center items-center z-10 scale-90 md:scale-100">
                <RealtimeWheel initialSegments={segments} />
            </div>

            {/* <div className="mt-12 text-center text-gray-400 max-w-md text-sm">
                <p>Real-time updates powered by Supabase.</p>
                <p>Changes in the admin panel reflect instantly.</p>
            </div> */}
        </div>
    )
}
