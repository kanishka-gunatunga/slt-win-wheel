'use client'

import { useState, useEffect } from 'react'
import { Segment } from '@prisma/client'
import dynamic from 'next/dynamic'
const Wheel = dynamic(() => import('react-custom-roulette').then(mod => mod.Wheel), { ssr: false })
import { socket } from '@/lib/socket'

import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import WinnerModal from './WinnerModal'

// Wheel library styling constants
// Figma Colors: #8B5CF6, #06B5D3, #E94797, #10B77F, #F19C0B, #6A717F, #EF4444, #3B82F6
const backgroundColors = ['#8B5CF6', '#06B5D3', '#E94797', '#10B77F', '#F19C0B', '#6A717F', '#EF4444', '#3B82F6']
const textColors = ['#FFFFFF']
const outerBorderColor = '#FFFFFF'
const outerBorderWidth = 5 // Per Figma "border: 1px solid #FFFFFF" but usually looks better slightly thicker on canvas
const innerBorderColor = '#30261a'
const innerBorderWidth = 0
const innerRadius = 0
const radiusLineColor = '#FFFFFF'
const radiusLineWidth = 3
const fontSize = 15
const textDistance = 60

interface RealtimeWheelProps {
    initialSegments: Segment[]
    wheelSlug: string
}

