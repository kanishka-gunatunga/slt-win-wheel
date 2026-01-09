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

    const handleDownloadCSV = () => {
        const headers = ['Date', 'Prize', 'Winner Name', 'Phone', 'Address']
        const rows = winLogs.map(log => [
            new Date(log.wonAt).toLocaleString(),
            log.segmentName,
            log.winnerName || '-',
            log.winnerPhone || '-',
            log.winnerAddress || '-'
        ])

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `winners-${new Date().toISOString().split('T')[0]}.csv`
        a.click()
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
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Segments</h2>
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

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Color</TableHead>
                                    <TableHead>Stock</TableHead>
                                    <TableHead>Probability</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {segments.map((seg) => (
                                    <TableRow key={seg.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {seg.imageUrl && <img src={seg.imageUrl} alt="" className="w-6 h-6 rounded object-cover" />}
                                                {seg.label}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full border" style={{ backgroundColor: seg.color }} />
                                                <span className="text-xs text-gray-500">{seg.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{seg.stock}</TableCell>
                                        <TableCell>{(seg.probability * 100).toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(seg)}>
                                                    <Pencil className="w-4 h-4 text-gray-500" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(seg.id)}>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold">Win History</h2>
                            <p className="text-gray-500 text-sm">View and export winner logs.</p>
                        </div>
                        <Button variant="outline" onClick={handleDownloadCSV}>
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                        </Button>
                    </div>

                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Prize</TableHead>
                                    <TableHead>Winner Name</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {winLogs.map((log) => (
                                    <TableRow key={log.id}>
                                        <TableCell>{new Date(log.wonAt).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: log.segmentColor }} />
                                                {log.segmentName}
                                            </div>
                                        </TableCell>
                                        <TableCell>{log.winnerName || <span className="text-gray-400 italic">Unclaimed</span>}</TableCell>
                                        <TableCell>{log.winnerPhone || '-'}</TableCell>
                                        <TableCell>{log.winnerAddress || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </TabsContent>
            </Tabs>

            <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isCreating ? 'Add New Prize' : 'Edit Segment'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="label">Label</Label>
                            <Input
                                id="label"
                                value={formData.label || ''}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="color">Color (Hex)</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="color"
                                    type="color"
                                    className="w-12 p-1 h-10"
                                    value={formData.color || '#000000'}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                                <Input
                                    value={formData.color || ''}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="stock">Stock</Label>
                            <Input
                                id="stock"
                                type="number"
                                value={formData.stock !== undefined ? formData.stock : ''}
                                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="probability">Probability (0.0 - 1.0)</Label>
                            <Input
                                id="probability"
                                type="number"
                                step="0.01"
                                value={formData.probability !== undefined ? formData.probability : ''}
                                onChange={(e) => setFormData({ ...formData, probability: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                            <Input
                                id="imageUrl"
                                placeholder="https://example.com/image.png"
                                value={formData.imageUrl || ''}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? 'Saving...' : (isCreating ? 'Create Prize' : 'Save Changes')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
