'use client'

import { Button } from '@/components/ui/button'
import { RefreshCw, Lock } from 'lucide-react'

export default function WheelClosed() {
    return (
        <div className="min-h-screen bg-[#0F172B] flex flex-col items-center justify-center p-4 text-center">

            <div className="bg-[#1E293B] border border-[#334155] p-8 md:p-12 rounded-3xl shadow-2xl max-w-lg w-full flex flex-col items-center gap-6 animate-in zoom-in duration-500">

                <div className="w-20 h-20 bg-[#334155]/50 rounded-full flex items-center justify-center mb-2">
                    <Lock className="w-10 h-10 text-[#94A3B8]" />
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold text-white">Wheel is Closed</h1>
                    <p className="text-[#94A3B8] text-lg">
                        The Spin Wheel is currently disabled by the administrator. Please check back later for the next event!
                    </p>
                </div>

                <Button
                    onClick={() => window.location.reload()}
                    className="w-full h-12 bg-[#9810FA] hover:bg-[#8000E0] text-white font-bold text-lg rounded-full shadow-lg mt-4 cursor-pointer"
                >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Check Again
                </Button>

            </div>

            {/* <div className="absolute bottom-10 text-[#334155] text-sm">
                Win Wheel System &copy; {new Date().getFullYear()}
            </div> */}
        </div>
    )
}
