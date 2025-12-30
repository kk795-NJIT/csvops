/**
 * Unit tests for Validation
 */
import { describe, it, expect } from 'vitest'
import { validateField, validateRow, TargetField } from '../utils/validation'

describe('validateField', () => {
    describe('required validation', () => {
        it('returns error for empty required field', () => {
            const field: TargetField = { name: 'email', type: 'string', required: true }
            expect(validateField('', field)).toBe('email is required')
        })

        it('returns error for whitespace-only required field', () => {
            const field: TargetField = { name: 'email', type: 'string', required: true }
            expect(validateField('   ', field)).toBe('email is required')
        })

        it('returns null for empty optional field', () => {
            const field: TargetField = { name: 'email', type: 'string', required: false }
            expect(validateField('', field)).toBeNull()
        })
    })

    describe('email validation', () => {
        it('validates correct email', () => {
            const field: TargetField = { name: 'email', type: 'email', required: true }
            expect(validateField('test@example.com', field)).toBeNull()
        })

        it('rejects invalid email - no @', () => {
            const field: TargetField = { name: 'email', type: 'email', required: true }
            expect(validateField('testexample.com', field)).toBe('Invalid email format')
        })

        it('rejects invalid email - no domain', () => {
            const field: TargetField = { name: 'email', type: 'email', required: true }
            expect(validateField('test@', field)).toBe('Invalid email format')
        })

        it('rejects invalid email - just @', () => {
            const field: TargetField = { name: 'email', type: 'email', required: true }
            expect(validateField('@test.com', field)).toBe('Invalid email format')
        })
    })

    describe('number validation', () => {
        it('validates integers', () => {
            const field: TargetField = { name: 'amount', type: 'number', required: true }
            expect(validateField('123', field)).toBeNull()
        })

        it('validates decimals', () => {
            const field: TargetField = { name: 'amount', type: 'number', required: true }
            expect(validateField('123.45', field)).toBeNull()
        })

        it('validates negative numbers', () => {
            const field: TargetField = { name: 'amount', type: 'number', required: true }
            expect(validateField('-123.45', field)).toBeNull()
        })

        it('rejects non-numeric', () => {
            const field: TargetField = { name: 'amount', type: 'number', required: true }
            expect(validateField('abc', field)).toBe('Invalid number format')
        })

        it('rejects mixed', () => {
            const field: TargetField = { name: 'amount', type: 'number', required: true }
            expect(validateField('123abc', field)).toBe('Invalid number format')
        })
    })

    describe('date validation', () => {
        it('validates ISO date', () => {
            const field: TargetField = { name: 'date', type: 'date', required: true }
            expect(validateField('2024-01-15', field)).toBeNull()
        })

        it('validates US date format', () => {
            const field: TargetField = { name: 'date', type: 'date', required: true }
            expect(validateField('01/15/2024', field)).toBeNull()
        })

        it('validates EU date format', () => {
            const field: TargetField = { name: 'date', type: 'date', required: true }
            expect(validateField('15-01-2024', field)).toBeNull()
        })

        it('rejects invalid date', () => {
            const field: TargetField = { name: 'date', type: 'date', required: true }
            expect(validateField('not-a-date', field)).toBe('Invalid date format')
        })
    })

    describe('string validation', () => {
        it('accepts any string', () => {
            const field: TargetField = { name: 'notes', type: 'string', required: true }
            expect(validateField('anything goes!', field)).toBeNull()
        })
    })
})

describe('validateRow', () => {
    const headers = ['email', 'first_name', 'age']
    const schema: TargetField[] = [
        { name: 'email', type: 'email', required: true },
        { name: 'name', type: 'string', required: true },
        { name: 'age', type: 'number', required: false },
    ]
    const mapping = { email: 'email', name: 'first_name', age: 'age' }

    it('returns mapped data and no errors for valid row', () => {
        const row = ['test@example.com', 'John', '25']
        const result = validateRow(row, headers, mapping, schema)

        expect(result.mappedData).toEqual({
            email: 'test@example.com',
            name: 'John',
            age: '25',
        })
        expect(result.errors).toHaveLength(0)
    })

    it('returns errors for invalid fields', () => {
        const row = ['invalid-email', '', 'not-a-number']
        const result = validateRow(row, headers, mapping, schema)

        expect(result.errors).toHaveLength(3)
        expect(result.errors.find(e => e.field === 'email')?.message).toBe('Invalid email format')
        expect(result.errors.find(e => e.field === 'name')?.message).toBe('name is required')
        expect(result.errors.find(e => e.field === 'age')?.message).toBe('Invalid number format')
    })

    it('handles unmapped fields', () => {
        const row = ['test@example.com', 'John', '25']
        const partialMapping = { email: 'email' } // name and age not mapped
        const result = validateRow(row, headers, partialMapping, schema)

        expect(result.mappedData.email).toBe('test@example.com')
        expect(result.mappedData.name).toBe('') // unmapped = empty
        expect(result.errors.find(e => e.field === 'name')?.message).toBe('name is required')
    })

    it('handles missing source columns', () => {
        const row = ['test@example.com'] // only email column exists
        const result = validateRow(row, headers, mapping, schema)

        expect(result.mappedData.email).toBe('test@example.com')
        expect(result.mappedData.name).toBe('')
    })
})
