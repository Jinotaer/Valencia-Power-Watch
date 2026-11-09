import { Download, ExternalLink, LogOut, Smartphone } from 'lucide-react'
import powerWatchLogo from '../../assets/logo.svg'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import { supabase } from '../../lib/supabase'

export function MobileAppRequiredScreen({ role = 'resident' }) {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt()

  const isMobile =
    typeof window !== 'undefined' &&
    /android|iphone|ipad|ipod|mobile/i.test(window.navigator.userAgent)

  async function handleInstall() {
    if (canInstall) {
      await promptInstall()
    }
  }

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut()
    }
    window.location.assign('/')
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#f2f5fc] p-4 text-[#111c38]">
      <div className="w-full max-w-[500px] overflow-hidden rounded-3xl border border-[#d8dce6] bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2.5">
            <img src={powerWatchLogo} alt="Valencia PowerWatch" className="size-8 rounded-xl object-contain" />
            <span className="text-base font-extrabold tracking-tight text-[#111c38]">PowerWatch</span>
          </div>
          <span className="rounded-full bg-[#e3e9f8] px-3 py-1 text-xs font-bold capitalize text-[#24449a]">
            {role === 'staff' ? 'Field Staff' : 'Resident'}
          </span>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="relative grid size-20 place-items-center rounded-3xl bg-[#eef3fd] text-[#24449a]">
            <Smartphone className="size-10 stroke-[1.8]" />
            <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-brand-yellow text-[#111c38] shadow-sm">
              <Download className="size-4 stroke-[2.5]" />
            </span>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-[#111c38] sm:text-[26px]">
            Installed Mobile App Required
          </h1>
          <p className="m-0 text-sm leading-relaxed text-[#555b66]">
            The {role === 'staff' ? 'Field Staff workspace' : 'Community reporting portal'} is restricted to the installed PowerWatch mobile application on your smartphone.
          </p>
        </div>

        {isMobile ? (
          <div className="space-y-3">
            {isInstalled ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-xs font-semibold text-emerald-800">
                PowerWatch is already installed on this phone! Open it from your phone's home screen or app drawer to proceed.
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleInstall}
                  className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#24449a] text-sm font-bold text-white shadow-md shadow-[#24449a]/20 transition-all hover:bg-[#1b357a]"
                >
                  <Download className="size-4.5" />
                  <span>Install PowerWatch App</span>
                </button>

                {isIOS && (
                  <div className="rounded-2xl border border-[#e4e9f2] bg-[#f8f9fc] p-4 text-left text-xs leading-relaxed text-[#4a5568]">
                    <strong className="block mb-1 text-[#111c38]">How to install on iPhone / iPad:</strong>
                    1. Tap the <strong>Share button</strong> (square with arrow up) at the bottom of Safari.
                    <br />
                    2. Scroll down and choose <strong>Add to Home Screen</strong>.
                    <br />
                    3. Launch PowerWatch from your home screen icon.
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-xs leading-relaxed text-amber-900">
            <strong className="block mb-1 text-sm font-bold text-amber-950">You are on a desktop browser</strong>
            Please open this page on your smartphone browser (Chrome or Safari) and install the PowerWatch app to your home screen to access your account.
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-[#e8ecf4] pt-5 text-xs">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-[#24449a] hover:underline"
          >
            <span>Back to Home</span>
            <ExternalLink className="size-3.5" />
          </a>

          <button
            type="button"
            onClick={handleSignOut}
            className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-[#8a94a6] transition-colors hover:text-[#111c38]"
          >
            <LogOut className="size-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  )
}
