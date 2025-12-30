import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface Preset {
    id: number
    name: string
    template_id: number | null
    mapping_json: Record<string, string>
    created_at: string
}

interface LoadPresetModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (preset: Preset) => void
    templateId?: number  // Optional: filter by template
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoadPresetModal({ isOpen, onClose, onSelect, templateId }: LoadPresetModalProps) {
    const { token, isAuthenticated } = useAuth()
    const [presets, setPresets] = useState<Preset[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen && isAuthenticated) {
            fetchPresets()
        } else if (isOpen && !isAuthenticated) {
            setIsLoading(false)
        }
    }, [isOpen, isAuthenticated])

    const fetchPresets = async () => {
        setIsLoading(true)
        setError(null)

        try {
            let url = `${API_BASE_URL}/presets`
            if (templateId) {
                url += `?template_id=${templateId}`
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (!response.ok) {
                throw new Error('Failed to fetch presets')
            }

            const data = await response.json()
            setPresets(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load presets')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isOpen) return null

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold mb-4">Sign in to Load Presets</h2>
                    <p className="text-gray-400 mb-6">
                        Create an account to save and load column mapping presets.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <a
                            href="/login"
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-center font-semibold hover:opacity-90 transition-opacity"
                        >
                            Sign In
                        </a>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold">Load Mapping Preset</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="text-gray-400 mt-4">Loading presets...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={fetchPresets}
                                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : presets.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <p className="text-gray-400">No saved presets yet</p>
                            <p className="text-sm text-gray-500 mt-1">
                                Save a column mapping to reuse it later
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {presets.map((preset) => {
                                const mappingCount = Object.keys(preset.mapping_json).length
                                const mappingPreview = Object.entries(preset.mapping_json).slice(0, 3)
                                
                                return (
                                    <button
                                        key={preset.id}
                                        onClick={() => onSelect(preset)}
                                        className="w-full text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-semibold">{preset.name}</h3>
                                            <span className="text-xs text-gray-500">{formatDate(preset.created_at)}</span>
                                        </div>
                                        <div className="space-y-1">
                                            {mappingPreview.map(([source, target]) => (
                                                <div key={source} className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400 truncate">{source}</span>
                                                    <svg className="w-3 h-3 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                    <span className="text-white truncate">{target}</span>
                                                </div>
                                            ))}
                                            {mappingCount > 3 && (
                                                <p className="text-xs text-gray-500">
                                                    +{mappingCount - 3} more mappings
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
