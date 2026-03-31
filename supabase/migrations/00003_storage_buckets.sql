-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('application-originals', 'application-originals', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('application-processed', 'application-processed', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('contracts', 'contracts', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('tenant-documents', 'tenant-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('repair-images', 'repair-images', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('template-samples', 'template-samples', false) ON CONFLICT DO NOTHING;

-- Storage policies: authenticated users in same company can access
CREATE POLICY storage_select ON storage.objects FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY storage_insert ON storage.objects FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY storage_delete ON storage.objects FOR DELETE USING (auth.role() = 'authenticated');
