'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

const initialState = {
    success: false,
    error: ''
}

export default function LoginPage() {
    const [state, formAction] = useActionState(login, initialState)

    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
            <div className="w-full max-w-sm p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-white">Admin Login</h1>
                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="bg-red-50 text-red-500 text-sm p-3 rounded-md border border-red-200">
                            {state.error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="username">Username</label>
                        <input
                            name="username"
                            id="username"
                            required
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300" htmlFor="password">Password</label>
                        <input
                            type="password"
                            name="password"
                            id="password"
                            required
                            className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
