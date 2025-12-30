/**
 * Usage Banner Component
 * Shows current usage and upgrade button for Free plan users
 */
import { useState, useEffect } from 'react'
import api, { UsageResponse, getUserId, setUserId } from '../api/client'

interface UsageBannerProps {
    onUpgrade?: () => void
}

export default function UsageBanner({ onUpgrade }: UsageBannerProps) {
    const [usage, setUsage] = useState<UsageResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [showUpgradeModal, setShowUpgradeModal] = useState(false)

    useEffect(() => {
        const userId = getUserId()
        if (!userId) {
            setLoading(false)
            return
        }

        api.getMyUsage()
            .then(setUsage)
            .catch(err => {
                console.error('Failed to fetch usage:', err)
                setError('Could not load usage data')
            })
            .finally(() => setLoading(false))
    }, [])

    const handleUpgrade = async () => {
        if (!usage) return

        try {
            await api.upgradeUser(usage.user_id)
            // Refresh usage
            const newUsage = await api.getMyUsage()
            setUsage(newUsage)
            setShowUpgradeModal(false)
            onUpgrade?.()
        } catch (err) {
            console.error('Failed to upgrade:', err)
        }
    }

    const handleDemoLogin = async (plan: 'free' | 'pro') => {
        // Set demo user ID based on plan (1 = free, 2 = pro based on seed script)
        const userId = plan === 'free' ? 1 : 2
        setUserId(userId)
        window.location.reload()
    }

    // Not logged in - show demo login options
    if (!getUserId()) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-400">
                            Login as demo user to track usage
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleDemoLogin('free')}
                            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-xs font-medium transition-colors"
                        >
                            Demo (Free)
                        </button>
                        <button
                            onClick={() => handleDemoLogin('pro')}
                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
                        >
                            Demo (Pro)
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-48"></div>
            </div>
        )
    }

    if (error || !usage) {
        return null
    }

    const isPro = usage.plan === 'pro' || usage.plan === 'team'
    const runsUsed = usage.usage.runs_this_month
    const runsMax = usage.usage.max_runs_per_month
    const templatesUsed = usage.usage.templates
    const templatesMax = usage.usage.max_templates
    const runsPercentage = runsMax > 0 ? Math.min(100, (runsUsed / runsMax) * 100) : 0
    const templatesPercentage = templatesMax > 0 ? Math.min(100, (templatesUsed / templatesMax) * 100) : 0

    return (
        <>
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        {/* Plan Badge */}
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPro
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                            }`}>
                            {isPro ? '⚡ PRO' : 'FREE'}
                        </div>

                        {/* Usage Stats */}
                        <div className="flex items-center gap-4 text-sm">
                            {/* Runs */}
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Files:</span>
                                <span className={runsPercentage >= 80 ? 'text-amber-400' : 'text-white'}>
                                    {runsUsed}{runsMax > 0 ? `/${runsMax}` : ''}
                                </span>
                                {!isPro && runsMax > 0 && (
                                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${runsPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${runsPercentage}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Templates */}
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Templates:</span>
                                <span className={templatesPercentage >= 80 ? 'text-amber-400' : 'text-white'}>
                                    {templatesUsed}{templatesMax > 0 ? `/${templatesMax}` : ''}
                                </span>
                                {!isPro && templatesMax > 0 && (
                                    <div className="w-12 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all ${templatesPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                }`}
                                            style={{ width: `${templatesPercentage}%` }}
                                        />
                                    </div>
                                )}
                            </div>

                            {isPro && (
                                <span className="text-gray-500 text-xs">Unlimited</span>
                            )}
                        </div>
                    </div>

                    {/* Upgrade Button */}
                    {!isPro && (
                        <button
                            onClick={() => setShowUpgradeModal(true)}
                            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg text-sm font-medium transition-all shadow-lg shadow-emerald-500/20"
                        >
                            ⚡ Upgrade to Pro
                        </button>
                    )}
                </div>

                {/* Warning if near limit */}
                {!isPro && (runsPercentage >= 80 || templatesPercentage >= 80) && (
                    <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-amber-400 text-xs">
                            ⚠️ You're approaching your plan limits. Upgrade to Pro for unlimited access.
                        </p>
                    </div>
                )}
            </div>

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUpgradeModal(false)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center">
                                <span className="text-3xl">⚡</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Upgrade to Pro</h3>
                            <p className="text-gray-400 text-sm">
                                Unlock unlimited imports and templates
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-emerald-400">✓</span>
                                <span>Unlimited file imports per month</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-emerald-400">✓</span>
                                <span>Unlimited saved templates</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="text-emerald-400">✓</span>
                                <span>Priority support</span>
                            </div>
                        </div>

                        <div className="bg-gray-800/50 rounded-xl p-4 mb-6 text-center">
                            <p className="text-gray-400 text-xs mb-1">Demo Mode</p>
                            <p className="text-sm">Click below to simulate upgrade (no payment)</p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradeModal(false)}
                                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpgrade}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-medium transition-all"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
