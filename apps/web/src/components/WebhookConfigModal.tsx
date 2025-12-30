/**
 * Webhook Configuration Modal
 * Allows Pro/Team users to configure webhook endpoints
 */
import { useState, useEffect } from 'react'
import { api, WebhookConfig, CreateWebhookRequest } from '../api/client'
import { useAuth } from '../contexts/AuthContext'

interface WebhookConfigModalProps {
    isOpen: boolean
    onClose: () => void
    templateId?: number
    existingWebhook?: WebhookConfig | null
    onSaved?: (webhook: WebhookConfig) => void
}

export default function WebhookConfigModal({
    isOpen,
    onClose,
    templateId,
    existingWebhook,
    onSaved,
}: WebhookConfigModalProps) {
    const { user } = useAuth()
    const [name, setName] = useState('')
    const [url, setUrl] = useState('')
    const [signingSecret, setSigningSecret] = useState('')
    const [customHeaders, setCustomHeaders] = useState('')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (existingWebhook) {
            setName(existingWebhook.name)
            setUrl(existingWebhook.url)
            setSigningSecret('')  // Don't show existing secret
            setCustomHeaders(
                existingWebhook.custom_headers
                    ? JSON.stringify(existingWebhook.custom_headers, null, 2)
                    : ''
            )
        } else {
            setName('')
            setUrl('')
            setSigningSecret('')
            setCustomHeaders('')
        }
        setError(null)
    }, [existingWebhook, isOpen])

    if (!isOpen) return null

    const isPro = user?.plan === 'pro' || user?.plan === 'team'

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Name is required')
            return
        }
        if (!url.trim()) {
            setError('URL is required')
            return
        }
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            setError('URL must start with http:// or https://')
            return
        }

        let parsedHeaders: Record<string, string> = {}
        if (customHeaders.trim()) {
            try {
                parsedHeaders = JSON.parse(customHeaders)
            } catch {
                setError('Custom headers must be valid JSON')
                return
            }
        }

        setSaving(true)
        setError(null)

        try {
            const payload: CreateWebhookRequest = {
                name: name.trim(),
                url: url.trim(),
                template_id: templateId,
                custom_headers: parsedHeaders,
            }

            if (signingSecret.trim()) {
                payload.signing_secret = signingSecret.trim()
            }

            let webhook: WebhookConfig
            if (existingWebhook) {
                webhook = await api.updateWebhook(existingWebhook.id, payload)
            } else {
                webhook = await api.createWebhook(payload)
            }

            onSaved?.(webhook)
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save webhook')
        } finally {
            setSaving(false)
        }
    }

    if (!isPro) {
        return (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
                <div
                    className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="text-center">
                        <div className="text-4xl mb-4">🔒</div>
                        <h2 className="text-xl font-bold mb-2">Pro Feature</h2>
                        <p className="text-gray-400 mb-6">
                            Webhook export is available on Pro and Team plans.
                            Upgrade to automatically send your cleaned data to any endpoint.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {/* TODO: Open upgrade modal */}}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        {existingWebhook ? 'Edit Webhook' : 'Configure Webhook'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
                        ×
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 overflow-auto max-h-[60vh]">
                    {/* Security Warning */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <h4 className="font-semibold text-amber-400 mb-1">Security Notice</h4>
                                <p className="text-sm text-gray-400">
                                    Data sent to webhooks will include your cleaned CSV data.
                                    Only configure webhooks to endpoints you trust and control.
                                    We recommend using a signing secret for verification.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Webhook Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., HubSpot Import"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        />
                    </div>

                    {/* URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Webhook URL
                        </label>
                        <input
                            type="url"
                            value={url}
                            onChange={e => setUrl(e.target.value)}
                            placeholder="https://your-endpoint.com/webhook"
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        />
                    </div>

                    {/* Signing Secret */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Signing Secret (Optional)
                        </label>
                        <input
                            type="password"
                            value={signingSecret}
                            onChange={e => setSigningSecret(e.target.value)}
                            placeholder={existingWebhook?.has_signing_secret ? '••••••••' : 'Enter a secret for HMAC signing'}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            We'll send a X-Webhook-Signature header for verification
                        </p>
                    </div>

                    {/* Custom Headers */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Custom Headers (Optional, JSON)
                        </label>
                        <textarea
                            value={customHeaders}
                            onChange={e => setCustomHeaders(e.target.value)}
                            placeholder={'{\n  "Authorization": "Bearer your-token"\n}'}
                            rows={4}
                            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono text-sm"
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-800 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : existingWebhook ? 'Update' : 'Save Webhook'}
                    </button>
                </div>
            </div>
        </div>
    )
}
