// Staff remarks and restoration ETA submitted with a progress/restoration update.
export function StaffUpdateFields({ value, onChange, disabled = false }) {
  return (
    <div className="space-y-2.5 pb-2">
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-brand-muted" htmlFor="staff-remarks">
          Remarks / findings
        </label>
        <textarea
          id="staff-remarks"
          rows={3}
          disabled={disabled}
          placeholder="e.g. Fallen line on Purok 3 cleared, transformer fuse replaced."
          value={value.remarks}
          onChange={(event) => onChange({ ...value, remarks: event.target.value })}
          className="w-full resize-none rounded-xl border border-brand-line bg-white px-3 py-2 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
        />
      </div>
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-brand-muted" htmlFor="staff-eta">
          Estimated restoration
        </label>
        <input
          id="staff-eta"
          type="text"
          disabled={disabled}
          placeholder="e.g. Today, 4:30 PM or ~2 hours"
          value={value.eta}
          onChange={(event) => onChange({ ...value, eta: event.target.value })}
          className="h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-xs text-brand-ink placeholder:text-brand-muted focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
        />
      </div>
    </div>
  )
}
