import { useState, useEffect } from 'react'
import { useAI } from '../hooks/useAI'

interface AISettingsModalProps {
    isOpen: boolean
    onClose: () => void
}

export function AISettingsModal({ isOpen, onClose }: AISettingsModalProps) {
    const { config, updateConfig, testConnection, isLoading, error } = useAI()
    
    const [localApiKey, setLocalApiKey] = useState('')
    const [localEndpoint, setLocalEndpoint] = useState('')
    const [localModel, setLocalModel] = useState('')
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

    useEffect(() => {
        if (isOpen) {
            setLocalApiKey(config.apiKey || '')
            setLocalEndpoint(config.ollamaEndpoint || 'http://localhost:11434')
            setLocalModel(config.model || (config.provider === 'openai' ? 'gpt-4o-mini' : 'llama3.2'))
            setTestResult(null)
        }
    }, [isOpen, config])

    if (!isOpen) return null

    const handleSave = () => {
        updateConfig({
            apiKey: config.provider === 'openai' ? localApiKey : undefined,
            ollamaEndpoint: config.provider === 'ollama' ? localEndpoint : undefined,
            model: localModel,
        })
        onClose()
    }

    const handleTest = async () => {
        // Temporarily save config for test
        updateConfig({
            apiKey: config.provider === 'openai' ? localApiKey : undefined,
            ollamaEndpoint: config.provider === 'ollama' ? localEndpoint : undefined,
            model: localModel,
            enabled: true,
        })
        
        const success = await testConnection()
        setTestResult(success ? 'success' : 'error')
    }

    const handleProviderChange = (provider: 'openai' | 'ollama') => {
        updateConfig({ provider })
        setLocalModel(provider === 'openai' ? 'gpt-4o-mini' : 'llama3.2')
        setTestResult(null)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">🤖</span>
                        <div>
                            <h2 className="text-lg font-semibold">AI Copilot Settings</h2>
                            <p className="text-sm text-gray-500">Configure AI assistance for mapping and validation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="px-6 py-4 space-y-6">
                    {/* Enable Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="font-medium text-gray-900">Enable AI Copilot</label>
                            <p className="text-sm text-gray-500">Get AI-powered suggestions</p>
                        </div>
                        <button
                            onClick={() => updateConfig({ enabled: !config.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                config.enabled ? 'bg-purple-600' : 'bg-gray-200'
                            }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                    config.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                            />
                        </button>
                    </div>

                    {/* Privacy Notice */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex gap-2">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm text-blue-800">
                                <p className="font-medium">Your data stays private</p>
                                <p className="mt-1">AI only sees column headers and up to 3 sample values per column. Your full dataset is never sent to AI.</p>
                            </div>
                        </div>
                    </div>

                    {config.enabled && (
                        <>
                            {/* Provider Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleProviderChange('ollama')}
                                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                            config.provider === 'ollama'
                                                ? 'border-purple-600 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-medium">🦙 Ollama (Local)</div>
                                        <p className="text-xs text-gray-500 mt-1">Free, runs on your machine</p>
                                    </button>
                                    <button
                                        onClick={() => handleProviderChange('openai')}
                                        className={`p-4 border-2 rounded-lg text-left transition-colors ${
                                            config.provider === 'openai'
                                                ? 'border-purple-600 bg-purple-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-medium">🔑 OpenAI (BYOK)</div>
                                        <p className="text-xs text-gray-500 mt-1">Bring your own API key</p>
                                    </button>
                                </div>
                            </div>

                            {/* Provider-specific settings */}
                            {config.provider === 'openai' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            OpenAI API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={localApiKey}
                                            onChange={(e) => setLocalApiKey(e.target.value)}
                                            placeholder="sk-..."
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Stored locally in your browser. Never sent to our servers.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Model
                                        </label>
                                        <select
                                            value={localModel}
                                            onChange={(e) => setLocalModel(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="gpt-4o-mini">GPT-4o Mini (Recommended)</option>
                                            <option value="gpt-4o">GPT-4o</option>
                                            <option value="gpt-4-turbo">GPT-4 Turbo</option>
                                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ollama Endpoint
                                        </label>
                                        <input
                                            type="text"
                                            value={localEndpoint}
                                            onChange={(e) => setLocalEndpoint(e.target.value)}
                                            placeholder="http://localhost:11434"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            value={localModel}
                                            onChange={(e) => setLocalModel(e.target.value)}
                                            placeholder="llama3.2"
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Run <code className="bg-gray-100 px-1 rounded">ollama pull llama3.2</code> to install
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Test Connection */}
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleTest}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm font-medium text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50"
                                >
                                    {isLoading ? 'Testing...' : 'Test Connection'}
                                </button>
                                {testResult === 'success' && (
                                    <span className="text-sm text-green-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        Connected!
                                    </span>
                                )}
                                {testResult === 'error' && (
                                    <span className="text-sm text-red-600">{error}</span>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-100"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    )
}
