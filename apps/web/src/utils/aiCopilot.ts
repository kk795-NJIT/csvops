/**
 * AI Copilot Utilities
 * Bounded AI assistant - client-side only, BYOK or local Ollama
 * NEVER sends full dataset, only headers + sampled values + error types
 */

export interface AIConfig {
    enabled: boolean
    provider: 'openai' | 'ollama'
    apiKey?: string // For OpenAI - stored in localStorage
    ollamaEndpoint?: string // Default: http://localhost:11434
    model: string
}

export interface AIContext {
    headers: string[]
    sampleValues: Record<string, string[]> // Max 3 sample values per column
    errorTypes?: string[]
    targetSchema?: string[]
}

export interface AIResponse {
    success: boolean
    data?: unknown
    error?: string
}

// Storage key for AI config
const AI_CONFIG_KEY = 'csv-cleaner-ai-config'

// Default config
const DEFAULT_CONFIG: AIConfig = {
    enabled: false,
    provider: 'ollama',
    ollamaEndpoint: 'http://localhost:11434',
    model: 'llama3.2',
}

/**
 * Get AI configuration from localStorage
 */
export function getAIConfig(): AIConfig {
    try {
        const stored = localStorage.getItem(AI_CONFIG_KEY)
        if (stored) {
            return { ...DEFAULT_CONFIG, ...JSON.parse(stored) }
        }
    } catch (e) {
        console.warn('Failed to parse AI config:', e)
    }
    return DEFAULT_CONFIG
}

/**
 * Save AI configuration to localStorage
 */
export function saveAIConfig(config: Partial<AIConfig>): void {
    const current = getAIConfig()
    const updated = { ...current, ...config }
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify(updated))
}

/**
 * Clear AI configuration (including API key)
 */
export function clearAIConfig(): void {
    localStorage.removeItem(AI_CONFIG_KEY)
}

/**
 * Prepare context for AI - ONLY headers, sampled values, and error types
 * NEVER include full dataset
 */
export function prepareAIContext(
    data: Record<string, unknown>[],
    headers: string[],
    targetSchema?: string[],
    errors?: Array<{ type: string }>
): AIContext {
    // Get max 3 sample values per column (first non-empty values)
    const sampleValues: Record<string, string[]> = {}
    
    for (const header of headers) {
        const samples: string[] = []
        for (const row of data) {
            if (samples.length >= 3) break
            const value = row[header]
            if (value !== null && value !== undefined && value !== '') {
                const strValue = String(value).slice(0, 100) // Limit value length
                if (!samples.includes(strValue)) {
                    samples.push(strValue)
                }
            }
        }
        sampleValues[header] = samples
    }

    // Get unique error types (not full error messages)
    const errorTypes = errors
        ? [...new Set(errors.map(e => e.type))]
        : undefined

    return {
        headers,
        sampleValues,
        errorTypes,
        targetSchema,
    }
}

/**
 * Call AI for column mapping suggestions
 */
export async function suggestColumnMappings(
    context: AIContext
): Promise<AIResponse> {
    const config = getAIConfig()
    
    if (!config.enabled) {
        return { success: false, error: 'AI is disabled' }
    }

    const prompt = `You are a CSV data mapping assistant. Given source columns and target schema, suggest the best mapping.

Source columns with sample values:
${JSON.stringify(context.sampleValues, null, 2)}

Target schema fields:
${JSON.stringify(context.targetSchema || [], null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "mappings": {
    "sourceColumn": "targetField",
    ...
  },
  "confidence": {
    "sourceColumn": "high" | "medium" | "low",
    ...
  },
  "reasoning": {
    "sourceColumn": "brief reason",
    ...
  }
}`

    return callAI(prompt, config)
}

/**
 * Call AI to explain validation errors
 */
