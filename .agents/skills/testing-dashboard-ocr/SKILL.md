# Testing: RS Property Management Dashboard + OCR Workflow

## Overview
The RS Property Management app has a unified dashboard that integrates OCR document processing. The main workflow is: upload files → OCR extracts fields → manual correction → categorize → confirm.

## Environment Setup
- **Dev server**: `npm run dev` from the project root (`/home/ubuntu/rs-property-management`)
- **Build**: `npm run build` to verify before deploying
- **Deploy**: Use the Devin deploy tool with `frontend` command pointing to `dist/` folder
- **Demo mode**: App works without Supabase connection using mock data (auth bypass enabled when `VITE_SUPABASE_URL` is not set)

## Deployed URL
- Frontend is deployed via Devin Apps. Check the deploy tool output for the current URL.
- The app uses client-side routing, so always navigate to `/dashboard` for the main workflow.

## Test Files
Create small test files for upload testing:
```bash
echo '%PDF-1.4 test' > /home/ubuntu/test_申込書.pdf
echo 'PK test' > /home/ubuntu/test_物件データ.xlsx  
echo 'PK test' > /home/ubuntu/test_contract.docx
```
Filenames containing Japanese keywords trigger different mock OCR data:
- `申込` → application category with applicant fields
- `物件` → property category with property fields
- `契約` → contract category with contract fields

## Key Test Scenarios

### 1. File Upload + OCR Processing
- Click the upload zone or drag-and-drop files
- Supported formats: PDF, Word (.doc/.docx), Excel (.xls/.xlsx), PowerPoint (.ppt/.pptx), Images (JPG/PNG/HEIC)
- Upload shows progress animation (0→100%), then OCR processing spinner
- After ~2 seconds, extracted fields appear with confidence scores
- Fields are color-coded: green (≥80%), yellow (50-80%), red (<50%)

### 2. Inline Field Editing
- Click the pencil icon on any field to enter edit mode
- Change value and press Enter to save
- Edited fields show blue "修正済" badge

### 3. Manual Field Addition
- Click "手入力で項目を追加" below the field list
- Enter 項目名 (label) and 値 (value), then click "追加"
- New fields show purple "手入力" badge
- Note: The button and form may be off-screen; scroll down to find them

### 4. Category Selection & Confirmation
- Category auto-suggested based on filename (e.g., 入居申込 for 申込書)
- Click a different category button to change selection
- Click "確定して仕分け" to confirm
- After confirmation: fields become read-only, category buttons disabled, document moves to 仕分け済みデータ section

### 5. KPI Section Toggle
- Click "業務概況・KPI" at the bottom to expand/collapse
- Shows 8 KPI cards, alert/task items, and recent applications

### 6. Document Removal
- Click trash icon on a document in the left panel
- Must test BEFORE confirming the document (confirmed docs can't be removed easily)

## Testing Tips
- **State is ephemeral**: Page refresh clears all uploaded documents (client-side state only in demo mode)
- **Click timeouts**: Some buttons may be off-screen. Scroll to bring them into view before clicking.
- **Test order matters**: Document removal (Test 6) should be tested before category confirmation (Test 4), as confirmation locks the document.
- **wmctrl**: May need `sudo apt-get install -y wmctrl` for browser window maximization before recording.

## Devin Secrets Needed
- None for demo mode testing
- For full Supabase integration: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- For OCR API: `OCR_API_KEY` (Google Cloud Vision or Azure Document Intelligence)
