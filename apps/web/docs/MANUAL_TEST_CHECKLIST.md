# Sprint 2 QA - Manual Test Checklist

## Prerequisites
- Dev server running: `npm run dev`
- Sample files available in `public/` directory

---

## 📁 File Upload Tests

### TC-001: Basic CSV Upload
- [ ] Upload `sample.csv`
- [ ] Verify file name displayed
- [ ] Verify row count shown
- [ ] Verify column headers detected

### TC-002: Large File (10K+ rows)
- [ ] Create/upload large CSV (10,000+ rows)
- [ ] Verify parsing completes without freezing UI
- [ ] Verify preview shows first 20 rows only

### TC-003: Tab-Delimited File
- [ ] Upload `.tsv` or tab-delimited file
- [ ] Verify delimiter auto-detected
- [ ] Verify columns parsed correctly

### TC-004: Semicolon-Delimited File
- [ ] Upload semicolon-separated CSV (European format)
- [ ] Verify delimiter auto-detected
- [ ] Verify columns parsed correctly

### TC-005: Quoted Fields with Commas
- [ ] Upload CSV with fields like `"Smith, John"`
- [ ] Verify commas inside quotes not treated as delimiters
- [ ] Verify data integrity preserved

### TC-006: Empty Lines in File
- [ ] Upload CSV with blank lines between data
- [ ] Verify empty lines skipped
- [ ] Verify row count excludes empty lines

### TC-007: Duplicate Headers
- [ ] Upload CSV with duplicate column names (e.g., `id,name,id`)
- [ ] Verify duplicates renamed (e.g., `id`, `id_2`)
- [ ] Verify mapping still works

### TC-008: Missing Headers
- [ ] Upload CSV without header row (numbers only)
- [ ] Use "No Header" option if available
- [ ] Verify auto-generated headers (`Column1`, `Column2`, etc.)

### TC-009: CRLF vs LF Line Endings
- [ ] Upload Windows-formatted CSV (CRLF)
- [ ] Verify no extra empty rows created
- [ ] Verify parsing correct

---

## 🗺️ Column Mapping Tests

### TC-010: Auto-Mapping Suggestions
- [ ] Define target fields: `email`, `first_name`, `company`
- [ ] Verify Fuse.js suggests matching columns
- [ ] Verify suggestions have confidence indicators

### TC-011: Manual Mapping Override
- [ ] Change auto-suggested mapping
- [ ] Verify new mapping persisted
- [ ] Verify validation uses new mapping

### TC-012: Unmapped Fields
- [ ] Leave a required target field unmapped
- [ ] Proceed to validation
- [ ] Verify all rows show errors for unmapped required field

### TC-013: Case-Insensitive Matching
- [ ] Source: `EMAIL`, Target: `email`
- [ ] Verify auto-suggestion works despite case

---

## ✅ Validation Tests

### TC-014: Valid Email Format
- [ ] Map email column
- [ ] Verify valid emails pass (e.g., `test@example.com`)
- [ ] Verify invalid emails fail (e.g., `test@`, `@test.com`, `test`)

### TC-015: Required Field Empty
- [ ] Mark field as required
- [ ] Have rows with empty values
- [ ] Verify error: "field is required"

### TC-016: Number Validation
- [ ] Mark field as number type
- [ ] Include valid: `123`, `45.67`, `-10`
- [ ] Include invalid: `abc`, `12abc`
- [ ] Verify correct pass/fail

### TC-017: Date Validation
- [ ] Mark field as date type
- [ ] Include valid: `2024-01-15`, `01/15/2024`, `15-01-2024`
- [ ] Include invalid: `not-a-date`, `32/13/2024`
- [ ] Verify correct pass/fail

### TC-018: Multiple Errors Per Row
- [ ] Row with invalid email AND missing required field
- [ ] Verify both errors shown in error table
- [ ] Verify error CSV has combined error_reason

---

## 📤 Export Tests

### TC-019: Export Clean CSV
- [ ] Click "Export Clean CSV"
- [ ] Verify download triggers
- [ ] Open file, verify:
  - [ ] Only target columns present
  - [ ] Column order matches target schema
  - [ ] Only valid rows included

### TC-020: Export Errors CSV
- [ ] Click "Export Errors CSV"
- [ ] Verify download triggers
- [ ] Open file, verify:
  - [ ] `row_number` column present
  - [ ] `error_reason` column present
  - [ ] Only invalid rows included

### TC-021: CSV Escaping in Export
- [ ] Have data with commas: `"Smith, John"`
- [ ] Have data with quotes: `"He said "Hello""`
- [ ] Export and verify:
  - [ ] File opens correctly in Excel
  - [ ] Data integrity preserved

### TC-022: Row Order Preserved
- [ ] Upload file with known order
- [ ] Export clean CSV
- [ ] Verify rows in same order as original

---

## 🔄 Edge Cases

### TC-023: Empty File
- [ ] Upload empty CSV
- [ ] Verify error message shown
- [ ] Verify no crash

### TC-024: Headers Only (No Data)
- [ ] Upload CSV with just headers, no data rows
- [ ] Verify handled gracefully
- [ ] Verify "0 rows" shown

### TC-025: Single Row
- [ ] Upload CSV with 1 data row
- [ ] Verify full workflow completes
- [ ] Verify export works

### TC-026: Very Wide File (100+ columns)
- [ ] Upload CSV with 100+ columns
- [ ] Verify preview scrolls horizontally
- [ ] Verify mapping works

### TC-027: Unicode Characters
- [ ] Upload CSV with emoji, accents, CJK characters
- [ ] Verify display correctly
- [ ] Verify export preserves characters

### TC-028: Whitespace Handling
- [ ] Fields with leading/trailing spaces
- [ ] Verify spaces trimmed in mapping
- [ ] Verify validation works correctly

---

## 🔧 UI/UX Tests

### TC-029: Back Navigation
- [ ] At each step, click Back
- [ ] Verify previous state preserved
- [ ] Verify no data loss

### TC-030: Start Over
- [ ] Complete full workflow
- [ ] Click "Start New Import"
- [ ] Verify all state cleared
- [ ] Verify new upload works

### TC-031: Browser Refresh
- [ ] Mid-workflow, refresh browser
- [ ] Verify graceful reset to start
- [ ] No console errors

---

## ✔️ Test Summary

| Category | Total | Passed | Failed |
|----------|-------|--------|--------|
| File Upload | 9 | | |
| Mapping | 4 | | |
| Validation | 5 | | |
| Export | 4 | | |
| Edge Cases | 6 | | |
| UI/UX | 3 | | |
| **TOTAL** | **31** | | |

---

## Run Automated Tests

```bash
# Run all tests
npm run test:run

# Watch mode
npm run test

# With coverage
npm run test:coverage
```
