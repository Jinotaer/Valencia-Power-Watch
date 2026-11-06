import { Building2, Zap } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

export function BarangayStatusUpdateDialog({
  open,
  onOpenChange,
  barangay,
  statusForm,
  setStatusForm,
  onSaveStatus,
  isSubmitting = false,
  actionError = '',
}) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-ink flex items-center gap-2">
              <Zap className="size-5 text-brand-blue" />
              Update Barangay Power Status
            </DialogTitle>
            <DialogDescription className="text-xs text-brand-muted">
              Update real-time grid status and restoration ETA for {barangay?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSaveStatus} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Power Grid Status</label>
              <select
                value={statusForm.status}
                onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink shadow-xs focus:ring-1 focus:ring-brand-blue"
              >
                <option value="Energized">Energized (Normal Service)</option>
                <option value="Interrupted">Interrupted (Full Outage)</option>
                <option value="Partial Outage">Partial Outage (Feeder Issue)</option>
                <option value="Maintenance">Maintenance (Scheduled Work)</option>
              </select>
            </div>

            {statusForm.status !== 'Energized' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-muted">Estimated Restoration Time</label>
                  <Input
                    placeholder="e.g. Today, 5:30 PM"
                    value={statusForm.restorationEta}
                    onChange={(e) => setStatusForm({ ...statusForm, restorationEta: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-muted">Affected Households</label>
                  <Input
                    type="number"
                    placeholder="e.g. 1200"
                    value={statusForm.affectedHouseholds}
                    onChange={(e) => setStatusForm({ ...statusForm, affectedHouseholds: e.target.value })}
                    className="h-10 text-sm"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Assigned Response Crew</label>
              <Input
                placeholder="e.g. Rapid Response Bravo"
                value={statusForm.assignedCrew}
                onChange={(e) => setStatusForm({ ...statusForm, assignedCrew: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            {actionError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">
                {actionError}
              </p>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? 'Saving…' : 'Save Updates'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function BarangayCreateDialog({
  open,
  onOpenChange,
  newBarangay,
  setNewBarangay,
  onCreateBarangay,
  isSubmitting = false,
  actionError = '',
}) {
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[440px] rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-brand-ink flex items-center gap-2">
              <Building2 className="size-5 text-brand-blue" />
              Register Barangay Liaison
            </DialogTitle>
            <DialogDescription className="text-xs text-brand-muted">
              Register a barangay contact and liaison for power outage response coordination.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onCreateBarangay} className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Barangay Name</label>
              <Input
                required
                placeholder="e.g. Sinayawan"
                value={newBarangay.name}
                onChange={(e) => setNewBarangay({ ...newBarangay, name: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Zone / District</label>
              <select
                value={newBarangay.zone}
                onChange={(e) => setNewBarangay({ ...newBarangay, zone: e.target.value })}
                className="h-10 w-full rounded-lg border border-brand-line bg-white px-3 text-sm text-brand-ink shadow-xs focus:ring-1 focus:ring-brand-blue"
              >
                <option>Central Urban</option>
                <option>North District</option>
                <option>South District</option>
                <option>East District</option>
                <option>West District</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Barangay Captain / Liaison</label>
              <Input
                placeholder="e.g. Hon. Juan Dela Cruz"
                value={newBarangay.captain}
                onChange={(e) => setNewBarangay({ ...newBarangay, captain: e.target.value })}
                className="h-10 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-muted">Contact Hotline</label>
                <Input
                  placeholder="+63 917 000 0000"
                  value={newBarangay.contactNumber}
                  onChange={(e) => setNewBarangay({ ...newBarangay, contactNumber: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-brand-muted">Total Households</label>
                <Input
                  type="number"
                  placeholder="2500"
                  value={newBarangay.totalHouseholds}
                  onChange={(e) => setNewBarangay({ ...newBarangay, totalHouseholds: e.target.value })}
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {actionError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[11px] font-semibold text-[#b42318]">
                {actionError}
              </p>
            )}

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-blue hover:bg-brand-navy text-white rounded-lg text-xs font-semibold"
              >
                {isSubmitting ? 'Registering…' : 'Register Barangay'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default BarangayStatusUpdateDialog
