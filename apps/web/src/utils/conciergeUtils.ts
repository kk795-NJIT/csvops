/**
 * Utility functions for Concierge Mode
 */

interface SourceCSV {
    fileName: string
    headers: string[]
    sampleRows: string[][]
    totalRows: number
}

/**
 * Generate a mapping worksheet CSV with source columns, target columns,
 * and blank spaces for transformation rules.
 */
export function generateMappingWorksheet(sourceColumns: string[], targetColumns: string[]): string {
    const rows: string[][] = []

    // Header row
    rows.push([
        'Target Column',
        'Source Column (fill in)',
        'Transformation Rule (optional)',
        'Notes',
    ])

    // Empty row for visual separation
    rows.push(['', '', '', ''])

    // One row per target column
    targetColumns.forEach((targetCol) => {
        // Try to find a matching source column (case-insensitive)
        const suggestedSource = sourceColumns.find(
            (src) => src.toLowerCase().replace(/[_\s-]/g, '') === targetCol.toLowerCase().replace(/[_\s-]/g, '')
        ) || ''

        rows.push([
            targetCol,
            suggestedSource, // Pre-fill if we found a match
            '',
            suggestedSource ? '(auto-matched)' : '',
        ])
    })

    // Add section for unmapped source columns
    rows.push(['', '', '', ''])
    rows.push(['--- UNMAPPED SOURCE COLUMNS ---', '', '', ''])

    const mappedSources = targetColumns.map((t) =>
        sourceColumns.find(
            (src) => src.toLowerCase().replace(/[_\s-]/g, '') === t.toLowerCase().replace(/[_\s-]/g, '')
        )
    ).filter(Boolean)

    sourceColumns.forEach((srcCol) => {
        if (!mappedSources.includes(srcCol)) {
            rows.push(['(needs mapping)', srcCol, '', ''])
        }
    })

    // Convert to CSV string
    return rows.map((row) => row.map(escapeCSVField).join(',')).join('\n')
}

/**
 * Generate a summary report text file with analysis of the source file.
 */
export function generateSummaryReport(sourceCSV: SourceCSV, targetColumns: string[]): string {
    const timestamp = new Date().toISOString()
    const matchedColumns: string[] = []
    const unmatchedTarget: string[] = []
    const unmatchedSource: string[] = []

    // Analyze column matches
    targetColumns.forEach((targetCol) => {
        const match = sourceCSV.headers.find(
            (src) => src.toLowerCase().replace(/[_\s-]/g, '') === targetCol.toLowerCase().replace(/[_\s-]/g, '')
        )
        if (match) {
            matchedColumns.push(`${targetCol} ← ${match}`)
        } else {
            unmatchedTarget.push(targetCol)
        }
    })

    const matchedSourceCols = matchedColumns.map((m) => m.split(' ← ')[1])
    sourceCSV.headers.forEach((srcCol) => {
        if (!matchedSourceCols.includes(srcCol)) {
            unmatchedSource.push(srcCol)
        }
    })

    // Analyze sample data for potential issues
    const dataIssues: string[] = []
    sourceCSV.headers.forEach((header, colIndex) => {
        const values = sourceCSV.sampleRows.map((row) => row[colIndex] || '').filter(Boolean)
        const emptyCount = sourceCSV.sampleRows.length - values.length

        if (emptyCount > 0) {
            dataIssues.push(`- "${header}": ${emptyCount}/${sourceCSV.sampleRows.length} sample rows are empty`)
        }

        // Check for potential email columns
        if (values.some((v) => v.includes('@') && v.includes('.'))) {
            const invalidEmails = values.filter((v) => v.includes('@') && !isValidEmail(v))
            if (invalidEmails.length > 0) {
                dataIssues.push(`- "${header}": Potential invalid emails found in sample`)
            }
        }

        // Check for mixed formats
        const hasNumbers = values.some((v) => /^\d+$/.test(v.trim()))
        const hasText = values.some((v) => /^[a-zA-Z]+$/.test(v.trim()))
        if (hasNumbers && hasText) {
            dataIssues.push(`- "${header}": Mixed number/text data detected`)
        }
    })

    // Build report
    const lines: string[] = [
        '╔══════════════════════════════════════════════════════════════════╗',
        '║           CSV IMPORT COPILOT - CONCIERGE SUMMARY REPORT          ║',
        '╚══════════════════════════════════════════════════════════════════╝',
        '',
        `Generated: ${timestamp}`,
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'SOURCE FILE SUMMARY',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `File Name:    ${sourceCSV.fileName}`,
        `Total Rows:   ${sourceCSV.totalRows.toLocaleString()}`,
        `Columns:      ${sourceCSV.headers.length}`,
        '',
        'Source Columns:',
        ...sourceCSV.headers.map((h, i) => `  ${i + 1}. ${h || '(empty header)'}`),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'TARGET SCHEMA',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Requested Output Columns:',
        ...targetColumns.map((t, i) => `  ${i + 1}. ${t}`),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'COLUMN MAPPING ANALYSIS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        `✅ Auto-Matched Columns (${matchedColumns.length}):`,
        ...(matchedColumns.length > 0
            ? matchedColumns.map((m) => `   ${m}`)
            : ['   (none)']),
        '',
        `⚠️  Target Columns Needing Manual Mapping (${unmatchedTarget.length}):`,
        ...(unmatchedTarget.length > 0
            ? unmatchedTarget.map((t) => `   - ${t}`)
            : ['   (none - all matched!)']),
        '',
        `📋 Unmapped Source Columns (${unmatchedSource.length}):`,
        ...(unmatchedSource.length > 0
            ? unmatchedSource.map((s) => `   - ${s}`)
            : ['   (none - all used!)']),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'DATA QUALITY OBSERVATIONS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Based on sample analysis:',
        ...(dataIssues.length > 0
            ? dataIssues
            : ['  ✓ No obvious issues detected in sample data']),
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        'NEXT STEPS',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        '1. Open the mapping_worksheet.csv file',
        '2. Fill in the "Source Column" for each target column',
        '3. Add any transformation rules if needed (e.g., "uppercase", "trim")',
        '4. Review this summary for potential data quality issues',
        '5. Use the completed worksheet as a guide for data transformation',
        '',
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
        '',
        'Report generated by CSV Import Copilot - Concierge Mode',
        'https://csvimportcopilot.com',
        '',
    ]

    return lines.join('\n')
}

/**
 * Escape a field for CSV format
 */
function escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`
    }
    return field
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Download a file to the user's computer
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
}
