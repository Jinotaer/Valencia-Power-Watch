import { HardHat, LoaderCircle, Trash2, Users } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'

const dialogContentClass =
  'gap-0 overflow-hidden rounded-2xl border border-brand-line bg-white p-0 shadow-2xl ring-0 sm:max-w-[540px]'
const dialogHeaderClass = 'border-b border-brand-line px-6 py-5'
const dialogTitleClass = 'text-lg font-bold tracking-[-0.02em] text-brand-navy'
const dialogDescriptionClass = 'text-xs leading-5 text-brand-muted'
const dialogBodyClass = 'max-h-[calc(85vh-140px)] space-y-4 overflow-y-auto px-6 py-5'
const dialogFooterClass =
  'flex items-center justify-end gap-2.5 border-t border-brand-line bg-brand-paper/60 px-6 py-4'
const labelClass = 'block text-xs font-semibold text-brand-ink'
const inputClass =
  'h-10 rounded-xl border-brand-line !bg-white px-3.5 text-sm text-brand-ink placeholder:text-brand-muted focus-visible:border-brand-blue'
const selectClass =
  'h-10 w-full cursor-pointer rounded-xl border border-brand-line !bg-white px-3 text-sm text-brand-ink outline-none transition-colors focus:border-brand-blue'
const errorClass =
  'rounded-xl border border-[#f3c7c3] bg-red-50/80 px-3.5 py-2.5 text-xs font-semibold text-[#b42318]'
const cancelClass =
  'h-10 cursor-pointer rounded-xl border-brand-line bg-white px-4 text-xs font-semibold text-brand-ink hover:bg-brand-paper'
const submitClass =
  'h-10 cursor-pointer rounded-xl bg-brand-blue px-4 text-xs font-semibold text-white hover:bg-brand-navy'

export function TeamCreateDialog({
  open,
  onOpenChange,
  newTeam,
  setNewTeam,
  onCreateTeam,
  staffList = [],
  isSubmitting,
  errorMessage,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e5e9f6] text-brand-blue">
              <Users className="size-5" />
            </span>
            <div>
              <DialogTitle className={dialogTitleClass}>Create Field Team</DialogTitle>
              <DialogDescription className={dialogDescriptionClass}>
                Organize technicians into a dispatchable unit with dedicated equipment and a lead lineman.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onCreateTeam}>
          <div className={dialogBodyClass}>
            {errorMessage && (
              <p className={errorClass} role="alert">
                {errorMessage}
              </p>
            )}

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="team-name">
                Team Name *
              </label>
              <Input
                id="team-name"
                required
                placeholder="e.g. Team Alpha - Feeder 1 Quick Response"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="team-description">
                Description / Coverage Area
              </label>
              <Input
                id="team-description"
                placeholder="e.g. Primary line repairs across Poblacion, Bagontaas & Mailag"
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="team-lead">
                  Designated Team Leader
                </label>
                <select
                  id="team-lead"
                  value={newTeam.leaderId || ''}
                  onChange={(e) => setNewTeam({ ...newTeam, leaderId: e.target.value || null })}
                  className={selectClass}
                >
                  <option value="">Select a team lead…</option>
                  {staffList.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email} {member.position ? `(${member.position})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="team-vehicle">
                  Vehicle / Equipment Plate
                </label>
                <Input
                  id="team-vehicle"
                  placeholder="e.g. Bucket Truck 02 (SKW-892)"
                  value={newTeam.vehiclePlate}
                  onChange={(e) => setNewTeam({ ...newTeam, vehiclePlate: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="team-contact">
                Radio Callsign / Contact Hotline
              </label>
              <Input
                id="team-contact"
                placeholder="e.g. VHF Ch. 7 / +63 917 123 4567"
                value={newTeam.contactNumber}
                onChange={(e) => setNewTeam({ ...newTeam, contactNumber: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <DialogFooter className={dialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cancelClass}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className={submitClass}>
              {isSubmitting ? (
                <>
                  <LoaderCircle className="size-4 animate-spin mr-1.5" />
                  Creating…
                </>
              ) : (
                'Create Team'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TeamEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  staffList = [],
  isSubmitting,
  errorMessage,
}) {
  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <HardHat className="size-5" />
            </span>
            <div>
              <DialogTitle className={dialogTitleClass}>Edit Team Settings</DialogTitle>
              <DialogDescription className={dialogDescriptionClass}>
                Update crew parameters, reassign the team leader, or update vehicle details.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSave}>
          <div className={dialogBodyClass}>
            {errorMessage && (
              <p className={errorClass} role="alert">
                {errorMessage}
              </p>
            )}

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-team-name">
                Team Name *
              </label>
              <Input
                id="edit-team-name"
                required
                value={form.name || ''}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-team-description">
                Description / Coverage Area
              </label>
              <Input
                id="edit-team-description"
                value={form.description || ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="edit-team-lead">
                  Team Leader
                </label>
                <select
                  id="edit-team-lead"
                  value={form.leaderId || ''}
                  onChange={(e) => setForm({ ...form, leaderId: e.target.value || null })}
                  className={selectClass}
                >
                  <option value="">No leader assigned</option>
                  {staffList.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="edit-team-status">
                  Operational Status
                </label>
                <select
                  id="edit-team-status"
                  value={form.status || 'available'}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className={selectClass}
                >
                  <option value="available">Available (Ready for Dispatch)</option>
                  <option value="dispatched">Dispatched (On Active Job)</option>
                  <option value="offline">Offline / Off-Duty</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="edit-team-vehicle">
                  Vehicle / Equipment Plate
                </label>
                <Input
                  id="edit-team-vehicle"
                  value={form.vehiclePlate || ''}
                  onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className={labelClass} htmlFor="edit-team-contact">
                  Radio Callsign / Contact
                </label>
                <Input
                  id="edit-team-contact"
                  value={form.contactNumber || ''}
                  onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <DialogFooter className={dialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className={cancelClass}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className={submitClass}>
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function TeamDeleteDialog({ open, onOpenChange, team, onDelete, isSubmitting }) {
  if (!team) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600">
              <Trash2 className="size-5" />
            </span>
            <div>
              <DialogTitle className={dialogTitleClass}>Delete Team: {team.name}?</DialogTitle>
              <DialogDescription className={dialogDescriptionClass}>
                This action disbands the team. Assigned crew members will become unassigned, but their
                accounts and historical reports will not be deleted.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-4 text-xs text-brand-muted">
          <p>
            Members currently in this team: <strong>{team.memberCount || 0} staff</strong>
          </p>
          <p className="mt-1">
            Active dispatched jobs: <strong>{team.activeJobCount || 0} incidents</strong>
          </p>
        </div>

        <DialogFooter className={dialogFooterClass}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={cancelClass}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onDelete}
            disabled={isSubmitting}
            className="h-10 cursor-pointer rounded-xl bg-[#b42318] px-4 text-xs font-semibold text-white hover:bg-[#912018]"
          >
            {isSubmitting ? 'Disbanding…' : 'Disband Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
