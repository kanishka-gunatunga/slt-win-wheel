
'use client'

import { useState } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { claimPrize } from '@/app/actions/winner'
import { toast } from 'sonner'

interface WinnerModalProps {
    isOpen: boolean
    onClose: () => void
    prizeName: string
    winLogId: string | null
}

export default function WinnerModal({ isOpen, onClose, prizeName, winLogId }: WinnerModalProps) {
    const [formData, setFormData] = useState({ name: '', phone: '', address: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!winLogId) return
        if (!formData.name || !formData.phone || !formData.address) {
            toast.error('Please fill in all fields')
            return
        }

        setIsSubmitting(true)
        try {
            const res = await claimPrize(winLogId, formData)
            if (res.success) {
                toast.success('Prize claimed successfully!')
                const JSConfetti = (await import('js-confetti')).default
                const jsConfetti = new JSConfetti()
                jsConfetti.addConfetti()
                onClose()
            } else {
                toast.error(res.error || 'Something went wrong')
            }
        } catch (error) {
            toast.error('Failed to submit')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-3xl text-center font-extrabold text-brand-gradient">🎉 Congratulations! 🎉</DialogTitle>
                    <DialogDescription className="text-center text-lg mt-2 font-medium">
                        You won: <span className="font-bold text-orange-600">{prizeName}</span>
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-gray-500 text-center">Please enter your details to claim your prize.</p>
                    <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234 567 890"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Address</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="123 Winning St, Jackpot City"
                        />
                    </div>
                </div>
                <DialogFooter className="sm:justify-center">
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
                        {isSubmitting ? 'Submitting...' : 'Claim Prize'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
