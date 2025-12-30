import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface RunSummary {
    id: number
    template_id: number | null
    preset_id: number | null
    file_name: string
    total_rows: number
    valid_rows: number
    invalid_rows: number
    error_count: number
    duplicates_count: number
    error_summary: Record<string, number>
    started_at: string
    completed_at: string | null
    duration_ms: number | null
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function RunHistoryPage() {
    const { token, isAuthenticated } = useAuth()
    const [runs, setRuns] = useState<RunSummary[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isAuthenticated) {
            fetchRuns()
        } else {
            setIsLoading(false)
        }
    }, [isAuthenticated])

    const fetchRuns = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/runs`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            if (!response.ok) {
                throw new Error('Failed to fetch runs')
            }
            const data = await response.json()
            setRuns(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load history')
        } finally {
            setIsLoading(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    const formatDuration = (ms: number | null) => {
        if (!ms) return '-'
        if (ms < 1000) return `${ms}ms`
        return `${(ms / 1000).toFixed(1)}s`
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-950 text-white">
                <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <h1 className="text-lg font-bold">Run History</h1>
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">Sign in to view history</h2>
                        <p className="text-gray-400 mb-6">
                            Track your import runs and see validation statistics
                        </p>
                        <Link
                            to="/login"
                            className="inline-flex px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Sign In
                        </Link>
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </Link>
                            <h1 className="text-lg font-bold">Run History</h1>
                        </div>
                        <Link
                            to="/tool"
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                        >
                            New Import
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                        <p className="text-gray-400 mt-4">Loading history...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-400">{error}</p>
                    </div>
                ) : runs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold mb-2">No imports yet</h2>
                        <p className="text-gray-400 mb-6">
                            Your import history will appear here
                        </p>
                        <Link
                            to="/tool"
                            className="inline-flex px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Start Importing
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {runs.map((run) => (
                            <div
                                key={run.id}
                                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{run.file_name}</h3>
                                        <p className="text-sm text-gray-400">{formatDate(run.started_at)}</p>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {formatDuration(run.duration_ms)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div className="bg-gray-800/50 rounded-lg p-3">
                                        <p className="text-2xl font-bold">{run.total_rows}</p>
                                        <p className="text-xs text-gray-400">Total Rows</p>
                                    </div>
                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                                        <p className="text-2xl font-bold text-emerald-400">{run.valid_rows}</p>
                                        <p className="text-xs text-gray-400">Valid</p>
                                    </div>
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                        <p className="text-2xl font-bold text-red-400">{run.invalid_rows}</p>
                                        <p className="text-xs text-gray-400">Invalid</p>
                                    </div>
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                                        <p className="text-2xl font-bold text-yellow-400">{run.duplicates_count || 0}</p>
                                        <p className="text-xs text-gray-400">Duplicates</p>
                                    </div>
                                </div>

                                {run.error_summary && Object.keys(run.error_summary).length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-800">
                                        <p className="text-sm text-gray-400 mb-2">Error breakdown:</p>
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(run.error_summary).map(([type, count]) => (
                                                <span
                                                    key={type}
                                                    className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300"
                                                >
                                                    {type}: {count}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
