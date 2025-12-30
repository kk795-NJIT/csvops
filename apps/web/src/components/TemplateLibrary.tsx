/**
 * Template Library Page
 * Shows all available import templates for CRMs/platforms
 */
import { Link } from 'react-router-dom'
import { TEMPLATES, ImportTemplate } from '../data/templates'

export default function TemplateLibrary() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/"
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                ← Home
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold">CRM Import Templates</h1>
                                <p className="text-sm text-gray-400">Pre-built schemas for HubSpot, Salesforce, Shopify & more</p>
                            </div>
                        </div>
                        <Link
                            to="/tool"
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm font-medium transition-colors"
                        >
                            🆓 Free Tool
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">
                        Skip the schema setup. Start importing.
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        Each template matches your CRM's exact import format.
                        Download a sample CSV, see the schema, and clean your data in seconds.
                    </p>
                </div>

                {/* Privacy Badge */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        100% privacy-first: All processing happens in your browser
                    </div>
                </div>

                {/* Template Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {TEMPLATES.map(template => (
                        <TemplateCard
                            key={template.id}
                            template={template}
                        />
                    ))}
                </div>

                {/* Custom Template CTA */}
                <div className="mt-12 bg-gray-900/50 border border-gray-800 rounded-2xl p-8 text-center">
                    <h3 className="text-xl font-bold mb-2">Need a different CRM format?</h3>
                    <p className="text-gray-400 mb-4">
                        Use the Free Tool to create your own schema. Upgrade to Pro to save it for future imports.
                    </p>
                    <Link
                        to="/tool"
                        className="inline-block px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
                    >
                        Try Free Tool
                    </Link>
                </div>
            </main>
        </div>
    )
}

function TemplateCard({ template }: { template: ImportTemplate }) {
    return (
        <Link
            to={`/templates/${template.slug}`}
            className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 text-left hover:border-emerald-500/50 hover:bg-gray-900 transition-all group block"
        >
            <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-2xl group-hover:bg-emerald-500/20 transition-colors">
                    {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold group-hover:text-emerald-400 transition-colors">
                            {template.name}
                        </h4>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{template.platform}</p>
                    <p className="text-sm text-gray-400 line-clamp-2">
                        {template.description}
                    </p>
                    <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-gray-500">
                            {template.schema.length} fields
                        </span>
                        <span className="text-xs text-emerald-400">
                            Sample CSV included
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    )
}
