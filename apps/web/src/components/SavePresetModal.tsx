import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SavePresetModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (presetId: number) => void
    mapping: Record<string, string>  // source -> target
    templateId?: number
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SavePresetModal({ isOpen, onClose, onSave, mapping, templateId }: SavePresetModalProps) {
    const { token, isAuthenticated } = useAuth()
    const [name, setName] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Preset name is required')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`${API_BASE_URL}/presets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    template_id: templateId || null,
                    mapping_json: mapping,
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to save preset')
            }

            const preset = await response.json()
            onSave(preset.id)
            onClose()
            setName('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save preset')
        } finally {
            setIsLoading(false)
        }
    }

    const mappingEntries = Object.entries(mapping)

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold mb-4">Sign in to Save Presets</h2>
                    <p className="text-gray-400 mb-6">
                        Create an account to save your column mapping as a reusable preset.
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
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Save Mapping Preset</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Preset Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Shopify Export to HubSpot"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-3">Column mappings ({mappingEntries.length})</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {mappingEntries.slice(0, 8).map(([source, target]) => (
                                <div key={source} className="flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 truncate flex-1">{source}</span>
                                    <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                    <span className="text-white truncate flex-1">{target}</span>
                                </div>
                            ))}
                            {mappingEntries.length > 8 && (
                                <p className="text-xs text-gray-500 pt-2">
                                    +{mappingEntries.length - 8} more mappings
                                </p>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isLoading || !name.trim()}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        {isLoading ? 'Saving...' : 'Save Preset'}
                    </button>
                </div>
            </div>
        </div>
    )
}
