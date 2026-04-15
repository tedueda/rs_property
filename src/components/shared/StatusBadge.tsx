import { Badge } from '@/components/ui/badge'

interface StatusBadgeProps {
  statusMap: Record<string, { label: string; color: string }>
  status: string
}

export function StatusBadge({ statusMap, status }: StatusBadgeProps) {
  const config = statusMap[status]
  if (!config) return <Badge variant="outline">{status}</Badge>
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  )
}
