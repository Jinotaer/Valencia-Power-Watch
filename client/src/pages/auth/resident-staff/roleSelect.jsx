import { ArrowLeft, ChevronRight, HardHat, Users, Zap } from 'lucide-react'
import { PortalAuthLayout } from '../../../components/auth/PortalAuthLayout'

const roles = [
  {
    key: 'resident',
    title: 'Resident',
    description: 'Report outages and follow your updates',
    href: '/community/login',
    icon: Users,
  },
  {
    key: 'staff',
    title: 'Staff',
    description: 'Manage assigned field response work',
    href: '/staff/login',
    icon: HardHat,
  },
]

export default function RoleSelect() {
  return (
    <PortalAuthLayout>
      <div className="w-full rounded-lg border border-brand-line bg-white p-6 shadow-[0_12px_30px_rgba(27,48,119,0.06)] sm:rounded-xl sm:p-8 md:p-10">
        <div className="mb-5 flex items-center justify-center gap-2.5 select-none sm:mb-6">
          <span className="grid size-8 place-items-center rounded-xl bg-brand-yellow text-brand-navy sm:size-9">
            <Zap className="size-4.5 fill-current sm:size-5" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight text-brand-navy sm:text-xl">PowerWatch</span>
        </div>

        <div className="mb-6 text-center sm:mb-7">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-navy sm:text-3xl">Welcome</h1>
          <p className="mt-1.5 text-xs leading-relaxed text-brand-muted sm:mt-2 sm:text-sm">
            Choose how you use PowerWatch to continue
          </p>
        </div>

        <nav className="space-y-3 sm:space-y-4" aria-label="Choose your role">
          {roles.map(({ key, title, description, href, icon: Icon }) => (
            <a
              key={key}
              href={href}
              className="group flex min-h-18 w-full items-center gap-4 rounded-xl border border-brand-line bg-white p-4 text-left transition-all hover:border-brand-blue hover:bg-brand-paper active:bg-brand-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue transition-colors group-hover:bg-brand-blue group-hover:text-white">
                <Icon className="size-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold text-brand-navy">{title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-brand-muted">{description}</span>
              </span>
              <ChevronRight
                className="size-5 shrink-0 text-brand-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand-blue"
                aria-hidden="true"
              />
            </a>
          ))}
        </nav>

        <p className="pt-5 text-center text-xs text-brand-muted sm:pt-6">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 font-semibold text-brand-blue transition-colors hover:text-brand-navy hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <ArrowLeft size={14} aria-hidden="true" />
            Back to home
          </a>
        </p>
      </div>
    </PortalAuthLayout>
  )
}