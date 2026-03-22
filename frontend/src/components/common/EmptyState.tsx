import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: "var(--surface-2)", border: "1px solid var(--surface-border)" }}
      >
        <Icon size={22} style={{ color: "var(--text-tertiary)" }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: "var(--text-tertiary)" }}>
        {description}
      </p>
      {action}
    </div>
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="glass-card p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-4 rounded" style={{ width: i === 0 ? "60%" : "100%" }} />
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
          {title}
        </h1>
        {description && (
          <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
