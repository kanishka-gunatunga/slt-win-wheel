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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { updateSegment, createSegment, deleteSegment, getWinLogs } from '@/app/admin/actions'
import { Pencil, AlertCircle, Trash2, Plus, Download } from 'lucide-react'

interface AdminViewProps {
    segments: Segment[]
}

export default function AdminView({ segments }: AdminViewProps) {
    const [editingSegment, setEditingSegment] = useState<Segment | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<Segment>>({})
    const [winLogs, setWinLogs] = useState<any[]>([])

    const totalProbability = segments.reduce((acc, seg) => acc + seg.probability, 0)
    const isProbValid = Math.abs(totalProbability - 1.0) < 0.001

    useEffect(() => {
        getWinLogs().then(setWinLogs)
    }, [])

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
            headStyles: { fillColor: [255, 105, 0] }, // Brand Orange
            styles: { fontSize: 10, cellPadding: 3 },
            alternateRowStyles: { fillColor: [255, 247, 237] } // Light orange tint
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

    return (
        <div className="space-y-6">
            <Tabs defaultValue="segments">
                <TabsList>
                    <TabsTrigger value="segments">Segments</TabsTrigger>
                    <TabsTrigger value="history">Win History</TabsTrigger>
                </TabsList>

                <TabsContent value="segments" className="space-y-6">
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Segments</h2>
                                <p className="text-gray-500 text-sm">Manage prizes and probabilities.</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className={`flex items-center gap-2 ${isProbValid ? 'text-green-600' : 'text-red-500'}`}>
                                    {!isProbValid && <AlertCircle className="w-4 h-4" />}
                                    <span className="font-medium">Total: {(totalProbability * 100).toFixed(1)}%</span>
                                </div>
                                <Button onClick={handleCreate}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Prize
                                </Button>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="text-gray-700 font-semibold">Label</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Color</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Stock</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Probability</TableHead>
                                        <TableHead className="text-right text-gray-700 font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {segments.map((seg) => (
                                        <TableRow key={seg.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    {seg.imageUrl && <img src={seg.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover border" />}
                                                    {seg.label}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full border shadow-sm" style={{ backgroundColor: seg.color }} />
                                                    <span className="text-xs text-gray-500 font-mono">{seg.color}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-700">{seg.stock}</TableCell>
                                            <TableCell className="text-gray-700">{(seg.probability * 100).toFixed(2)}%</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(seg)} className="text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(seg.id)} className="text-gray-500 hover:bg-red-50 hover:text-red-600">
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
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <div className="bg-white/95 backdrop-blur-sm p-6 rounded-xl shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Win History</h2>
                                <p className="text-gray-500 text-sm">View and export winner logs.</p>
                            </div>
                            <Button variant="outline" onClick={handleDownloadReport} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                                <Download className="w-4 h-4 mr-2" />
                                Export PDF
                            </Button>
                        </div>

                        <div className="border rounded-lg overflow-hidden max-h-[600px] overflow-y-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-gray-50">
                                    <TableRow>
                                        <TableHead className="text-gray-700 font-semibold">Date</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Prize</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Winner Name</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Phone</TableHead>
                                        <TableHead className="text-gray-700 font-semibold">Address</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {winLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-gray-50">
                                            <TableCell className="text-gray-700">{new Date(log.wonAt).toLocaleString()}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: log.segmentColor }} />
                                                    <span className="font-medium text-gray-900">{log.segmentName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-700">{log.winnerName || <span className="text-gray-400 italic">Unclaimed</span>}</TableCell>
                                            <TableCell className="text-gray-700">{log.winnerPhone || '-'}</TableCell>
                                            <TableCell className="text-gray-700">{log.winnerAddress || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center text-brand-gradient">{isCreating ? 'Add New Prize' : 'Edit Segment'}</DialogTitle>
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
                                className="text-gray-900"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="color" className="text-gray-700 font-semibold">Color (Hex)</Label>
                            <div className="flex gap-2 items-center">
                                <div className="p-1 border rounded-md shadow-sm bg-white">
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
                                    className="text-gray-900 font-mono uppercase"
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
                                    className="text-gray-900"
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
                                    className="text-gray-900"
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
                                className="text-gray-900"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={closeDialog} className="text-gray-700 border-gray-300 hover:bg-gray-50">Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading} className="w-full sm:w-auto">
                            {isLoading ? 'Saving...' : (isCreating ? 'Create Prize' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
