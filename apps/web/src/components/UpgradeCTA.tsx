import { useState } from 'react'

interface UpgradeCTAProps {
    feature: 'save-template' | 'save-preset' | 'webhook' | 'unlimited-runs' | 'ai-copilot'
    currentUsage?: number
    limit?: number
    onClose?: () => void
    inline?: boolean
}

const FEATURE_COPY = {
    'save-template': {
        icon: '📋',
        title: 'Save Templates with Pro',
        description: 'Free accounts can only use 2 templates. Upgrade to Pro for unlimited saved templates.',
        benefit: 'Never recreate column mappings again',
    },
    'save-preset': {
        icon: '⚙️',
        title: 'Save Presets with Pro',
        description: 'Free accounts can only save 2 presets. Upgrade to Pro for unlimited validation presets.',
        benefit: 'Reuse your custom validation rules',
    },
    'webhook': {
        icon: '🔗',
        title: 'Webhook Export is Pro',
        description: 'Automatically send clean data to your systems. Pro users can configure webhooks for instant data delivery.',
        benefit: 'Automate your data pipeline',
    },
    'unlimited-runs': {
        icon: '🚀',
        title: 'Need More Runs?',
        description: 'Free accounts have 10 runs per month. Upgrade to Pro for unlimited CSV cleaning.',
        benefit: 'Clean unlimited files every month',
    },
    'ai-copilot': {
        icon: '🤖',
        title: 'AI Copilot (Beta)',
        description: 'Get AI-powered suggestions for column mapping and validation rules.',
        benefit: 'Let AI help with tricky data',
    },
}

export function UpgradeCTA({ feature, currentUsage, limit, onClose, inline = false }: UpgradeCTAProps) {
    const [dismissed, setDismissed] = useState(false)
    const copy = FEATURE_COPY[feature]

    if (dismissed) return null

    const handleDismiss = () => {
        setDismissed(true)
        onClose?.()
    }

    const handleUpgrade = () => {
        // Navigate to pricing page or open upgrade modal
        window.location.href = '/#pricing'
    }

    if (inline) {
        return (
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                <span className="text-xl">{copy.icon}</span>
                <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{copy.title}</span>
                    {currentUsage !== undefined && limit !== undefined && (
                        <span className="ml-2 text-xs text-gray-500">
                            ({currentUsage}/{limit} used)
                        </span>
                    )}
                </div>
                <button
                    onClick={handleUpgrade}
                    className="px-3 py-1 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                >
                    Upgrade
                </button>
            </div>
        )
    }

    return (
        <div className="relative p-6 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl text-white shadow-lg">
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 text-white/70 hover:text-white"
                aria-label="Dismiss"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            <div className="flex items-start gap-4">
                <span className="text-3xl">{copy.icon}</span>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{copy.title}</h3>
                    <p className="text-white/90 text-sm mb-3">{copy.description}</p>
                    
                    {currentUsage !== undefined && limit !== undefined && (
                        <div className="mb-3">
                            <div className="flex justify-between text-xs text-white/80 mb-1">
                                <span>Usage this month</span>
                                <span>{currentUsage} / {limit}</span>
                            </div>
                            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all"
                                    style={{ width: `${Math.min((currentUsage / limit) * 100, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-white/90 mb-4">
                        <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{copy.benefit}</span>
                    </div>

                    <button
                        onClick={handleUpgrade}
                        className="w-full py-2 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Upgrade to Pro — $19/mo
                    </button>
                </div>
            </div>
        </div>
    )
}

// Hook to check if upgrade CTA should show
export function useUpgradeCTA() {
    const checkShouldShow = (
        feature: 'save-template' | 'save-preset' | 'webhook' | 'unlimited-runs',
        plan: string | undefined,
        currentUsage?: number
    ): boolean => {
        if (plan === 'pro' || plan === 'team') return false

        switch (feature) {
            case 'save-template':
            case 'save-preset':
                return (currentUsage ?? 0) >= 2
            case 'webhook':
                return true // Always show for free users
            case 'unlimited-runs':
                return (currentUsage ?? 0) >= 8 // Show when close to limit
            default:
                return false
        }
    }

    return { checkShouldShow }
}
