import { CheckIcon } from './icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface LandingPageProps {
    onOpenWaitlist: () => void
    onTryNow: () => void
    onConcierge?: () => void
    onTemplates?: () => void
    onFullApp?: () => void
}

const steps = [
    {
        number: '01',
        title: 'Pick a CRM Template',
        description: 'Ready-made schemas for HubSpot, Salesforce, Shopify, Mailchimp. Skip the setup—start cleaning immediately.',
        icon: '📋',
    },
    {
        number: '02',
        title: 'Map Once, Reuse Forever',
        description: 'Smart column matching learns your messy exports. Save presets and clean the same import type in seconds next time.',
        icon: '🔗',
    },
    {
        number: '03',
        title: 'Export CRM-Ready Data',
        description: 'Download validated files that import without errors. 100% client-side—your data never touches our servers.',
        icon: '✨',
    },
]

const pricingPlans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        description: 'Try it out, no signup',
        features: [
            'Unlimited rows per file',
            'All 5 CRM templates',
            'Smart column mapping',
            'CSV export',
            '100% browser-based',
        ],
        cta: 'Start Cleaning',
        highlighted: false,
    },
    {
        name: 'Pro',
        price: '$29',
        period: '/month',
        description: 'For ops teams & agencies',
        features: [
            'Everything in Free',
            'Save custom templates',
            'Reusable mapping presets',
            'Excel & JSON export',
            'Run history & summaries',
            'Priority support',
        ],
        cta: 'Join Waitlist',
        highlighted: true,
    },
    {
        name: 'Team',
        price: '$99',
        period: '/month',
        description: 'For growing organizations',
        features: [
            'Everything in Pro',
            'Up to 10 team members',
            'Shared template library',
            'API access',
            'Webhook integrations',
            'SSO authentication',
        ],
        cta: 'Contact Sales',
        highlighted: false,
    },
]

const painPoints = [
    { stat: '4+ hrs', text: 'spent by ops teams reformatting each CSV before CRM import' },
    { stat: '67%', text: 'of CRM import failures come from column mismatches & bad data' },
    { stat: '∞', text: 'repeat cleanups eliminated when you save reusable templates' },
]

