"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { PageHeader, KpiCard, Button, AvatarInitials, DataTable } from "@/components/ui";
import { useAnalytics } from "@/hooks/useDashboard";

function formatPkr(value) {
  return Number(value || 0).toLocaleString("en-PK");
}

function formatPctChange(value) {
  const n = Number(value) || 0;
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function DonutChart({ segments }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  if (!segments?.length) {
    return (
      <div className="relative w-40 h-40 flex items-center justify-center">
        <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center text-xs text-on-surface-variant text-center px-2">
          No cases yet
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e0e3e5" strokeWidth="12" />
        {segments.map((seg, i) => {
          const length = (seg.percentage / 100) * circumference;
          const dash = `${length} ${circumference - length}`;
          const el = (
            <circle
              key={seg.label}
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="12"
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="round"
            />
          );
          offset += length;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-on-surface">100%</span>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">
          Case Mix
        </span>
      </div>
    </div>
  );
}

function CashFlowChart({ cashFlow }) {
  const maxVal = useMemo(() => {
    if (!cashFlow?.length) return 1;
    return Math.max(
      1,
      ...cashFlow.flatMap((m) => [m.revenue || 0, m.expenses || 0])
    );
  }, [cashFlow]);

  if (!cashFlow?.length) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-on-surface-variant">
        No billing data for this period.
      </div>
    );
  }

  return (
    <div className="h-64 flex flex-col justify-end relative">
      <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="border-b border-surface-container-high/60 w-full h-0" />
        ))}
      </div>
      <div className="flex items-end justify-between h-full relative z-10 px-2 gap-1 sm:gap-2">
        {cashFlow.map((item) => (
          <div key={`${item.month}-${item.year}`} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="flex items-end justify-center gap-0.5 w-full h-[85%]">
              <div
                className="w-[42%] max-w-[14px] bg-primary rounded-t-sm transition-all duration-500"
                style={{ height: `${((item.revenue || 0) / maxVal) * 100}%`, minHeight: item.revenue ? "4px" : 0 }}
                title={`Revenue: PKR ${formatPkr(item.revenue)}`}
              />
              <div
                className="w-[42%] max-w-[14px] bg-surface-container-high rounded-t-sm transition-all duration-500"
                style={{ height: `${((item.expenses || 0) / maxVal) * 100}%`, minHeight: item.expenses ? "4px" : 0 }}
                title={`Expenses: PKR ${formatPkr(item.expenses)}`}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-4 px-1 text-[10px] sm:text-[11px] font-medium text-outline">
        {cashFlow.map((item) => (
          <span key={`${item.month}-label`} className="flex-1 text-center truncate">
            {item.month.toUpperCase()}
          </span>
        ))}
      </div>
    </div>
  );
}

const clientColumns = [
  {
    header: "Client Name",
    render: (row) => (
      <Link href={`/clients/${row.clientId}`} className="flex items-center gap-3 group">
        <AvatarInitials name={row.name} />
        <div>
          <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{row.name}</p>
          <p className="text-xs text-on-surface-variant line-clamp-1">{row.type}</p>
        </div>
      </Link>
    ),
  },
  { header: "Industry", key: "industry" },
  {
    header: "Total Billing (PKR)",
    render: (row) => <span className="font-semibold text-on-surface">{formatPkr(row.billing)}</span>,
  },
  {
    header: "Growth",
    render: (row) => (
      <span
        className={`text-sm font-medium ${
          row.growthUp === true ? "text-success" : row.growthUp === false ? "text-error" : "text-on-surface-variant"
        }`}
      >
        {row.growthLabel}
      </span>
    ),
  },
  {
    header: "Status",
    render: (row) => (
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
          row.status === "Active"
            ? "bg-success-light text-success"
            : row.status === "Pending Review"
              ? "bg-warning-light text-warning"
              : "bg-surface-container-high text-on-surface-variant"
        }`}
      >
        {row.status}
      </span>
    ),
  },
  {
    header: "Action",
    render: (row) => (
      <Link href={`/clients/${row.clientId}`} className="text-on-surface-variant hover:text-primary p-1">
        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
      </Link>
    ),
  },
];

export default function AnalyticsPage() {
  const [months, setMonths] = useState(12);
  const { data, isLoading, error, refetch, isFetching } = useAnalytics(months);

  const kpis = data?.kpis;
  const practiceAreas = data?.practiceAreas || [];
  const topClients = data?.topClients || [];

  const fiscalYear = new Date().getFullYear();

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Revenue Analytics"
        subtitle={`Financial performance summary — ${data?.period?.label || `Last ${months} months`} (${fiscalYear})`}
      >
        <select
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={6}>Last 6 Months</option>
          <option value={12}>Last 12 Months</option>
        </select>
        <Button variant="primary" icon="refresh" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
      </PageHeader>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          Failed to load analytics. Ensure you are logged in as a lawyer and the backend is running.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-surface-container-high animate-pulse rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              icon="payments"
              label="Total Revenue (PKR)"
              value={formatPkr(kpis?.totalRevenue)}
              badge={formatPctChange(kpis?.totalRevenueChange)}
              badgeColor={
                (kpis?.totalRevenueChange || 0) >= 0
                  ? "bg-success-light text-success"
                  : "bg-error-container text-error"
              }
            />
            <KpiCard
              icon="sync"
              iconBg="bg-primary-fixed/30"
              iconColor="text-primary"
              label="Monthly Recurring Revenue"
              value={formatPkr(kpis?.monthlyRecurringRevenue)}
              badge={formatPctChange(kpis?.mrrChange)}
              badgeColor={
                (kpis?.mrrChange || 0) >= 0 ? "bg-success-light text-success" : "bg-error-container text-error"
              }
            />
            <KpiCard
              icon="account_balance_wallet"
              iconBg="bg-warning-light"
              iconColor="text-warning"
              label="Average Deal Value"
              value={formatPkr(kpis?.averageDealValue)}
              badge={formatPctChange(kpis?.avgDealChange)}
              badgeColor={
                (kpis?.avgDealChange || 0) >= 0 ? "bg-success-light text-success" : "bg-error-container text-error"
              }
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Revenue vs Expenses</h3>
              <p className="text-sm text-secondary mt-0.5">
                Paid revenue vs tax &amp; outstanding subtotals by month
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-primary" /> Revenue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-surface-container-high border border-outline-variant/40" />{" "}
                Expenses
              </span>
            </div>
          </div>
          {isLoading ? (
            <div className="h-64 bg-surface-container-high animate-pulse rounded-lg" />
          ) : (
            <CashFlowChart cashFlow={data?.cashFlow} />
          )}
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <h3 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Practice Area</h3>
          <p className="text-xs text-on-surface-variant mb-4">Based on your case portfolio</p>
          {isLoading ? (
            <div className="h-48 bg-surface-container-high animate-pulse rounded-lg" />
          ) : (
            <>
              <div className="flex items-center justify-center my-6">
                <DonutChart segments={practiceAreas} />
              </div>
              <div className="space-y-3">
                {practiceAreas.length > 0 ? (
                  practiceAreas.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.label}
                      </span>
                      <span className="font-semibold">
                        {item.percentage}% <span className="text-on-surface-variant font-normal">({item.count})</span>
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-on-surface-variant text-center py-4">No cases to analyze yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card">
        <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-on-surface tracking-tight">Top Revenue Clients</h3>
            <p className="text-sm text-secondary mt-0.5">Ranked by invoice totals in the selected period</p>
          </div>
          <Link href="/clients" className="text-primary text-sm font-semibold hover:underline">
            View All Clients
          </Link>
        </div>
        {isLoading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-surface-container-high animate-pulse rounded-lg" />
            ))}
          </div>
        ) : topClients.length > 0 ? (
          <DataTable columns={clientColumns} data={topClients} />
        ) : (
          <div className="px-8 py-12 text-center text-sm text-on-surface-variant">
            No client billing data yet. Cases and invoices will appear here once clients are onboarded.
          </div>
        )}
      </div>
    </div>
  );
}
