import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SchemaField {
    name: string
    type: 'string' | 'email' | 'number' | 'date' | 'phone'
    required: boolean
}

interface SaveTemplateModalProps {
    isOpen: boolean
    onClose: () => void
    onSave: (templateId: number) => void
    schemaFields: SchemaField[]
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function SaveTemplateModal({ isOpen, onClose, onSave, schemaFields }: SaveTemplateModalProps) {
    const { token, isAuthenticated } = useAuth()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    if (!isOpen) return null

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Template name is required')
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
            
            const response = await fetch(`${API_BASE_URL}/templates`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name,
                    slug,
                    description: description || null,
                    schema_json: schemaFields,
                    rules_json: {},
                    transforms_json: {},
                }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.detail || 'Failed to save template')
            }

            const template = await response.json()
            onSave(template.id)
            onClose()
            setName('')
            setDescription('')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save template')
        } finally {
            setIsLoading(false)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6">
                    <h2 className="text-xl font-bold mb-4">Sign in to Save Templates</h2>
                    <p className="text-gray-400 mb-6">
                        Create an account to save your schema as a reusable template.
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
                    <h2 className="text-xl font-bold">Save as Template</h2>
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
                            Template Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., HubSpot Contacts Import"
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of what this template is for..."
                            rows={3}
                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <div className="bg-gray-800/50 rounded-lg p-4">
                        <p className="text-sm text-gray-400 mb-2">Schema fields ({schemaFields.length})</p>
                        <div className="flex flex-wrap gap-2">
                            {schemaFields.slice(0, 6).map((field) => (
                                <span
                                    key={field.name}
                                    className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300"
                                >
                                    {field.name}
                                    {field.required && <span className="text-red-400 ml-1">*</span>}
                                </span>
                            ))}
                            {schemaFields.length > 6 && (
                                <span className="px-2 py-1 text-xs text-gray-500">
                                    +{schemaFields.length - 6} more
                                </span>
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
                        {isLoading ? 'Saving...' : 'Save Template'}
                    </button>
                </div>
            </div>
        </div>
    )
}
