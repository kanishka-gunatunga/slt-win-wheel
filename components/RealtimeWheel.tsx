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

const STOP_MARKER_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAARAAAAENCAMAAADwnMpiAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAACZUExURUdwTP+OROJKK+JKK/6PReJKK/+QQ+JKK+JKK+JKK+JKK/2MQ/+LRv2LQeNLK+JKK/BrNuRNLPyJQeNLK/d+PfFvN/iFQONLK/BtOPV3OvmCPfFxOPR4PeNMLO5oNexiNPmBPudVL+hXL+pcMepfMuZSLvV7PORPLPFyPedULuhYMOpfM+5nNetdMfupXexhM+2dRuNOLeJKK+Smm3cAAAAydFJOUwAY9Okb+hT+8f3uIRYm5fdz1yvdQWQx4mtRNV1L0HqNOsOwo5W6RcRWz6qGgLYFnA6eKwdCNwAACLhJREFUGBntwNeSg8C1BdANdHMaGLJyzprRaNL+/4+7df1iV7lsgyI0Wnh5eXl5eXl5eXl5+S/8t3jQG/ez5W779bX+f1+b7fI8ms4mseOjS5yo937erk0aCP+FCP9BJHU/NstpL3JgPSeeZafc1SIkhf+FiDYf29EheoOlfLXq/+RGC4WVSertF+PoDbZRg9HP0ATC+kRc7zQaOLCGH83OH6EWXk50eDxPFCzgR++7oRHh1XS4ziYO2k31PksjwpsQSb1NP/bRVm9FtjaaNyWmXPYU2kj1dqUrvLkg8DbjCG0TvW88zTsJzHoU+2gPP+qvTcA7CkyeFW9oibg/94R3JibPCh8tEE2PYcAHkDDvx2g6NduHAR8kMMd3hSZ7m2wTzQcKvFPPQWPFWenywdLhcuCjkdRsbQI+nsn7EZrHL5aJ5lME4WbloGHUbG74LJKWWYxGic9JyicKwn3PQWP4q00ofK60zGI0hHrPXT5dEG5WPpogWgw1m8DNpwrPV+y8gM2gk2WMJ/NXeyNsCgk3Ex/P5PTmLpvEzHsOnkeNS5fN4uZjhWdR0zJl06TlVOE51Gio2Tx62Fd4BtUfajaRTrIIj6f6Q81mCpJFhEdT/aFmU4n3GeGx1LTUbDBvGeGRnHGp2Wjep8Lj+L08ZcMlmcLDTOYumy4YTh08SLE3bD5dHnw8RLQzbAN3PsEjqMwTtoK7KXB//ngYsCXMMsLdTfKUbSHeSOHO4o3L9gjKg4+7UouQbZLOB7gnf5YIW8VsI9xRMU/ZMuHIwd2onWHbBGUPdzNL2D7pusCdxEfNFjKfCnfxlhm2kSRjH/ewKgO2UjovcAdqm7KlzFLh9sYeWyuZ4ebivWZr6WOMG/Onhi1msjfcVpEHbLGgXOGmnEXIVku3CrdUlMJWE+8dN+QsDFtOH2PcTlEK2870fdyKnxm2XpAXuJU4F7afOTu4kZGhBaQc4DaitdAG7qeDmxgbWkHKCW5BbQLaIf10cAM9j5aQcoDrvS01beEufFytKGkNyWNcLXNpDzPCtaK90B6yV7jSwdAm4QHXedtp2kTv3nCVoqRdyhhXGbm0izvCNdReaBfZO7hCL6Rtwgku539q2kYvcLkop32OChd7N7RPuMKlnJ3QPnqBS8WJ0D6ydnChvksbhQNcxtkKbaT7uEzh0Uqy9XGRUUo7JREu4ZyEdjIHXKLwaCkZ4RKjlJaSrY/6nI3QVomD+gqP1jIT1DdKaa1gjNqcjdBackZthUeLbVDbKKXFyjfU5JyEFnMVaio82kyvUFM/pc1khnqcrdBmkqGeOKHdlqhn6tJuX6jF3wnt9oFa1FBot9BHHTNDu4l+Qx1noeWCCDWoD6HlpEANg5C2kwFqGGlab4LqnJPQej1UF3m0Xw/Vvbu0Xw/VLYX266EylbMDeqhsYtgBPVSWBeyAHqpyNsIOWKGqyGMHyABVjV12gMSo6izsAB2hIvUh7IDUR0VFyC5IfFTU1+wA+UBF/k7YBV+oSCXshCUq6oXshAwVjYRdELyjGuck7IJghWpUwk4wMao5uOwEz0E1mbATvnxU4myEXSBLVBN57ASZopqDy05IV6gmE3ZCGKES5yTshPUbKlEeO0F2qKbnshOCKaoZCTshnKASfyvshKFCJSphJ8jORyUTw07QfVQzDdgJ4QDV/Ai7QD4UKnE+2AlyRjWxYSeYGaqZaXaBDCNUsxB2gfz4qMT/Yie4U1SjPHaBJDGq6bnsgmDroJqpsAvMFBX9CDtAhjGqcT7YBbJzUE1k2AXhOyqaaXaA5BEqyoQdkC58VOOf2AXJBBWphB2gtw4qGhh2gBmjqnFA+8kxQlVnof1Mhqr8De0neYyqHI/2c88+qhoYWk/KASo7BLReunRQWSa0nQwnqG5J67mfDqpb03ZSDlBDQtuZs4MaUlouyAvUoWm5cOqjhkhot3QfoY53Wi45oJY97WaWCrXMaTWdF6gnpdW8dx+1/GrazGwj1HOgzXQ+QE2ftJgkYx81zWkxc1aoq6S93H2Mur41rZXmK9RWBLRVMBz7qG1EW4mXKdS3p63CXYQL5LSUOcW4REo7ufsBLvEd0ErufIWLDGglNz/4uMiINkrLmYPL7GmhtJwpXCinfdxyrHChX5fWcfOZwqViTdu4856Di02FlnH3Kx+X29Ey4WmAa+S0SuAtY1zFo03SYRbhKr+aFnHzscJ1YqE1JNysfFzpndZIk3OMqy1pCzMfK1xvTjtob1f4uIGENpAwH0e4hW9NC6TDz8LHTTgBWy/wTisHN7Ji2wXm+K5wMyO2m5i8H+OGNmwzcctF4eOWSraXmPJcOLgtw7aSMM8KBzf2G7CddLjvRz5uLhK2kKTJz0HhHsZsHRGTLwYO7uOTLSNpeJpGPu5lzjYRMfl5pXBHQ7aHpN52Gvm4p++UbaHNcTFwcGd+wFYQU+4OEe5vIGw+Sb3tNPbxCFM2nehwPyocPMiOzabDdTZx8DhzNpgOj4uJwkN5bCodrhcrhQf71mwi0eE6myg83m/AxpHU22QDB09RsFlETLLtFw6eZcwGEW3yz3H0hidasinE9TbZROHJjmwC0ebjcxw5eD6PzyZikl1/oNAMLp9JxPW+sp7y0RTfwmcRSb39YhY5aJJf4TOIuN5XNoscNE3Mh5PAJKfsEDlooh4fSrT5+OmvlI+mGvFRRFzvazGOHTTajg8gos3HbrpSPhrvg/clos3Hz+gQOWgHw7sR0ebjp9+LHLQI70IkNeuffi9y0Da8MQnScL1dzCaOj1ZKeSuivfnfzEHLubye6GT+965ghSOvITqZ/72rb9jjFPASIql3/JspWGcasibRZr7pT3zYKTpqVhXoZL6bxr+w2mci/F9Eu+UxO6hvdED0Z4T/kWgv/5sOftEhh7+Q/050Wh4XM/WL7ln9DTX/SXSYn/oT/xud9dv/y8MgkCAdzj/H0S9evtVk1hv433h5eXl5ebna/wE/LWKN4f9AUgAAAABJRU5ErkJggg==";

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
    }, [activeSegments]);

    const wheelData = activeSegments.map((s) => ({
        option: s.stock > 0 ? s.label : `${s.label} (Empty)`,
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
        socket.emit('spin');
    }

    const handleStopSpinning = () => {
        setMustSpin(false)
        setIsSpinning(false)

        if (spinResult) {
            toast.success(`You won: ${spinResult.label}!`)
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
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#1D2838] shadow-[0_0_65px_rgba(0,0,0,0.5)] -z-10"></div>

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
                <div style={{ transform: 'rotate(-60deg)' }}>
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
                className="relative bg-[#9711F9] hover:bg-[#8000E0] text-white rounded-[50px] w-[296px] h-[78px] text-[25px] font-bold tracking-wider shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
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
                winLogId={currentWinLogId}
            />
        </div>
    )
}
