import { getSegments } from './actions'
import AdminView from '@/components/admin/AdminView'

export const dynamic = 'force-dynamic' // Ensure we always get fresh data on page load

export default async function AdminPage() {
    const segments = await getSegments()

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">Wheel Configuration</h1>
            <AdminView segments={segments} />
        </div>
    )
}
