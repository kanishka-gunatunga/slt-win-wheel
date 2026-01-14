import { getWheels } from '@/app/actions/wheel'
import WheelsPage from '@/components/admin/WheelsPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
    const wheels = await getWheels()
    return <WheelsPage wheels={wheels} />
}