export default function LandingPage({ onOpenWaitlist, onTryNow }: LandingPageProps) {
    const { isAuthenticated, user, logout } = useAuth()
    
    return (
        <div className="text-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold">Ops CSV Cleaner</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <Link
                                to="/tool"
                                className="text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Free Tool
                            </Link>
                            <Link
                                to="/templates"
                                className="text-gray-400 hover:text-white transition-colors text-sm"
                            >
                                Templates
                            </Link>
                            {isAuthenticated && (
                                <Link
                                    to="/history"
                                    className="text-gray-400 hover:text-white transition-colors text-sm"
                                >
                                    History
                                </Link>
                            )}
                            {isAuthenticated ? (
                                <div className="flex items-center gap-3">
                                    <span className="text-sm text-gray-400">
                                        {user?.email}
                                        {(user?.plan === 'pro' || user?.plan === 'team') && (
                                            <span className="ml-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded">
                                                {user?.plan === 'team' ? 'TEAM' : 'PRO'}
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        onClick={logout}
                                        className="text-gray-400 hover:text-white transition-colors text-sm"
                                    >
                                        Logout
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-emerald-400 hover:text-emerald-300 transition-colors text-sm font-medium"
                                    >
                                        Sign In
                                    </Link>
                                    <button
                                        onClick={onOpenWaitlist}
                                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                                    >
                                        Join Waitlist
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        Built for Ops, RevOps & Agency teams
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                        Stop wasting hours{' '}
                        <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            cleaning CSVs
                        </span>{' '}
                        for CRM imports
                    </h1>

                    <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                        Pre-built templates for HubSpot, Salesforce, Shopify & Mailchimp.
                        Map once, reuse forever. <strong className="text-white">Your data never leaves your browser.</strong>
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            to="/tool"
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-lg font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all text-center"
                        >
                            🆓 Clean a CSV Free →
                        </Link>
                        <Link
                            to="/templates"
                            className="w-full sm:w-auto px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-lg font-medium border border-gray-700 transition-colors text-center"
                        >
                            📚 Browse CRM Templates
                        </Link>
                    </div>

                    {/* Trust badges */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            No signup required
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            100% browser-based
                        </div>
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Data never uploaded
                        </div>
                    </div>
                </div>
            </section>

            {/* Pain Points */}
            <section className="py-16 border-y border-gray-800/50 bg-gray-900/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {painPoints.map((point) => (
                            <div key={point.stat} className="text-center">
                                <div className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-2">
                                    {point.stat}
                                </div>
                                <p className="text-gray-400">{point.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Clean data in 3 simple steps
                        </h2>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            No more spreadsheet gymnastics. Go from messy import to clean data in under a minute.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {steps.map((step, index) => (
                            <div
                                key={step.number}
                                className="relative group"
                            >
                                {/* Connector line */}
                                {index < steps.length - 1 && (
                                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-gray-700 to-transparent" />
                                )}

                                <div className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-8 h-full hover:border-emerald-500/30 hover:bg-gray-900/80 transition-all duration-300">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="text-4xl">{step.icon}</div>
                                        <span className="text-6xl font-bold text-gray-800 group-hover:text-gray-700 transition-colors">
                                            {step.number}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                                    <p className="text-gray-400">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent via-emerald-950/10 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Built for ops teams who clean CSVs every week
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Real templates for real CRM imports—not a generic CSV tool
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '🔒', title: 'Privacy-First Processing', desc: 'Your CSV data never leaves your browser. No uploads, no servers, no security risks.' },
                            { icon: '📋', title: 'Real CRM Templates', desc: 'HubSpot, Salesforce, Shopify, Mailchimp—schemas that match what your CRM actually expects.' },
                            { icon: '🎯', title: 'Smart Column Matching', desc: 'Fuzzy matching auto-maps messy column names to clean field names. Review and adjust.' },
                            { icon: '✅', title: 'Validation That Matters', desc: 'Catch bad emails, invalid dates, missing required fields—before your CRM rejects them.' },
                            { icon: '💾', title: 'Save & Reuse Presets', desc: 'Save your mapping rules once. Clean the same vendor export format in seconds next time.' },
                            { icon: '📥', title: 'Clean Export Formats', desc: 'Download validated CSV ready for direct CRM import. Errors report included.' },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 hover:border-gray-700 transition-colors"
                            >
                                <div className="text-3xl mb-4">{feature.icon}</div>
                                <h3 className="font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Simple, transparent pricing
                        </h2>
                        <p className="text-gray-400 text-lg">
                            Start free, upgrade when you need more power
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {pricingPlans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative rounded-2xl p-8 ${plan.highlighted
                                    ? 'bg-gradient-to-b from-emerald-500/10 to-cyan-500/10 border-2 border-emerald-500/50'
                                    : 'bg-gray-900/50 border border-gray-800'
                                    }`}
                            >
                                {plan.highlighted && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full text-sm font-medium">
                                        Most Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-gray-400">{plan.period}</span>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3 text-sm">
                                            <CheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                                            <span className="text-gray-300">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={plan.name === 'Free' ? onTryNow : onOpenWaitlist}
                                    className={`w-full py-3 rounded-xl font-medium transition-all ${plan.highlighted
                                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:opacity-90'
                                        : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                                        }`}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-blue-500/10 border border-emerald-500/20 rounded-3xl p-12">
                        <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                            Ready to stop dreading CSV cleanup day?
                        </h2>
                        <p className="text-gray-400 text-lg mb-8 max-w-xl mx-auto">
                            Try the free tool now—no signup required. Or join 500+ ops teams on the waitlist for Pro features.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                to="/tool"
                                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-lg font-semibold shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 transition-all"
                            >
                                🆓 Clean a CSV Free
                            </Link>
                            <button
                                onClick={onOpenWaitlist}
                                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-xl text-lg font-medium border border-gray-700 transition-colors"
                            >
                                Join Pro Waitlist
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-gray-800/50">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <span className="font-medium">Ops CSV Cleaner</span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link to="/templates" className="hover:text-gray-300 transition-colors">Templates</Link>
                        <Link to="/tool" className="hover:text-gray-300 transition-colors">Free Tool</Link>
                    </div>
                    <p className="text-gray-500 text-sm">
                        © 2025 Ops CSV Cleaner. 100% privacy-first—your data never leaves your browser.
                    </p>
                </div>
            </footer>
        </div>
    )
}
