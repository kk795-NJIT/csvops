/**
 * Export Options Modal
 * Google Sheets export + Webhook export with security warnings
 */
import { useState, useEffect } from 'react'
import {
    generateSheetsCompatibleCSV,
    rowsToJSON,
    sendToWebhook,
    GOOGLE_APPS_SCRIPT_TEMPLATE,
    downloadFile,
} from '../utils/advancedExport'
import { api, WebhookConfig } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface ExportOptionsModalProps {
    isOpen: boolean
    onClose: () => void
    rows: Array<{ mappedData: Record<string, string> }>
    fieldNames: string[]
    fileName?: string
}

type ExportTab = 'sheets' | 'webhook'
type WebhookMode = 'client' | 'server'

export default function ExportOptionsModal({
    isOpen,
    onClose,
    rows,
    fieldNames,
    fileName = 'export',
}: ExportOptionsModalProps) {
    const { user, isAuthenticated } = useAuth()
    const [activeTab, setActiveTab] = useState<ExportTab>('sheets')
    const [webhookMode, setWebhookMode] = useState<WebhookMode>('client')
    const [webhookUrl, setWebhookUrl] = useState('')
    const [includeMetadata, setIncludeMetadata] = useState(true)
    const [webhookStatus, setWebhookStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
    const [webhookMessage, setWebhookMessage] = useState('')
    const [showScript, setShowScript] = useState(false)
    const [securityAcknowledged, setSecurityAcknowledged] = useState(false)
    
    // Server-side webhook state
    const [savedWebhooks, setSavedWebhooks] = useState<WebhookConfig[]>([])
    const [selectedWebhookId, setSelectedWebhookId] = useState<number | null>(null)
    const [loadingWebhooks, setLoadingWebhooks] = useState(false)
    
    const isPro = user?.plan === 'pro' || user?.plan === 'team'

    // Load saved webhooks for Pro users
    useEffect(() => {
        if (isOpen && isPro && isAuthenticated) {
            loadSavedWebhooks()
        }
    }, [isOpen, isPro, isAuthenticated])

    const loadSavedWebhooks = async () => {
        setLoadingWebhooks(true)
        try {
            const webhooks = await api.listWebhooks()
            setSavedWebhooks(webhooks)
            if (webhooks.length > 0) {
                setSelectedWebhookId(webhooks[0].id)
                setWebhookMode('server')
            }
        } catch {
            // Ignore errors - user might not have webhook access
        } finally {
            setLoadingWebhooks(false)
        }
    }

    if (!isOpen) return null

    const handleSheetsDownload = () => {
        const csv = generateSheetsCompatibleCSV(rows, fieldNames)
        downloadFile(csv, `${fileName}_sheets.csv`, 'text/csv;charset=utf-8')
    }

    const handleDownloadScript = () => {
        downloadFile(GOOGLE_APPS_SCRIPT_TEMPLATE, 'import_csv.gs', 'text/plain')
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const handleWebhookSend = async () => {
        // Server-side webhook for Pro users
        if (isPro && webhookMode === 'server') {
            if (!selectedWebhookId) {
                setWebhookMessage('Please select a webhook configuration')
                return
            }

            setWebhookStatus('sending')
            setWebhookMessage('')

            try {
                const data = rowsToJSON(rows, fieldNames)
                const result = await api.sendToWebhook({
                    webhook_id: selectedWebhookId,
                    data: data,
                    include_metadata: includeMetadata,
                    file_name: fileName,
                })
                setWebhookStatus('success')
                setWebhookMessage(result.message || 'Data sent successfully!')
            } catch (error) {
                setWebhookStatus('error')
                setWebhookMessage(error instanceof Error ? error.message : 'Failed to send data')
            }
            return
        }

        // Client-side webhook
        if (!webhookUrl.trim()) {
            setWebhookMessage('Please enter a webhook URL')
            return
        }

        if (!securityAcknowledged) {
            setWebhookMessage('Please acknowledge the security warning')
            return
        }

        setWebhookStatus('sending')
        setWebhookMessage('')

        const data = rowsToJSON(rows, fieldNames)
        const result = await sendToWebhook(webhookUrl, data, {
            includeMetadata,
            fileName,
        })

        if (result.success) {
            setWebhookStatus('success')
            setWebhookMessage(result.message)
        } else {
            setWebhookStatus('error')
            setWebhookMessage(result.message)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Export Options</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                        ×
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-800">
                    <button
                        onClick={() => setActiveTab('sheets')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'sheets'
                                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        📊 Google Sheets
                    </button>
                    <button
                        onClick={() => setActiveTab('webhook')}
                        className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'webhook'
                                ? 'text-emerald-400 border-b-2 border-emerald-400 bg-emerald-500/5'
                                : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        🔗 Webhook
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-auto max-h-[60vh]">
                    {/* Google Sheets Tab */}
                    {activeTab === 'sheets' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="bg-gray-800/50 rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <span className="text-gray-400 text-sm">Exporting</span>
                                    <p className="font-bold">{rows.length} rows × {fieldNames.length} columns</p>
                                </div>
                                <div className="text-3xl">📊</div>
                            </div>

                            {/* Download CSV */}
                            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                                <h3 className="font-semibold mb-2">📥 Download for Google Sheets</h3>
                                <p className="text-sm text-gray-400 mb-4">
                                    UTF-8 CSV with BOM for proper character encoding in Google Sheets.
                                </p>
                                <button
                                    onClick={handleSheetsDownload}
                                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
                                >
                                    Download Sheets-Compatible CSV
                                </button>
                            </div>

                            {/* Instructions */}
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <h3 className="font-semibold mb-3">📋 How to import into Google Sheets</h3>
                                <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
                                    <li>Open Google Sheets and create a new spreadsheet</li>
                                    <li>Go to <span className="text-white">File → Import</span></li>
                                    <li>Select the <span className="text-white">Upload</span> tab</li>
                                    <li>Drag the downloaded CSV file</li>
                                    <li>Choose <span className="text-white">"Replace current sheet"</span> or <span className="text-white">"Insert new sheet"</span></li>
                                    <li>Click <span className="text-white">Import data</span></li>
                                </ol>
                            </div>

                            {/* Apps Script */}
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="font-semibold">🔧 Google Apps Script (Advanced)</h3>
                                    <button
                                        onClick={() => setShowScript(!showScript)}
                                        className="text-sm text-emerald-400 hover:text-emerald-300"
                                    >
                                        {showScript ? 'Hide' : 'Show'} Script
                                    </button>
                                </div>
                                <p className="text-sm text-gray-400 mb-3">
                                    For automated imports, use this Apps Script in your Google Sheet.
                                </p>

                                {showScript && (
                                    <div className="mt-4">
                                        <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-auto">
                                            <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">
                                                {GOOGLE_APPS_SCRIPT_TEMPLATE.slice(0, 800)}...
                                            </pre>
                                        </div>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={handleDownloadScript}
                                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                                            >
                                                Download .gs File
                                            </button>
                                            <button
                                                onClick={() => copyToClipboard(GOOGLE_APPS_SCRIPT_TEMPLATE)}
                                                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm transition-colors"
                                            >
                                                Copy to Clipboard
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Webhook Tab */}
                    {activeTab === 'webhook' && (
                        <div className="space-y-6">
                            {/* Pro Mode Toggle */}
                            {isPro && (
                                <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">✨</span>
                                            <h3 className="font-semibold text-purple-400">Pro Feature: Server-side Webhook</h3>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-400 mb-4">
                                        Send data securely through our server with HMAC signing. Your webhook secrets stay protected.
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setWebhookMode('client')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                webhookMode === 'client'
                                                    ? 'bg-gray-700 text-white'
                                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Client-side (Direct)
                                        </button>
                                        <button
                                            onClick={() => setWebhookMode('server')}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                webhookMode === 'server'
                                                    ? 'bg-purple-600 text-white'
                                                    : 'bg-gray-800 text-gray-400 hover:text-white'
                                            }`}
                                        >
                                            Server-side (Secure)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Server-side Webhook Selection (Pro only) */}
                            {isPro && webhookMode === 'server' && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Select Saved Webhook</label>
                                    {loadingWebhooks ? (
                                        <div className="text-gray-400 text-sm">Loading webhooks...</div>
                                    ) : savedWebhooks.length === 0 ? (
                                        <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                                            <p className="text-gray-400 mb-2">No webhooks configured yet</p>
                                            <p className="text-sm text-gray-500">
                                                Go to Settings → Webhook to create a webhook configuration
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedWebhookId || ''}
                                            onChange={e => setSelectedWebhookId(Number(e.target.value))}
                                            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-purple-500 focus:outline-none"
                                        >
                                            {savedWebhooks.map(wh => (
                                                <option key={wh.id} value={wh.id}>
                                                    {wh.name} - {wh.url.slice(0, 40)}...
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}

                            {/* Client-side: Security Warning */}
                            {(webhookMode === 'client' || !isPro) && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <h3 className="font-semibold text-amber-400 mb-1">Security Warning</h3>
                                            <p className="text-sm text-gray-400 mb-3">
                                                Your data will be sent to the webhook URL you provide.
                                                <strong className="text-white"> Only use trusted endpoints.</strong>
                                                Never send sensitive data to untrusted URLs.
                                            </p>
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={securityAcknowledged}
                                                    onChange={e => setSecurityAcknowledged(e.target.checked)}
                                                    className="rounded border-gray-600"
                                                />
                                                <span>I understand and trust this webhook endpoint</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Client-side: Webhook URL */}
                            {(webhookMode === 'client' || !isPro) && (
                                <div>
                                    <label className="block text-sm font-medium mb-2">Webhook URL</label>
                                    <input
                                        type="url"
                                        value={webhookUrl}
                                        onChange={e => setWebhookUrl(e.target.value)}
                                        placeholder="https://your-webhook.example.com/endpoint"
                                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Options */}
                            <div>
                                <label className="flex items-center gap-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={includeMetadata}
                                        onChange={e => setIncludeMetadata(e.target.checked)}
                                        className="rounded border-gray-600"
                                    />
                                    <span>Include metadata (timestamp, row count, source)</span>
                                </label>
                            </div>

                            {/* Payload Preview */}
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <h3 className="font-semibold mb-2">Payload Preview</h3>
                                <div className="bg-gray-900 rounded-lg p-3 max-h-32 overflow-auto">
                                    <pre className="text-xs text-gray-300 font-mono">
                                        {JSON.stringify({
                                            data: rows.slice(0, 2).map(r => {
                                                const obj: Record<string, string> = {}
                                                fieldNames.forEach(f => obj[f] = r.mappedData[f] || '')
                                                return obj
                                            }),
                                            metadata: includeMetadata ? {
                                                exported_at: new Date().toISOString(),
                                                row_count: rows.length,
                                                source: 'CSV Import Copilot',
                                            } : undefined,
                                        }, null, 2).slice(0, 300)}...
                                    </pre>
                                </div>
                            </div>

                            {/* Headers Info */}
                            <div className="bg-gray-800/50 rounded-xl p-4">
                                <h3 className="font-semibold mb-2">Request Headers</h3>
                                <div className="text-sm text-gray-400 font-mono space-y-1">
                                    <p>Content-Type: application/json</p>
                                    <p>X-Webhook-Timestamp: {Date.now()}</p>
                                    <p>X-Webhook-Signature: sha256=...</p>
                                </div>
                            </div>

                            {/* Status */}
                            {webhookMessage && (
                                <div className={`rounded-xl p-4 ${webhookStatus === 'success'
                                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                                    }`}>
                                    {webhookMessage}
                                </div>
                            )}

                            {/* Send Button */}
                            <button
                                onClick={handleWebhookSend}
                                disabled={
                                    webhookStatus === 'sending' ||
                                    (isPro && webhookMode === 'server' ? !selectedWebhookId : !webhookUrl.trim())
                                }
                                className={`w-full px-4 py-3 ${
                                    isPro && webhookMode === 'server'
                                        ? 'bg-purple-600 hover:bg-purple-700'
                                        : 'bg-emerald-500 hover:bg-emerald-600'
                                } disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors`}
                            >
                                {webhookStatus === 'sending' ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : isPro && webhookMode === 'server' ? (
                                    `🔒 Send ${rows.length} rows securely`
                                ) : (
                                    `Send ${rows.length} rows to Webhook`
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
