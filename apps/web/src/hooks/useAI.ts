/**
 * useAI Hook - React hook for AI Copilot functionality
 */

import { useState, useCallback, useEffect } from 'react'
import {
    AIConfig,
    getAIConfig,
    saveAIConfig,
    prepareAIContext,
    suggestColumnMappings,
    explainErrors,
    generateValidationRules,
    testAIConnection,
} from '../utils/aiCopilot'

interface UseAIReturn {
    config: AIConfig
    isEnabled: boolean
    isLoading: boolean
    error: string | null
    
    // Config management
    updateConfig: (updates: Partial<AIConfig>) => void
    testConnection: () => Promise<boolean>
    
    // AI operations
    getMappingSuggestions: (
        data: Record<string, unknown>[],
        headers: string[],
        targetSchema: string[]
    ) => Promise<MappingSuggestions | null>
    
    getErrorExplanations: (
        data: Record<string, unknown>[],
        headers: string[],
        errors: Array<{ row: number; column: string; type: string; message: string }>
    ) => Promise<ErrorExplanations | null>
    
    getValidationRulesFromText: (
        data: Record<string, unknown>[],
        headers: string[],
        description: string
    ) => Promise<GeneratedRules | null>
}

interface MappingSuggestions {
    mappings: Record<string, string>
    confidence: Record<string, 'high' | 'medium' | 'low'>
    reasoning: Record<string, string>
}

interface ErrorExplanations {
    explanations: Array<{
        errorType: string
        explanation: string
        suggestedFix: string
    }>
    generalAdvice: string
}

interface GeneratedRules {
    rules: Array<{
        column: string
        type: string
        params?: Record<string, unknown>
        description: string
    }>
    explanation: string
}

export function useAI(): UseAIReturn {
    const [config, setConfig] = useState<AIConfig>(getAIConfig)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Sync config from localStorage on mount
    useEffect(() => {
        const handleStorage = () => {
            setConfig(getAIConfig())
        }
        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
    }, [])

    const updateConfig = useCallback((updates: Partial<AIConfig>) => {
        saveAIConfig(updates)
        setConfig(prev => ({ ...prev, ...updates }))
        setError(null)
    }, [])

    const testConnection = useCallback(async (): Promise<boolean> => {
        setIsLoading(true)
        setError(null)
        
        try {
            const result = await testAIConnection()
            if (!result.success) {
                setError(result.error || 'Connection failed')
                return false
            }
            return true
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Test failed'
            setError(message)
            return false
        } finally {
            setIsLoading(false)
        }
    }, [])

    const getMappingSuggestions = useCallback(async (
        data: Record<string, unknown>[],
        headers: string[],
        targetSchema: string[]
    ): Promise<MappingSuggestions | null> => {
        if (!config.enabled) return null
        
        setIsLoading(true)
        setError(null)
        
        try {
            const context = prepareAIContext(data, headers, targetSchema)
            const result = await suggestColumnMappings(context)
            
            if (!result.success) {
                setError(result.error || 'Failed to get suggestions')
                return null
            }
            
            return result.data as MappingSuggestions
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Request failed'
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [config.enabled])

    const getErrorExplanations = useCallback(async (
        data: Record<string, unknown>[],
        headers: string[],
        errors: Array<{ row: number; column: string; type: string; message: string }>
    ): Promise<ErrorExplanations | null> => {
        if (!config.enabled) return null
        
        setIsLoading(true)
        setError(null)
        
        try {
            const context = prepareAIContext(data, headers)
            const result = await explainErrors(context, errors)
            
            if (!result.success) {
                setError(result.error || 'Failed to get explanations')
                return null
            }
            
            return result.data as ErrorExplanations
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Request failed'
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [config.enabled])

    const getValidationRulesFromText = useCallback(async (
        data: Record<string, unknown>[],
        headers: string[],
        description: string
    ): Promise<GeneratedRules | null> => {
        if (!config.enabled) return null
        
        setIsLoading(true)
        setError(null)
        
        try {
            const context = prepareAIContext(data, headers)
            const result = await generateValidationRules(context, description)
            
            if (!result.success) {
                setError(result.error || 'Failed to generate rules')
                return null
            }
            
            return result.data as GeneratedRules
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Request failed'
            setError(message)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [config.enabled])

    return {
        config,
        isEnabled: config.enabled,
        isLoading,
        error,
        updateConfig,
        testConnection,
        getMappingSuggestions,
        getErrorExplanations,
        getValidationRulesFromText,
    }
}
