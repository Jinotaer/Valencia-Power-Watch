import { useState } from 'react'
import { Eye, EyeOff, HardHat, LoaderCircle } from 'lucide-react'
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

export function AdminUsersCreateDialog({
  open,
  onOpenChange,
  newUser,
  setNewUser,
  onCreateUser,
  isSubmitting,
  errorMessage,
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] rounded-2xl bg-white p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <HardHat className="size-4.5" />
            </span>
            <div>
              <DialogTitle className="text-xl font-bold text-brand-ink">
                Create Staff Account
              </DialogTitle>
              <DialogDescription className="text-xs text-brand-muted">
                Register a new field responder, technician, or utility crew member.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onCreateUser} className="space-y-4 py-2">
          {/* Role Indicator Banner */}
          <div className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50/60 px-3.5 py-2 text-xs">
            <span className="font-medium text-amber-900">Account Type</span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-2.5 py-0.5 font-bold text-amber-800">
              <span className="size-1.5 rounded-full bg-amber-600" />
              Field Staff
            </span>
          </div>

          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Full Name *</label>
            <Input
              required
              placeholder="e.g. Maria Santos"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="h-10 text-sm rounded-xl"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Email Address *</label>
            <Input
              required
              type="email"
              placeholder="e.g. maria.santos@gmail.com"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="h-10 text-sm rounded-xl"
            />
          </div>

          {/* Initial Password */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Temporary Password *</label>
            <div className="relative">
              <Input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="h-10 text-sm rounded-xl pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-muted cursor-pointer p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="text-[11px] text-brand-muted">The staff member will sign in with this temporary password.</p>
          </div>

          {/* Staff ID Number and Contact Number */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Staff ID Number</label>
              <Input
                value={newUser.idNumber}
                onChange={(e) => setNewUser({ ...newUser, idNumber: e.target.value })}
                placeholder="STF-101"
                className="h-10 text-sm rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-muted">Contact Number</label>
              <Input
                value={newUser.contactNumber}
                onChange={(e) => setNewUser({ ...newUser, contactNumber: e.target.value })}
                placeholder="+63 917 123 4567"
                className="h-10 text-sm rounded-xl"
              />
            </div>
          </div>

          {/* Position / Designation */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-brand-muted">Staff Position / Designation</label>
            <select
              value={newUser.position}
              onChange={(e) => setNewUser({ ...newUser, position: e.target.value })}
              className="h-10 w-full rounded-xl border border-brand-line bg-white px-3 text-sm text-brand-ink outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
            >
              <option value="Line Crew / Responder">Line Crew / Responder</option>
              <option value="Substation Technician">Substation Technician</option>
              <option value="Grid Maintenance Specialist">Grid Maintenance Specialist</option>
              <option value="Control Room Dispatcher">Control Room Dispatcher</option>
              <option value="Emergency Response Lead">Emergency Response Lead</option>
              <option value="Field Support Crew">Field Support Crew</option>
            </select>
          </div>

          <DialogFooter className="pt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-brand-navy hover:bg-brand-navy text-white rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              {isSubmitting && <LoaderCircle className="size-4 animate-spin" />}
              <span>{isSubmitting ? 'Creating Staff...' : 'Create Staff Account'}</span>
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AdminUsersCreateDialog
