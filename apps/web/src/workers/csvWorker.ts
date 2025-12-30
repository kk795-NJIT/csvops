/**
 * Web Worker for CSV parsing and validation
 * Runs heavy operations off the main thread
 */

import Papa from 'papaparse'

export interface ParseMessage {
    type: 'parse'
    file: File
}

export interface ValidateMessage {
    type: 'validate'
    rows: string[][]
    headers: string[]
    mapping: Record<string, string> // targetField -> sourceHeader
    schema: TargetField[]
}

export interface TargetField {
    name: string
    type: 'string' | 'email' | 'number' | 'date'
    required: boolean
}

export interface ValidationError {
    rowIndex: number
    field: string
    value: string
    message: string
}

export interface ValidatedRow {
    rowIndex: number
    originalRow: string[]
    mappedData: Record<string, string>
    errors: ValidationError[]
    isValid: boolean
}

// Listen for messages from main thread
self.onmessage = async (event: MessageEvent<ParseMessage | ValidateMessage>) => {
    const { type } = event.data

    if (type === 'parse') {
        const { file } = event.data as ParseMessage
        handleParse(file)
    } else if (type === 'validate') {
        const { rows, headers, mapping, schema } = event.data as ValidateMessage
        handleValidate(rows, headers, mapping, schema)
    }
}

function handleParse(file: File) {
    Papa.parse(file, {
        complete: (results) => {
            const data = results.data as string[][]
            const headers = data[0] || []
            const rows = data.slice(1).filter(row => row.some(cell => cell?.trim()))

            self.postMessage({
                type: 'parseComplete',
                headers,
                rows,
                totalRows: rows.length,
            })
        },
        error: (error) => {
            self.postMessage({
                type: 'parseError',
                error: error.message,
            })
        },
    })
}

function handleValidate(
    rows: string[][],
    headers: string[],
    mapping: Record<string, string>,
    schema: TargetField[]
) {
    const validatedRows: ValidatedRow[] = []
    const headerIndexMap: Record<string, number> = {}

    headers.forEach((h, i) => {
        headerIndexMap[h] = i
    })

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const errors: ValidationError[] = []
        const mappedData: Record<string, string> = {}

        for (const field of schema) {
            const sourceHeader = mapping[field.name]
            const sourceIndex = sourceHeader ? headerIndexMap[sourceHeader] : -1
            const value = sourceIndex >= 0 ? (row[sourceIndex] || '').trim() : ''

            mappedData[field.name] = value

            // Required check
            if (field.required && !value) {
                errors.push({
                    rowIndex: i + 2, // +2 for 1-indexing and header row
                    field: field.name,
                    value,
                    message: `${field.name} is required`,
                })
                continue
            }

            // Skip further validation if empty and not required
            if (!value) continue

            // Type validation
            if (field.type === 'email') {
                if (!isValidEmail(value)) {
                    errors.push({
                        rowIndex: i + 2,
                        field: field.name,
                        value,
                        message: `Invalid email format`,
                    })
                }
            } else if (field.type === 'number') {
                if (!isValidNumber(value)) {
                    errors.push({
                        rowIndex: i + 2,
                        field: field.name,
                        value,
                        message: `Invalid number format`,
                    })
                }
            } else if (field.type === 'date') {
                if (!isValidDate(value)) {
                    errors.push({
                        rowIndex: i + 2,
                        field: field.name,
                        value,
                        message: `Invalid date format`,
                    })
                }
            }
        }

        validatedRows.push({
            rowIndex: i + 2,
            originalRow: row,
            mappedData,
            errors,
            isValid: errors.length === 0,
        })

        // Progress update every 1000 rows
        if (i % 1000 === 0) {
            self.postMessage({
                type: 'validateProgress',
                processed: i + 1,
                total: rows.length,
            })
        }
    }

    const validRows = validatedRows.filter(r => r.isValid)
    const invalidRows = validatedRows.filter(r => !r.isValid)
    const allErrors = validatedRows.flatMap(r => r.errors)

    self.postMessage({
        type: 'validateComplete',
        validRows,
        invalidRows,
        errors: allErrors,
        stats: {
            total: rows.length,
            valid: validRows.length,
            invalid: invalidRows.length,
            errorCount: allErrors.length,
        },
    })
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function isValidNumber(value: string): boolean {
    return !isNaN(parseFloat(value)) && isFinite(Number(value))
}

function isValidDate(value: string): boolean {
    // Accept common formats
    const parsed = Date.parse(value)
    if (!isNaN(parsed)) return true

    // Try MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
    const patterns = [
        /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
        /^\d{4}-\d{2}-\d{2}$/,
        /^\d{1,2}-\d{1,2}-\d{2,4}$/,
    ]
    return patterns.some(p => p.test(value))
}

export { }