export default function RealtimeWheel({ initialSegments, wheelSlug }: RealtimeWheelProps) {
    const [segments, setSegments] = useState<Segment[]>(initialSegments)
    const [mustSpin, setMustSpin] = useState(false)
    const [prizeNumber, setPrizeNumber] = useState(0)
    const [isSpinning, setIsSpinning] = useState(false)
    const [spinResult, setSpinResult] = useState<Segment | null>(null)
    const [showWinnerModal, setShowWinnerModal] = useState(false)
    const [currentWinLogId, setCurrentWinLogId] = useState<string | null>(null)

    const activeSegments = segments.filter((s) => s.probability > 0)

    // Socket.io Subscription
    useEffect(() => {
        // Listen for connection
        socket.on('connect', () => {
            console.log('Connected to WebSocket server');
            // Re-join if reconnected
            if (wheelSlug) {
                socket.emit('join_wheel', wheelSlug);
            }
        });

        // Join the room on mount / slug change
        if (wheelSlug) {
            socket.emit('join_wheel', wheelSlug);
        }

        // Listen for segment updates (broadcasting changes)
        socket.on('segment_update', (updatedSegment: Segment) => {
            // ... existing logic ...
        });

        // Listen for spin results
        socket.on('spin_result', (res: any) => {
            setIsSpinning(false);

            if (!res.success || !res.segment) {
                toast.error(res.error || 'Failed to spin');
                return;
            }

            // Find index
            const winningIndex = activeSegments.findIndex((s) => s.id === res.segment.id);

            if (winningIndex === -1) {
                toast.error('Sync error: Winner not visible');
                return;
            }

            setPrizeNumber(winningIndex);
            setMustSpin(true); // START the visual spin
            setSpinResult(res.segment);

            if (res.winLogId) {
                setCurrentWinLogId(res.winLogId);
            }
        });

        return () => {
            socket.off('connect');
            socket.off('segment_update');
            socket.off('spin_result');
        }
    }, [activeSegments, wheelSlug]);

    const wheelData = activeSegments.map((s) => ({
        option: s.stock > 0 ? s.label : `${s.label}`,
        style: { backgroundColor: s.color || '#8B5CF6', textColor: 'white' }, // Fallback color
        image: s.imageUrl ? { uri: s.imageUrl, sizeMultiplier: 0.8, offsetY: 110 } : undefined,
        optionSize: fontSize,
    }))

    const handleSpinClick = () => {
        if (mustSpin || isSpinning) return
        setIsSpinning(true)
        setSpinResult(null)
        setCurrentWinLogId(null)

        // Emit spin request
        socket.emit('spin', { slug: wheelSlug });
    }

    const handleStopSpinning = () => {
        setMustSpin(false)
        setIsSpinning(false)

        if (spinResult) {
            if (!spinResult.label.toLowerCase().includes('try again')) {
                if (currentWinLogId) {
                    setTimeout(() => setShowWinnerModal(true), 1000)
                }
            }
        }
    }

    if (activeSegments.length === 0) {
        return <div className="text-center p-10 text-xl font-bold text-white">No prizes available!</div>
    }

    return (
        <div className="flex flex-col items-center gap-10">
            <div className="relative">
                {/* Outer Glow/Shadow Circle (Ellipse 4 in Figma: 485.77px) 
                    We approximate size or let it sit behind wheel. 
                    Wheel radius is auto-calculated by library usually ~440px by default with outerBorder. 
                    We add a div behind. */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] rounded-full bg-[#1D2838] shadow-[0_0_65px_rgba(0,0,0,0.5)] -z-10"></div>

                {/* Stop Marker (Top Center) */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-20 w-[65px] h-[80px]">
                    <img
                        src="/marker.svg"
                        alt="Pointer"
                        className="w-full h-full object-contain"
                        style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.5))' }}
                    />
                </div>

                {/* Rotate the wheel container -90 degrees so the "Right" (default stop) becomes "Top" 
                    This aligns the logical stop position with our custom top marker. */}
                <div style={{ transform: 'rotate(-47deg)' }}>
                    <Wheel
                        mustStartSpinning={mustSpin}
                        prizeNumber={prizeNumber}
                        data={wheelData}
                        backgroundColors={backgroundColors}
                        textColors={textColors}
                        outerBorderColor={outerBorderColor}
                        outerBorderWidth={outerBorderWidth}
                        innerBorderColor={innerBorderColor}
                        innerBorderWidth={innerBorderWidth}
                        innerRadius={innerRadius}
                        radiusLineColor={radiusLineColor}
                        radiusLineWidth={radiusLineWidth}
                        fontSize={fontSize}
                        textDistance={textDistance}
                        onStopSpinning={handleStopSpinning}
                        pointerProps={{ style: { display: "none" } }} // Hide default pointer
                    />
                </div>

                {/* Center Knob (Ellipse 9 & 10) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
                    {/* Ellipse 9 (Glow/Outer) */}
                    {/* Reducing size slightly for visual balance on this specific wheel library render */}
                    <div className="w-[60px] h-[60px] rounded-full bg-[#F0B100] shadow-[0_0_6px_rgba(0,0,0,0.5)] flex items-center justify-center border-4 border-[#F0B100]">
                        {/* Ellipse 10 (Inner Detail - slightly lighter or just style) */}
                        <div className="w-[20px] h-[20px] rounded-full bg-[#FFD700] opacity-80"></div>
                    </div>
                </div>
            </div>

            {/* Spin Button */}
            <Button
                size="lg"
                onClick={handleSpinClick}
                disabled={isSpinning || mustSpin}
                className="relative bg-[#9711F9] hover:bg-[#8000E0] text-white rounded-[50px] w-[90%] max-w-[296px] h-[78px] text-[20px] sm:text-[25px] font-bold tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                style={{
                    boxShadow: '0px 0px 20px rgba(151, 17, 249, 0.4)'
                }}
            >
                {isSpinning ? (
                    <>
                        <Loader2 className="mr-3 h-8 w-8 animate-spin" />
                        SPINNING...
                    </>
                ) : (
                    'SPIN THE WHEEL'
                )}
            </Button>

            <WinnerModal
                isOpen={showWinnerModal}
                onClose={() => setShowWinnerModal(false)}
                prizeName={spinResult?.label || ''}
                prizeImageUrl={spinResult?.imageUrl || undefined}
                winLogId={currentWinLogId}
            />
        </div>
    )
}
