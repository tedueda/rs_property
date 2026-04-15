# Supabase \u672c\u756a\u74b0\u5883\u8a2d\u5b9a\u30ac\u30a4\u30c9

## 1. \u74b0\u5883\u5909\u6570\u4e00\u89a7

| \u5909\u6570\u540d | \u8aac\u660e | \u4f8b |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase\u30d7\u30ed\u30b8\u30a7\u30af\u30c8URL | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (\u30b5\u30fc\u30d0\u30fc\u5074\u306e\u307f\u3001VITE_\u30d7\u30ec\u30d5\u30a3\u30c3\u30af\u30b9\u4e0d\u53ef) | `eyJhbGci...` |
| `VITE_DEMO_MODE` | \u30c7\u30e2\u30e2\u30fc\u30c9\u30d5\u30e9\u30b0 | `false` |
| `VITE_APP_ENV` | \u74b0\u5883\u8b58\u5225\u5b50 | `production` |
| `VITE_STORAGE_BUCKET` | Storage\u30d0\u30b1\u30c3\u30c8\u540d | `documents` |
| `VITE_OCR_PROVIDER` | OCR\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc | `demo` |

## 2. Supabase\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u8a2d\u5b9a

### 2.1 \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u4f5c\u6210
1. [Supabase Dashboard](https://supabase.com/dashboard) \u3067\u65b0\u898f\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u3092\u4f5c\u6210
2. \u30ea\u30fc\u30b8\u30e7\u30f3\u306f\u300c\u6771\u4eac (ap-northeast-1)\u300d\u3092\u63a8\u5968
3. \u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u540d: `rs-property-production` (\u4efb\u610f)

### 2.2 \u30c7\u30fc\u30bf\u30d9\u30fc\u30b9\u30de\u30a4\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3
\u4ee5\u4e0b\u306e\u9806\u756a\u3067SQL Editor\u304b\u3089\u5b9f\u884c:
```
00001_initial_schema.sql
00002_seed_companies.sql
00003_rls_policies.sql
00004_additional_rls.sql
00005_add_soft_delete.sql
00006_phase2_schema.sql
00007_phase3_document_management.sql
00008_phase4_import_workflow.sql
```

### 2.3 \u8a8d\u8a3c\u8a2d\u5b9a
1. Authentication > Settings > General
   - \u300cEnable email confirmations\u300d: \u672c\u756a\u3067\u306fON\u63a8\u5968
   - \u300cMinimum password length\u300d: 8\u6587\u5b57\u4ee5\u4e0a
2. Authentication > Settings > Email
   - \u30e1\u30fc\u30eb\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u65e5\u672c\u8a9e\u306b\u30ab\u30b9\u30bf\u30de\u30a4\u30ba

### 2.4 \u30e6\u30fc\u30b6\u30fc\u4f5c\u6210
1. Authentication > Users > \u300cAdd User\u300d
2. \u30ed\u30b0\u30a4\u30f3ID\u3068\u3057\u3066\u4f7f\u7528\u3059\u308b\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3092\u767b\u9332
3. `user_profiles` \u30c6\u30fc\u30d6\u30eb\u306b\u30ed\u30fc\u30eb\u3092\u8a2d\u5b9a:
```sql
INSERT INTO user_profiles (user_id, display_name, role)
VALUES ('USER_UUID', '\u7ba1\u7406\u8005\u540d', 'accounting_manager');
```

## 3. Storage\u8a2d\u5b9a

### 3.1 \u30d0\u30b1\u30c3\u30c8\u4f5c\u6210
1. Storage > \u300cNew Bucket\u300d
2. \u30d0\u30b1\u30c3\u30c8\u540d: `documents`
3. \u516c\u958b\u8a2d\u5b9a: **\u975e\u516c\u958b** (\u8a8d\u8a3c\u5fc5\u9808)
4. \u30d5\u30a1\u30a4\u30eb\u30b5\u30a4\u30ba\u4e0a\u9650: 50MB
5. \u8a31\u53ef MIME\u30bf\u30a4\u30d7: `image/jpeg, image/png, image/heif, image/heic, application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/msword`

### 3.2 Storage RLS\u30dd\u30ea\u30b7\u30fc
```sql
-- \u8a8d\u8a3c\u30e6\u30fc\u30b6\u30fc\u306e\u307f\u30a2\u30c3\u30d7\u30ed\u30fc\u30c9\u53ef\u80fd
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

-- \u8a8d\u8a3c\u30e6\u30fc\u30b6\u30fc\u306f\u53c2\u7167\u53ef\u80fd
CREATE POLICY "Authenticated users can read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- \u7d4c\u7406\u8cac\u4efb\u8005\u306e\u307f\u524a\u9664\u53ef\u80fd
CREATE POLICY "Accounting managers can delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'documents' AND
    EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'accounting_manager')
  );
```

## 4. RLS\u78ba\u8a8d\u30dd\u30a4\u30f3\u30c8

### 4.1 \u5168\u30c6\u30fc\u30d6\u30eb\u306eRLS\u6709\u52b9\u5316\u78ba\u8a8d
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```
\u2192 \u5168\u30c6\u30fc\u30d6\u30eb\u304c `rowsecurity = true` \u3067\u3042\u308b\u3053\u3068\u3092\u78ba\u8a8d

### 4.2 \u30dd\u30ea\u30b7\u30fc\u4e00\u89a7\u78ba\u8a8d
```sql
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### 4.3 \u30ed\u30fc\u30eb\u5225\u30a2\u30af\u30bb\u30b9\u78ba\u8a8d
| \u30ed\u30fc\u30eb | \u95b2\u89a7 | \u5bb6\u8cc3\u7de8\u96c6 | \u7d4c\u8cbb\u7de8\u96c6 | \u9280\u884c\u7de8\u96c6 | \u66f8\u985e\u7de8\u96c6 | \u30e6\u30fc\u30b6\u30fc\u7ba1\u7406 |
|---|---|---|---|---|---|---|
| president | \u25cb | \u00d7 | \u00d7 | \u00d7 | \u00d7 | \u00d7 |
| accounting_manager | \u25cb | \u25cb | \u25cb | \u25cb | \u25cb | \u25cb |
| payment_staff | \u25cb | \u25cb | \u00d7 | \u00d7 | \u25cb | \u00d7 |
| expense_staff | \u25cb | \u00d7 | \u25cb | \u00d7 | \u25cb | \u00d7 |
| viewer | \u25cb | \u00d7 | \u00d7 | \u00d7 | \u00d7 | \u00d7 |

## 5. \u672c\u756a\u30c7\u30d7\u30ed\u30a4\u524d\u30c1\u30a7\u30c3\u30af\u30ea\u30b9\u30c8

- [ ] Supabase\u30d7\u30ed\u30b8\u30a7\u30af\u30c8\u4f5c\u6210\u6e08\u307f
- [ ] \u5168\u30de\u30a4\u30b0\u30ec\u30fc\u30b7\u30e7\u30f3\u5b9f\u884c\u6e08\u307f
- [ ] \u8a8d\u8a3c\u8a2d\u5b9a\u78ba\u8a8d
- [ ] \u521d\u671f\u30e6\u30fc\u30b6\u30fc\u4f5c\u6210\u6e08\u307f
- [ ] Storage\u30d0\u30b1\u30c3\u30c8\u4f5c\u6210\u6e08\u307f
- [ ] Storage RLS\u8a2d\u5b9a\u6e08\u307f
- [ ] RLS\u5168\u30c6\u30fc\u30d6\u30eb\u6709\u52b9\u78ba\u8a8d
- [ ] \u74b0\u5883\u5909\u6570 `.env.production` \u8a2d\u5b9a\u6e08\u307f
- [ ] `VITE_DEMO_MODE=false` \u78ba\u8a8d
- [ ] \u30d3\u30eb\u30c9\u30fb\u30c7\u30d7\u30ed\u30a4\u30c6\u30b9\u30c8\u6e08\u307f

## 6. OCR\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u8a2d\u5b9a

\u73fe\u5728\u306f\u30c7\u30e2\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u304c\u5b9f\u88c5\u6e08\u307f\u3002\u672c\u756a\u3067\u306f\u4ee5\u4e0b\u306e\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u306b\u5dee\u3057\u66ff\u3048\u53ef\u80fd:

### \u5bfe\u5fdc\u4e88\u5b9a\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc
| \u30d7\u30ed\u30d0\u30a4\u30c0\u30fc | \u74b0\u5883\u5909\u6570 | \u5099\u8003 |
|---|---|---|
| Google Cloud Vision | `VITE_OCR_PROVIDER=google_vision` | \u65e5\u672c\u8a9e\u5bfe\u5fdc\u826f\u597d |
| Azure Cognitive Services | `VITE_OCR_PROVIDER=azure_cognitive` | \u624b\u66f8\u304d\u5bfe\u5fdc |
| Tesseract.js | `VITE_OCR_PROVIDER=tesseract` | \u30af\u30e9\u30a4\u30a2\u30f3\u30c8\u5074OCR |

### \u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u5b9f\u88c5\u4f8b
```typescript
import { OcrProvider, OcrResult, setOcrProvider } from '@/lib/ocrProvider'

class GoogleVisionProvider implements OcrProvider {
  name = 'Google Cloud Vision'
  supportedMimeTypes = ['image/jpeg', 'image/png', 'application/pdf']

  async processFile(file: File): Promise<OcrResult> {
    // Google Cloud Vision API\u3092\u547c\u3073\u51fa\u3059\u5b9f\u88c5
    const formData = new FormData()
    formData.append('file', file)
    const response = await fetch('/api/ocr/google-vision', { method: 'POST', body: formData })
    const data = await response.json()
    return { raw_text: data.text, confidence: data.confidence, language: 'ja' }
  }
}

// \u30a2\u30d7\u30ea\u521d\u671f\u5316\u6642\u306b\u30d7\u30ed\u30d0\u30a4\u30c0\u30fc\u3092\u8a2d\u5b9a
setOcrProvider(new GoogleVisionProvider())
```

## 7. \u4e8c\u6bb5\u968e\u8a8d\u8a3c (2FA) \u5bfe\u5fdc\u6e96\u5099

\u73fe\u5728\u306e\u8a8d\u8a3c\u69cb\u9020\u306f\u5c06\u6765\u7684\u306b2FA\u3092\u8ffd\u52a0\u3057\u3084\u3059\u3044\u8a2d\u8a08:
- Supabase Auth\u306eMFA\u6a5f\u80fd\u3092\u6709\u52b9\u5316\u3059\u308b\u3060\u3051\u3067\u5bfe\u5fdc\u53ef\u80fd
- \u30ed\u30b0\u30a4\u30f3\u30d5\u30ed\u30fc\u306b2FA\u30b9\u30c6\u30c3\u30d7\u3092\u8ffd\u52a0
- `useAuth` hook\u306b`verifyMfa`\u30e1\u30bd\u30c3\u30c9\u3092\u8ffd\u52a0
