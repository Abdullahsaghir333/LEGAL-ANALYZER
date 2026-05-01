"use client";

import { PageHeader, DataTable, StatusBadge, Button, KpiCard } from "@/components/ui";

const contractsData = [
  { name: "Service Agreement 2024", ref: "#SA-229-B", client: "Stellar Dynamics Inc.", date: "Oct 12, 2023", risk: "Low Risk" },
  { name: "Vendor Master Policy", ref: "#VM-102-X", client: "Global Tech Logistics", date: "Nov 05, 2023", risk: "High Risk" },
  { name: "Lease Amendment v2", ref: "#LA-988-C", client: "Urban Real Estate", date: "Nov 18, 2023", risk: "Medium Risk" },
  { name: "Non-Disclosure Agreement", ref: "#NDA-441-A", client: "Helix BioLabs", date: "Dec 01, 2023", risk: "Low Risk" },
  { name: "Employment Contract - CXO", ref: "#EC-110-Z", client: "LexAgile Internal", date: "Jan 14, 2024", risk: "Low Risk" },
];

const columns = [
  {
    header: "Contract Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
        </div>
        <div>
          <p className="font-semibold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">Ref: {row.ref}</p>
        </div>
      </div>
    ),
  },
  { header: "Client", key: "client" },
  { header: "Date Uploaded", key: "date" },
  { header: "Risk Score", render: (row) => <StatusBadge status={row.risk} /> },
  {
    header: "Actions",
    render: () => (
      <button className="p-1 text-on-surface-variant hover:text-on-surface rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    ),
  },
];

export default function ContractsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Contracts" subtitle="Manage and analyze your legal documents with AI-powered insights.">
        <Button variant="secondary" icon="tune">View Filters</Button>
        <Button variant="primary" icon="add">New Contract</Button>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="description" label="Total Contracts" value="1,284" badge="↗ 12%" badgeColor="bg-success-light text-success" />
        <KpiCard icon="warning" iconBg="bg-error-container/50" iconColor="text-error" label="High Risk Items" value="24" badge="Active" badgeColor="bg-error-container text-error" />
        <KpiCard icon="pending_actions" iconBg="bg-warning-light" iconColor="text-warning" label="Pending Review" value="156" />
        <KpiCard icon="verified" iconBg="bg-success-light" iconColor="text-success" label="Fully Executed" value="982" />
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm">
          <span className="text-on-surface-variant font-medium">Status:</span>
          <span className="font-semibold text-on-surface">All Statuses</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm">
          <span className="text-on-surface-variant font-medium">Risk Level:</span>
          <span className="font-semibold text-on-surface">All Risk Levels</span>
        </div>
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg px-3 py-2 text-sm">
          <span className="text-on-surface-variant font-medium">Date Range:</span>
          <span className="font-semibold text-on-surface">Last 30 Days</span>
        </div>
        <button className="text-sm text-primary font-semibold hover:underline ml-auto">Clear all filters</button>
      </div>

      <DataTable
        columns={columns}
        data={contractsData}
        pagination={{
          label: "Showing 1 to 5 of 1,284 entries",
          pages: [
            { label: "1", active: true },
            { label: "2", active: false },
            { label: "3", active: false },
          ],
        }}
      />

      {/* AI Intelligence Report */}
      <div className="bg-primary-container rounded-xl p-8 text-on-primary shadow-elevated relative overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span className="text-xs font-bold uppercase tracking-wider text-on-primary/70">AI Intelligence Report</span>
            </div>
            <h3 className="text-2xl font-semibold leading-snug">
              Detected 4 high-risk clauses in recent uploads
            </h3>
            <p className="text-on-primary/70 mt-3 text-sm leading-relaxed max-w-lg">
              Our AI analysis has flagged several liability limitations and termination triggers that deviate from your organization&apos;s standard procurement playbook. Review these immediately to minimize legal exposure.
            </p>
            <Button variant="secondary" className="mt-6 !bg-white/15 !text-on-primary !border-white/20 hover:!bg-white/25" icon="arrow_forward">
              Review High-Risk Clusters
            </Button>
          </div>
          <div className="bg-white/10 rounded-xl p-6 space-y-4 min-w-[260px]">
            {[
              { label: "Processing Efficiency", value: "94%" },
              { label: "Accuracy Score", value: "99.2%" },
              { label: "Compliance Match", value: "88%" },
            ].map((m) => (
              <div key={m.label}>
                <div className="flex justify-between text-sm">
                  <span className="text-on-primary/70">{m.label}</span>
                  <span className="font-semibold">{m.value}</span>
                </div>
                <div className="mt-1.5 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-white/60 rounded-full" style={{ width: m.value }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
