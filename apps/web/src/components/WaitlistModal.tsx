import { useState, useEffect } from 'react'
import { CloseIcon } from './icons'

interface WaitlistModalProps {
    isOpen: boolean
    onClose: () => void
}

interface WaitlistSubmission {
    id: string
    submittedAt: string
    email: string
    role: string
    companySize: string
    filesPerMonth: string
    biggestPain: string
    currentSolution: string
    willingToPay: string
    mostExcited: string
}

const STORAGE_KEY = 'csv_copilot_waitlist'

export default function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
    const [step, setStep] = useState(1)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        role: '',
        companySize: '',
        filesPerMonth: '',
        biggestPain: '',
        currentSolution: '',
        willingToPay: '',
        mostExcited: '',
    })

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const saveToLocalStorage = (data: WaitlistSubmission) => {
        const existing = localStorage.getItem(STORAGE_KEY)
        const submissions: WaitlistSubmission[] = existing ? JSON.parse(existing) : []
        submissions.push(data)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(submissions))
        console.log('Waitlist submissions:', submissions)
    }

    const handleSubmit = () => {
        setIsSubmitting(true)

        // Simulate submission delay
        setTimeout(() => {
            const submission: WaitlistSubmission = {
                id: crypto.randomUUID(),
                submittedAt: new Date().toISOString(),
                ...formData,
            }

            saveToLocalStorage(submission)
            setIsSubmitting(false)
            setIsSubmitted(true)
        }, 1000)
    }

    const handleClose = () => {
        onClose()
        // Reset state after animation
        setTimeout(() => {
            setStep(1)
            setIsSubmitted(false)
            setFormData({
                email: '',
                role: '',
                companySize: '',
                filesPerMonth: '',
                biggestPain: '',
                currentSolution: '',
                willingToPay: '',
                mostExcited: '',
            })
        }, 300)
    }

    const canProceed = () => {
        if (step === 1) return formData.email && formData.role && formData.companySize
        if (step === 2) return formData.filesPerMonth && formData.biggestPain && formData.currentSolution
        if (step === 3) return formData.willingToPay && formData.mostExcited
        return false
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <div>
                        <h2 className="text-xl font-bold text-white">Join the Waitlist</h2>
                        {!isSubmitted && (
                            <p className="text-sm text-gray-400 mt-1">Step {step} of 3</p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <CloseIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Progress Bar */}
                {!isSubmitted && (
                    <div className="h-1 bg-gray-800">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-300"
                            style={{ width: `${(step / 3) * 100}%` }}
                        />
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {isSubmitted ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-3">You're on the list! 🎉</h3>
                            <p className="text-gray-400 mb-6">
                                Thanks for joining! We'll be in touch soon with early access details and your 50% launch discount.
                            </p>
                            <button
                                onClick={handleClose}
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium text-white transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Step 1: About You */}
                            {step === 1 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Work email *
                                        </label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="you@company.com"
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            What's your role? *
                                        </label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => handleInputChange('role', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select your role</option>
                                            <option value="ops_manager">Operations Manager</option>
                                            <option value="customer_success">Customer Success</option>
                                            <option value="data_analyst">Data Analyst</option>
                                            <option value="developer">Developer / Engineer</option>
                                            <option value="product_manager">Product Manager</option>
                                            <option value="founder">Founder / Executive</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Company size *
                                        </label>
                                        <div className="grid grid-cols-3 gap-3">
                                            {['1-10', '11-50', '51-200', '201-500', '500+'].map((size) => (
                                                <button
                                                    key={size}
                                                    type="button"
                                                    onClick={() => handleInputChange('companySize', size)}
                                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${formData.companySize === size
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Current Pain */}
                            {step === 2 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            How many CSV files do you process monthly? *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['1-5', '6-20', '21-50', '50+'].map((count) => (
                                                <button
                                                    key={count}
                                                    type="button"
                                                    onClick={() => handleInputChange('filesPerMonth', count)}
                                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${formData.filesPerMonth === count
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                                        }`}
                                                >
                                                    {count} files
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            What's your biggest CSV import pain point? *
                                        </label>
                                        <select
                                            value={formData.biggestPain}
                                            onChange={(e) => handleInputChange('biggestPain', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select your biggest challenge</option>
                                            <option value="column_mapping">Column names don't match my system</option>
                                            <option value="data_formatting">Dates, numbers, or formats are inconsistent</option>
                                            <option value="duplicates">Duplicate or missing data</option>
                                            <option value="validation">Invalid data (emails, phones, etc.)</option>
                                            <option value="time_consuming">Takes too long to clean manually</option>
                                            <option value="customer_delays">Delays customer onboarding</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            What do you currently use to clean CSVs? *
                                        </label>
                                        <select
                                            value={formData.currentSolution}
                                            onChange={(e) => handleInputChange('currentSolution', e.target.value)}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        >
                                            <option value="">Select current solution</option>
                                            <option value="excel">Excel / Google Sheets</option>
                                            <option value="python">Python scripts</option>
                                            <option value="paid_tool">Paid tool (Flatfile, etc.)</option>
                                            <option value="manual">Manual copy/paste</option>
                                            <option value="none">Nothing - we accept messy data</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Interest Level */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            How much would you pay monthly for a tool that solves this? *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { value: 'free_only', label: 'Free only' },
                                                { value: 'under_25', label: 'Under $25' },
                                                { value: '25_50', label: '$25-$50' },
                                                { value: '50_100', label: '$50-$100' },
                                                { value: 'over_100', label: '$100+' },
                                            ].map((option) => (
                                                <button
                                                    key={option.value}
                                                    type="button"
                                                    onClick={() => handleInputChange('willingToPay', option.value)}
                                                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${formData.willingToPay === option.value
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                                        }`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            What feature would get you most excited? *
                                        </label>
                                        <textarea
                                            value={formData.mostExcited}
                                            onChange={(e) => handleInputChange('mostExcited', e.target.value)}
                                            placeholder="e.g., AI column mapping, validation rules, saved templates, API access..."
                                            rows={3}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
                                {step > 1 ? (
                                    <button
                                        onClick={() => setStep(step - 1)}
                                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        ← Back
                                    </button>
                                ) : (
                                    <div />
                                )}

                                {step < 3 ? (
                                    <button
                                        onClick={() => setStep(step + 1)}
                                        disabled={!canProceed()}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                                    >
                                        Continue →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!canProceed() || isSubmitting}
                                        className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Joining...
                                            </>
                                        ) : (
                                            'Join Waitlist 🚀'
                                        )}
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
