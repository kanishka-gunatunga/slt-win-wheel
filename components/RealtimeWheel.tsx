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
const backgroundColors = ['#ff8f43', '#70bbe0', '#0b3351', '#f9dd50']
const textColors = ['#0b3351']
const outerBorderColor = '#eeeeee'
const outerBorderWidth = 10
const innerBorderColor = '#30261a'
const innerBorderWidth = 0
const innerRadius = 0
const radiusLineColor = '#eeeeee'
const radiusLineWidth = 1
const fontSize = 17
const textDistance = 60

interface RealtimeWheelProps {
    initialSegments: Segment[]
}

export default function RealtimeWheel({ initialSegments }: RealtimeWheelProps) {
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
        });

        // Listen for segment updates (broadcasting changes)
        socket.on('segment_update', (updatedSegment: Segment) => {
            console.log('Realtime update:', updatedSegment);
            setSegments((current) =>
                current.map((seg) =>
                    seg.id === updatedSegment.id ? { ...seg, ...updatedSegment } : seg
                )
            );
        });

        // Listen for spin results (private to this client usually, or we can listen to general winner if we want)
        // In our server.ts, we emit 'spin_result' to the caller.
        socket.on('spin_result', (res: any) => {
            setIsSpinning(false); // Stop "Preparing..." or network wait state effectively
            // IMPORTANT: The wheel library needs to spin to a RESULT. 
            // Logic:
            // 1. We request spin.
            // 2. Server sends back result immediately.
            // 3. We set `prizeNumber` and `mustSpin` to true.
            // 4. Wheel spins visually.
            // 5. onStopSpinning handles the "You won!" toast.

            if (!res.success || !res.segment) {
                toast.error(res.error || 'Failed to spin');
                return;
            }

            // Find index
            const winningIndex = activeSegments.findIndex((s) => s.id === res.segment.id);

            if (winningIndex === -1) {
                // If the winner is not in our local list (e.g., hidden due to stock 0 but server picked it?), error.
                toast.error('Sync error: Winner not visible');
                return;
            }

            setPrizeNumber(winningIndex);
            setMustSpin(true); // START the visual spin
            setSpinResult(res.segment);

            console.log('Spin Result Response:', res);
            if (res.winLogId) {
                console.log('Setting WinLogID:', res.winLogId);
                setCurrentWinLogId(res.winLogId);
            } else {
                console.error('WinLogID missing in response!');
            }
        });

        return () => {
            socket.off('connect');
            socket.off('segment_update');
            socket.off('spin_result');
        }
    }, [activeSegments]); // Re-bind if activeSegments changes? careful with infinite loops if we depend on it. 
    // actually `activeSegments` is derived from `segments`. `segments` changes on update.
    // If we re-bind, we might lose the 'spin_result' listener if it fires during re-render?
    // Better to use a ref for segments inside the listener or just depend on `segments` state updater correctly used.
    // socket.on listeners are stable if we don't depend on stale closures.
    // In `setSegments`, we use callback `current => ...` so it's fine.
    // For `activeSegments` inside `spin_result`: we need the LATEST `activeSegments` to find the index.
    // This is tricky with useEffect closures.
    // Either use a Ref for activeSegments, or accept that we might need to re-bind.
    // Re-binding is fine as long as we clean up.

    // Filter segments with stock > 0 for display? 
    // Requirement: "Fetch only segments with stock > 0" for logic.
    // For visual, we might want to show all but disable them? 
    // Or just show available ones. If we hide them, the wheel changes size/layout.
    // Best to keep layout constant but mark out of stock?
    // `react-custom-roulette` draws standard slices.
    // If we remove slices, the wheel redraws. Realtime removing slices might be jarring.
    // Strategy: Show all, but if stock is 0, maybe change color or label?
    // The user requirement says: "Verify stock becomes 0 in Admin."
    // It doesn't explicitly say "Hide from Wheel".
    // However, `spinWheel` only picks from stock > 0.
    // If the wheel shows "Grand Prize" (stock 0), and user spins, they can't win it.
    // If the server picks a winner, it returns an index. That index MUST match the CLIENTS wheel segments.
    // CRITICAL: The data passed to `Wheel` must match the server logic's eligible list OR mapping is needed.
    // Problem: `spinWheel` logic: "Fetch only segments with stock > 0".
    // If client shows ALL, but server only considers stock > 0, the indices WON'T MATCH.
    // Solution: Filter segments on client to only show stock > 0?
    // If stock drops to 0 mid-spin or realtime, the wheel slice disappears? That's weird.
    // Better: Server should select from ALL segments but with probability 0 for OOS?
    // Current `spinWheel` implementation: `where: { stock: { gt: 0 } }`.
    // So server logic uses a subset.
    // Client MUST use the same subset to ensure index alignment.
    // If `segments` updates via Pusher/Supabase, and an item goes to 0 stock, it is removed from the visible wheel.
    // This is acceptable for this demo.


    // Need valid data for Wheel
    const wheelData = activeSegments.map((s) => ({
        option: s.stock > 0 ? s.label : `${s.label} (Sold Out)`, // Actually we filtered out stock <= 0
        style: { backgroundColor: s.color, textColor: 'white' },
        image: s.imageUrl ? { uri: s.imageUrl, sizeMultiplier: 0.5, offsetY: 200 } : undefined,
        optionSize: fontSize, // Using custom option prop if library supports, or just mapping
    }))

    // NOTE: If activeSegments is empty, wheel crashes?
    // We should handle empty state.

    const handleSpinClick = () => {
        if (mustSpin || isSpinning) return
        setIsSpinning(true)
        setSpinResult(null)
        setCurrentWinLogId(null)

        // Emit spin request
        socket.emit('spin');
        // We wait for 'spin_result' event.
    }

    const handleStopSpinning = () => {
        setMustSpin(false)
        setIsSpinning(false)
        console.log('Spin stopped. Result:', spinResult);
        console.log('Current WinLogID:', currentWinLogId);

        if (spinResult) {
            toast.success(`You won: ${spinResult.label}!`)
            // Logic to check "Try Again" - assuming label contains "Try Again"
            if (!spinResult.label.toLowerCase().includes('try again')) {
                // If it's a real prize, show modal
                if (currentWinLogId) {
                    console.log('Opening modal...');
                    setTimeout(() => setShowWinnerModal(true), 1000)
                } else {
                    console.error('No win log ID found!');
                }
            } else {
                console.log('is try again segment');
            }
        }
    }

    if (activeSegments.length === 0) {
        return <div className="text-center p-10 text-xl font-bold">No prizes available!</div>
    }

    return (
        <div className="flex flex-col items-center gap-8">
            <div className="relative">
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
                />
            </div>

            <Button
                size="lg"
                onClick={handleSpinClick}
                disabled={isSpinning || mustSpin}
                className="w-48 text-lg h-14"
            >
                {isSpinning && !mustSpin ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Preparing...
                    </>
                ) : (
                    'SPIN NOW'
                )}
            </Button>

            <div className="text-sm text-gray-500">
                Prizes Available: {activeSegments.filter(s => s.stock > 0).reduce((acc, s) => acc + s.stock, 0)}
            </div>

            <WinnerModal
                isOpen={showWinnerModal}
                onClose={() => setShowWinnerModal(false)}
                prizeName={spinResult?.label || ''}
                winLogId={currentWinLogId}
            />
        </div>
    )
}
