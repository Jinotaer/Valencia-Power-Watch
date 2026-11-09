export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  children,
  className = '',
}) {
  const rightContent = actions ?? children

  return (
    <header
      className={`flex flex-wrap items-end justify-between gap-4 ${className}`}
    >
      <div>
        
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-[-.03em] text-brand-navy sm:text-3xl">
          {Icon && <Icon className="size-6 shrink-0 text-brand-blue" aria-hidden="true" />}
          <span>{title}</span>
        </h1>
        {description && (
          <p className="mt-1 text-sm text-brand-muted">{description}</p>
        )}
      </div>

      {rightContent && (
        <div className="flex flex-wrap items-center gap-2.5">{rightContent}</div>
      )}
    </header>
  )
}

export default PageHeader
