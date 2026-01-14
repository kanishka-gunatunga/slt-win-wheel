'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, Settings, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { createWheel, deleteWheel } from '@/app/actions/wheel'
import { toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Wheel {
    id: string
    name: string
    slug: string
    isEnabled: boolean
    _count: { segments: number }
}

interface WheelsPageProps {
    wheels: Wheel[]
}

export default function WheelsPage({ wheels }: WheelsPageProps) {
    const [isCreating, setIsCreating] = useState(false)
    const [newWheelName, setNewWheelName] = useState('')
    const [newWheelSlug, setNewWheelSlug] = useState('')
    const router = useRouter()

    const handleCreate = async () => {
        if (!newWheelName || !newWheelSlug) {
            toast.error('Please fill in all fields')
            return
        }

        const res = await createWheel({ name: newWheelName, slug: newWheelSlug })
        if (res.success) {
            toast.success('Wheel created successfully')
            setIsCreating(false)
            setNewWheelName('')
            setNewWheelSlug('')
            router.refresh()
        } else {
            toast.error(res.error || 'Failed to create wheel')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this wheel? This action cannot be undone.')) return

        const res = await deleteWheel(id)
        if (res.success) {
            toast.success('Wheel deleted')
            router.refresh()
        } else {
            toast.error('Failed to delete wheel')
        }
    }

    return (
        <div className="min-h-screen bg-[#0F172B] p-8 font-[Arial]">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex justify-between items-center border-b border-[#334155] pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-[#FDC700] to-[#FF6900] bg-clip-text text-transparent">
                            Wheels
                        </h1>
                        <p className="text-[#94A3B8] mt-2">Manage your spin wheels and campaigns.</p>
                    </div>
                    <Dialog open={isCreating} onOpenChange={setIsCreating}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#9810FA] hover:bg-[#8000E0] text-white">
                                <Plus className="mr-2 h-4 w-4" /> Create Wheel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white">
                            <DialogHeader>
                                <DialogTitle className="text-[#1E2939]">Create New Wheel</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-gray-700">Wheel Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Summer Promo"
                                        value={newWheelName}
                                        onChange={(e) => {
                                            setNewWheelName(e.target.value)
                                            // Auto-generate slug
                                            if (!newWheelSlug) {
                                                setNewWheelSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))
                                            }
                                        }}
                                        className="text-gray-900 border-gray-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-gray-700">URL Slug</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-500 text-sm">/wheel/</span>
                                        <Input
                                            id="slug"
                                            placeholder="summer-promo"
                                            value={newWheelSlug}
                                            onChange={(e) => setNewWheelSlug(e.target.value)}
                                            className="text-gray-900 border-gray-300"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-500">Unique identifier for the wheel link.</p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCreate} className="bg-[#9810FA] hover:bg-[#8000E0] text-white">Create</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wheels.map((wheel) => (
                        <Card key={wheel.id} className="bg-[#1E293B] border-[#334155] text-white hover:border-[#9810FA]/50 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-xl font-semibold text-white">{wheel.name}</CardTitle>
                                        <CardDescription className="text-[#94A3B8] flex items-center gap-1 mt-1">
                                            <span className={`w-2 h-2 rounded-full ${wheel.isEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            {wheel.isEnabled ? 'Active' : 'Disabled'}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-1">
                                        <Link
                                            href={`/wheel/${wheel.slug}`}
                                            target="_blank"
                                            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "text-[#94A3B8] hover:text-white")}
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        <Button variant="ghost" size="icon" className="text-[#94A3B8] hover:text-red-500" onClick={() => handleDelete(wheel.id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col gap-4">
                                    <div className="flex justify-between text-sm text-[#94A3B8]">
                                        <span>Segments: {wheel._count.segments}</span>
                                        <span>Slug: <code>{wheel.slug}</code></span>
                                    </div>
                                    <Link
                                        href={`/admin/wheels/${wheel.id}`}
                                        className={cn(buttonVariants({ variant: "default" }), "w-full bg-[#334155] hover:bg-[#475569] text-white")}
                                    >
                                        <Settings className="w-4 h-4 mr-2" /> Manage Wheel
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
