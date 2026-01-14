'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Lock } from 'lucide-react'

const initialState = {
    success: false,
    error: ''
}

export default function LoginPage() {
    // @ts-ignore - types for useActionState might be loose in current react definitions
    const [state, formAction, isPending] = useActionState(login, initialState)

    return (
        <div className="min-h-screen bg-[#0F172B] flex items-center justify-center p-4 font-[Arial]">
            <div className="w-full max-w-md space-y-8 relative">
                {/* Background glow effect */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-brand-gradient opacity-20 blur-[100px] rounded-full pointer-events-none" />

                <Card className="bg-[#1E293B] border-[#334155] relative z-10 shadow-2xl">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#334155] flex items-center justify-center">
                                <Lock className="w-6 h-6 text-[#9810FA]" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">
                            Admin Login
                        </CardTitle>
                        <CardDescription className="text-[#94A3B8]">
                            Enter your credentials to access the dashboard
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={formAction} className="space-y-4">
                            {state?.error && (
                                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                                    {state.error}
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-200">Username</Label>
                                <Input
                                    id="username"
                                    name="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    required
                                    className="bg-[#0F172B] border-[#334155] text-white placeholder:text-gray-500 focus-visible:ring-[#9810FA]"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-200">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="bg-[#0F172B] border-[#334155] text-white placeholder:text-gray-500 focus-visible:ring-[#9810FA]"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full bg-[#9810FA] hover:bg-[#8000E0] text-white font-semibold transition-all duration-200 hover:shadow-[0_0_20px_-5px_#9810FA]"
                                disabled={isPending}
                            >
                                {isPending ? 'Signing in...' : 'Sign In'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-sm text-[#64748B]">
                    Protected Area • Authorized Personnel Only
                </p>
            </div>
        </div>
    )
}
