/**
 * Unit tests for Header Matching (Fuse.js)
 */
import { describe, it, expect } from 'vitest'
import { findBestMatch, generateMappingSuggestions } from '../utils/headerMatching'

describe('findBestMatch', () => {
    it('finds exact match', () => {
        const result = findBestMatch('email', ['email', 'name', 'phone'])
        expect(result?.sourceHeader).toBe('email')
        expect(result?.score).toBeGreaterThan(0.9)
    })

    it('finds case-insensitive match', () => {
        const result = findBestMatch('Email', ['email', 'name', 'phone'])
        expect(result?.sourceHeader).toBe('email')
    })

    it('finds match with underscores vs spaces', () => {
        const result = findBestMatch('first_name', ['First Name', 'Last Name'])
        expect(result?.sourceHeader).toBe('First Name')
    })

    it('finds similar match', () => {
        const result = findBestMatch('email', ['email_address', 'name', 'phone'])
        expect(result?.sourceHeader).toBe('email_address')
    })

    it('returns null for no match', () => {
        const result = findBestMatch('xyz', ['email', 'name', 'phone'])
        expect(result).toBeNull()
    })

    it('returns null for empty source headers', () => {
        const result = findBestMatch('email', [])
        expect(result).toBeNull()
    })
})

describe('generateMappingSuggestions', () => {
    it('suggests mappings for matching fields', () => {
        const targetFields = ['email', 'first_name', 'phone']
        const sourceHeaders = ['Email Address', 'First Name', 'Phone Number', 'Company']

        const suggestions = generateMappingSuggestions(targetFields, sourceHeaders)

        expect(suggestions.email?.suggestion).toBe('Email Address')
        expect(suggestions.first_name?.suggestion).toBe('First Name')
        expect(suggestions.phone?.suggestion).toBe('Phone Number')
    })

    it('returns null for non-matching fields', () => {
        const targetFields = ['xyz']
        const sourceHeaders = ['email', 'name', 'phone']

        const suggestions = generateMappingSuggestions(targetFields, sourceHeaders)

        expect(suggestions.xyz).toBeNull()
    })

    it('avoids duplicate suggestions', () => {
        const targetFields = ['email', 'email_backup']
        const sourceHeaders = ['Email']

        const suggestions = generateMappingSuggestions(targetFields, sourceHeaders)

        // First match gets it, second should be null
        expect(suggestions.email?.suggestion).toBe('Email')
        expect(suggestions.email_backup).toBeNull()
    })

    it('handles special characters in field names', () => {
        const targetFields = ['first-name', 'last-name']
        const sourceHeaders = ['first_name', 'last_name']

        const suggestions = generateMappingSuggestions(targetFields, sourceHeaders)

        expect(suggestions['first-name']?.suggestion).toBe('first_name')
        expect(suggestions['last-name']?.suggestion).toBe('last_name')
    })
})
