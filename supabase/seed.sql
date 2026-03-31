-- Initial company
INSERT INTO companies (id, name, address, phone)
VALUES ('00000000-0000-0000-0000-000000000001', 'アールエス株式会社', '東京都千代田区丸の内1-1-1', '03-0000-0000')
ON CONFLICT (id) DO NOTHING;

-- Note: To create initial admin user:
-- 1. Sign up via Supabase Auth
-- 2. Then INSERT INTO users (id, email, full_name, role, company_id)
--    VALUES ('<auth_user_id>', 'admin@rs-corp.co.jp', '管理者', 'super_admin', '00000000-0000-0000-0000-000000000001');
