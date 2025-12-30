import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

interface SchemaField {
    name: string
    type: string
    required: boolean
}

interface Template {
    id: number
    name: string
    slug: string | null
    description: string | null
    schema_json: SchemaField[]
    created_at: string
}

interface LoadTemplateModalProps {
    isOpen: boolean
    onClose: () => void
    onSelect: (template: Template) => void
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function LoadTemplateModal({ isOpen, onClose, onSelect }: LoadTemplateModalProps) {
    const { token, isAuthenticated } = useAuth()
    const [templates, setTemplates] = useState<Template[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (isOpen) {
            fetchTemplates()
        }
    }, [isOpen])

    const fetchTemplates = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const headers: HeadersInit = { 'Content-Type': 'application/json' }
            if (token) {
                headers['Authorization'] = `Bearer ${token}`
            }

            const url = isAuthenticated 
                ? `${API_BASE_URL}/templates?mine_only=true`
                : `${API_BASE_URL}/templates`

            const response = await fetch(url, { headers })

            if (!response.ok) {
                throw new Error('Failed to fetch templates')
            }

            const data = await response.json()
            setTemplates(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load templates')
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

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold">Load Template</h2>
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
                            <p className="text-gray-400 mt-4">Loading templates...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={fetchTemplates}
                                className="mt-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    ) : templates.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <p className="text-gray-400">No saved templates yet</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {isAuthenticated 
                                    ? 'Save a schema as a template to reuse it'
                                    : 'Sign in to save and load templates'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => onSelect(template)}
                                    className="w-full text-left bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl p-4 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-semibold">{template.name}</h3>
                                        <span className="text-xs text-gray-500">{formatDate(template.created_at)}</span>
                                    </div>
                                    {template.description && (
                                        <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                                    )}
                                    <div className="flex flex-wrap gap-1">
                                        {template.schema_json?.slice(0, 5).map((field) => (
                                            <span
                                                key={field.name}
                                                className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-300"
                                            >
                                                {field.name}
                                            </span>
                                        ))}
                                        {template.schema_json?.length > 5 && (
                                            <span className="px-2 py-0.5 text-xs text-gray-500">
                                                +{template.schema_json.length - 5}
                                            </span>
                                        )}
                                    </div>
                                </button>
                            ))}
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
