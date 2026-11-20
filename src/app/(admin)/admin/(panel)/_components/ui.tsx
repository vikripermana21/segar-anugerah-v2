export const inputClass = "admin-input";
export const btnPrimary = "admin-btn";
export const btnSecondary = "admin-btn-ghost";
export const btnDanger = "admin-btn-danger";
export const cardClass = "admin-card";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="admin-h1">{title}</h1>
        {description ? <p className="admin-sub">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`admin-card ${className}`}>{children}</section>;
}

export function CardHead({
  title,
  note,
  action,
  className = "",
}: {
  title: string;
  note?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`admin-card-head ${className}`}>
      <div>
        <h2 className="admin-card-title">{title}</h2>
        {note ? <p className="admin-card-note">{note}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`admin-card-body ${className}`}>{children}</div>;
}

export function Tile({ children }: { children: React.ReactNode }) {
  return <span className="admin-tile">{children}</span>;
}

export function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "muted" | "warn";
}) {
  return (
    <span className="admin-badge" data-tone={tone}>
      {children}
    </span>
  );
}

export function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="admin-empty">{children}</p>
  );
}

export function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string;
  note?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="admin-card admin-metric">
      <div className="flex items-center justify-between gap-3">
        <p className="admin-metric-label">{label}</p>
        {icon ? <Tile>{icon}</Tile> : null}
      </div>
      <p className="admin-metric-value">{value}</p>
      {note ? <p className="admin-metric-note">{note}</p> : null}
    </div>
  );
}
