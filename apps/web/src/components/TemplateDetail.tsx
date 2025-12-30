/**
 * Template Detail Page
 * Shows template description, schema, sample download, and "Use Template" button
 */
import { Link } from 'react-router-dom'
import { getTemplateBySlug, ImportTemplate } from '../data/templates'

interface TemplateDetailProps {
    templateId: string // This is actually the slug
    onUseTemplate: (template: ImportTemplate) => void
    onBack: () => void
}

export default function TemplateDetail({ templateId, onUseTemplate }: TemplateDetailProps) {
    const template = getTemplateBySlug(templateId)

    if (!template) {
        return (
            <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Template Not Found</h2>
                    <Link to="/templates" className="text-emerald-400 hover:underline">
                        ← Back to Library
                    </Link>
                </div>
            </div>
        )
    }

    const requiredFields = template.schema.filter(f => f.required).length
    const optionalFields = template.schema.length - requiredFields

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <Link
                            to="/templates"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Back to Templates
                        </Link>
                        <button
                            onClick={() => onUseTemplate(template)}
                            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
                        >
                            Use This Template →
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Template Header */}
                <div className="flex items-start gap-6 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center text-4xl">
                        {template.icon}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <span className="px-2 py-0.5 bg-gray-800 rounded text-xs">{template.platform}</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">{template.name}</h1>
                        <p className="text-gray-400 max-w-2xl">{template.description}</p>
                    </div>
                </div>

                {/* Privacy Notice */}
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-8">
                    <div className="flex items-center gap-2 text-emerald-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span><strong>Privacy-first:</strong> Your data never leaves your browser. Processing happens 100% client-side.</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-emerald-400">{template.schema.length}</div>
                        <div className="text-sm text-gray-400">Total Fields</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-amber-400">{requiredFields}</div>
                        <div className="text-sm text-gray-400">Required</div>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-gray-400">{optionalFields}</div>
                        <div className="text-sm text-gray-400">Optional</div>
                    </div>
                </div>

                {/* Schema */}
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-8">
                    <div className="px-6 py-4 border-b border-gray-800">
                        <h3 className="font-semibold">Schema Definition</h3>
                        <p className="text-sm text-gray-500">Fields expected by {template.platform}</p>
                    </div>
                    <div className="divide-y divide-gray-800">
                        {template.schema.map(field => (
                            <div key={field.name} className="px-6 py-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <code className="text-sm font-mono text-emerald-400">{field.name}</code>
                                        {field.required && (
                                            <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">required</span>
                                        )}
                                    </div>
                                    {field.description && (
                                        <p className="text-sm text-gray-500 mt-1">{field.description}</p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 bg-gray-800 px-3 py-1 rounded-full">
                                    {field.type}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recommended Transforms */}
                {template.recommendedTransforms.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-8">
                        <h3 className="font-semibold mb-4">💡 Recommended Transforms</h3>
                        <div className="space-y-3">
                            {template.recommendedTransforms.map((t, i) => (
                                <div key={i} className="flex items-center gap-3 text-sm">
                                    <code className="text-emerald-400 font-mono">{t.field}</code>
                                    <span className="text-gray-600">→</span>
                                    <span className="text-gray-400">{t.description}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sample Download */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold mb-1">📥 Download Sample CSV</h3>
                            <p className="text-sm text-gray-400">
                                See the expected format before uploading your data
                            </p>
                        </div>
                        <a
                            href={template.sampleFile}
                            download
                            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            Download Sample
                        </a>
                    </div>
                </div>

                {/* Tags */}
                <div className="mt-8">
                    <div className="flex flex-wrap gap-2">
                        {template.tags.map(tag => (
                            <span key={tag} className="text-xs px-3 py-1 bg-gray-800 text-gray-400 rounded-full">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-12 text-center">
                    <button
                        onClick={() => onUseTemplate(template)}
                        className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                        🚀 Use This Template
                    </button>
                </div>
            </main>
        </div>
    )
}
