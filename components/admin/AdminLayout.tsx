'use client'

import { ReactNode } from 'react'
import { LayoutDashboard, History, LogOut, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'

interface AdminLayoutProps {
    children: ReactNode
    currentTab: 'segments' | 'history'
    onTabChange: (tab: 'segments' | 'history') => void
}

export default function AdminLayout({ children, currentTab, onTabChange }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-[#0F172B] flex font-[Arial]">
            {/* Sidebar */}
            <aside className="w-64 bg-[#1E293B] border-r border-[#334155] flex flex-col flex-shrink-0 fixed h-full z-20">
                <div className="p-6 border-b border-[#334155]">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-[#FDC700] to-[#FF6900] bg-clip-text text-transparent">
                        Admin Panel
                    </h1>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Button
                        variant="ghost"
                        onClick={() => onTabChange('segments')}
                        className={cn(
                            "w-full justify-start gap-3 h-12 text-[16px] font-medium",
                            currentTab === 'segments'
                                ? "bg-[#334155] text-white hover:bg-[#334155] hover:text-white"
                                : "text-[#94A3B8] hover:bg-[#334155]/50 hover:text-white"
                        )}
                    >
                        <LayoutDashboard className="w-5 h-5" />
                        Segments
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => onTabChange('history')}
                        className={cn(
                            "w-full justify-start gap-3 h-12 text-[16px] font-medium",
                            currentTab === 'history'
                                ? "bg-[#334155] text-white hover:bg-[#334155] hover:text-white"
                                : "text-[#94A3B8] hover:bg-[#334155]/50 hover:text-white"
                        )}
                    >
                        <History className="w-5 h-5" />
                        Win History
                    </Button>
                </nav>

                <div className="p-4 border-t border-[#334155] space-y-2">
                    <Link href="/admin/wheels">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-[#94A3B8] hover:text-white hover:bg-[#334155]/50"
                        >
                            <ExternalLink className="w-5 h-5" />
                            Exit to Wheel
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={() => logout()}
                        className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    >
                        <LogOut className="w-5 h-5" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen overflow-auto">
                <div className="p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
