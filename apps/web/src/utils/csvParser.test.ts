/**
 * Unit tests for CSV Parser
 */
import { describe, it, expect } from 'vitest'
import {
    detectDelimiter,
    parseCSVLine,
    normalizeHeaders,
    parseCSV,
    isValidCSV,
} from '../utils/csvParser'

describe('detectDelimiter', () => {
    it('detects comma delimiter', () => {
        const content = 'a,b,c\n1,2,3'
        expect(detectDelimiter(content)).toBe(',')
    })

    it('detects tab delimiter', () => {
        const content = 'a\tb\tc\n1\t2\t3'
        expect(detectDelimiter(content)).toBe('\t')
    })

    it('detects semicolon delimiter', () => {
        const content = 'a;b;c\n1;2;3'
        expect(detectDelimiter(content)).toBe(';')
    })

    it('defaults to comma for empty content', () => {
        expect(detectDelimiter('')).toBe(',')
    })

    it('handles mixed delimiters, chooses most common', () => {
        const content = 'a,b,c,d;e\n1,2,3,4;5'
        expect(detectDelimiter(content)).toBe(',')
    })
})

describe('parseCSVLine', () => {
    it('parses simple comma-separated values', () => {
        expect(parseCSVLine('a,b,c', ',')).toEqual(['a', 'b', 'c'])
    })

    it('handles quoted fields with commas', () => {
        expect(parseCSVLine('a,"b,c",d', ',')).toEqual(['a', 'b,c', 'd'])
    })

    it('handles escaped quotes within quoted fields', () => {
        expect(parseCSVLine('a,"b""c",d', ',')).toEqual(['a', 'b"c', 'd'])
    })

    it('handles empty fields', () => {
        expect(parseCSVLine('a,,c', ',')).toEqual(['a', '', 'c'])
    })

    it('handles quoted empty fields', () => {
        expect(parseCSVLine('a,"",c', ',')).toEqual(['a', '', 'c'])
    })

    it('handles newlines in quoted fields', () => {
        // Note: This is a single logical line, the newline is inside quotes
        expect(parseCSVLine('a,"b\nc",d', ',')).toEqual(['a', 'b\nc', 'd'])
    })

    it('trims whitespace from fields', () => {
        expect(parseCSVLine('  a  ,  b  ,  c  ', ',')).toEqual(['a', 'b', 'c'])
    })

    it('handles tab delimiter', () => {
        expect(parseCSVLine('a\tb\tc', '\t')).toEqual(['a', 'b', 'c'])
    })

    it('handles semicolon delimiter', () => {
        expect(parseCSVLine('a;b;c', ';')).toEqual(['a', 'b', 'c'])
    })
})

describe('normalizeHeaders', () => {
    it('keeps unique headers unchanged', () => {
        const result = normalizeHeaders(['name', 'email', 'phone'])
        expect(result.normalized).toEqual(['name', 'email', 'phone'])
        expect(result.duplicatesRenamed).toEqual([])
    })

    it('renames duplicate headers', () => {
        const result = normalizeHeaders(['name', 'email', 'name'])
        expect(result.normalized).toEqual(['name', 'email', 'name_2'])
        expect(result.duplicatesRenamed).toContain('name → name_2')
    })

    it('handles multiple duplicates', () => {
        const result = normalizeHeaders(['id', 'id', 'id'])
        expect(result.normalized).toEqual(['id', 'id_2', 'id_3'])
    })

    it('generates names for empty headers', () => {
        const result = normalizeHeaders(['name', '', 'email'])
        expect(result.normalized).toEqual(['name', 'Column2', 'email'])
    })

    it('handles case-insensitive duplicates', () => {
        const result = normalizeHeaders(['Name', 'name'])
        expect(result.normalized).toEqual(['Name', 'name_2'])
    })
})

