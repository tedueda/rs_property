-- RS Property 本番リペア SQL（冪等 / 既存データは削除しません）
-- Supabase SQL Editor で全文を貼り付けて Run してください。

-- ============================================================
-- 1. companies テーブルに不足カラムを追加
-- ============================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ============================================================
-- 2. 不足テーブルの作成（未収管理・資金移動）
-- ============================================================
CREATE TABLE IF NOT EXISTS arrears_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  monthly_charge_id UUID NOT NULL REFERENCES monthly_charges(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  target_month TEXT NOT NULL,
  billed_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  paid_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  arrears_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partially_paid', 'resolved', 'written_off')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE TABLE IF NOT EXISTS fund_transfer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_date DATE NOT NULL,
  from_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  to_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- 3. RLS ポリシー（既存の allow_all 方式に合わせる / 重複作成しない）
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['companies', 'arrears_records', 'fund_transfer_records'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'allow_all_' || tbl
    ) THEN
      EXECUTE format('CREATE POLICY "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ============================================================
-- 4. 会社マスタの初期データ（未登録の場合のみ）
-- ============================================================
INSERT INTO companies (name, company_code, notes)
SELECT v.name, v.company_code, v.notes
FROM (VALUES
  ('林建設株式会社', 'HAYASHI', '不動産管理グループ'),
  ('N・Yコーポレーション株式会社', 'NYCORP', '不動産管理グループ'),
  ('株式会社オーナーズ', 'OWNERS', '不動産管理グループ'),
  ('株式会社照', 'TERU', '不動産管理グループ')
) AS v(name, company_code, notes)
WHERE NOT EXISTS (SELECT 1 FROM companies c WHERE c.company_code = v.company_code);

-- ============================================================
-- 5. 確認
-- ============================================================
SELECT id, name, company_code, deleted_at FROM companies ORDER BY created_at;
