import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, register, devLogin, isLoading } = useAuth()
    const [isRegister, setIsRegister] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            if (isRegister) {
                await register(email, password, name || undefined)
            } else {
                await login(email, password)
            }
            navigate('/app/import')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed')
        }
    }

    const handleDevLogin = async () => {
        setError(null)
        try {
            await devLogin()
            navigate('/app/import')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Dev login failed')
        }
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
            <div className="w-full max-w-md px-4">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold">Ops CSV Cleaner</span>
                    </Link>
                    <h1 className="text-2xl font-bold">
                        {isRegister ? 'Create your account' : 'Welcome back'}
                    </h1>
                    <p className="text-gray-400 mt-2">
                        {isRegister
                            ? 'Start saving templates and tracking imports'
                            : 'Sign in to access your templates and history'}
                    </p>
                </div>

                <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Name (optional)
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    placeholder="Your name"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : isRegister ? 'Create Account' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsRegister(!isRegister)
                                setError(null)
                            }}
                            className="text-emerald-400 hover:text-emerald-300 text-sm"
                        >
                            {isRegister
                                ? 'Already have an account? Sign in'
                                : "Don't have an account? Sign up"}
                        </button>
                    </div>

                    {/* Dev login for testing */}
                    <div className="mt-6 pt-6 border-t border-gray-800">
                        <p className="text-xs text-gray-500 text-center mb-3">
                            Development only
                        </p>
                        <button
                            onClick={handleDevLogin}
                            disabled={isLoading}
                            className="w-full py-2 px-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 text-sm transition-colors disabled:opacity-50"
                        >
                            Quick Dev Login (Pro User)
                        </button>
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mt-6">
                    <Link to="/tool" className="text-emerald-400 hover:text-emerald-300">
                        Continue without account
                    </Link>
                    {' '}— Free tool mode, no login required
                </p>
            </div>
        </div>
    )
}
