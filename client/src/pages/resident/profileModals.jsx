import { X, MapPin } from 'lucide-react'

const valenciaBarangays = [
  'Guinoyuran',
  'Poblacion',
  'Bagontapay',
  'Bantuanon',
  'Barobo',
  'Batangan',
  'Catumbalon',
  'Colonia',
  'Concepcion',
  'Dagat-Kidavao',
  'Dampas',
  'Datu Salumay',
  'Kahaponan',
  'Laligan',
  'Lilingayon',
  'Lourdes',
  'Lumbayao',
  'Lumbo',
  'Lurugan',
  'Mabuhay',
  'Mailag',
  'Mt. Nebo',
  'Musuan',
  'Pinatilan',
  'San Carlos',
  'San Isidro',
  'Sinayawan',
  'Sugod',
  'Tongantongan',
  'Tugaya',
  'Vintar',
]

export function ResidentProfileModals({
  activeModal,
  setActiveModal,
  personalForm,
  setPersonalForm,
  selectedBarangay,
  setSelectedBarangay,
  passwordForm,
  setPasswordForm,
  handleSavePersonal,
  handleSaveBarangay,
  handleSavePassword,
  handleSignOut,
}) {
  return (
    <>
      {/* INTERACTIVE MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-brand-line bg-white p-5 shadow-2xl animate-in slide-in-from-bottom-6"
            role="dialog"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-line pb-3">
              <h3 className="text-base font-bold text-brand-navy">
                {activeModal === 'personal' && 'Personal Information'}
                {activeModal === 'barangay' && 'Select Home Barangay'}
                {activeModal === 'password' && 'Change Password'}
                {activeModal === 'signout' && 'Sign Out Confirmation'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="grid size-8 place-items-center rounded-full text-brand-muted hover:bg-[#e5e9f6] hover:text-brand-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="pt-4">
              {activeModal === 'personal' && (
                <form onSubmit={handleSavePersonal} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">Full name</label>
                    <input
                      type="text"
                      required
                      value={personalForm.name}
                      onChange={(e) => setPersonalForm({ ...personalForm, name: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">Email address</label>
                    <input
                      type="email"
                      required
                      value={personalForm.email}
                      onChange={(e) => setPersonalForm({ ...personalForm, email: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">Contact number</label>
                    <input
                      type="tel"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-navy"
                    >
                      Save changes
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'barangay' && (
                <form onSubmit={handleSaveBarangay} className="space-y-4">
                  <p className="text-xs text-brand-muted">
                    Choose your primary barangay in Valencia City to prioritize relevant power interruption advisories.
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {valenciaBarangays.map((brgy) => (
                      <label
                        key={brgy}
                        className={`flex items-center justify-between rounded-xl p-2.5 text-xs font-semibold cursor-pointer border transition-colors ${
                          selectedBarangay === brgy
                            ? 'border-brand-blue bg-[e5e9f6] text-brand-navy'
                            : 'border-brand-line bg-white text-brand-ink hover:bg-brand-paper'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="size-3.5 text-brand-blue" />
                          Brgy. {brgy}
                        </span>
                        <input
                          type="radio"
                          name="barangay"
                          checked={selectedBarangay === brgy}
                          onChange={() => setSelectedBarangay(brgy)}
                          className="text-brand-blue accent-brand-blue"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-navy"
                    >
                      Confirm
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'password' && (
                <form onSubmit={handleSavePassword} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">Current password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">New password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.newPass}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPass: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-muted mb-1">Confirm new password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full rounded-xl border border-brand-line px-3 py-2 text-sm text-brand-ink focus:border-brand-blue focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 rounded-xl bg-brand-blue py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-navy"
                    >
                      Update password
                    </button>
                  </div>
                </form>
              )}

              {activeModal === 'signout' && (
                <div className="space-y-4">
                  <p className="text-sm text-brand-muted">
                    Are you sure you want to sign out of the Valencia PowerWatch Community Portal?
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveModal(null)}
                      className="flex-1 rounded-xl border border-brand-line py-2.5 text-xs font-bold text-brand-muted hover:bg-brand-paper cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 cursor-pointer"
                    >
                      Yes, sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ResidentProfileModals