describe('parseCSV', () => {
    it('parses simple CSV', () => {
        const content = 'name,email\nJohn,john@test.com\nJane,jane@test.com'
        const result = parseCSV(content)

        expect(result.headers).toEqual(['name', 'email'])
        expect(result.rows).toHaveLength(2)
        expect(result.rows[0]).toEqual(['John', 'john@test.com'])
    })

    it('skips empty lines by default', () => {
        const content = 'name,email\n\nJohn,john@test.com\n\nJane,jane@test.com\n'
        const result = parseCSV(content)

        expect(result.rows).toHaveLength(2)
        expect(result.emptyLinesSkipped).toBe(3)
    })

    it('preserves empty lines when skipEmptyLines is false', () => {
        const content = 'name,email\n\nJohn,john@test.com'
        const result = parseCSV(content, { skipEmptyLines: false })

        expect(result.rows).toHaveLength(2)
        expect(result.rows[0]).toEqual(['', ''])
    })

    it('handles missing values (pads rows)', () => {
        const content = 'a,b,c\n1,2\n4'
        const result = parseCSV(content)

        expect(result.rows[0]).toEqual(['1', '2', ''])
        expect(result.rows[1]).toEqual(['4', '', ''])
    })

    it('truncates extra columns', () => {
        const content = 'a,b\n1,2,3,4'
        const result = parseCSV(content)

        expect(result.rows[0]).toEqual(['1', '2'])
    })

    it('generates headers when hasHeader is false', () => {
        const content = '1,2,3\n4,5,6'
        const result = parseCSV(content, { hasHeader: false })

        expect(result.headers).toEqual(['Column1', 'Column2', 'Column3'])
        expect(result.rows).toHaveLength(2)
        expect(result.rows[0]).toEqual(['1', '2', '3'])
    })

    it('handles CRLF line endings', () => {
        const content = 'name,email\r\nJohn,john@test.com\r\n'
        const result = parseCSV(content)

        expect(result.rows).toHaveLength(1)
        expect(result.rows[0]).toEqual(['John', 'john@test.com'])
    })

    it('handles quoted fields with commas', () => {
        const content = 'name,address\nJohn,"123 Main St, Apt 4"'
        const result = parseCSV(content)

        expect(result.rows[0]).toEqual(['John', '123 Main St, Apt 4'])
    })

    it('handles duplicate headers', () => {
        const content = 'id,name,id\n1,John,2'
        const result = parseCSV(content)

        expect(result.headers).toEqual(['id', 'name', 'id_2'])
        expect(result.duplicateHeadersRenamed).toContain('id → id_2')
    })

    it('preserves row order', () => {
        const content = 'n\n1\n2\n3\n4\n5'
        const result = parseCSV(content)

        expect(result.rows.map(r => r[0])).toEqual(['1', '2', '3', '4', '5'])
    })

    it('returns detected delimiter', () => {
        const tabContent = 'a\tb\n1\t2'
        const result = parseCSV(tabContent)

        expect(result.delimiter).toBe('\t')
    })

    it('uses specified delimiter', () => {
        const content = 'a;b,c\n1;2,3'
        const result = parseCSV(content, { delimiter: ';' })

        expect(result.headers).toEqual(['a', 'b,c'])
        expect(result.delimiter).toBe(';')
    })
})

describe('isValidCSV', () => {
    it('returns true for valid CSV', () => {
        expect(isValidCSV('a,b,c\n1,2,3')).toBe(true)
    })

    it('returns false for empty content', () => {
        expect(isValidCSV('')).toBe(false)
        expect(isValidCSV('   ')).toBe(false)
    })

    it('returns true for single line', () => {
        expect(isValidCSV('a,b,c')).toBe(true)
    })

    it('handles varying column counts with tolerance', () => {
        // 50% tolerance means this should still be valid
        const content = 'a,b,c\n1,2,3\n4,5\n6,7,8'
        expect(isValidCSV(content)).toBe(true)
    })
})
