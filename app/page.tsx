import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white p-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-violet-500 animate-pulse">
          Realtime Win Wheel
        </h1>
        <p className="text-xl text-gray-300">
          Experience the next generation of server-authoritative gaming.
          Instant updates, zero lag, fair play.
        </p>

        <div className="flex gap-6 justify-center mt-10">
          <Link href="/wheel">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-white text-black hover:bg-gray-100 transition-transform hover:scale-105">
              Spin to Win
            </Button>
          </Link>
          <Link href="/admin">
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-white text-black hover:bg-white/10 hover:text-white transition-transform hover:scale-105">
              Admin Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-10 text-gray-500 text-sm">
        Powered by Next.js 14, Supabase Realtime & Prisma
      </div>
    </div>
  )
}
