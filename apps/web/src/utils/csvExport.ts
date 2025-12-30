/**
 * Enhanced CSV export utilities with proper escaping
 */

/**
 * Escape a field for CSV format - handles all edge cases
 */
export function escapeCSVField(field: string | null | undefined): string {
    if (field === null || field === undefined) return ''

    const str = String(field)

    // Check if escaping is needed
    const needsEscaping =
        str.includes(',') ||
        str.includes('"') ||
        str.includes('\n') ||
        str.includes('\r') ||
        str.includes('\t') ||
        str.startsWith(' ') ||
        str.endsWith(' ')

    if (needsEscaping) {
        // Escape double quotes by doubling them
        const escaped = str.replace(/"/g, '""')
        return `"${escaped}"`
    }

    return str
}

/**
 * Generate a CSV string from headers and rows
 */
export function generateCSV(headers: string[], rows: string[][]): string {
    const lines: string[] = []

    // Add header row
    lines.push(headers.map(escapeCSVField).join(','))

    // Add data rows
    for (const row of rows) {
        const escapedRow = row.map(escapeCSVField)
        lines.push(escapedRow.join(','))
    }

    return lines.join('\n')
}

/**
 * Generate CSV with custom delimiter
 */
export function generateCSVWithDelimiter(
    headers: string[],
    rows: string[][],
    delimiter: string = ','
): string {
    const lines: string[] = []

    // For non-comma delimiters, we still need to escape if field contains the delimiter
    const escapeField = (field: string | null | undefined): string => {
        if (field === null || field === undefined) return ''
        const str = String(field)

        const needsEscaping =
            str.includes(delimiter) ||
            str.includes('"') ||
            str.includes('\n') ||
            str.includes('\r')

        if (needsEscaping) {
            return `"${str.replace(/"/g, '""')}"`
        }
        return str
    }

    lines.push(headers.map(escapeField).join(delimiter))

    for (const row of rows) {
        lines.push(row.map(escapeField).join(delimiter))
    }

    return lines.join('\n')
}

/**
 * Download a file to the user's computer
 */
export function downloadCSV(content: string, filename: string): void {
    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF'
    const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}

export interface ExportableRow {
    mappedData: Record<string, string>
    errors?: Array<{ field: string; message: string }>
}

/**
 * Export clean rows (valid only) in target schema order
 */
export function exportCleanCSV(
    rows: ExportableRow[],
    targetFields: string[],
    filename: string = 'clean_export.csv'
): void {
    const headers = targetFields
    const dataRows = rows.map(row =>
        targetFields.map(field => row.mappedData[field] || '')
    )
    const csv = generateCSV(headers, dataRows)
    downloadCSV(csv, filename)
}

/**
 * Export error rows with error_reason column
 */
export function exportErrorCSV(
    rows: Array<ExportableRow & { rowIndex: number }>,
    targetFields: string[],
    filename: string = 'errors_export.csv'
): void {
    const headers = ['row_number', ...targetFields, 'error_reason']
    const dataRows = rows.map(row => {
        const errorReason = row.errors?.map(e => `${e.field}: ${e.message}`).join('; ') || ''
        return [
            row.rowIndex.toString(),
            ...targetFields.map(field => row.mappedData[field] || ''),
            errorReason,
        ]
    })
    const csv = generateCSV(headers, dataRows)
    downloadCSV(csv, filename)
}

/**
 * Convert rows to CSV string without downloading (for testing)
 */
export function rowsToCSVString(
    rows: ExportableRow[],
    targetFields: string[]
): string {
    const headers = targetFields
    const dataRows = rows.map(row =>
        targetFields.map(field => row.mappedData[field] || '')
    )
    return generateCSV(headers, dataRows)
}
