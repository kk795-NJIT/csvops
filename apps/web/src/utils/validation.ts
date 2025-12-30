/**
 * Zod schemas for field validation
 */
import { z } from 'zod'

export const emailSchema = z.string().email('Invalid email format')

export const numberSchema = z.string().refine(
    (val) => !val || (!isNaN(parseFloat(val)) && isFinite(Number(val))),
    'Invalid number format'
)

export const dateSchema = z.string().refine(
    (val) => {
        if (!val) return true
        const parsed = Date.parse(val)
        if (!isNaN(parsed)) return true
        const patterns = [
            /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
            /^\d{4}-\d{2}-\d{2}$/,
            /^\d{1,2}-\d{1,2}-\d{2,4}$/,
        ]
        return patterns.some(p => p.test(val))
    },
    'Invalid date format'
)

export const stringSchema = z.string()

export type FieldType = 'string' | 'email' | 'number' | 'date'

export interface TargetField {
    name: string
    type: FieldType
    required: boolean
}

export function validateField(value: string, field: TargetField): string | null {
    // Required check
    if (field.required && !value.trim()) {
        return `${field.name} is required`
    }

    // Skip type validation if empty
    if (!value.trim()) return null

    try {
        switch (field.type) {
            case 'email':
                emailSchema.parse(value)
                break
            case 'number':
                numberSchema.parse(value)
                break
            case 'date':
                dateSchema.parse(value)
                break
            case 'string':
                // No validation needed
                break
        }
        return null
    } catch (error) {
        if (error instanceof z.ZodError) {
            return error.issues[0]?.message || 'Invalid value'
        }
        return 'Validation error'
    }
}

export function validateRow(
    row: string[],
    headers: string[],
    mapping: Record<string, string>,
    schema: TargetField[]
): { mappedData: Record<string, string>; errors: Array<{ field: string; value: string; message: string }> } {
    const headerIndexMap: Record<string, number> = {}
    headers.forEach((h, i) => {
        headerIndexMap[h] = i
    })

    const mappedData: Record<string, string> = {}
    const errors: Array<{ field: string; value: string; message: string }> = []

    for (const field of schema) {
        const sourceHeader = mapping[field.name]
        const sourceIndex = sourceHeader ? headerIndexMap[sourceHeader] : -1
        const value = sourceIndex >= 0 ? (row[sourceIndex] || '').trim() : ''

        mappedData[field.name] = value

        const error = validateField(value, field)
        if (error) {
            errors.push({ field: field.name, value, message: error })
        }
    }

    return { mappedData, errors }
}
