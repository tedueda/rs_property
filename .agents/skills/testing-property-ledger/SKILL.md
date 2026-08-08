---
name: testing-property-ledger
description: Test the property ledger (物件管理台帳) page end-to-end. Use when verifying property ledger import, CRUD, or parsing changes.
---

# Testing the Property Ledger Page

## Overview
The property ledger page (`/property-ledger`) allows importing property management documents (DOCX, HTML, Excel, PDF) and managing them with CRUD operations.

## Prerequisites
- Dev server running: `VITE_DEMO_MODE=true npx vite --host 0.0.0.0 --port 5173`
  - Note: If port 5173 is in use, Vite auto-assigns the next port (e.g. 5174). Check the terminal output.
- No Supabase credentials needed (demo mode uses client-side state)
- Test files: user-provided DOCX/HTML/Excel files. Copy them to a path without Japanese characters (e.g. `/home/ubuntu/test-files/`) for easier automation.

## How to Access
- Navigate to `http://localhost:5173/property-ledger` (or whatever port Vite assigned)
- Or click "物件管理台帳" in sidebar under "マスタ管理"

## Test File Import
- The file input is hidden (`class="hidden"`). To use it with browser automation:
  1. Make it visible via JS: `document.querySelector('input[type="file"]').style.display='block'; document.querySelector('input[type="file"]').style.position='relative';`
  2. Then use `select_file` browser action with the devinid of the input element
- Accepted formats: `.docx`, `.html`, `.htm`, `.xlsx`, `.xls`, `.pdf`
- After making the file input visible, it gets a devinid you can use with `select_file`
- A single parsed ledger opens `読取内容の確認`; verify and correct values before clicking `データベースに登録`
- Excel files that contain multiple rows may be batch-registered without the single-record confirmation dialog

## Key Test Scenarios

### 1. HTML Import
- HTML parser extracts from `<table>` rows (`th`/`td` pairs)
- Property name from `<h1>`, created date from `.footer`
- Generally the most reliable parsing format
- **Critical assertion for rent fields**: Verify that "家賃" shows the correct value (e.g. 82,000円) and is NOT overwritten by "家賃他合計" (e.g. 83,330円). The parser has exclusion logic (`FIELD_EXCLUDE`) to prevent this.

### 2. Excel Import (Tabular Format)
- Excel parser detects tabular format: scans first 5 rows for header row with 3+ known field names
- Each data row below the header becomes a separate record
- Property name is built from "物件名" + "部屋番号" columns (e.g. "フォレストヴィラ 202号室")
- `formatValue()` auto-formats bare integers to currency for monetary fields (82000 → 82,000円)
- `isRecordEmpty()` filters out records with no meaningful data (prevents junk records from irrelevant sheets)
- **Critical assertion**: Verify correct record count (no empty/junk records from sheets like 入力リスト, 集計, 使い方)
- Note: The "deduction" field is NOT in MONETARY_FIELDS, so bare numeric values in 控除 won't be auto-formatted with 円.

### 3. DOCX Import
- Import a DOCX file and verify `読取内容の確認` opens before any record is added
- Verify all 14 fields + `created_date` in the confirmation form, then click `データベースに登録`
- Confirm the success banner, registered count, list row, and detail view contain the same values
- Property name regex has been tightened to stop at section headers (契約者情報, 賃借人, 作成日)

### 4. Production Supabase Persistence
- Record the visible `登録済み` baseline before importing; parsing alone must not change it
- After `データベースに登録`, confirm the green success banner and that the count increased by exactly one
- Reload `/property-ledger`; the same count and row must return from Supabase
- Open the new row's eye-icon detail view and compare every field with the confirmation form
- Never delete or edit pre-existing rows merely to simplify testing; only clean up the record created by the current test if cleanup is explicitly required

### 5. Simplified Navigation and CRUD
- Dashboard: the upload card must say `物件管理台帳を読み込む` and route selected files to `/property-ledger`
- Legacy routes `/file-upload`, `/import-review`, and `/import-history` must redirect to `/property-ledger`
- Create: Click `新規作成`, fill the four form sections, then click `登録する`
- Edit: Click the pencil icon, modify fields, then click `更新する`
- Delete: Click the trash icon and confirm the dialog
- Search: Type in the search box; it filters by `property_name`, `tenant_name`, or `notes`

## Parser Architecture (`propertyLedgerParser.ts`)
- `FIELD_MAP`: Japanese label → field name mapping (20+ variations)
- `FIELD_EXCLUDE`: Labels that should NOT match any field (e.g. "家賃他合計")
- `FIELD_KEYS_SORTED`: Keys sorted longest-first for substring matching priority
- `EXCEL_HEADER_MAP`: Column header aliases for tabular Excel sheets
- `SECTION_HEADERS`: Section headers that should be skipped during parsing
- `matchField()`: 3-tier matching: exclusion check → exact match → longest-first substring
- `detectTabularHeaders()`: Scans first 5 rows for header row with 3+ known field names
- `parseTabularSheet()`: Parses each data row using column-to-field mapping
- `formatValue()`: Auto-formats bare integers for monetary fields
- `isRecordEmpty()`: Filters records with no meaningful data
- **Known latent issue**: '備考' appears in both `FIELD_MAP` and `SECTION_HEADERS`. The `isSection()` function uses exact match to avoid conflict, but if a document uses '備考' (not '備考欄') as notes label with no other context, behavior might be unexpected.

## Verification Checklist (Expected Values)
When testing with user-provided files, verify these fields in the detail dialog:

### For HTML files (e.g. 202.html — tenant 南條 将宗):
- 賃借人: 南條 将宗
- 電話番号: 080-8306-9500
- 家賃: **82,000円** (NOT 83,330円)
- 保証会社: ジェイリース（明神）

### For HTML files (e.g. preview.html — tenant 岡崎 達彦):
- 賃借人: 岡崎 達彦
- 電話番号: 080-4104-1325
- 家賃: 75,000円
- 保証人: 市原 義人
- 保証会社: 日本セーフティー株式会社
- ハウスクリーニング代: 30,000円（退去時）

### For Excel files (e.g. 202.xlsx — tabular format):
- Record count: 3 valid records (not 7 empty ones)
- フォレストヴィラ 201号室 / 山口 建治 / 75,000円
- フォレストヴィラ 202号室 / 南條 将宗 / 82,000円

## Form Sections (matching template)
1. 物件基本情報: property_name, created_date
2. 契約者情報: tenant_name, phone, guarantor
3. 物件・入居情報: move_in_date
4. 費用・契約条件: rent, guarantee_company, house_cleaning_fee, water_fee, common_fee, deposit, deduction, penalty
5. 備考: notes (textarea)

## Devin Secrets Needed

Local demo testing requires no secrets.

Production persistence/deployment verification requires:
- `NETLIFY_RS_PROPERTY_AUTH_TOKEN` — deploy and inspect the RIKA SOGABE Netlify production site
- `VITE_SUPABASE_URL` — Supabase project endpoint used by the production build
- `VITE_SUPABASE_ANON_KEY` — client access for production authentication and `property_ledgers` CRUD

If production remains on an older bundle, verify the Netlify token can access the linked site before claiming Supabase persistence passed.
