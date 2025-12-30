import { useState } from 'react'
import { useAI } from '../hooks/useAI'
import { AISettingsModal } from './AISettingsModal'

interface AIHelpButtonProps {
    type: 'mapping' | 'validation' | 'rules'
    onSuggestion?: (suggestion: unknown) => void
    data?: Record<string, unknown>[]
    headers?: string[]
    targetSchema?: string[]
    errors?: Array<{ row: number; column: string; type: string; message: string }>
    className?: string
}

export function AIHelpButton({
    type,
    onSuggestion,
    data = [],
    headers = [],
    targetSchema = [],
    errors = [],
    className = '',
}: AIHelpButtonProps) {
    const { isEnabled, isLoading, error, getMappingSuggestions, getErrorExplanations } = useAI()
    const [showSettings, setShowSettings] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [result, setResult] = useState<unknown>(null)

    const handleClick = async () => {
        if (!isEnabled) {
            setShowSettings(true)
            return
        }

        let suggestions = null
        
        if (type === 'mapping') {
            suggestions = await getMappingSuggestions(data, headers, targetSchema)
        } else if (type === 'validation') {
            suggestions = await getErrorExplanations(data, headers, errors)
        }

        if (suggestions) {
            setResult(suggestions)
            setShowResult(true)
            onSuggestion?.(suggestions)
        }
    }

    const getButtonText = () => {
        if (isLoading) return 'Thinking...'
        if (!isEnabled) return 'AI Help'
        
        switch (type) {
            case 'mapping':
                return 'AI Suggest Mappings'
            case 'validation':
                return 'AI Explain Errors'
            case 'rules':
                return 'AI Generate Rules'
            default:
                return 'AI Help'
        }
    }

    const getIcon = () => {
        if (isLoading) {
            return (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
            )
        }
        return <span>🤖</span>
    }

    return (
        <>
            <button
                onClick={handleClick}
                disabled={isLoading}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isEnabled
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                } disabled:opacity-50 ${className}`}
                title={isEnabled ? `Click to get AI suggestions` : 'Configure AI Copilot'}
            >
                {getIcon()}
                <span>{getButtonText()}</span>
                {!isEnabled && (
                    <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
            </button>

            {error && (
                <div className="mt-2 text-sm text-red-600">
                    {error}
                </div>
            )}

            {showResult && result && (
                <AIResultPopover
                    type={type}
                    result={result}
                    onClose={() => setShowResult(false)}
                    onApply={(applied) => {
                        onSuggestion?.(applied)
                        setShowResult(false)
                    }}
                />
            )}

            <AISettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
        </>
    )
}

interface AIResultPopoverProps {
    type: 'mapping' | 'validation' | 'rules'
    result: unknown
    onClose: () => void
    onApply: (result: unknown) => void
}

function AIResultPopover({ type, result, onClose, onApply }: AIResultPopoverProps) {
    if (type === 'mapping') {
        const mappingResult = result as {
            mappings: Record<string, string>
            confidence: Record<string, 'high' | 'medium' | 'low'>
            reasoning: Record<string, string>
        }

        return (
            <div className="absolute z-50 mt-2 p-4 bg-white border rounded-xl shadow-xl max-w-md">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">AI Mapping Suggestions</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {Object.entries(mappingResult.mappings).map(([source, target]) => (
                        <div key={source} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                            <span className="font-mono">{source}</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                            <span className="font-mono text-purple-600">{target}</span>
                            <ConfidenceBadge level={mappingResult.confidence[source]} />
                        </div>
                    ))}
                </div>

                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => onApply(mappingResult.mappings)}
                        className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                        Apply Mappings
                    </button>
                    <button
                        onClick={onClose}
                        className="px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        )
    }

    if (type === 'validation') {
        const errorResult = result as {
            explanations: Array<{
                errorType: string
                explanation: string
                suggestedFix: string
            }>
            generalAdvice: string
        }

        return (
            <div className="absolute z-50 mt-2 p-4 bg-white border rounded-xl shadow-xl max-w-md">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium">AI Error Analysis</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto">
                    {errorResult.explanations.map((exp, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="font-medium text-red-600">{exp.errorType}</div>
                            <p className="text-gray-600 mt-1">{exp.explanation}</p>
                            <p className="text-green-600 mt-1">💡 {exp.suggestedFix}</p>
                        </div>
                    ))}
                </div>

                {errorResult.generalAdvice && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                        <strong>Overall:</strong> {errorResult.generalAdvice}
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full mt-4 px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                    Got it
                </button>
            </div>
        )
    }

    return null
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
    const colors = {
        high: 'bg-green-100 text-green-700',
        medium: 'bg-yellow-100 text-yellow-700',
        low: 'bg-red-100 text-red-700',
    }

    return (
        <span className={`ml-auto px-1.5 py-0.5 text-xs rounded ${colors[level]}`}>
            {level}
        </span>
    )
}
