/**
 * Free Tool Page
 * No login required - clean 1 CSV and download output
 * Cannot save templates or run summaries
 */
import { useState, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import Papa from 'papaparse'
import { TargetField, validateRow, FieldType } from '../utils/validation'
import { generateMappingSuggestions } from '../utils/headerMatching'
import { exportCleanCSV, exportErrorCSV } from '../utils/csvExport'
import { ImportTemplate } from '../data/templates'
import ExportOptionsModal from './ExportOptionsModal'
import { UpgradeCTA } from './UpgradeCTA'
import { AIHelpButton } from './AIHelpButton'

interface FreeToolPageProps {
    onBack: () => void
    onViewTemplates: () => void
    initialTemplate?: ImportTemplate | null
}

type Step = 'upload' | 'schema' | 'mapping' | 'validate' | 'results'

interface ParsedCSV {
    fileName: string
    headers: string[]
    rows: string[][]
    totalRows: number
}

interface ValidationResult {
    rowIndex: number
    mappedData: Record<string, string>
    errors: Array<{ field: string; value: string; message: string }>
    isValid: boolean
}

const DEFAULT_FIELDS: TargetField[] = [
    { name: 'email', type: 'email', required: true },
    { name: 'first_name', type: 'string', required: true },
    { name: 'last_name', type: 'string', required: false },
    { name: 'company', type: 'string', required: false },
    { name: 'phone', type: 'string', required: false },
]

export default function FreeToolPage({ initialTemplate }: FreeToolPageProps) {
    const [step, setStep] = useState<Step>('upload')
    const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null)
    const [targetFields, setTargetFields] = useState<TargetField[]>(
        initialTemplate
            ? initialTemplate.schema.map(f => ({ name: f.name, type: f.type as FieldType, required: f.required }))
            : DEFAULT_FIELDS
    )
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [showExportModal, setShowExportModal] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Computed values
    const validRows = useMemo(() => validationResults.filter(r => r.isValid), [validationResults])
    const invalidRows = useMemo(() => validationResults.filter(r => !r.isValid), [validationResults])
    const allErrors = useMemo(() => invalidRows.flatMap(r =>
        r.errors.map(e => ({ ...e, rowIndex: r.rowIndex }))
    ), [invalidRows])

    // File Upload
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsProcessing(true)

        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as string[][]
                const headers = data[0] || []
                const rows = data.slice(1).filter(row => row.some(cell => cell.trim() !== ''))

                setParsedCSV({
                    fileName: file.name,
                    headers,
                    rows,
                    totalRows: rows.length,
                })

                // Auto-suggest mappings
                const targetFieldNames = targetFields.map(f => f.name)
                const rawSuggestions = generateMappingSuggestions(targetFieldNames, headers)
                // Extract just the suggestion strings for the mapping state
                const mappingRecord: Record<string, string> = {}
                for (const [key, value] of Object.entries(rawSuggestions)) {
                    if (value) {
                        mappingRecord[key] = value.suggestion
                    }
                }
                setMapping(mappingRecord)

                setStep('schema')
                setIsProcessing(false)
            },
            error: () => {
                setIsProcessing(false)
            }
        })
    }, [targetFields])

    // Schema management
    const addField = () => {
        setTargetFields([...targetFields, { name: '', type: 'string', required: false }])
    }

    const updateField = (index: number, updates: Partial<TargetField>) => {
        const updated = [...targetFields]
        updated[index] = { ...updated[index], ...updates }
        setTargetFields(updated)
    }

    const removeField = (index: number) => {
        setTargetFields(targetFields.filter((_, i) => i !== index))
    }

    const updateMapping = (targetField: string, sourceColumn: string) => {
        setMapping(prev => ({ ...prev, [targetField]: sourceColumn }))
    }

    // Validation
    const runValidation = () => {
        if (!parsedCSV) return

        const currentRows = parsedCSV.rows
        const currentHeaders = parsedCSV.headers
        const currentMapping = { ...mapping }
        const currentTargetFields = [...targetFields]

        setIsProcessing(true)
        setStep('validate')

        setTimeout(() => {
            try {
                const results: ValidationResult[] = []

                for (let i = 0; i < currentRows.length; i++) {
                    const row = currentRows[i]
                    const { mappedData, errors } = validateRow(
                        row,
                        currentHeaders,
                        currentMapping,
                        currentTargetFields
                    )

                    results.push({
                        rowIndex: i + 2,
                        mappedData,
                        errors: errors.map(e => ({ ...e, value: mappedData[e.field] || '' })),
                        isValid: errors.length === 0,
                    })
                }

                setValidationResults(results)
                setStep('results')
            } catch (error) {
                console.error('Validation error:', error)
            } finally {
                setIsProcessing(false)
            }
        }, 10)
    }

    // Export handlers
    const handleExportClean = () => {
        const fieldNames = targetFields.map(f => f.name)
        exportCleanCSV(validRows, fieldNames, 'clean_export.csv')
    }

    const handleExportErrors = () => {
        const fieldNames = targetFields.map(f => f.name)
        exportErrorCSV(
            invalidRows.map(r => ({ ...r, errors: r.errors })),
            fieldNames,
            'errors_export.csv'
        )
    }

    const resetTool = () => {
        setParsedCSV(null)
        setMapping({})
        setValidationResults([])
        setStep('upload')
        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    // State for upgrade prompt
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)

    const handleSaveTemplateClick = () => {
        setShowUpgradePrompt(true)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Upgrade Prompt Modal */}
            {showUpgradePrompt && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradePrompt(false)}>
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-md text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-4xl mb-4">⭐</div>
                        <h3 className="text-xl font-bold mb-2">Save Templates with Pro</h3>
                        <p className="text-gray-400 mb-6">
                            Upgrade to Pro to save your schema and mappings. Reuse them instantly on future imports—no re-mapping needed.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowUpgradePrompt(false)}
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Maybe Later
                            </button>
                            <Link
                                to="/#pricing"
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg font-medium hover:opacity-90 transition-opacity text-center"
                            >
                                View Pro Plans
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                                ← Home
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2">
                                    Ops CSV Cleaner
                                    <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">FREE</span>
                                </h1>
                                <p className="text-sm text-gray-400">No login required • 100% browser-based • Data never uploaded</p>
                            </div>
                        </div>

                        {/* Step Indicator */}
                        <div className="hidden sm:flex items-center gap-1">
                            {(['upload', 'schema', 'mapping', 'validate', 'results'] as Step[]).map((s, i) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${step === s
                                        ? 'bg-emerald-500 text-white'
                                        : i < ['upload', 'schema', 'mapping', 'validate', 'results'].indexOf(step)
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-gray-800 text-gray-500'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    {i < 4 && <div className={`w-4 h-0.5 ${i < ['upload', 'schema', 'mapping', 'validate', 'results'].indexOf(step)
                                        ? 'bg-emerald-500/50'
                                        : 'bg-gray-800'
                                        }`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Free Tool Notice */}
                <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🔒</span>
                            <div>
                                <p className="font-medium">Privacy-First Processing</p>
                                <p className="text-sm text-gray-400">Your CSV data never leaves your browser. All validation happens locally.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link
                                to="/templates"
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                            >
                                📚 CRM Templates
                            </Link>
                            <button
                                onClick={handleSaveTemplateClick}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                            >
                                💾 Save Template
                                <span className="text-xs text-amber-400">PRO</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 max-w-lg w-full text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold mb-2">Upload Your CSV</h2>
                            <p className="text-gray-400 text-sm mb-6">
                                {initialTemplate
                                    ? `Using template: ${initialTemplate.name}`
                                    : 'Select a CSV file to start cleaning'
                                }
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isProcessing}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Parsing...' : 'Select CSV File'}
                            </button>

                            {initialTemplate && (
                                <div className="mt-6 pt-6 border-t border-gray-800">
                                    <a
                                        href={initialTemplate.sampleFile}
                                        download
                                        className="text-emerald-400 hover:underline text-sm"
                                    >
                                        📥 Download sample {initialTemplate.name} CSV
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Schema */}
                {step === 'schema' && parsedCSV && (
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="font-medium">{parsedCSV.fileName}</span>
                                    <span className="text-gray-400 text-sm ml-2">
                                        ({parsedCSV.totalRows.toLocaleString()} rows, {parsedCSV.headers.length} columns)
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                <h3 className="font-semibold">Target Schema</h3>
                                <button
                                    onClick={addField}
                                    className="text-sm text-emerald-400 hover:text-emerald-300"
                                >
                                    + Add Field
                                </button>
                            </div>
                            <div className="divide-y divide-gray-800">
                                {targetFields.map((field, index) => (
                                    <div key={index} className="px-6 py-3 flex items-center gap-4">
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => updateField(index, { name: e.target.value })}
                                            placeholder="field_name"
                                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                                        />
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(index, { type: e.target.value as FieldType })}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm"
                                        >
                                            <option value="string">String</option>
                                            <option value="email">Email</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(index, { required: e.target.checked })}
                                                className="rounded"
                                            />
                                            Required
                                        </label>
                                        <button
                                            onClick={() => removeField(index)}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                onClick={() => setStep('mapping')}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
                            >
                                Continue to Mapping →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Mapping */}
                {step === 'mapping' && parsedCSV && (
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Map Columns</h3>
                                    <p className="text-sm text-gray-400">Match your CSV columns to target fields</p>
                                </div>
                                <AIHelpButton
                                    type="mapping"
                                    data={parsedCSV.rows.slice(0, 10).map((row) => {
                                        const obj: Record<string, unknown> = {}
                                        parsedCSV.headers.forEach((h, j) => { obj[h] = row[j] })
                                        return obj
                                    })}
                                    headers={parsedCSV.headers}
                                    targetSchema={targetFields.map(f => f.name)}
                                    onSuggestion={(suggestions) => {
                                        if (suggestions && typeof suggestions === 'object' && 'mappings' in suggestions) {
                                            const mappings = (suggestions as { mappings: Record<string, string> }).mappings
                                            setMapping(prev => ({ ...prev, ...mappings }))
                                        }
                                    }}
                                />
                            </div>
                            <div className="divide-y divide-gray-800">
                                {targetFields.filter(f => f.name.trim()).map((field) => (
                                    <div key={field.name} className="px-6 py-3 flex items-center gap-4">
                                        <div className="w-1/3">
                                            <span className="font-mono text-sm">{field.name}</span>
                                            {field.required && <span className="text-red-400 ml-1">*</span>}
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <select
                                            value={mapping[field.name] || ''}
                                            onChange={(e) => updateMapping(field.name, e.target.value)}
                                            className={`flex-1 px-3 py-2 bg-gray-800 border rounded-lg text-sm ${mapping[field.name] ? 'border-emerald-500/50' : 'border-gray-700'}`}
                                        >
                                            <option value="">— Select source column —</option>
                                            {parsedCSV.headers.map((h, i) => (
                                                <option key={i} value={h}>{h || `Column ${i + 1}`}</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep('schema')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={runValidation}
                                disabled={isProcessing}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                {isProcessing ? 'Validating...' : 'Validate Data →'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Validating */}
                {step === 'validate' && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 max-w-md w-full text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold mb-2">Validating Data...</h2>
                            <p className="text-gray-400 text-sm">
                                Processing {parsedCSV?.totalRows.toLocaleString()} rows
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 5: Results */}
                {step === 'results' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold">{validationResults.length}</div>
                                <div className="text-sm text-gray-400">Total Rows</div>
                            </div>
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-emerald-400">{validRows.length}</div>
                                <div className="text-sm text-gray-400">Valid</div>
                            </div>
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-red-400">{invalidRows.length}</div>
                                <div className="text-sm text-gray-400">Invalid</div>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold text-amber-400">{allErrors.length}</div>
                                <div className="text-sm text-gray-400">Errors</div>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                            <h3 className="font-semibold mb-4">Export Results</h3>
                            <div className="flex gap-4 mb-4">
                                <button
                                    onClick={handleExportClean}
                                    disabled={validRows.length === 0}
                                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    📥 Download Clean CSV ({validRows.length} rows)
                                </button>
                                <button
                                    onClick={handleExportErrors}
                                    disabled={invalidRows.length === 0}
                                    className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    📥 Download Errors ({invalidRows.length} rows)
                                </button>
                            </div>
                            {/* Advanced Export */}
                            <button
                                onClick={() => setShowExportModal(true)}
                                disabled={validRows.length === 0}
                                className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                🔗 Advanced Export (Sheets / Webhook)
                            </button>
                        </div>

                        {/* Error Preview */}
                        {allErrors.length > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                                    <h3 className="font-semibold">Error Details (first 10)</h3>
                                    <AIHelpButton
                                        type="validation"
                                        data={parsedCSV?.rows.slice(0, 10).map((row) => {
                                            const obj: Record<string, unknown> = {}
                                            parsedCSV?.headers.forEach((h, j) => { obj[h] = row[j] })
                                            return obj
                                        }) || []}
                                        headers={parsedCSV?.headers || []}
                                        errors={allErrors.slice(0, 5).map(e => ({
                                            row: e.rowIndex,
                                            column: e.field,
                                            type: 'validation_error',
                                            message: e.message
                                        }))}
                                    />
                                </div>
                                <div className="divide-y divide-gray-800 max-h-64 overflow-auto">
                                    {allErrors.slice(0, 10).map((error, i) => (
                                        <div key={i} className="px-6 py-3 flex items-center gap-4 text-sm">
                                            <span className="text-gray-500">Row {error.rowIndex}</span>
                                            <span className="font-mono text-amber-400">{error.field}</span>
                                            <span className="text-gray-400">{error.message}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upgrade CTA */}
                        <div className="mt-6">
                            <UpgradeCTA 
                                feature="unlimited-runs" 
                                currentUsage={1} 
                                limit={10} 
                            />
                        </div>

                        {/* Reset */}
                        <div className="text-center">
                            <button
                                onClick={resetTool}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg font-medium transition-colors"
                            >
                                🔄 Clean Another File
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Export Options Modal */}
            <ExportOptionsModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                rows={validRows}
                fieldNames={targetFields.map(f => f.name)}
                fileName={parsedCSV?.fileName?.replace('.csv', '') || 'export'}
            />
        </div>
    )
}
