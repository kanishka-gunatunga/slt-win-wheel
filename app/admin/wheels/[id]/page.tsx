import { getSegments } from '@/app/admin/actions'
import { getWheelStatus } from '@/app/actions/settings'
import AdminView from '@/components/admin/AdminView'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function WheelAdminPage({ params }: PageProps) {
    const { id } = await params

    // Validate existence
    const wheel = await prisma.wheel.findUnique({ where: { id } })
    if (!wheel) return notFound()

    const segments = await getSegments(id)
    const isEnabled = await getWheelStatus(id)

    return (
        <AdminView
            segments={segments}
            wheelId={id}
            initialWheelStatus={isEnabled}
            wheelSlug={wheel.slug}
        />
    )
}
