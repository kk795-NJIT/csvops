import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import { generateMappingWorksheet, generateSummaryReport, downloadFile } from '../utils/conciergeUtils'

interface ConciergePageProps {
    onBack: () => void
}

interface SourceCSV {
    fileName: string
    headers: string[]
    sampleRows: string[][]
    totalRows: number
}

export default function ConciergePage({ onBack }: ConciergePageProps) {
    const [step, setStep] = useState<'upload' | 'schema' | 'generate'>('upload')
    const [sourceCSV, setSourceCSV] = useState<SourceCSV | null>(null)
    const [targetColumns, setTargetColumns] = useState<string[]>([''])
    const [isProcessing, setIsProcessing] = useState(false)
    const [generatedFiles, setGeneratedFiles] = useState<{ mapping: string; report: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsProcessing(true)

        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as string[][]
                if (data.length > 0) {
                    setSourceCSV({
                        fileName: file.name,
                        headers: data[0],
                        sampleRows: data.slice(1, 6).filter(row => row.some(cell => cell?.trim())),
                        totalRows: data.length - 1,
                    })
                    setStep('schema')
                }
                setIsProcessing(false)
            },
            error: () => {
                setIsProcessing(false)
            },
        })

        event.target.value = ''
    }, [])

    const addTargetColumn = () => {
        setTargetColumns([...targetColumns, ''])
    }

    const updateTargetColumn = (index: number, value: string) => {
        const updated = [...targetColumns]
        updated[index] = value
        setTargetColumns(updated)
    }

    const removeTargetColumn = (index: number) => {
        if (targetColumns.length > 1) {
            setTargetColumns(targetColumns.filter((_, i) => i !== index))
        }
    }

    const handleGenerate = () => {
        if (!sourceCSV) return

        const validTargetColumns = targetColumns.filter(col => col.trim() !== '')
        if (validTargetColumns.length === 0) return

        const mappingCSV = generateMappingWorksheet(sourceCSV.headers, validTargetColumns)
        const report = generateSummaryReport(sourceCSV, validTargetColumns)

        setGeneratedFiles({ mapping: mappingCSV, report })
        setStep('generate')
    }

    const handleDownloadMapping = () => {
        if (generatedFiles) {
            downloadFile(generatedFiles.mapping, 'mapping_worksheet.csv', 'text/csv')
        }
    }

    const handleDownloadReport = () => {
        if (generatedFiles) {
            downloadFile(generatedFiles.report, 'summary_report.txt', 'text/plain')
        }
    }

    const handleStartOver = () => {
        setStep('upload')
        setSourceCSV(null)
        setTargetColumns([''])
        setGeneratedFiles(null)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                                <h1 className="text-lg font-bold">Concierge Mode</h1>
                                <p className="text-xs text-gray-400">Upload → Define Schema → Get Mapping Files</p>
                            </div>
                        </div>

                        {/* Progress Indicator */}
                        <div className="flex items-center gap-2">
                            {['upload', 'schema', 'generate'].map((s, i) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === s
                                            ? 'bg-emerald-500 text-white'
                                            : i < ['upload', 'schema', 'generate'].indexOf(step)
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-gray-800 text-gray-500'
                                        }`}>
                                        {i + 1}
                                    </div>
                                    {i < 2 && <div className={`w-8 h-0.5 ${i < ['upload', 'schema', 'generate'].indexOf(step) ? 'bg-emerald-500/50' : 'bg-gray-800'
                                        }`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Step 1: Upload */}
                {step === 'upload' && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 max-w-xl w-full text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Upload Your Source CSV</h2>
                            <p className="text-gray-400 mb-8">
                                Start by uploading the CSV file you want to transform. We'll analyze the columns and help you create a mapping plan.
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
                                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-lg font-semibold shadow-xl shadow-purple-500/25 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isProcessing ? 'Analyzing...' : 'Select CSV File'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Define Target Schema */}
                {step === 'schema' && sourceCSV && (
                    <div className="space-y-8">
                        {/* Source Summary */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <span className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs">✓</span>
                                Source File: {sourceCSV.fileName}
                            </h3>
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-gray-400">Total Rows</div>
                                    <div className="text-xl font-semibold">{sourceCSV.totalRows.toLocaleString()}</div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                    <div className="text-gray-400">Columns Found</div>
                                    <div className="text-xl font-semibold">{sourceCSV.headers.length}</div>
                                </div>
                            </div>
                            <div className="text-sm">
                                <div className="text-gray-400 mb-2">Source Columns:</div>
                                <div className="flex flex-wrap gap-2">
                                    {sourceCSV.headers.map((header, i) => (
                                        <span key={i} className="px-3 py-1 bg-gray-800 rounded-full text-gray-300">
                                            {header || `(Column ${i + 1})`}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Target Schema */}
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-2">Define Your Target Schema</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Enter the column names you want in your final output. We'll create a mapping worksheet to help you match source to target.
                            </p>

                            <div className="space-y-3">
                                {targetColumns.map((col, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
                                        <input
                                            type="text"
                                            value={col}
                                            onChange={(e) => updateTargetColumn(i, e.target.value)}
                                            placeholder="e.g., customer_email, first_name, phone"
                                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        />
                                        {targetColumns.length > 1 && (
                                            <button
                                                onClick={() => removeTargetColumn(i)}
                                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={addTargetColumn}
                                className="mt-4 flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Add another column
                            </button>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                            <button
                                onClick={() => setStep('upload')}
                                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                            >
                                ← Back
                            </button>
                            <button
                                onClick={handleGenerate}
                                disabled={targetColumns.every(col => col.trim() === '')}
                                className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                            >
                                Generate Mapping Files →
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Download Files */}
                {step === 'generate' && generatedFiles && sourceCSV && (
                    <div className="space-y-8">
                        <div className="text-center py-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">Your Files Are Ready! 🎉</h2>
                            <p className="text-gray-400 max-w-md mx-auto">
                                Download these files to plan your data transformation. Fill out the mapping worksheet and use the summary report as your guide.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mapping Worksheet */}
                            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Mapping Worksheet</h3>
                                        <p className="text-gray-400 text-sm">A blank table to define column mappings</p>
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-sm font-mono text-gray-400 overflow-x-auto">
                                    <pre>{generatedFiles.mapping.slice(0, 200)}...</pre>
                                </div>
                                <button
                                    onClick={handleDownloadMapping}
                                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download mapping_worksheet.csv
                                </button>
                            </div>

                            {/* Summary Report */}
                            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Summary Report</h3>
                                        <p className="text-gray-400 text-sm">Analysis of your source file</p>
                                    </div>
                                </div>
                                <div className="bg-gray-800/50 rounded-lg p-4 mb-4 text-sm font-mono text-gray-400 overflow-x-auto max-h-32">
                                    <pre>{generatedFiles.report.slice(0, 300)}...</pre>
                                </div>
                                <button
                                    onClick={handleDownloadReport}
                                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 rounded-xl font-medium text-gray-900 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Download summary_report.txt
                                </button>
                            </div>
                        </div>

                        {/* Start Over */}
                        <div className="text-center pt-8">
                            <button
                                onClick={handleStartOver}
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl font-medium transition-colors"
                            >
                                Start Over with New File
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
