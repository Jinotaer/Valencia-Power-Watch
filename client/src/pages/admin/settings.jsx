import { Check, Settings2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import AdminNavbar from '../../components/admin/navbar'
import AdminSidebar from '../../components/admin/sidebar'
import { SidebarInset, SidebarProvider } from '../../components/ui/sidebar'
import {
  loadReportCategories,
  loadRolePermissions,
  loadSystemSettings,
  setRolePermission,
  updateReportCategory,
  updateSystemSetting,
} from '../../lib/systemSettings'

const roleLabels = { admin: 'Administrator', staff: 'Staff', resident: 'Resident' }
const builtInStatuses = [
  { value: 'pending', label: 'Pending', note: 'Waiting for verification.' },
  { value: 'verified', label: 'Verified', note: 'Verified and ready for field response.' },
  { value: 'resolved', label: 'Resolved', note: 'Service restored or issue closed.' },
  { value: 'rejected', label: 'Rejected', note: 'Terminal admin decision.' },
]

export default function AdminSettings() {
  const [settings, setSettings] = useState([])
  const [permissions, setPermissions] = useState([])
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [formError, setFormError] = useState('')

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(''), 3500)
  }

  useEffect(() => {
    let active = true

    Promise.all([loadSystemSettings(), loadRolePermissions(), loadReportCategories()])
      .then(([nextSettings, nextPermissions, nextCategories]) => {
        if (!active) return
        setSettings(nextSettings)
        setPermissions(nextPermissions)
        setCategories(nextCategories)
      })
      .catch(() => {
        if (active) setLoadError('We could not load system settings. Run supabase/admin_management.sql and try again.')
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const permissionByRole = useMemo(() => {
    const groups = {}
    permissions.forEach((row) => {
      groups[row.role] = groups[row.role] ?? []
      groups[row.role].push(row)
    })
    return groups
  }, [permissions])

  async function saveSetting(setting) {
    if (isSaving) return
    setIsSaving(true)
    setFormError('')
    try {
      const updated = await updateSystemSetting(setting.key, setting.value)
      setSettings((current) => current.map((row) => (row.key === updated.key ? updated : row)))
      showToast(`${setting.key.replaceAll('_', ' ')} saved.`)
    } catch (error) {
      setFormError(error.message || 'Could not save this setting.')
    } finally {
      setIsSaving(false)
    }
  }

  async function togglePermission(row) {
    if (isSaving) return
    setIsSaving(true)
    setFormError('')
    try {
      const updated = await setRolePermission(row.id, !row.enabled)
      setPermissions((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      showToast(`${row.role} ${row.permission} ${updated.enabled ? 'enabled' : 'disabled'}.`)
    } catch (error) {
      setFormError(error.message || 'Could not update this permission.')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveCategory(category) {
    if (isSaving) return
    setIsSaving(true)
    setFormError('')
    try {
      const updated = await updateReportCategory(category.id, {
        label: category.label,
        description: category.description,
        isActive: category.isActive,
        sortOrder: category.sortOrder,
      })
      setCategories((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      showToast(`${updated.label} updated.`)
    } catch (error) {
      setFormError(error.message || 'Could not update this category.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <SidebarProvider>
      <AdminSidebar activePath="/admin/settings" />
      <SidebarInset className="min-h-screen bg-brand-paper">
        <AdminNavbar title="Administration" section="System settings" />

        {toast && (
          <div className="fixed top-5 right-5 z-[100] flex items-center gap-2.5 rounded-2xl bg-brand-navy px-4 py-3 text-xs font-bold text-white shadow-xl">
            <Check className="size-4 text-brand-yellow" />
            <span>{toast}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-[1400px]">
            <header className="mb-6">
              <h1 className="text-2xl font-bold tracking-[-.03em] text-brand-navy">System settings and access control</h1>
              <p className="mt-1 max-w-xl text-sm text-brand-muted">Manage application values, role permissions, report categories and built-in report statuses.</p>
            </header>

            {formError && <p role="alert" className="mb-5 rounded-xl border border-[#f3c7c3] bg-white px-4 py-3 text-sm font-semibold text-[#b42318]">{formError}</p>}

            {isLoading ? (
              <p className="rounded-2xl border border-brand-line bg-white p-10 text-center text-sm font-semibold text-brand-muted">Loading settings…</p>
            ) : loadError ? (
              <p className="rounded-2xl border border-[#f3c7c3] bg-white p-10 text-center text-sm font-bold text-[#b42318]">{loadError}</p>
            ) : (
              <div className="grid gap-6 xl:grid-cols-2">
                <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-[#e5e9f6] text-brand-blue"><Settings2 className="size-5" /></span>
                    <div>
                      <h2 className="font-bold text-brand-navy">Application settings</h2>
                      <p className="text-xs text-brand-muted">Public and operational values saved in Supabase.</p>
                    </div>
                  </div>
                  <div className="mt-5 space-y-4">
                    {settings.map((setting) => (
                      <div key={setting.key} className="flex flex-col gap-2 border-b border-brand-line pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-end">
                        <label className="min-w-0 flex-1 space-y-1.5 text-xs font-semibold text-brand-muted">
                          {setting.key.replaceAll('_', ' ')}
                          {setting.description && <span className="block font-normal normal-case text-brand-muted">{setting.description}</span>}
                          <input
                            value={setting.value}
                            onChange={(event) => setSettings((current) => current.map((row) => (row.key === setting.key ? { ...row, value: event.target.value } : row)))}
                            className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue"
                          />
                        </label>
                        <button type="button" onClick={() => saveSetting(setting)} disabled={isSaving} className="h-10 shrink-0 rounded-lg bg-brand-blue px-4 text-xs font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                          {isSaving ? 'Saving…' : 'Save'}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs">
                  <h2 className="font-bold text-brand-navy">Built-in report statuses</h2>
                  <p className="mt-1 text-xs text-brand-muted">Statuses are fixed by the Supabase constraint so resident, staff and admin views stay aligned.</p>
                  <div className="mt-4 space-y-3">
                    {builtInStatuses.map((status) => (
                      <div key={status.value} className="rounded-xl bg-brand-paper p-3">
                        <p className="text-sm font-bold text-brand-navy">{status.label}</p>
                        <p className="text-xs text-brand-muted">{status.note}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs xl:col-span-2">
                  <h2 className="font-bold text-brand-navy">Roles and permissions</h2>
                  <p className="mt-1 text-xs text-brand-muted">Toggle what each role may do. RLS and route guards still enforce the three core roles.</p>
                  <div className="mt-5 grid gap-5 lg:grid-cols-3">
                    {Object.entries(permissionByRole).map(([role, rows]) => (
                      <div key={role} className="rounded-xl border border-brand-line p-4">
                        <h3 className="font-bold text-brand-navy">{roleLabels[role] ?? role}</h3>
                        <div className="mt-3 space-y-2">
                          {rows.map((row) => (
                            <label key={row.id} className="flex items-center justify-between gap-3 rounded-lg bg-brand-paper px-3 py-2 text-xs font-semibold text-brand-ink">
                              <span>{row.permission.replaceAll('_', ' ')}</span>
                              <input
                                type="checkbox"
                                checked={row.enabled}
                                disabled={isSaving}
                                onChange={() => togglePermission(row)}
                                className="size-4 rounded border-brand-line accent-brand-blue"
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-brand-line bg-white p-5 shadow-xs xl:col-span-2">
                  <h2 className="font-bold text-brand-navy">Report categories</h2>
                  <p className="mt-1 text-xs text-brand-muted">Rename, reorder or hide the outage categories used by the report form.</p>
                  <div className="mt-5 space-y-3">
                    {categories.map((category) => (
                      <div key={category.id} className="grid gap-3 rounded-xl bg-brand-paper p-3 md:grid-cols-[160px_1fr_110px_auto]">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-muted">Value</p>
                          <p className="text-sm font-bold text-brand-navy">{category.value}</p>
                        </div>
                        <label className="space-y-1 text-xs font-semibold text-brand-muted">
                          Label
                          <input value={category.label} onChange={(event) => setCategories((current) => current.map((row) => (row.id === category.id ? { ...row, label: event.target.value } : row)))} className="h-9 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue" />
                        </label>
                        <label className="space-y-1 text-xs font-semibold text-brand-muted">
                          Sort
                          <input value={category.sortOrder} onChange={(event) => setCategories((current) => current.map((row) => (row.id === category.id ? { ...row, sortOrder: event.target.value } : row)))} type="number" className="h-9 w-full rounded-lg border border-brand-line bg-white px-3 text-sm font-normal text-brand-ink outline-none focus:border-brand-blue" />
                        </label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 text-xs font-semibold text-brand-navy">
                            <input type="checkbox" checked={category.isActive} onChange={(event) => setCategories((current) => current.map((row) => (row.id === category.id ? { ...row, isActive: event.target.checked } : row)))} className="size-4 rounded border-brand-line accent-brand-blue" />
                            Active
                          </label>
                          <button type="button" onClick={() => saveCategory(category)} disabled={isSaving} className="h-9 rounded-lg bg-brand-blue px-3 text-xs font-semibold text-white hover:bg-brand-navy disabled:opacity-60">
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
