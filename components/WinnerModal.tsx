'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { claimPrize } from '@/app/actions/winner'
import { toast } from 'sonner'
import { User, Phone, Mail, Check } from 'lucide-react'
import JSConfetti from 'js-confetti'

interface WinnerModalProps {
    isOpen: boolean
    onClose: () => void
    prizeName: string
    prizeImageUrl?: string
    winLogId: string | null
}

type Step = 'CONGRATS' | 'DETAILS' | 'SUCCESS'

export default function WinnerModal({ isOpen, onClose, prizeName, prizeImageUrl, winLogId }: WinnerModalProps) {
    const [step, setStep] = useState<Step>('CONGRATS')
    const [formData, setFormData] = useState({ name: '', phone: '', email: '' })
    const [errors, setErrors] = useState({ name: '', phone: '', email: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reset step when modal opens
    useEffect(() => {
        if (isOpen) {
            setStep('CONGRATS')
            setFormData({ name: '', phone: '', email: '' })
            setErrors({ name: '', phone: '', email: '' })
            // Fire confetti on open
            const jsConfetti = new JSConfetti()
            jsConfetti.addConfetti()
        }
    }, [isOpen])

    const handleNext = () => {
        setStep('DETAILS')
    }

    const validateForm = () => {
        let isValid = true
        const newErrors = { name: '', phone: '', email: '' }

        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required'
            isValid = false
        } else if (formData.name.length < 2) {
            newErrors.name = 'Name must be at least 2 characters'
            isValid = false
        }

        const phoneRegex = /^\d{10}$/
        if (!formData.phone.trim()) {
            newErrors.phone = 'Contact number is required'
            isValid = false
        } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            newErrors.phone = 'Please enter a valid 10-digit number'
            isValid = false
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required'
            isValid = false
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    const handleSubmit = async () => {
        if (!winLogId) return

        if (!validateForm()) {
            return
        }

        setIsSubmitting(true)
        try {
            const res = await claimPrize(winLogId, {
                name: formData.name,
                phone: formData.phone,
                address: formData.email // Using email as address field for compatibility
            })

            if (res.success) {
                setStep('SUCCESS')
            } else {
                toast.error(res.error || 'Something went wrong')
            }
        } catch (error) {
            toast.error('Failed to submit')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleClose = () => {
        onClose()
    }

    if (!isOpen) return null

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            {/* 
                Responsive Dialog Content:
                - Max width constrained
                - Fits within viewport with margins
                - Scrollable if content too tall
            */}
            <DialogContent className="max-w-[512px] w-[90vw] p-0 !rounded-[24px] bg-white shadow-[0px_25px_50px_-12px_rgba(0,0,0,0.25)] border-none [&>button]:hidden overflow-hidden flex flex-col font-[Arial]">
                <DialogTitle className="sr-only">Winner Modal</DialogTitle>
                <DialogDescription className="sr-only">Claim your prize</DialogDescription>

                {/* 
                  ===========================================
                  STEP 1: CONGRATS
                  ===========================================
                */}
                {step === 'CONGRATS' && (
                    <div className="flex flex-col items-center w-full p-6 sm:p-8">
                        {/* Heading */}
                        <h2 className="w-full text-center font-bold text-[24px] sm:text-[30px] leading-tight text-[#1E2939] mb-6">
                            Congratulations! 🎉
                        </h2>

                        {/* Image */}
                        <div className="w-[160px] h-[140px] sm:w-[200px] sm:h-[182px] flex items-center justify-center mb-6">
                            {prizeImageUrl ? (
                                <img src={prizeImageUrl} alt={prizeName} className="max-w-full max-h-full object-contain drop-shadow-lg" />
                            ) : (
                                <div className="text-6xl">🎁</div>
                            )}
                        </div>

                        {/* Prize Info */}
                        <div className="w-full max-w-[328px] bg-[#FEF9C2] rounded-[16px] flex flex-col items-center justify-center py-4 px-4 mb-6">
                            <p className="font-normal text-[14px] text-[#4A5565] mb-1">
                                You won
                            </p>
                            <h3 className="font-bold text-[24px] sm:text-[30px] leading-tight text-[#D08700] text-center w-full truncate">
                                {prizeName}
                            </h3>
                        </div>

                        {/* Instruction Text */}
                        <p className="font-normal text-[14px] sm:text-[16px] text-[#364153] text-center mb-6">
                            Please provide your details to claim your prize
                        </p>

                        {/* Button */}
                        <Button
                            onClick={handleNext}
                            className="w-full max-w-[384px] h-[56px] bg-[#9810FA] hover:bg-[#8000E0] rounded-full shadow-lg text-white font-bold text-[16px] cursor-pointer"
                        >
                            OK
                        </Button>
                    </div>
                )}


                {/* 
                  ===========================================
                  STEP 2: DETAILS
                  ===========================================
                */}
                {step === 'DETAILS' && (
                    <div className="flex flex-col items-center w-full p-6 sm:p-8">
                        {/* Header Section */}
                        <div className="flex flex-col items-center mb-8 w-full">
                            <div className="w-[56px] h-[56px] bg-[#FEF9C2] rounded-full flex items-center justify-center text-[#D08700] mb-4">
                                <Check className="w-8 h-8" strokeWidth={3} />
                            </div>
                            <h2 className="font-bold text-[24px] text-[#1E2939] mb-4">
                                Winner Details
                            </h2>
                            <div className="bg-[#FEF9C2] rounded-[10px] px-4 py-2 flex items-center justify-center gap-2 max-w-full">
                                <span className="font-normal text-[14px] text-[#4A5565] whitespace-nowrap">Prize:</span>
                                <span className="font-bold text-[14px] text-[#D08700] truncate max-w-[150px]">{prizeName}</span>
                            </div>
                        </div>

                        {/* Inputs Section */}
                        <div className="w-full max-w-[384px] flex flex-col gap-4 mb-2">
                            {/* Name */}
                            <div className="flex flex-col gap-2 w-full">
                                <label className="flex items-center gap-2 text-[14px] text-[#364153]">
                                    <User className="w-4 h-4" />
                                    <span>Full Name</span>
                                </label>
                                <input
                                    value={formData.name}
                                    onChange={(e) => {
                                        setFormData({ ...formData, name: e.target.value })
                                        if (errors.name) setErrors({ ...errors, name: '' })
                                    }}
                                    placeholder="Enter your full name"
                                    className={`w-full h-[50px] border rounded-[10px] px-4 outline-none text-[16px] text-[#1E2939] placeholder:text-gray-400 font-normal transition-colors ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-[#D1D5DC] focus:border-[#9810FA]'}`}
                                />
                                {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                            </div>

                            {/* Phone */}
                            <div className="flex flex-col gap-2 w-full">
                                <label className="flex items-center gap-2 text-[14px] text-[#364153]">
                                    <Phone className="w-4 h-4" />
                                    <span>Contact Number</span>
                                </label>
                                <input
                                    value={formData.phone}
                                    onChange={(e) => {
                                        setFormData({ ...formData, phone: e.target.value })
                                        if (errors.phone) setErrors({ ...errors, phone: '' })
                                    }}
                                    placeholder="Enter your contact number"
                                    className={`w-full h-[50px] border rounded-[10px] px-4 outline-none text-[16px] text-[#1E2939] placeholder:text-gray-400 font-normal transition-colors ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-[#D1D5DC] focus:border-[#9810FA]'}`}
                                />
                                {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
                            </div>

                            {/* Email */}
                            <div className="flex flex-col gap-2 w-full">
                                <label className="flex items-center gap-2 text-[14px] text-[#364153]">
                                    <Mail className="w-4 h-4" />
                                    <span>Email Address</span>
                                </label>
                                <input
                                    value={formData.email}
                                    onChange={(e) => {
                                        setFormData({ ...formData, email: e.target.value })
                                        if (errors.email) setErrors({ ...errors, email: '' })
                                    }}
                                    placeholder="Enter your email address"
                                    className={`w-full h-[50px] border rounded-[10px] px-4 outline-none text-[16px] text-[#1E2939] placeholder:text-gray-400 font-normal transition-colors ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-[#D1D5DC] focus:border-[#9810FA]'}`}
                                />
                                {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
                            </div>

                            {/* Button */}
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-[56px] mt-4 bg-[#9810FA] hover:bg-[#8000E0] rounded-full shadow-lg text-white font-bold text-[16px] cursor-pointer"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit Details'}
                            </Button>
                        </div>
                    </div>
                )}


                {/* 
                  ===========================================
                  STEP 3: SUCCESS
                  ===========================================
                */}
                {step === 'SUCCESS' && (
                    <div className="flex flex-col items-center w-full p-6 sm:p-8 min-h-[440px] justify-center">
                        {/* Green Check Icon */}
                        <div className="w-[80px] h-[80px] bg-[#00C950] rounded-full flex items-center justify-center shadow-lg mb-6">
                            <Check className="w-[40px] h-[40px] text-white" strokeWidth={4} />
                        </div>

                        <h2 className="font-bold text-[24px] sm:text-[30px] leading-tight text-[#1E2939] text-center mb-6">
                            Successfully<br />Submitted!
                        </h2>

                        <p className="font-normal text-[16px] text-[#4A5565] text-center mb-6">
                            Your details have been recorded successfully!
                        </p>

                        <div className="w-full max-w-[384px] bg-[#DCFCE7] rounded-[16px] flex flex-col items-center justify-center p-4 mb-6">
                            <span className="font-normal text-[14px] text-[#4A5565] mb-1">
                                Your Prize
                            </span>
                            <span className="font-bold text-[20px] sm:text-[24px] text-[#00A63E] text-center w-full truncate">
                                {prizeName}
                            </span>
                        </div>

                        <p className="font-normal text-[14px] text-[#6A7282] text-center mb-6">
                            We will contact you shortly to arrange the delivery of your prize.
                        </p>

                        <Button
                            onClick={handleClose}
                            className="w-full max-w-[384px] h-[56px] bg-[#00A63E] hover:bg-[#008f35] rounded-full shadow-lg text-white font-bold text-[16px] cursor-pointer"
                        >
                            Close
                        </Button>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    )
}
