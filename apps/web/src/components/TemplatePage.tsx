import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { getTemplateBySlug } from '../data/templates'
import { getTemplateSEO, TEMPLATE_SEO } from '../data/templatesSEO'

export function TemplatePage() {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    
    const template = slug ? getTemplateBySlug(slug) : undefined
    const seoData = slug ? getTemplateSEO(slug) : undefined

    // If we have SEO data but no template, use SEO data for the page
    const hasSEOData = !!seoData
    const hasTemplate = !!template

    if (!hasSEOData && !hasTemplate) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Template Not Found</h1>
                    <p className="text-gray-600 mb-4">The template you're looking for doesn't exist.</p>
                    <Link to="/templates" className="text-purple-600 hover:underline">
                        Browse all templates →
                    </Link>
                </div>
            </div>
        )
    }

    const title = seoData?.h1 || template?.name || 'CSV Template'
    const description = seoData?.metaDescription || template?.description || ''
    const metaTitle = seoData?.metaTitle || `${title} | CSV Cleaner`

    const handleStartCleaning = () => {
        if (template) {
            navigate('/tool', { state: { template } })
        } else {
            navigate('/tool')
        }
    }

    const handleDownloadSample = () => {
        if (template?.sampleFile) {
            window.location.href = template.sampleFile
        }
    }

    return (
        <>
            <Helmet>
                <title>{metaTitle}</title>
                <meta name="description" content={description} />
                <meta property="og:title" content={metaTitle} />
                <meta property="og:description" content={description} />
                <meta property="og:type" content="website" />
                <link rel="canonical" href={`https://csvcleaner.app/templates/${slug}`} />
            </Helmet>

            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
                {/* Header */}
                <header className="bg-white border-b">
                    <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link to="/" className="text-xl font-bold text-purple-600">
                            CSV Cleaner
                        </Link>
                        <nav className="flex items-center gap-4">
                            <Link to="/templates" className="text-gray-600 hover:text-gray-900">
                                Templates
                            </Link>
                            <Link to="/tool" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                                Start Cleaning
                            </Link>
                        </nav>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="max-w-5xl mx-auto px-4 py-12">
                    <div className="flex items-start gap-4 mb-6">
                        <span className="text-4xl">{template?.icon || '📋'}</span>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Link to="/templates" className="text-sm text-purple-600 hover:underline">
                                    Templates
                                </Link>
                                <span className="text-gray-400">/</span>
                                <span className="text-sm text-gray-500">{template?.platform || 'Universal'}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{title}</h1>
                        </div>
                    </div>

                    <p className="text-xl text-gray-600 mb-8 max-w-3xl">
                        {seoData?.problem || template?.description}
                    </p>

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={handleStartCleaning}
                            className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
                        >
                            Start Cleaning — Free
                        </button>
                        {template?.sampleFile && (
                            <button
                                onClick={handleDownloadSample}
                                className="px-6 py-3 border-2 border-purple-600 text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-all"
                            >
                                Download Sample CSV
                            </button>
                        )}
                    </div>
                </section>

                {/* What Breaks Section */}
                {seoData?.whatBreaks && (
                    <section className="bg-red-50 py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>❌</span> What Breaks Without Clean Data
                            </h2>
                            <ul className="grid md:grid-cols-2 gap-4">
                                {seoData.whatBreaks.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-white p-4 rounded-lg">
                                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* What This Fixes Section */}
                {seoData?.whatThisFixes && (
                    <section className="py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <span>✅</span> What This Template Fixes
                            </h2>
                            <ul className="grid md:grid-cols-2 gap-4">
                                {seoData.whatThisFixes.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-green-50 p-4 rounded-lg">
                                        <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span className="text-gray-700">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {/* Steps Section */}
                {seoData?.steps && (
                    <section className="bg-gray-50 py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                                How It Works
                            </h2>
                            <div className="grid md:grid-cols-4 gap-6">
                                {seoData.steps.map((step, i) => (
                                    <div key={i} className="text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-full flex items-center justify-center text-3xl shadow-md">
                                            {step.icon}
                                        </div>
                                        <div className="text-sm text-purple-600 font-medium mb-1">Step {i + 1}</div>
                                        <h3 className="font-semibold text-gray-900 mb-1">{step.title}</h3>
                                        <p className="text-sm text-gray-600">{step.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Use Cases Section */}
                {seoData?.useCases && (
                    <section className="py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Common Use Cases
                            </h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                {seoData.useCases.map((useCase, i) => (
                                    <div key={i} className="flex items-center gap-3 p-4 border rounded-lg bg-white">
                                        <span className="text-2xl">📁</span>
                                        <span className="text-gray-700">{useCase}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* Schema Preview */}
                {template?.schema && (
                    <section className="bg-gray-50 py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Expected Fields
                            </h2>
                            <div className="grid md:grid-cols-3 gap-4">
                                {template.schema.map((field) => (
                                    <div key={field.name} className="bg-white p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-1">
                                            <code className="text-purple-600 font-mono text-sm">{field.name}</code>
                                            {field.required && (
                                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Required</span>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 capitalize">{field.type}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* CTA Section */}
                <section className="py-16 bg-gradient-to-r from-purple-600 to-blue-600">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">
                            Ready to Clean Your CSV?
                        </h2>
                        <p className="text-xl text-white/90 mb-8">
                            Start cleaning for free. No signup required.
                        </p>
                        <button
                            onClick={handleStartCleaning}
                            className="px-8 py-4 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 shadow-xl transition-all text-lg"
                        >
                            Start Cleaning Now →
                        </button>
                    </div>
                </section>

                {/* Related Templates */}
                {seoData?.relatedTemplates && seoData.relatedTemplates.length > 0 && (
                    <section className="py-12">
                        <div className="max-w-5xl mx-auto px-4">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                Related Templates
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6">
                                {seoData.relatedTemplates.map((relatedSlug) => {
                                    const related = getTemplateBySlug(relatedSlug)
                                    const relatedSEO = getTemplateSEO(relatedSlug)
                                    if (!related && !relatedSEO) return null

                                    return (
                                        <Link
                                            key={relatedSlug}
                                            to={`/templates/${relatedSlug}`}
                                            className="block p-6 bg-white border rounded-xl hover:shadow-lg transition-shadow"
                                        >
                                            <span className="text-3xl">{related?.icon || '📋'}</span>
                                            <h3 className="font-semibold text-gray-900 mt-3 mb-1">
                                                {related?.name || relatedSEO?.h1}
                                            </h3>
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {related?.description || ''}
                                            </p>
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {/* All Templates Link */}
                <section className="py-8 border-t">
                    <div className="max-w-5xl mx-auto px-4 text-center">
                        <Link to="/templates" className="text-purple-600 hover:underline font-medium">
                            View All Templates →
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-400 py-8">
                    <div className="max-w-5xl mx-auto px-4 text-center text-sm">
                        <p>© {new Date().getFullYear()} CSV Cleaner. Clean your data before import.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}

// Templates Index Page for /templates
export function TemplatesIndex() {
    const allSlugs = Object.keys(TEMPLATE_SEO)

    return (
        <>
            <Helmet>
                <title>CSV Import Templates | Clean Data for Any Platform</title>
                <meta name="description" content="Free CSV templates for HubSpot, Salesforce, Shopify, Mailchimp, and more. Clean and validate your data before import." />
                <link rel="canonical" href="https://csvcleaner.app/templates" />
            </Helmet>

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="bg-white border-b">
                    <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                        <Link to="/" className="text-xl font-bold text-purple-600">
                            CSV Cleaner
                        </Link>
                        <Link to="/tool" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            Start Cleaning
                        </Link>
                    </div>
                </header>

                {/* Hero */}
                <section className="bg-gradient-to-r from-purple-600 to-blue-600 py-16">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            CSV Import Templates
                        </h1>
                        <p className="text-xl text-white/90">
                            Pre-built templates to clean and validate your CSV files for any platform.
                            Start with a template or build your own.
                        </p>
                    </div>
                </section>

                {/* Templates Grid */}
                <section className="max-w-6xl mx-auto px-4 py-12">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allSlugs.map((slug) => {
                            const template = getTemplateBySlug(slug)
                            const seoData = getTemplateSEO(slug)
                            
                            return (
                                <Link
                                    key={slug}
                                    to={`/templates/${slug}`}
                                    className="block p-6 bg-white border rounded-xl hover:shadow-lg hover:border-purple-200 transition-all"
                                >
                                    <div className="flex items-start gap-4">
                                        <span className="text-3xl">{template?.icon || '📋'}</span>
                                        <div className="flex-1">
                                            <h2 className="font-semibold text-gray-900 mb-1">
                                                {template?.name || seoData?.h1}
                                            </h2>
                                            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                                {template?.description || seoData?.problem?.slice(0, 100) + '...'}
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {template?.tags?.slice(0, 3).map((tag) => (
                                                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </section>

                {/* CTA */}
                <section className="py-12 bg-gray-100">
                    <div className="max-w-3xl mx-auto px-4 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            Don't See Your Platform?
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Use our universal template or create your own custom schema.
                        </p>
                        <Link
                            to="/tool"
                            className="inline-block px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                        >
                            Start with Blank Template
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="bg-gray-900 text-gray-400 py-8">
                    <div className="max-w-5xl mx-auto px-4 text-center text-sm">
                        <p>© {new Date().getFullYear()} CSV Cleaner. Clean your data before import.</p>
                    </div>
                </footer>
            </div>
        </>
    )
}
