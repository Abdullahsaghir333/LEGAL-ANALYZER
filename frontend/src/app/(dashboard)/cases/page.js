"use client";

import { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Button, KpiCard, FilterChip } from "@/components/ui";

const casesData = [
  { name: "Peterson vs. TechCorp", type: "Intellectual Property Dispute", typeIcon: "gavel", client: "Peterson Dynamics", status: "Open", priority: "High", date: "Oct 12, 2023" },
  { name: "Merger: Apex & Zenith", type: "M&A Acquisition", typeIcon: "handshake", client: "Apex Global", status: "Pending", priority: "Medium", date: "Nov 04, 2023" },
  { name: "Q3 Audit Review", type: "Regulatory Compliance", typeIcon: "policy", client: "Internal Affairs", status: "Closed", priority: "Low", date: "Aug 19, 2023" },
  { name: "Data Breach Mitigation", type: "Cybersecurity Law", typeIcon: "shield", client: "CloudSync Systems", status: "Open", priority: "High", date: "Dec 01, 2023" },
];

const columns = [
  {
    header: "Case Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{row.typeIcon}</span>
        </div>
        <div>
          <p className="font-semibold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.type}</p>
        </div>
      </div>
    ),
  },
  { header: "Client", key: "client" },
  {
    header: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Priority",
    render: (row) => <StatusBadge status={row.priority} />,
  },
  { header: "Date Opened", key: "date" },
  {
    header: "Actions",
    render: () => (
      <button className="p-1 text-on-surface-variant hover:text-on-surface rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    ),
  },
];

export default function CasesPage() {
  const [activeFilter, setActiveFilter] = useState("All");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Active Cases" subtitle="Manage and monitor legal proceedings across your client portfolio.">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg overflow-hidden">
          <button className="px-4 py-2 text-sm font-medium bg-primary text-on-primary">Table</button>
          <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">Board</button>
        </div>
        <Button variant="secondary" icon="file_download">Export</Button>
      </PageHeader>

      {/* Filters + KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Status</label>
              <select className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>All Statuses</option>
                <option>Open</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Priority</label>
              <select className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Date Opened</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_today</span>
                <input type="text" placeholder="Select range" className="bg-surface-container-low border border-outline-variant/30 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <button className="mt-3 text-sm font-semibold text-primary hover:underline">Clear all filters</button>
        </div>

        <div className="bg-primary-container p-6 rounded-xl shadow-elevated text-on-primary">
          <p className="text-on-primary/70 text-xs font-medium">Total Active Cases</p>
          <p className="text-[40px] font-bold mt-1 leading-tight">124</p>
          <p className="text-sm text-on-primary/60 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            +12% from last month
          </p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={casesData}
        pagination={{
          label: "Showing 1 to 10 of 42 entries",
          pages: [
            { label: "1", active: true },
            { label: "2", active: false },
            { label: "3", active: false },
          ],
        }}
      />

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary">auto_awesome</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-on-surface">AI Case Summary</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">Generate an automated summary of your active cases and impending deadlines for the weekly partner review.</p>
          </div>
          <Button variant="secondary" size="sm">Generate</Button>
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">history</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-on-surface">Recent Activity</h4>
            <p className="text-xs text-on-surface-variant mt-0.5">You updated the status of &apos;Peterson vs. TechCorp&apos; to Open 2 hours ago. 4 new documents added.</p>
          </div>
          <Button variant="secondary" size="sm">View All</Button>
        </div>
      </div>
    </div>
  );
}