export async function explainErrors(
    context: AIContext,
    specificErrors: Array<{ row: number; column: string; type: string; message: string }>
): Promise<AIResponse> {
    const config = getAIConfig()
    
    if (!config.enabled) {
        return { success: false, error: 'AI is disabled' }
    }

    // Only send first 5 errors as examples
    const sampleErrors = specificErrors.slice(0, 5).map(e => ({
        column: e.column,
        type: e.type,
        message: e.message,
    }))

    const prompt = `You are a CSV data validation assistant. Explain these validation errors and suggest fixes.

Column samples:
${JSON.stringify(context.sampleValues, null, 2)}

Validation errors found:
${JSON.stringify(sampleErrors, null, 2)}

Respond ONLY with valid JSON in this exact format:
{
  "explanations": [
    {
      "errorType": "type",
      "explanation": "why this happens",
      "suggestedFix": "how to fix it"
    }
  ],
  "generalAdvice": "overall recommendation"
}`

    return callAI(prompt, config)
}

/**
 * Call AI to generate validation rules from natural language
 */
export async function generateValidationRules(
    context: AIContext,
    naturalLanguageDescription: string
): Promise<AIResponse> {
    const config = getAIConfig()
    
    if (!config.enabled) {
        return { success: false, error: 'AI is disabled' }
    }

    const prompt = `You are a CSV validation rule generator. Given column info and a description, generate validation rules.

Available columns with sample values:
${JSON.stringify(context.sampleValues, null, 2)}

User's description of what they want to validate:
"${naturalLanguageDescription}"

Respond ONLY with valid JSON in this exact format:
{
  "rules": [
    {
      "column": "column_name",
      "type": "required" | "email" | "phone" | "date" | "number" | "regex" | "enum" | "minLength" | "maxLength",
      "params": {},
      "description": "what this rule does"
    }
  ],
  "explanation": "summary of generated rules"
}`

    return callAI(prompt, config)
}

/**
 * Core AI call function - handles both OpenAI and Ollama
 */
async function callAI(prompt: string, config: AIConfig): Promise<AIResponse> {
    try {
        let response: Response

        if (config.provider === 'openai') {
            if (!config.apiKey) {
                return { success: false, error: 'OpenAI API key not configured' }
            }

            response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`,
                },
                body: JSON.stringify({
                    model: config.model || 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a helpful CSV data assistant. Always respond with valid JSON only. No markdown, no explanations outside the JSON.',
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.3,
                    max_tokens: 1000,
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                return { success: false, error: `OpenAI API error: ${error}` }
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content

            return parseAIResponse(content)
        } else {
            // Ollama
            const endpoint = config.ollamaEndpoint || 'http://localhost:11434'

            response = await fetch(`${endpoint}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: config.model || 'llama3.2',
                    prompt: `You are a helpful CSV data assistant. Always respond with valid JSON only. No markdown, no explanations outside the JSON.\n\n${prompt}`,
                    stream: false,
                }),
            })

            if (!response.ok) {
                const error = await response.text()
                return { success: false, error: `Ollama error: ${error}` }
            }

            const data = await response.json()
            return parseAIResponse(data.response)
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        
        // Check for common connection errors
        if (message.includes('fetch') || message.includes('network')) {
            if (config.provider === 'ollama') {
                return { 
                    success: false, 
                    error: 'Could not connect to Ollama. Make sure Ollama is running locally.' 
                }
            }
        }
        
        return { success: false, error: message }
    }
}

/**
 * Parse and validate AI response as JSON
 */
function parseAIResponse(content: string): AIResponse {
    if (!content) {
        return { success: false, error: 'Empty response from AI' }
    }

    try {
        // Try to extract JSON from response (handle markdown code blocks)
        let jsonStr = content.trim()
        
        // Remove markdown code blocks if present
        const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim()
        }

        const parsed = JSON.parse(jsonStr)
        return { success: true, data: parsed }
    } catch (e) {
        console.warn('Failed to parse AI response as JSON:', content)
        return { success: false, error: 'AI response was not valid JSON' }
    }
}

/**
 * Test AI connection
 */
export async function testAIConnection(): Promise<AIResponse> {
    const config = getAIConfig()
    
    if (!config.enabled) {
        return { success: false, error: 'AI is disabled' }
    }

    return callAI('Respond with: {"status": "ok"}', config)
}
