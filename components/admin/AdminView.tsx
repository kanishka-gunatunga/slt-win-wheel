'use client'

import { useState, useEffect } from 'react'
import { Segment } from '@prisma/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Button, buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { updateSegment, createSegment, deleteSegment, getWinLogs } from '@/app/admin/actions'
import { getWheelStatus, toggleWheelStatus } from '@/app/actions/settings'
import { Pencil, AlertCircle, Trash2, Plus, Download, Lock, Unlock, ExternalLink } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import AdminLayout from './AdminLayout'

interface AdminViewProps {
    segments: Segment[]
    wheelId: string
    initialWheelStatus: boolean
    wheelSlug: string
}

export default function AdminView({ segments, wheelId, initialWheelStatus, wheelSlug }: AdminViewProps) {
    const [currentTab, setCurrentTab] = useState<'segments' | 'history'>('segments')
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Segment>>({})
    const [winLogs, setWinLogs] = useState<any[]>([])
    const [isWheelEnabled, setIsWheelEnabled] = useState(initialWheelStatus)

    const totalProbability = segments.reduce((acc, seg) => acc + seg.probability, 0)
    const isProbValid = Math.abs(totalProbability - 1.0) < 0.001

    useEffect(() => {
        getWinLogs(wheelId).then(setWinLogs)
        // initialWheelStatus is passed as prop, so we rely on that or could refetch
    }, [wheelId])

    const handleEdit = (segment: Segment) => {
        setEditingSegment(segment)
        setFormData({
            label: segment.label,
            color: segment.color,
            stock: segment.stock,
            probability: segment.probability,
            imageUrl: segment.imageUrl,
        })
    }

    const handleCreate = () => {
        setIsCreating(true)
        setFormData({
            label: 'New Prize',
            color: '#000000',
            stock: 10,
            probability: 0.1,
            imageUrl: '',
            wheelId: wheelId,
        })
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this segment?')) return
        setIsLoading(true)
        try {
            const res = await deleteSegment(id)
            if (res.success) {
                toast.success('Segment deleted')
            } else {
                toast.error('Failed to delete')
            }
        } catch (err) {
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        setIsLoading(true)
        try {
            if (isCreating) {
                const res = await createSegment({
                    label: formData.label || 'New Prize',
                    color: formData.color || '#000000',
                    stock: Number(formData.stock) || 0,
                    probability: Number(formData.probability) || 0,
                    imageUrl: formData.imageUrl || undefined,
                    wheelId: wheelId,
                })
                if (res.success) {
                    toast.success('Segment created')
                    setIsCreating(false)
                } else {
                    toast.error('Failed to create')
                }
            } else if (editingSegment) {
                const res = await updateSegment(editingSegment.id, {
                    ...formData,
                    stock: Number(formData.stock),
                    probability: Number(formData.probability),
                })

                if (res.success) {
                    toast.success('Segment updated')
                    setEditingSegment(null)
                } else {
                    toast.error('Failed to update')
                }
            }
        } catch (err) {
            toast.error('An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const handleDownloadReport = async () => {
        if (!winLogs.length) {
            toast.error('No win history available')
            return
        }

        const jsPDF = (await import('jspdf')).default
        const autoTable = (await import('jspdf-autotable')).default

        const doc = new jsPDF()

        // Header
        doc.setFontSize(22)
        doc.setTextColor(40, 40, 40)
        doc.text("Win Wheel Results", 14, 22)

        doc.setFontSize(12)
        doc.setTextColor(80, 80, 80)
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)

        // Table
        const tableBody = winLogs.map((log, index) => [
            `${index + 1}`,
            new Date(log.wonAt).toLocaleString(),
            log.segmentName,
            log.winnerName || '-',
            log.winnerPhone || '-',
            log.winnerAddress || '-'
        ])

        autoTable(doc, {
            head: [['No.', 'Date', 'Prize', 'Winner Name', 'Phone', 'Address']],
            body: tableBody,
            startY: 40,
            theme: 'grid',
            headStyles: { fillColor: [151, 17, 249] }, // Brand Purple
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        })

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages()
        doc.setFontSize(8)
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i)
            doc.text('Confidential Report - Generated by Win Wheel System', 14, doc.internal.pageSize.height - 10)
            doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10)
        }

        doc.save(`Win-Wheel-Report-${new Date().toISOString().split('T')[0]}.pdf`)
    }

    const isOpen = !!editingSegment || isCreating
    const closeDialog = () => {
        setEditingSegment(null)
        setIsCreating(false)
    }

    const handleToggleWheel = async (enabled: boolean) => {
        setIsWheelEnabled(enabled)
        const res = await toggleWheelStatus(wheelId, enabled)
        if (!res.success) {
            setIsWheelEnabled(!enabled)
            toast.error('Failed to update wheel status')
        } else {
            toast.success(enabled ? 'Wheel Enabled' : 'Wheel Disabled')
        }
    }

    return (
        <AdminLayout currentTab={currentTab} onTabChange={setCurrentTab}>
            {/* Global Status Card */}
            <div className="flex items-center justify-between bg-[#1E293B] p-6 rounded-xl border border-[#334155] mb-8 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-300 ${isWheelEnabled ? 'bg-[#00C950]/10 text-[#00C950]' : 'bg-[#EF4444]/10 text-[#EF4444]'}`}>
                        {isWheelEnabled ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-xl">Global Status</h3>
                        <p className="text-[#94A3B8] text-sm mt-1">{isWheelEnabled ? 'The wheel is currently active and playable.' : 'The wheel is closed. Users will see a maintenance screen.'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-[#0F172B]/50 p-2 rounded-lg border border-[#334155]/50 px-4">
                    <span className={`text-sm font-bold uppercase tracking-wider ${isWheelEnabled ? 'text-[#00C950]' : 'text-[#94A3B8]'}`}>{isWheelEnabled ? 'Online' : 'Offline'}</span>
                    <Switch checked={isWheelEnabled} onCheckedChange={handleToggleWheel} />
                </div>
                <Link
                    href={`/wheel/${wheelSlug}`}
                    target="_blank"
                    className={cn(buttonVariants({ variant: "default" }), "bg-[#9810FA] hover:bg-[#8000E0] text-white ml-6")}
                >
                    <ExternalLink className="w-4 h-4 mr-2" /> Launch Wheel
                </Link>
            </div>

            {/* SEGMENTS VIEW */}
            {currentTab === 'segments' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Segments</h2>
                            <p className="text-[#94A3B8] mt-1">Manage prizes, probabilities, and stock.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1E293B] border border-[#334155] ${isProbValid ? 'text-[#00C950]' : 'text-[#EF4444]'}`}>
                                {!isProbValid && <AlertCircle className="w-4 h-4" />}
                                <span className="font-medium">Total Prob: {(totalProbability * 100).toFixed(1)}%</span>
                            </div>
                            <Button
                                onClick={handleCreate}
                                className="bg-[#9810FA] hover:bg-[#8000E0] text-white font-bold"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Prize
                            </Button>
                        </div>
                    </div>

                    <div className="border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B] shadow-2xl max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-[#0F172B] sticky top-0 z-10">
                                <TableRow className="border-[#334155] hover:bg-[#0F172B]">
                                    <TableHead className="text-[#94A3B8] font-semibold">Label</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Color</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Stock</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Probability</TableHead>
                                    <TableHead className="text-right text-[#94A3B8] font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {segments.map((seg) => (
                                    <TableRow key={seg.id} className="border-[#334155] hover:bg-[#334155]/50">
                                        <TableCell className="font-medium text-white">
                                            <div className="flex items-center gap-3">
                                                {seg.imageUrl ? (
                                                    <img src={seg.imageUrl} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/5 border border-[#334155]" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-[#334155] flex items-center justify-center text-xs text-[#94A3B8]">
                                                        Img
                                                    </div>
                                                )}
                                                {seg.label}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full border border-[#334155] shadow-sm" style={{ backgroundColor: seg.color }} />
                                                <span className="text-xs text-[#94A3B8] font-mono">{seg.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white">{seg.stock}</TableCell>
                                        <TableCell className="text-white">{(seg.probability * 100).toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEdit(seg)}
                                                    className="text-[#94A3B8] hover:bg-[#9810FA]/20 hover:text-[#9810FA]"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDelete(seg.id)}
                                                    className="text-[#94A3B8] hover:bg-red-500/20 hover:text-red-500"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* HISTORY VIEW */}
            {currentTab === 'history' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-bold text-white">Win History</h2>
                            <p className="text-[#94A3B8] mt-1">View and export winner logs.</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleDownloadReport}
                            className="border-[#9810FA] text-[#9810FA] hover:bg-[#9810FA] hover:text-white bg-transparent"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </Button>
                    </div>

                    <div className="border border-[#334155] rounded-xl overflow-hidden bg-[#1E293B] shadow-2xl max-h-[calc(100vh-220px)] overflow-y-auto custom-scrollbar">
                        <Table>
                            <TableHeader className="bg-[#0F172B] sticky top-0 z-10">
                                <TableRow className="border-[#334155] hover:bg-[#0F172B]">
                                    <TableHead className="text-[#94A3B8] font-semibold">Date</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Prize</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Winner Name</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Phone</TableHead>
                                    <TableHead className="text-[#94A3B8] font-semibold">Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {winLogs.map((log) => (
                                    <TableRow key={log.id} className="border-[#334155] hover:bg-[#334155]/50">
                                        <TableCell className="text-[#94A3B8]">{new Date(log.wonAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: log.segmentColor }} />
                                                <span className="font-medium text-white">{log.segmentName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-white">{log.winnerName || <span className="text-gray-500 italic">Unclaimed</span>}</TableCell>
                                        <TableCell className="text-white">{log.winnerPhone || '-'}</TableCell>
                                        <TableCell className="text-white">{log.winnerAddress || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* EDIT/CREATE DIALOG */}
            <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent className="bg-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-[#1E2939]">{isCreating ? 'Add New Prize' : 'Edit Segment'}</DialogTitle>
                        <p className="text-center text-sm text-gray-500">
                            {isCreating ? 'Configure the new prize details below.' : 'Update the prize details below.'}
                        </p>
                    </DialogHeader>
                    <div className="grid gap-5 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="label" className="text-gray-700 font-semibold">Label</Label>
                            <Input
                                id="label"
                                value={formData.label || ''}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                placeholder="Enter prize name"
                                className="text-gray-900 border-gray-300"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="color" className="text-gray-700 font-semibold">Color (Hex)</Label>
                            <div className="flex gap-2 items-center">
                                <div className="p-1 border border-gray-300 rounded-md shadow-sm bg-white">
                                    <Input
                                        id="color"
                                        type="color"
                                        className="w-12 h-8 p-0 border-0 cursor-pointer"
                                        value={formData.color || '#000000'}
                                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    />
                                </div>
                                <Input
                                    value={formData.color || ''}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    placeholder="#000000"
                                    className="text-gray-900 font-mono uppercase border-gray-300"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="stock" className="text-gray-700 font-semibold">Stock</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    value={formData.stock !== undefined ? formData.stock : ''}
                                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                    className="text-gray-900 border-gray-300"
                                    min="0"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="probability" className="text-gray-700 font-semibold">Probability (0-1)</Label>
                                <Input
                                    id="probability"
                                    type="number"
                                    step="0.01"
                                    max="1"
                                    min="0"
                                    value={formData.probability !== undefined ? formData.probability : ''}
                                    onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) || 0 })}
                                    className="text-gray-900 border-gray-300"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl" className="text-gray-700 font-semibold">Image URL <span className="text-gray-400 font-normal">(Optional)</span></Label>
                            <Input
                                id="imageUrl"
                                placeholder="https://example.com/image.png"
                                value={formData.imageUrl || ''}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                className="text-gray-900 border-gray-300"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={closeDialog} className="text-gray-700 border-gray-300 hover:bg-gray-50">Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto bg-[#9810FA] hover:bg-[#8000E0] text-white">
                            {isLoading ? 'Saving...' : (isCreating ? 'Create Prize' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    )
}
