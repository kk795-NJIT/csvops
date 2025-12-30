/**
 * Unit tests for CSV Export
 */
import { describe, it, expect } from 'vitest'
import {
    escapeCSVField,
    generateCSV,
    generateCSVWithDelimiter,
    rowsToCSVString,
} from '../utils/csvExport'

describe('escapeCSVField', () => {
    it('returns empty string for null', () => {
        expect(escapeCSVField(null)).toBe('')
    })

    it('returns empty string for undefined', () => {
        expect(escapeCSVField(undefined)).toBe('')
    })

    it('returns string unchanged if no special chars', () => {
        expect(escapeCSVField('hello')).toBe('hello')
    })

    it('escapes field containing comma', () => {
        expect(escapeCSVField('hello, world')).toBe('"hello, world"')
    })

    it('escapes field containing double quote', () => {
        expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""')
    })

    it('escapes field containing newline', () => {
        expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"')
    })

    it('escapes field containing carriage return', () => {
        expect(escapeCSVField('line1\rline2')).toBe('"line1\rline2"')
    })

    it('escapes field containing tab', () => {
        expect(escapeCSVField('col1\tcol2')).toBe('"col1\tcol2"')
    })

    it('escapes field with leading space', () => {
        expect(escapeCSVField(' hello')).toBe('" hello"')
    })

    it('escapes field with trailing space', () => {
        expect(escapeCSVField('hello ')).toBe('"hello "')
    })

    it('handles multiple special characters', () => {
        expect(escapeCSVField('a,"b"\nc')).toBe('"a,""b""\nc"')
    })
})

describe('generateCSV', () => {
    it('generates simple CSV', () => {
        const headers = ['name', 'email']
        const rows = [['John', 'john@test.com'], ['Jane', 'jane@test.com']]

        const result = generateCSV(headers, rows)

        expect(result).toBe('name,email\nJohn,john@test.com\nJane,jane@test.com')
    })

    it('escapes special characters in data', () => {
        const headers = ['name', 'address']
        const rows = [['John', '123 Main St, Apt 4']]

        const result = generateCSV(headers, rows)

        expect(result).toBe('name,address\nJohn,"123 Main St, Apt 4"')
    })

    it('handles empty rows', () => {
        const headers = ['a', 'b']
        const rows: string[][] = []

        const result = generateCSV(headers, rows)

        expect(result).toBe('a,b')
    })

    it('handles empty values', () => {
        const headers = ['a', 'b', 'c']
        const rows = [['1', '', '3']]

        const result = generateCSV(headers, rows)

        expect(result).toBe('a,b,c\n1,,3')
    })

    it('preserves row order', () => {
        const headers = ['n']
        const rows = [['1'], ['2'], ['3'], ['4'], ['5']]

        const result = generateCSV(headers, rows)

        expect(result).toBe('n\n1\n2\n3\n4\n5')
    })
})

describe('generateCSVWithDelimiter', () => {
    it('uses semicolon delimiter', () => {
        const headers = ['a', 'b']
        const rows = [['1', '2']]

        const result = generateCSVWithDelimiter(headers, rows, ';')

        expect(result).toBe('a;b\n1;2')
    })

    it('uses tab delimiter', () => {
        const headers = ['a', 'b']
        const rows = [['1', '2']]

        const result = generateCSVWithDelimiter(headers, rows, '\t')

        expect(result).toBe('a\tb\n1\t2')
    })

    it('escapes fields containing the delimiter', () => {
        const headers = ['a', 'b']
        const rows = [['1;2', '3']]

        const result = generateCSVWithDelimiter(headers, rows, ';')

        expect(result).toBe('a;b\n"1;2";3')
    })
})

describe('rowsToCSVString', () => {
    it('converts rows to CSV string', () => {
        const rows = [
            { mappedData: { name: 'John', email: 'john@test.com' } },
            { mappedData: { name: 'Jane', email: 'jane@test.com' } },
        ]
        const targetFields = ['name', 'email']

        const result = rowsToCSVString(rows, targetFields)

        expect(result).toBe('name,email\nJohn,john@test.com\nJane,jane@test.com')
    })

    it('handles missing fields', () => {
        const rows = [
            { mappedData: { name: 'John' } },
        ]
        const targetFields = ['name', 'email']

        const result = rowsToCSVString(rows, targetFields)

        expect(result).toBe('name,email\nJohn,')
    })

    it('respects field order', () => {
        const rows = [
            { mappedData: { email: 'john@test.com', name: 'John' } },
        ]
        const targetFields = ['name', 'email']

        const result = rowsToCSVString(rows, targetFields)

        expect(result).toBe('name,email\nJohn,john@test.com')
    })
})
