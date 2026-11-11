import { useState } from 'react'
import { Eye, EyeOff, HardHat, LoaderCircle } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'

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

export function AdminUsersCreateDialog({
  open,
  onOpenChange,
  newUser,
  setNewUser,
  onCreateUser,
  teamsList = [],
  isSubmitting,
  errorMessage,
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <HardHat className="size-5" />
            </span>
            <div>
              <DialogTitle className={dialogTitleClass}>Create Staff Account</DialogTitle>
              <DialogDescription className={dialogDescriptionClass}>
                Register a new field responder, technician, or utility crew member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onCreateUser}>
          <div className={dialogBodyClass}>
            {errorMessage && (
              <p className={errorClass} role="alert">
                {errorMessage}
              </p>
            )}

            <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-2 text-xs">
              <span className="font-medium text-amber-900">Account Type</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-0.5 font-bold text-amber-800">
                <span className="size-1.5 rounded-full bg-amber-600" />
                Field Staff
              </span>
            </div>

            {/* 1. Staff ID Number */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-id-number">
                Staff ID Number
              </label>
              <Input
                id="user-id-number"
                value={newUser.idNumber || ''}
                onChange={(e) => setNewUser({ ...newUser, idNumber: e.target.value })}
                placeholder="e.g. STF-101"
                className={inputClass}
              />
            </div>

            {/* 2. Full Name */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-full-name">
                Full Name *
              </label>
              <Input
                id="user-full-name"
                required
                placeholder="e.g. Maria Santos"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* 3. Email Address */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-email">
                Email Address *
              </label>
              <Input
                id="user-email"
                required
                type="email"
                placeholder="e.g. maria.santos@gmail.com"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className={inputClass}
              />
            </div>

            {/* Temporary Password */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-password">
                Temporary Password *
              </label>
              <div className="relative">
                <Input
                  id="user-password"
                  required
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={`${inputClass} pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-brand-muted hover:text-brand-ink"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-[11px] text-brand-muted">
                The staff member will sign in with this temporary password.
              </p>
            </div>

            {/* 4. Contact Number */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-contact">
                Contact Number
              </label>
              <Input
                id="user-contact"
                value={newUser.contactNumber || ''}
                onChange={(e) => setNewUser({ ...newUser, contactNumber: e.target.value })}
                placeholder="+63 917 123 4567"
                className={inputClass}
              />
            </div>

            {/* 5. Address / Coverage */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-address">
                Address / Coverage
              </label>
              <Input
                id="user-address"
                value={newUser.address || ''}
                onChange={(e) => setNewUser({ ...newUser, address: e.target.value })}
                placeholder="e.g. Brgy. Poblacion, Valencia City"
                className={inputClass}
              />
            </div>

            {/* 6. Staff Position / Designation */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-position">
                Staff Position / Designation
              </label>
              <select
                id="user-position"
                value={newUser.position}
                onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
                className={selectClass}
              >
                <option value="Line Crew / Responder">Line Crew / Responder</option>
                <option value="Substation Technician">Substation Technician</option>
                <option value="Grid Maintenance Specialist">Grid Maintenance Specialist</option>
                <option value="Control Room Dispatcher">Control Room Dispatcher</option>
                <option value="Emergency Response Lead">Emergency Response Lead</option>
                <option value="Field Support Crew">Field Support Crew</option>
              </select>
            </div>

            {/* 7. Field Team Assignment */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="user-team">
                Field Team Assignment
              </label>
              <select
                id="user-team"
                value={newUser.teamId || ''}
                onChange={(e) => setNewUser({ ...newUser, teamId: e.target.value || null })}
                className={selectClass}
              >
                <option value="">No team assigned (Unassigned)</option>
                {teamsList.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.memberCount || 0} members)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-brand-muted">
                Staff assigned to this team will receive all reports dispatched to the team.
              </p>
            </div>
          </div>

          <div className={dialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className={cancelClass}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`${submitClass} flex items-center gap-2`}
            >
              {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              <span>{isSubmitting ? 'Creating Staff...' : 'Create Staff Account'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminUsersEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSave,
  onToggleActive,
  onResetAccess,
  teamsList = [],
  isSubmitting,
  isWorking,
  errorMessage,
  user,
}) {
  const positionOptions = [
    'Line Crew / Responder',
    'Substation Technician',
    'Grid Maintenance Specialist',
    'Control Room Dispatcher',
    'Emergency Response Lead',
    'Field Support Crew',
    'Administrator',
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader className={dialogHeaderClass}>
          <DialogTitle className={dialogTitleClass}>Edit Staff Account</DialogTitle>
          <DialogDescription className={dialogDescriptionClass}>
            {user?.email
              ? `Update ${user.email}'s details. Email changes are made by the staff member, not here.`
              : 'Update staff details.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSave}>
          <div className={dialogBodyClass}>
            {errorMessage && (
              <p className={errorClass} role="alert">
                {errorMessage}
              </p>
            )}

            {/* 1. Staff ID Number */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-id-number">
                Staff ID Number
              </label>
              <Input
                id="edit-id-number"
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                placeholder="e.g. STF-101"
                className={inputClass}
              />
            </div>

            {/* 2. Full Name */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-full-name">
                Full Name *
              </label>
              <Input
                id="edit-full-name"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="e.g. Maria Santos"
                className={inputClass}
              />
            </div>

            {/* 3. Email Address (Read-only) */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-email">
                Email Address
              </label>
              <Input
                id="edit-email"
                disabled
                value={user?.email || ''}
                className={`${inputClass} bg-brand-paper/50 cursor-not-allowed text-brand-muted text-xs font-mono`}
              />
            </div>

            {/* 4. Contact Number */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-contact">
                Contact Number
              </label>
              <Input
                id="edit-contact"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                placeholder="+63 917 123 4567"
                className={inputClass}
              />
            </div>

            {/* 5. Address / Coverage */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-address">
                Address / Coverage
              </label>
              <Input
                id="edit-address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="e.g. Brgy. Poblacion, Valencia City"
                className={inputClass}
              />
            </div>

            {/* 6. Staff Position / Designation */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-position">
                Staff Position / Designation
              </label>
              <select
                id="edit-position"
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className={selectClass}
              >
                {positionOptions.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>

            {/* 7. Field Team Assignment */}
            <div className="space-y-1.5">
              <label className={labelClass} htmlFor="edit-team">
                Field Team Assignment
              </label>
              <select
                id="edit-team"
                value={form.teamId || ''}
                onChange={(e) => setForm({ ...form, teamId: e.target.value || null })}
                className={selectClass}
              >
                <option value="">No team assigned (Unassigned)</option>
                {teamsList.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.memberCount || 0} members)
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-brand-muted">
                Staff assigned to this team will receive all reports dispatched to the team.
              </p>
            </div>

            {/* Account Actions: Deactivate / Reset Password */}
            <div className="grid gap-2 border-t border-brand-line pt-4 sm:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={isWorking}
                onClick={() => onToggleActive()}
                className={`${cancelClass} w-full`}
              >
                {user?.isActive === false ? 'Reactivate account' : 'Deactivate account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isWorking}
                onClick={() => onResetAccess()}
                className={`${cancelClass} w-full`}
              >
                Send password reset link
              </Button>
            </div>
          </div>

          <div className={dialogFooterClass}>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className={cancelClass}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className={`${submitClass} flex items-center gap-2`}
            >
              {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              <span>{isSubmitting ? 'Saving...' : 'Save changes'}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AdminUsersCreateDialog
