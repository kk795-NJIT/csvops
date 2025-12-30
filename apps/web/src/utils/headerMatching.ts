/**
 * Fuse.js-based header matching for column suggestions
 */
import Fuse from 'fuse.js'

interface MatchResult {
    sourceHeader: string
    score: number
}

/**
 * Find the best matching source header for a target field
 */
export function findBestMatch(targetField: string, sourceHeaders: string[]): MatchResult | null {
    if (sourceHeaders.length === 0) return null

    // Normalize the target field name
    const normalizedTarget = normalizeFieldName(targetField)

    // Create searchable items
    const items = sourceHeaders.map(header => ({
        header,
        normalized: normalizeFieldName(header),
    }))

    // Fuse.js configuration
    const fuse = new Fuse(items, {
        keys: ['normalized', 'header'],
        threshold: 0.4, // Lower = more strict matching
        includeScore: true,
        ignoreLocation: true,
    })

    // Search for matches
    const results = fuse.search(normalizedTarget)

    if (results.length > 0 && results[0].score !== undefined) {
        return {
            sourceHeader: results[0].item.header,
            score: 1 - results[0].score, // Convert to similarity score (higher = better)
        }
    }

    // Try exact match (case-insensitive)
    const exactMatch = sourceHeaders.find(
        h => normalizeFieldName(h) === normalizedTarget
    )
    if (exactMatch) {
        return { sourceHeader: exactMatch, score: 1 }
    }

    return null
}

/**
 * Generate suggested mappings for all target fields
 */
export function generateMappingSuggestions(
    targetFields: string[],
    sourceHeaders: string[]
): Record<string, { suggestion: string; confidence: number } | null> {
    const suggestions: Record<string, { suggestion: string; confidence: number } | null> = {}
    const usedSources = new Set<string>()

    for (const target of targetFields) {
        const match = findBestMatch(target, sourceHeaders.filter(h => !usedSources.has(h)))

        if (match && match.score > 0.5) {
            suggestions[target] = {
                suggestion: match.sourceHeader,
                confidence: match.score,
            }
            usedSources.add(match.sourceHeader)
        } else {
            suggestions[target] = null
        }
    }

    return suggestions
}

/**
 * Normalize a field name for comparison
 */
function normalizeFieldName(name: string): string {
    return name
        .toLowerCase()
        .replace(/[_\-\s]+/g, '') // Remove separators
        .replace(/[^a-z0-9]/g, '') // Remove special chars
}

/**
 * Common field name aliases for better matching
 */
export const fieldAliases: Record<string, string[]> = {
    email: ['email', 'emailaddress', 'mail', 'e-mail', 'useremail'],
    firstName: ['firstname', 'first', 'fname', 'givenname'],
    lastName: ['lastname', 'last', 'lname', 'surname', 'familyname'],
    phone: ['phone', 'phonenumber', 'tel', 'telephone', 'mobile', 'cell'],
    company: ['company', 'companyname', 'organization', 'org', 'employer'],
    date: ['date', 'createdat', 'createddate', 'timestamp'],
    amount: ['amount', 'total', 'price', 'value', 'cost'],
}
