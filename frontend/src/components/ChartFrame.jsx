export function ChartFrame({ title, description, action, children, className = '' }) {
  return (
    <section className={`panel chart-frame ${className}`}>
      <div className="panel-heading">
        <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  )
}
