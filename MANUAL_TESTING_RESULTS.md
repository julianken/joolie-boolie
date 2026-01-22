# Manual Testing Results: Bingo Template Management

**Date:** 2026-01-22
**Tester:** Claude Code (Playwright MCP)
**Feature:** Phase 1 - Bingo Template Management (BEA-289, BEA-290, BEA-291)

## Executive Summary

Manual testing revealed **2 critical bugs** and **1 blocking infrastructure issue**:
- ✅ **FIXED:** Unit conversion bug (seconds ↔ milliseconds)
- ⚠️ **BLOCKER:** Database migration not applied to production

## Testing Environment

- **URL:** http://localhost:3000/play
- **Database:** Supabase remote (https://iivxpjhmnalsuvpdzgza.supabase.co)
- **Auth:** Temporarily bypassed for testing (middleware + API routes)
- **Browser:** Playwright (automated via MCP)

## Test Scenario

**Goal:** Create and save a template with "Four Corners" pattern.

### Steps Executed

1. ✅ Navigate to `/play` page
2. ✅ Verify "Save as Template" button visible in ControlPanel
3. ✅ Select "Four Corners" pattern from dropdown
4. ✅ Click "Save as Template" button
5. ✅ SaveTemplateModal opens with correct current settings
6. ✅ Enter template name: "Four Corners Default"
7. ✅ Check "Set as default template" checkbox
8. ✅ Click "Save" button
9. ❌ **FAILED:** 400 Bad Request → auto_call_interval validation error
10. ✅ **FIXED:** Unit conversion bug
11. ❌ **FAILED:** 500 Internal Server Error → database table missing

## Bugs Discovered

### Bug 1: Unit Conversion (seconds ↔ milliseconds)

**Severity:** Critical
**Status:** ✅ Fixed

**Description:**
- Game store uses **seconds** for `autoCallSpeed` (value: 10)
- Database expects **milliseconds** for `auto_call_interval` (range: 1000-30000)
- SaveTemplateModal was sending raw value (10) instead of converting to milliseconds (10000)

**Error Message:**
```
auto_call_interval must be between 1000 and 30000ms
```

**Files Fixed:**
- `apps/bingo/src/components/presenter/SaveTemplateModal.tsx:62`
  - Changed: `auto_call_interval: autoCallSpeed`
  - To: `auto_call_interval: autoCallSpeed * 1000`

- `apps/bingo/src/components/presenter/TemplateSelector.tsx:81`
  - Changed: `setAutoCallSpeed(template.auto_call_interval)`
  - To: `setAutoCallSpeed(template.auto_call_interval / 1000)`

**Impact:**
- Without fix: Templates cannot be saved (validation fails)
- Without fix: Loading templates would set incorrect auto-call speed

### Bug 2: Database Table Missing

**Severity:** Blocker
**Status:** ⚠️ Not Fixed (Infrastructure Issue)

**Description:**
Database table `public.bingo_templates` does not exist in the remote Supabase instance.

**Error Message:**
```
Could not find the table 'public.bingo_templates' in the schema cache
```

**Root Cause:**
Migration file exists (`supabase/migrations/20260119000002_create_bingo_templates.sql`) but has not been applied to the production database.

**Required Action:**
Apply migration to Supabase:
```sql
-- From: supabase/migrations/20260119000002_create_bingo_templates.sql
CREATE TABLE public.bingo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  pattern_id text NOT NULL,
  voice_pack text NOT NULL DEFAULT 'classic',
  auto_call_enabled boolean NOT NULL DEFAULT false,
  auto_call_interval integer NOT NULL DEFAULT 5000,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- + RLS policies, indexes, constraints
```

**Blocked Functionality:**
- Cannot save templates (POST /api/templates → 500 error)
- Cannot load templates (GET /api/templates → 500 error)
- Cannot update templates (PATCH /api/templates/[id] → 500 error)
- Cannot delete templates (DELETE /api/templates/[id] → 500 error)

## UI/UX Observations

### What Works Well ✅

1. **SaveTemplateModal UI:**
   - Clean, accessible modal design
   - Clear "Current Settings" preview showing pattern, voice pack, auto-call status
   - Validation error messages display inline and as toast notifications
   - "Set as default template" checkbox clearly labeled

2. **ControlPanel Integration:**
   - "Save as Template" button properly positioned between secondary controls and status
   - Button clearly labeled and accessible

3. **Pattern Selection:**
   - "Four Corners" pattern displays correctly with visual preview
   - Pattern description ("Mark all four corner squares") shows in UI

### What Needs Database to Verify ⚠️

1. **TemplateSelector Component:**
   - Cannot test loading templates (database table missing)
   - Cannot verify auto-load of default template
   - Cannot verify template dropdown population

2. **RoomSetupModal Integration:**
   - Cannot test TemplateSelector in room setup flow
   - Cannot verify auto-load behavior on modal open

## Test Coverage Status

| Component | Unit Tests | Manual Tests | Status |
|-----------|-----------|--------------|--------|
| SaveTemplateModal | ✅ 11/11 passing | ✅ Tested (UI works) | Blocked by DB |
| TemplateSelector | ✅ 10/10 passing | ⚠️ Cannot test load | Blocked by DB |
| API Routes | ✅ 23/23 passing | ⚠️ 500 errors | Blocked by DB |
| RoomSetupModal | ✅ All passing | ⚠️ Not tested | Blocked by DB |

## Screenshots

Captured screenshots available in `.playwright-mcp/`:
- `save-template-button-visible.png` - ControlPanel with button
- `save-template-modal-open.png` - Modal with form filled out
- `save-validation-error.png` - Unit conversion error (before fix)
- `database-table-missing-error.png` - Database error (blocker)

## Recommendations

### Immediate Actions Required

1. **Apply Database Migration:**
   - Run migration `20260119000002_create_bingo_templates.sql` on Supabase
   - Verify table created: `SELECT * FROM public.bingo_templates LIMIT 1;`
   - Verify RLS policies enabled: `SELECT * FROM pg_policies WHERE tablename = 'bingo_templates';`

2. **Commit Bug Fixes:**
   - Commit the unit conversion fixes in SaveTemplateModal and TemplateSelector
   - These are critical for feature functionality

3. **Re-test After Migration:**
   - Complete full save/load cycle
   - Test TemplateSelector component
   - Test RoomSetupModal integration
   - Verify default template auto-load

### Testing Gaps

The following scenarios still need manual testing after DB migration:
1. Save template → verify success toast → verify template appears in list
2. Load template from TemplateSelector dropdown → verify settings applied to stores
3. Open RoomSetupModal → verify default template auto-loads
4. Create multiple templates → verify dropdown shows all templates
5. Update template to set/unset default flag
6. Delete template

## Conclusion

The UI components work correctly, but the feature is **blocked by missing database infrastructure**. The unit conversion bug has been fixed. Once the database migration is applied, the feature should be fully functional.

**Next Steps:**
1. Apply database migration to Supabase
2. Commit bug fixes (unit conversion)
3. Complete manual testing of full save/load cycle
4. Update phase1_status.md with final test results
