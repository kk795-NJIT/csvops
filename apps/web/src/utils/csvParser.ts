/**
 * Robust CSV Parsing Utilities
 * Handles edge cases: delimiters, quoted fields, empty lines, duplicate/missing headers
 */

export type Delimiter = ',' | '\t' | ';' | 'auto'

export interface ParseOptions {
    delimiter?: Delimiter
    hasHeader?: boolean
    skipEmptyLines?: boolean
}

export interface ParseResult {
    headers: string[]
    rows: string[][]
    originalHeaders: string[]
    delimiter: string
    totalRows: number
    emptyLinesSkipped: number
    duplicateHeadersRenamed: string[]
}

/**
 * Detect delimiter from CSV content by analyzing first few lines
 */
export function detectDelimiter(content: string): string {
    const firstLines = content.split('\n').slice(0, 5).join('\n')

    const delimiters = [',', '\t', ';']
    const counts = delimiters.map(d => ({
        delimiter: d,
        count: (firstLines.match(new RegExp(escapeRegex(d), 'g')) || []).length,
    }))

    // Sort by count descending
    counts.sort((a, b) => b.count - a.count)

    // Return the most common delimiter (default to comma if none found)
    return counts[0]?.count > 0 ? counts[0].delimiter : ','
}

/**
 * Parse a CSV line handling quoted fields correctly
 */
export function parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]
        const nextChar = line[i + 1]

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote
                    current += '"'
                    i++ // Skip next quote
                } else {
                    // End of quoted field
                    inQuotes = false
                }
            } else {
                current += char
            }
        } else {
            if (char === '"') {
                inQuotes = true
            } else if (char === delimiter) {
                result.push(current.trim())
                current = ''
            } else {
                current += char
            }
        }
    }

    // Push last field
    result.push(current.trim())

    return result
}

/**
 * Normalize headers: handle duplicates and missing headers
 */
export function normalizeHeaders(headers: string[]): {
    normalized: string[]
    duplicatesRenamed: string[]
} {
    const seen = new Map<string, number>()
    const normalized: string[] = []
    const duplicatesRenamed: string[] = []

    headers.forEach((header, index) => {
        let name = header.trim()

        // Handle empty headers
        if (!name) {
            name = `Column${index + 1}`
        }

        // Handle duplicates
        if (seen.has(name.toLowerCase())) {
            const count = seen.get(name.toLowerCase())! + 1
            seen.set(name.toLowerCase(), count)
            const newName = `${name}_${count}`
            duplicatesRenamed.push(`${name} → ${newName}`)
            name = newName
        } else {
            seen.set(name.toLowerCase(), 1)
        }

        normalized.push(name)
    })

    return { normalized, duplicatesRenamed }
}

/**
 * Parse CSV content with full edge-case handling
 */
export function parseCSV(content: string, options: ParseOptions = {}): ParseResult {
    const {
        delimiter: requestedDelimiter = 'auto',
        hasHeader = true,
        skipEmptyLines = true,
    } = options

    // Normalize line endings
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Detect or use specified delimiter
    const delimiter = requestedDelimiter === 'auto'
        ? detectDelimiter(normalizedContent)
        : requestedDelimiter

    // Split into lines
    const allLines = normalizedContent.split('\n')

    // Filter empty lines if needed
    let emptyLinesSkipped = 0
    const lines = skipEmptyLines
        ? allLines.filter(line => {
            const isEmpty = line.trim() === ''
            if (isEmpty) emptyLinesSkipped++
            return !isEmpty
        })
        : allLines

    if (lines.length === 0) {
        return {
            headers: [],
            rows: [],
            originalHeaders: [],
            delimiter,
            totalRows: 0,
            emptyLinesSkipped,
            duplicateHeadersRenamed: [],
        }
    }

    // Parse first line as headers
    const originalHeaders = hasHeader ? parseCSVLine(lines[0], delimiter) : []

    // Generate headers if none provided
    const rawHeaders = hasHeader
        ? originalHeaders
        : Array.from({ length: parseCSVLine(lines[0], delimiter).length }, (_, i) => `Column${i + 1}`)

    // Normalize headers
    const { normalized: headers, duplicatesRenamed } = normalizeHeaders(rawHeaders)

    // Parse data rows
    const startIndex = hasHeader ? 1 : 0
    const rows: string[][] = []

    for (let i = startIndex; i < lines.length; i++) {
        const row = parseCSVLine(lines[i], delimiter)

        // Pad row to match header length
        while (row.length < headers.length) {
            row.push('')
        }

        // Truncate if row has extra columns
        if (row.length > headers.length) {
            row.length = headers.length
        }

        rows.push(row)
    }

    return {
        headers,
        rows,
        originalHeaders: hasHeader ? originalHeaders : [],
        delimiter,
        totalRows: rows.length,
        emptyLinesSkipped,
        duplicateHeadersRenamed: duplicatesRenamed,
    }
}

/**
 * Check if content appears to be a valid CSV
 */
export function isValidCSV(content: string): boolean {
    if (!content || content.trim().length === 0) return false

    const lines = content.trim().split('\n').filter(l => l.trim())
    if (lines.length === 0) return false

    const delimiter = detectDelimiter(content)
    const firstLineFields = parseCSVLine(lines[0], delimiter).length

    // Check that at least 50% of rows have similar field count
    let matchingRows = 0
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const fields = parseCSVLine(lines[i], delimiter).length
        if (Math.abs(fields - firstLineFields) <= 1) matchingRows++
    }

    return matchingRows / Math.min(lines.length, 10) >= 0.5
}

function escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
