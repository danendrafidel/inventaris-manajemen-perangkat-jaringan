import CircleIcon from "@mui/icons-material/Circle";

export default function StatusPill({ status }) {
  const normalized = String(status || '').toUpperCase()
  const config = {
    OPERATED: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-100', dot: 'text-emerald-500', label: 'Operated' },
    IDLE: { bg: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'text-slate-400', label: 'Idle' },
    MAINTENANCE: { bg: 'bg-blue-50 text-blue-700 border-blue-100', dot: 'text-blue-500', label: 'Maintenance' },
    PROBLEM: { bg: 'bg-rose-50 text-rose-700 border-rose-100', dot: 'text-rose-500', label: 'Problem' }
  }[normalized] || { bg: 'bg-amber-50 text-amber-700 border-amber-100', dot: 'text-amber-500', label: normalized || 'Unknown' }

  return (
    <div className={`inline-flex items-center gap-2 rounded-lg border px-2 py-0.5 ${config.bg}`}>
      <CircleIcon sx={{ fontSize: 8, color: 'currentColor' }} className={config.dot} />
      <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
    </div>
  )
}
