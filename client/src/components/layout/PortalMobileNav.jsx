import { ClipboardList, House, Map, UserRound, Wrench } from 'lucide-react'

const navigation = {
  resident: [
    { label: 'Home', path: '/community', icon: House },
    { label: 'Reports', path: '/community/reports', icon: ClipboardList },
    { label: 'Map', path: '/community/map', icon: Map },
    { label: 'Profile', path: '/community/profile', icon: UserRound },
  ],
  staff: [
    { label: 'Home', path: '/staff', icon: House },
    { label: 'Jobs', path: '/staff/jobs', icon: ClipboardList, badge: 3 },
    { label: 'Map', path: '/staff/map', icon: Map },
    { label: 'Profile', path: '/staff/profile', icon: UserRound },
  ],
}

export function PortalMobileNav({ role }) {
  const items = navigation[role] ?? navigation.resident
  const currentPath = window.location.pathname

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#d6dfec] bg-white/95 px-3 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_24px_rgba(27,48,80,0.08)] backdrop-blur-md md:static md:mx-auto md:w-full md:max-w-3xl md:rounded-2xl md:border md:px-4 md:py-3 md:shadow-[0_8px_26px_rgba(27,48,80,0.08)]">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map(({ label, path, icon: Icon, badge }) => {
          const isActive = currentPath === path
          return (
            <a
              key={path}
              href={path}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold tracking-[.01em] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#24449a] ${isActive ? 'text-[#1769c2]' : 'text-[#405873] hover:bg-[#f2f6fb] hover:text-[#24449a]'}`}
            >
              <span className={`relative grid size-8 place-items-center rounded-full transition-colors ${isActive ? 'bg-[#e7f2ff]' : 'bg-transparent'}`}>
                <Icon className="size-[21px]" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
                {badge !== undefined && (
                  <span className="absolute -top-1 -right-1 grid size-4.5 place-items-center rounded-full bg-[#ffdc00] text-[10px] font-black text-[#172b68] ring-2 ring-white shadow-xs">
                    {badge}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}

export function PortalMark({ role }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[#ffdc00] text-[#172b68]">
        <Wrench className="size-4.5" strokeWidth={2.5} aria-hidden="true" />
      </span>
      <span>
        <span className="block text-[10px] font-bold uppercase tracking-[.14em] text-[#60748e]">{role === 'staff' ? 'Field workspace' : 'Community portal'}</span>
        <span className="block text-base font-extrabold tracking-[-.03em] text-[#172b68]">PowerWatch</span>
      </span>
    </div>
  )
}
