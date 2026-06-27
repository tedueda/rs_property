import { useState, useEffect, useCallback } from 'react'
import { supabase, isDemoMode } from './client'
import type {
  Property, Unit, Application, Contract, Tenant, Repair,
  RentCharge, RentPayment, OcrJob, DashboardAlerts,
} from '@/types'

// Generic hook for Supabase queries
function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (isDemoMode) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: err } = await queryFn()
      if (err) throw new Error(err.message)
      setData(result || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch, setData }
}

// Single record hook
function useSupabaseSingle<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: { message: string } | null }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refetch = useCallback(async () => {
    if (isDemoMode) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data: result, error: err } = await queryFn()
      if (err) throw new Error(err.message)
      setData(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { refetch() }, [refetch])

  return { data, loading, error, refetch, setData }
}

// ==================== Properties ====================
export function useProperties() {
  return useSupabaseQuery<Property>(
    () => supabase.from('properties').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useProperty(id: string | undefined) {
  return useSupabaseSingle<Property>(
    () => supabase.from('properties').select('*').eq('id', id!).single(),
    [id]
  )
}

export async function createProperty(data: Partial<Property>) {
  const { data: result, error } = await supabase.from('properties').insert(data).select().single()
  if (error) throw new Error(error.message)
  return result
}

export async function updateProperty(id: string, data: Partial<Property>) {
  const { data: result, error } = await supabase.from('properties').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return result
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from('properties').update({ deleted_at: new Date().toISOString() }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ==================== Units ====================
export function useUnits() {
  return useSupabaseQuery<Unit>(
    () => supabase.from('units').select('*, property:properties(*)').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useUnitsByProperty(propertyId: string | undefined) {
  return useSupabaseQuery<Unit>(
    () => supabase.from('units').select('*, property:properties(*)').eq('property_id', propertyId!).is('deleted_at', null).order('unit_number'),
    [propertyId]
  )
}

export function useUnit(id: string | undefined) {
  return useSupabaseSingle<Unit>(
    () => supabase.from('units').select('*, property:properties(*)').eq('id', id!).single(),
    [id]
  )
}

export async function createUnit(data: Partial<Unit>) {
  const { data: result, error } = await supabase.from('units').insert(data).select().single()
  if (error) throw new Error(error.message)
  return result
}

export async function updateUnit(id: string, data: Partial<Unit>) {
  const { data: result, error } = await supabase.from('units').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return result
}

// ==================== Applications ====================
export function useApplications() {
  return useSupabaseQuery<Application>(
    () => supabase.from('applications').select('*, property:properties(*), applicant:applicants(*)').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useApplication(id: string | undefined) {
  return useSupabaseSingle<Application>(
    () => supabase.from('applications').select('*, property:properties(*), unit:units(*), applicant:applicants(*)').eq('id', id!).single(),
    [id]
  )
}

export async function createApplication(appData: Partial<Application>, applicantData: Partial<{ full_name: string; full_name_kana: string; phone: string; email: string }>) {
  const { data: app, error: appErr } = await supabase.from('applications').insert(appData).select().single()
  if (appErr) throw new Error(appErr.message)
  if (applicantData.full_name) {
    await supabase.from('applicants').insert({ ...applicantData, application_id: app.id })
  }
  return app
}

export async function updateApplication(id: string, data: Partial<Application>) {
  const { data: result, error } = await supabase.from('applications').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return result
}

// ==================== Contracts ====================
export function useContracts() {
  return useSupabaseQuery<Contract>(
    () => supabase.from('contracts').select('*, property:properties(*)').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useContract(id: string | undefined) {
  return useSupabaseSingle<Contract>(
    () => supabase.from('contracts').select('*, property:properties(*), unit:units(*)').eq('id', id!).single(),
    [id]
  )
}

// ==================== Tenants ====================
export function useTenants() {
  return useSupabaseQuery<Tenant>(
    () => supabase.from('tenants').select('*').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useTenant(id: string | undefined) {
  return useSupabaseSingle<Tenant>(
    () => supabase.from('tenants').select('*').eq('id', id!).single(),
    [id]
  )
}

// ==================== Repairs ====================
export function useRepairs() {
  return useSupabaseQuery<Repair>(
    () => supabase.from('repairs').select('*, property:properties(*)').is('deleted_at', null).order('created_at', { ascending: false })
  )
}

export function useRepair(id: string | undefined) {
  return useSupabaseSingle<Repair>(
    () => supabase.from('repairs').select('*, property:properties(*), unit:units(*)').eq('id', id!).single(),
    [id]
  )
}

export async function createRepair(data: Partial<Repair>) {
  const { data: result, error } = await supabase.from('repairs').insert(data).select().single()
  if (error) throw new Error(error.message)
  return result
}

// ==================== Rent ====================
export function useRentCharges() {
  return useSupabaseQuery<RentCharge>(
    () => supabase.from('rent_charges').select('*, tenant:tenants(*), unit:units(*, property:properties(*))').order('charge_month', { ascending: false })
  )
}

export function useRentPayments() {
  return useSupabaseQuery<RentPayment>(
    () => supabase.from('rent_payments').select('*').order('payment_date', { ascending: false })
  )
}

// ==================== OCR Jobs ====================
export function useOcrJobs() {
  return useSupabaseQuery<OcrJob>(
    () => supabase.from('ocr_jobs').select('*').order('created_at', { ascending: false })
  )
}

// ==================== Documents ====================
export function useDocuments() {
  return useSupabaseQuery<{ id: string; company_id: string; name: string; file_path: string; file_type: string; category: string; created_at: string; updated_at: string }>(
    () => supabase.from('documents').select('*').order('created_at', { ascending: false })
  )
}

// ==================== Dashboard Stats ====================
interface HookDashboardStats {
  total_properties: number
  total_units: number
  occupied_units: number
  vacant_units: number
  pending_applications: number
  contracts_this_month: number
  arrears_count: number
  active_repairs: number
}

export function useDashboardStats() {
  const [stats, setStats] = useState<HookDashboardStats>({
    total_properties: 0, total_units: 0, occupied_units: 0, vacant_units: 0,
    pending_applications: 0, contracts_this_month: 0, arrears_count: 0, active_repairs: 0,
  })
  const [alerts, setAlerts] = useState<DashboardAlerts>({
    ocr_unconfirmed: 0, mapping_unconfirmed: 0, contracts_not_created: 0,
    payments_unconfirmed: 0, arrears_count: 0, repairs_incomplete: 0, new_templates_detected: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) { setLoading(false); return }

    async function fetchStats() {
      try {
        const [
          { count: propCount },
          { count: unitCount },
          { count: occupiedCount },
          { count: vacantCount },
          { count: appCount },
          { count: contractCount },
          { count: arrearsCount },
          { count: repairCount },
          { count: ocrCount },
          { count: paymentCount },
        ] = await Promise.all([
          supabase.from('properties').select('*', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('units').select('*', { count: 'exact', head: true }).is('deleted_at', null),
          supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'occupied').is('deleted_at', null),
          supabase.from('units').select('*', { count: 'exact', head: true }).eq('status', 'vacant').is('deleted_at', null),
          supabase.from('applications').select('*', { count: 'exact', head: true }).in('status', ['submitted', 'screening']).is('deleted_at', null),
          supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
          supabase.from('rent_charges').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
          supabase.from('repairs').select('*', { count: 'exact', head: true }).not('status', 'eq', 'completed').is('deleted_at', null),
          supabase.from('ocr_jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
          supabase.from('rent_payments').select('*', { count: 'exact', head: true }).eq('reconciliation_status', 'unmatched'),
        ])

        setStats({
          total_properties: propCount || 0,
          total_units: unitCount || 0,
          occupied_units: occupiedCount || 0,
          vacant_units: vacantCount || 0,
          pending_applications: appCount || 0,
          contracts_this_month: contractCount || 0,
          arrears_count: arrearsCount || 0,
          active_repairs: repairCount || 0,
        })

        setAlerts({
          ocr_unconfirmed: ocrCount || 0,
          mapping_unconfirmed: 0,
          contracts_not_created: 0,
          payments_unconfirmed: paymentCount || 0,
          arrears_count: arrearsCount || 0,
          repairs_incomplete: repairCount || 0,
          new_templates_detected: 0,
        })
      } catch {
        // silently fail for stats
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, alerts, loading }
}

// ==================== File Upload ====================
export async function uploadFile(bucket: string, path: string, file: File) {
  const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw new Error(error.message)
  return data
}

export function getPublicUrl(bucket: string, path: string) {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

// ==================== OCR Job Management ====================
export async function createOcrJob(fileData: {
  company_id: string
  file_path: string
  file_name: string
  file_type: string
}) {
  const { data, error } = await supabase.from('ocr_jobs').insert({
    ...fileData,
    status: 'pending',
  }).select().single()
  if (error) throw new Error(error.message)
  return data as OcrJob
}

export async function updateOcrJob(id: string, updates: Partial<OcrJob>) {
  const { data, error } = await supabase.from('ocr_jobs').update({
    ...updates,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data as OcrJob
}

export async function saveOcrExtractedFields(ocrJobId: string, fields: Array<{
  ocr_label: string
  ocr_value: string
  confidence_score: number
  status: 'auto_confirmed' | 'candidate' | 'needs_review' | 'unmapped'
}>) {
  const rows = fields.map(f => ({ ocr_job_id: ocrJobId, ...f }))
  const { error } = await supabase.from('ocr_extracted_fields').insert(rows)
  if (error) throw new Error(error.message)
}
