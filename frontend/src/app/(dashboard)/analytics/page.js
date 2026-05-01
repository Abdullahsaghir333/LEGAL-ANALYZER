"use client";

import { PageHeader, KpiCard, Button, AvatarInitials, DataTable } from "@/components/ui";

const topClients = [
  { name: "Habib Tech Solutions", type: "Enterprise Retainer", industry: "Technology", billing: "12,450,000", growth: "+15%", growthUp: true, status: "Active" },
  { name: "Indus Cement Group", type: "Contract Litigation", industry: "Manufacturing", billing: "8,200,000", growth: "→ 0%", growthUp: null, status: "Active" },
  { name: "Khyber Food & Bev", type: "IP Protection", industry: "FMCG", billing: "6,120,000", growth: "↘ 5%", growthUp: false, status: "Pending Review" },
];

const clientColumns = [
  {
    header: "Client Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <AvatarInitials name={row.name} />
        <div>
          <p className="font-semibold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.type}</p>
        </div>
      </div>
    ),
  },
  { header: "Industry", key: "industry" },
  {
    header: "Total Billing (PKR)",
    render: (row) => <span className="font-semibold text-on-surface">{row.billing}</span>,
  },
  {
    header: "Growth",
    render: (row) => (
      <span className={`text-sm font-medium ${row.growthUp === true ? "text-success" : row.growthUp === false ? "text-error" : "text-on-surface-variant"}`}>
        {row.growth}
      </span>
    ),
  },
  {
    header: "Status",
    render: (row) => (
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${row.status === "Active" ? "bg-success-light text-success" : "bg-warning-light text-warning"}`}>
        {row.status}
      </span>
    ),
  },
  {
    header: "Action",
    render: () => (
      <button className="text-on-surface-variant hover:text-on-surface">
        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
      </button>
    ),
  },
];

export default function AnalyticsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Revenue Analytics" subtitle="Financial performance summary for fiscal year 2024">
        <Button variant="secondary" icon="calendar_today">Last 12 Months</Button>
        <Button variant="primary" icon="file_download">Export Report</Button>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard icon="payments" label="Total Revenue (PKR)" value="84,250,000" badge="+12.4%" badgeColor="bg-success-light text-success" />
        <KpiCard icon="sync" iconBg="bg-primary-fixed/30" iconColor="text-primary" label="Monthly Recurring Revenue" value="7,200,000" badge="+8.1%" badgeColor="bg-success-light text-success" />
        <KpiCard icon="account_balance_wallet" iconBg="bg-warning-light" iconColor="text-warning" label="Average Deal Value" value="1,450,000" badge="-2.4%" badgeColor="bg-error-container text-error" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue vs Expenses */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Revenue vs Expenses</h3>
              <p className="text-sm text-secondary mt-0.5">Fiscal year cash flow analysis</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-primary" /> Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-surface-container-high" /> Expenses</span>
            </div>
          </div>
          <div className="h-64 flex flex-col justify-end relative">
            <div className="absolute inset-0 flex flex-col justify-between py-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="border-b border-surface-container-high/60 w-full h-0" />
              ))}
            </div>
            <div className="flex justify-between mt-4 px-2 text-[11px] font-medium text-outline">
              <span>JAN</span><span>FEB</span><span>MAR</span><span>APR</span><span>MAY</span><span>JUN</span><span>JUL</span><span>AUG</span>
            </div>
          </div>
        </div>

        {/* Practice Area Donut */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <h3 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Practice Area</h3>
          <div className="flex items-center justify-center my-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e3e5" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#4f46e5" strokeWidth="12" strokeDasharray="113 138" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#7c6df0" strokeWidth="12" strokeDasharray="75 176" strokeDashoffset="-113" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#c7c4d8" strokeWidth="12" strokeDasharray="63 189" strokeDashoffset="-188" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-on-surface">100%</span>
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold">Total Split</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { label: "Corporate", value: "45%", color: "bg-primary" },
              { label: "Litigation", value: "30%", color: "bg-primary/60" },
              { label: "Real Estate", value: "25%", color: "bg-outline-variant" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                  {item.label}
                </span>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Revenue Clients */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card">
        <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-on-surface tracking-tight">Top Revenue Clients</h3>
            <p className="text-sm text-secondary mt-0.5">Major account performance this quarter</p>
          </div>
          <button className="text-primary text-sm font-semibold hover:underline">View All Clients</button>
        </div>
        <DataTable columns={clientColumns} data={topClients} />
      </div>
    </div>
  );
}
