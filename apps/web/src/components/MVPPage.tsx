import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import Papa from 'papaparse'
import { TargetField, validateRow, FieldType } from '../utils/validation'
import { generateMappingSuggestions } from '../utils/headerMatching'
import { exportCleanCSV, exportErrorCSV } from '../utils/csvExport'
import api, { Template, SchemaField } from '../api/client'
import UsageBanner from './UsageBanner'

interface MVPPageProps {
    onBack: () => void
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

export default function MVPPage({ onBack }: MVPPageProps) {
    const [step, setStep] = useState<Step>('upload')
    const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null)
    const [targetFields, setTargetFields] = useState<TargetField[]>(DEFAULT_FIELDS)
    const [mapping, setMapping] = useState<Record<string, string>>({})
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Template state
    const [templates, setTemplates] = useState<Template[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
    const [templateName, setTemplateName] = useState('')
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

    // Load templates on mount
    useEffect(() => {
        api.listTemplates()
            .then(setTemplates)
            .catch(err => console.error('Failed to load templates:', err))
    }, [])

    // Load template handler
    const handleLoadTemplate = useCallback((templateId: number) => {
        const template = templates.find(t => t.id === templateId)
        if (!template) return

        setSelectedTemplateId(templateId)
        setTargetFields(template.schema_json.map((f: { name: string; type: string; required: boolean }) => ({
            name: f.name,
            type: f.type as FieldType,
            required: f.required,
        })))
        // Load mapping from preset if available, otherwise empty
        setMapping({})
    }, [templates])

    // Save template handler
    const handleSaveTemplate = useCallback(async () => {
        if (!templateName.trim()) return

        setSaveStatus('saving')
        try {
            const schemaFields: SchemaField[] = targetFields
                .filter(f => f.name.trim())
                .map(f => ({
                    name: f.name,
                    type: f.type,
                    required: f.required,
                }))

            const newTemplate = await api.createTemplate({
                name: templateName,
                schema_json: schemaFields,
            })

            setTemplates(prev => [...prev, newTemplate])
            setSelectedTemplateId(newTemplate.id)
            setSaveStatus('saved')
            setTimeout(() => {
                setShowSaveModal(false)
                setSaveStatus('idle')
            }, 1500)
        } catch (err) {
            console.error('Failed to save template:', err)
            setSaveStatus('error')
        }
    }, [templateName, targetFields, mapping])

    // Save run summary to backend
    const saveRunSummary = useCallback(async (
        results: ValidationResult[],
        durationMs: number
    ) => {
        if (!parsedCSV) return

        const validCount = results.filter(r => r.isValid).length
        const invalidCount = results.filter(r => !r.isValid).length
        const allErrors = results.flatMap(r => r.errors)
        const errorCount = allErrors.length

        // Count errors by field
        const errorSummary: Record<string, number> = {}
        allErrors.forEach(e => {
            errorSummary[e.field] = (errorSummary[e.field] || 0) + 1
        })

        try {
            await api.createRun({
                template_id: selectedTemplateId || undefined,
                file_name: parsedCSV.fileName,
                total_rows: results.length,
                valid_rows: validCount,
                invalid_rows: invalidCount,
                error_count: errorCount,
                error_summary: errorSummary,
                duration_ms: durationMs,
            })
        } catch (err) {
            console.error('Failed to save run summary:', err)
        }
    }, [parsedCSV, selectedTemplateId])

    // Computed values
    const validRows = useMemo(() => validationResults.filter(r => r.isValid), [validationResults])
    const invalidRows = useMemo(() => validationResults.filter(r => !r.isValid), [validationResults])
    const allErrors = useMemo(() => invalidRows.flatMap(r =>
        r.errors.map(e => ({ ...e, rowIndex: r.rowIndex }))
    ), [invalidRows])

    // Step 1: File Upload
    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsProcessing(true)

        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as string[][]
                const headers = data[0] || []
                const rows = data.slice(1).filter(row => row.some(cell => cell?.trim()))

                setParsedCSV({
                    fileName: file.name,
                    headers,
                    rows,
                    totalRows: rows.length,
                })
                setIsProcessing(false)
                setStep('schema')
            },
            error: () => {
                setIsProcessing(false)
            },
        })

        event.target.value = ''
    }, [])

    // Step 2: Schema definition helpers
    const addField = () => {
        setTargetFields([...targetFields, { name: '', type: 'string', required: false }])
    }

    const updateField = (index: number, updates: Partial<TargetField>) => {
        const updated = [...targetFields]
        updated[index] = { ...updated[index], ...updates }
        setTargetFields(updated)
    }

    const removeField = (index: number) => {
        if (targetFields.length > 1) {
            setTargetFields(targetFields.filter((_, i) => i !== index))
        }
    }

    const proceedToMapping = () => {
        if (!parsedCSV) return

        // Generate suggestions using Fuse.js
        const fieldNames = targetFields.filter(f => f.name.trim()).map(f => f.name)
        const suggestions = generateMappingSuggestions(fieldNames, parsedCSV.headers)

        // Initialize mapping with suggestions
        const initialMapping: Record<string, string> = {}
        for (const [target, suggestion] of Object.entries(suggestions)) {
            if (suggestion) {
                initialMapping[target] = suggestion.suggestion
            }
        }
        setMapping(initialMapping)
        setStep('mapping')
    }

    // Step 3: Mapping helpers
    const updateMapping = (targetField: string, sourceHeader: string) => {
        setMapping(prev => ({
            ...prev,
            [targetField]: sourceHeader,
        }))
    }

    // Step 4: Validation - using setTimeout to ensure state is captured properly
    const runValidation = () => {
        if (!parsedCSV) return

        // Capture current state values before async operation
        const currentRows = parsedCSV.rows
        const currentHeaders = parsedCSV.headers
        const currentMapping = { ...mapping }
        const currentTargetFields = [...targetFields]
        const startTime = Date.now()

        setIsProcessing(true)

        // Use setTimeout to allow React to update UI before processing
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

                const durationMs = Date.now() - startTime
                setValidationResults(results)
                setStep('results')

                // Save run summary to backend
                saveRunSummary(results, durationMs)
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

    const handleStartOver = () => {
        setStep('upload')
        setParsedCSV(null)
        setTargetFields(DEFAULT_FIELDS)
        setMapping({})
        setValidationResults([])
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onBack}
                                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <div>
                                <h1 className="text-lg font-bold">CSV Import MVP</h1>
                                <p className="text-xs text-gray-400">Upload → Schema → Map → Validate → Export</p>
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
                {/* Usage Banner */}
                <UsageBanner />

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
                                Select a CSV file to start the import process
                            </p>

                            {/* Template Dropdown */}
                            {templates.length > 0 && (
                                <div className="mb-6">
                                    <label className="block text-sm text-gray-400 mb-2">Load Template</label>
                                    <select
                                        value={selectedTemplateId || ''}
                                        onChange={(e) => e.target.value && handleLoadTemplate(Number(e.target.value))}
                                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="">— Start fresh —</option>
                                        {templates.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

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

                            <p className="text-gray-500 text-xs mt-4">
                                Try with <a href="/sample.csv" download className="text-emerald-400 hover:underline">sample.csv</a>
                            </p>
                        </div>
                    </div>
                )}

                {/* Step 2: Schema Definition */}
                {step === 'schema' && parsedCSV && (
                    <div className="space-y-6">
                        {/* File Summary */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="font-medium">{parsedCSV.fileName}</div>
                                        <div className="text-sm text-gray-400">{parsedCSV.totalRows.toLocaleString()} rows, {parsedCSV.headers.length} columns</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-800 bg-gray-900">
                                <h3 className="font-medium">Preview (first 20 rows)</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-800/50">
                                            {parsedCSV.headers.map((h, i) => (
                                                <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-400 uppercase">
                                                    {h || `Col ${i + 1}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {parsedCSV.rows.slice(0, 20).map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-800/30">
                                                {row.map((cell, j) => (
                                                    <td key={j} className="px-3 py-2 text-gray-300 whitespace-nowrap max-w-[200px] truncate">
                                                        {cell || <span className="text-gray-600">—</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Target Schema */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <h3 className="font-medium mb-4">Define Target Schema</h3>
                            <div className="space-y-3">
                                {targetFields.map((field, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            value={field.name}
                                            onChange={(e) => updateField(i, { name: e.target.value })}
                                            placeholder="Field name"
                                            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        />
                                        <select
                                            value={field.type}
                                            onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
                                            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        >
                                            <option value="string">Text</option>
                                            <option value="email">Email</option>
                                            <option value="number">Number</option>
                                            <option value="date">Date</option>
                                        </select>
                                        <label className="flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={field.required}
                                                onChange={(e) => updateField(i, { required: e.target.checked })}
                                                className="rounded bg-gray-800 border-gray-700 text-emerald-500 focus:ring-emerald-500"
                                            />
                                            Required
                                        </label>
                                        {targetFields.length > 1 && (
                                            <button
                                                onClick={() => removeField(i)}
                                                className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={addField}
                                className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add field
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-between">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={proceedToMapping}
                                disabled={targetFields.every(f => !f.name.trim())}
                                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                            >
                                Continue to Mapping →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Column Mapping */}
                {step === 'mapping' && parsedCSV && (
                    <div className="space-y-6">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                            <h3 className="font-medium mb-4">Map Columns</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Match your target fields to source columns. We've auto-suggested matches where possible.
                            </p>
                            <div className="space-y-3">
                                {targetFields.filter(f => f.name.trim()).map((field) => (
                                    <div key={field.name} className="flex items-center gap-4">
                                        <div className="w-1/3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{field.name}</span>
                                                {field.required && <span className="text-xs text-red-400">*</span>}
                                                <span className="text-xs text-gray-500">({field.type})</span>
                                            </div>
                                        </div>
                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <select
                                            value={mapping[field.name] || ''}
                                            onChange={(e) => updateMapping(field.name, e.target.value)}
                                            className={`flex-1 px-3 py-2 bg-gray-800 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 ${mapping[field.name] ? 'border-emerald-500/50' : 'border-gray-700'
                                                }`}
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

                        {/* Actions */}
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setStep('schema')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setShowSaveModal(true)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    💾 Save Template
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
                    </div>
                )}

                {/* Save Template Modal */}
                {showSaveModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
                        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                            <h3 className="text-lg font-bold mb-4">Save Template</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Save your schema and mapping as a reusable template.
                            </p>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Template name (e.g., Customer Import)"
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSaveModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveTemplate}
                                    disabled={!templateName.trim() || saveStatus === 'saving'}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                                >
                                    {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? '✓ Saved!' : 'Save Template'}
                                </button>
                            </div>
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
                            <p className="text-gray-400 text-sm mb-4">
                                Processing {parsedCSV?.totalRows.toLocaleString()} rows
                            </p>
                            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Results */}
                {step === 'results' && (
                    <div className="space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-center">
                                <div className="text-2xl font-bold">{allErrors.length}</div>
                                <div className="text-sm text-gray-400">Errors</div>
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleExportClean}
                                disabled={validRows.length === 0}
                                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Clean CSV ({validRows.length} rows)
                            </button>
                            <button
                                onClick={handleExportErrors}
                                disabled={invalidRows.length === 0}
                                className="px-6 py-3 bg-red-500/80 hover:bg-red-500 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Export Errors CSV ({invalidRows.length} rows)
                            </button>
                        </div>

                        {/* Error Table */}
                        {allErrors.length > 0 && (
                            <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 border-b border-gray-800 bg-gray-900">
                                    <h3 className="font-medium">Error Details (first 100)</h3>
                                </div>
                                <div className="overflow-x-auto max-h-96">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-800/50 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Row</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Field</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Value</th>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-400">Error</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-800">
                                            {allErrors.slice(0, 100).map((error, i) => (
                                                <tr key={i} className="hover:bg-gray-800/30">
                                                    <td className="px-3 py-2 text-gray-400">{error.rowIndex}</td>
                                                    <td className="px-3 py-2 font-medium">{error.field}</td>
                                                    <td className="px-3 py-2 text-gray-400 max-w-[200px] truncate">
                                                        {error.value || <span className="italic">empty</span>}
                                                    </td>
                                                    <td className="px-3 py-2 text-red-400">{error.message}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Start Over */}
                        <div className="text-center pt-4">
                            <button
                                onClick={handleStartOver}
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Start New Import
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
