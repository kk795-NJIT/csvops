import { useState, useRef } from 'react'
import Papa from 'papaparse'

interface CSVImporterProps {
    onBack: () => void
}

interface CSVData {
    headers: string[]
    rows: string[][]
    rowCount: number
}

export default function CSVImporter({ onBack }: CSVImporterProps) {
    const [csvData, setCsvData] = useState<CSVData | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImportClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        setError(null)

        Papa.parse(file, {
            complete: (results) => {
                const data = results.data as string[][]
                if (data.length > 0) {
                    setCsvData({
                        headers: data[0],
                        rows: data.slice(1).filter(row => row.some(cell => cell.trim() !== '')),
                        rowCount: data.length - 1,
                    })
                }
                setIsLoading(false)
            },
            error: (err) => {
                setError(err.message)
                setIsLoading(false)
            },
        })

        event.target.value = ''
    }

    const handleReset = () => {
        setCsvData(null)
        setError(null)
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <h1 className="text-lg font-bold">CSV Import Copilot</h1>
                                <p className="text-xs text-gray-400">Free Demo</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {!csvData ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-12 max-w-xl w-full text-center">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                                <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3">
                                Import Your CSV File
                            </h2>
                            <p className="text-gray-400 mb-8">
                                Upload a CSV file to parse and validate it instantly in your browser.
                                Your data never leaves your device.
                            </p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            <button
                                onClick={handleImportClick}
                                disabled={isLoading}
                                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-xl text-lg font-semibold shadow-xl shadow-emerald-500/25 hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        Upload CSV
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">CSV Preview</h2>
                                <p className="text-gray-400">
                                    {csvData.rowCount} rows × {csvData.headers.length} columns
                                </p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Import Another
                            </button>
                        </div>

                        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-900">
                                            {csvData.headers.map((header, i) => (
                                                <th key={i} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                                                    {header || `Column ${i + 1}`}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {csvData.rows.slice(0, 100).map((row, rowIndex) => (
                                            <tr key={rowIndex} className="hover:bg-gray-800/50 transition-colors">
                                                {row.map((cell, cellIndex) => (
                                                    <td key={cellIndex} className="px-4 py-3 text-sm whitespace-nowrap">
                                                        {cell || <span className="text-gray-600 italic">empty</span>}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {csvData.rows.length > 100 && (
                                <div className="p-4 text-center text-sm text-gray-500 bg-gray-900 border-t border-gray-800">
                                    Showing first 100 of {csvData.rows.length} rows
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
