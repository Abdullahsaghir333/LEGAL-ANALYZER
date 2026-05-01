export function KpiCard({ icon, iconBg, iconColor, label, value, badge, badgeColor }) {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card
      flex flex-col justify-between group hover:shadow-elevated transition-shadow duration-200">
      <div className="flex justify-between items-start">
        <div className={`p-3 rounded-lg ${iconBg || "bg-primary-fixed/30"}`}>
          <span className={`material-symbols-outlined text-[22px] ${iconColor || "text-primary"}`}>
            {icon}
          </span>
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor || "bg-success-light text-success"}`}>
            {badge}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
          {label}
        </p>
        <h3 className="text-2xl font-semibold text-on-surface mt-1 tracking-tight">{value}</h3>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, breadcrumb, children }) {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
      <div>
        {breadcrumb && (
          <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="material-symbols-outlined text-[14px]">chevron_right</span>}
                <span className={i === breadcrumb.length - 1 ? "text-primary font-semibold" : ""}>
                  {item}
                </span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[30px] font-semibold text-on-surface tracking-tight leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-base text-secondary mt-1">{subtitle}</p>
        )}
      </div>
      {children && <div className="flex items-center gap-3 flex-wrap">{children}</div>}
    </div>
  );
}

export function DataTable({ columns, data, pagination }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-outline-variant/20">
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-4 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {data.map((row, ri) => (
              <tr
                key={ri}
                className="hover:bg-surface-container-low/50 transition-colors cursor-pointer"
              >
                {columns.map((col, ci) => (
                  <td key={ci} className="px-6 py-4 text-sm">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="px-6 py-4 border-t border-outline-variant/15 flex items-center justify-between">
          <p className="text-sm text-on-surface-variant">{pagination.label}</p>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              Previous
            </button>
            {pagination.pages?.map((page, i) => (
              <button
                key={i}
                className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                  page.active
                    ? "bg-primary text-on-primary font-semibold"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {page.label}
              </button>
            ))}
            <button className="px-3 py-1.5 text-sm text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ status, variant }) {
  const styles = {
    open: "bg-success-light text-success",
    active: "bg-success-light text-success",
    closed: "bg-surface-container-high text-on-surface-variant",
    pending: "bg-warning-light text-warning",
    overdue: "bg-error-container text-error",
    paid: "bg-success-light text-success",
    unpaid: "bg-warning-light text-warning",
    high: "bg-error-container text-error",
    medium: "bg-surface-container-high text-on-surface-variant",
    low: "bg-surface-container text-on-surface-variant",
    "low risk": "bg-success-light text-success",
    "medium risk": "bg-warning-light text-warning",
    "high risk": "bg-error-container text-error",
    critical: "bg-error-container text-error",
    moderate: "bg-warning-light text-warning",
    attention: "bg-info-light text-info",
    billable: "bg-success-light text-success",
    "non-billable": "bg-surface-container-high text-on-surface-variant",
    "in review": "bg-info-light text-info",
    archived: "bg-surface-container text-on-surface-variant",
    processing: "bg-warning-light text-warning",
    complete: "bg-success-light text-success",
    "pending review": "bg-warning-light text-warning",
  };

  const key = status.toLowerCase();
  const dotStatuses = ["open", "active", "closed", "pending", "inactive"];
  const showDot = dotStatuses.includes(key);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
        styles[key] || "bg-surface-container text-on-surface-variant"
      }`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            key === "open" || key === "active"
              ? "bg-success"
              : key === "pending"
              ? "bg-warning"
              : key === "inactive"
              ? "bg-on-surface-variant"
              : "bg-on-surface-variant"
          }`}
        />
      )}
      {status}
    </span>
  );
}

export function AvatarInitials({ name, size = "md", className = "" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-primary-container text-on-primary",
    "bg-info text-white",
    "bg-tertiary-container text-white",
    "bg-secondary text-on-secondary",
    "bg-success text-white",
    "bg-warning text-white",
  ];

  const colorIndex =
    name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;

  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold shrink-0 ${colors[colorIndex]} ${className}`}
    >
      {initials}
    </div>
  );
}

export function Button({ children, variant = "primary", size = "md", icon, className = "", ...props }) {
  const variants = {
    primary:
      "bg-primary text-on-primary shadow-primary hover:opacity-90 active:scale-[0.98]",
    secondary:
      "bg-surface-container-lowest border border-outline-variant/40 text-on-surface hover:bg-surface-container-low",
    ghost:
      "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
    danger:
      "bg-error text-on-error hover:opacity-90 active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2.5 text-sm gap-2",
    lg: "px-6 py-3 text-sm gap-2",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[18px]">{icon}</span>}
      {children}
    </button>
  );
}

export function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-primary text-on-primary shadow-sm"
          : "bg-surface-container-lowest border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low"
      }`}
    >
      {label}
    </button>
  );
}

export function ProgressBar({ value, color = "bg-primary", className = "" }) {
  return (
    <div className={`w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${color}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-[32px] text-outline">{icon}</span>
      </div>
      <h3 className="text-lg font-semibold text-on-surface mb-1">{title}</h3>
      <p className="text-sm text-on-surface-variant max-w-md">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
