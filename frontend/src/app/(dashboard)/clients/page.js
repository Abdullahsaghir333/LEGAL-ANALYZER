"use client";

import { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Button, KpiCard, AvatarInitials, FilterChip } from "@/components/ui";

const clientsData = [
  { name: "Aria Montgomery", id: "LX-4001", email: "aria.m@globalcorp.com", phone: "+1 (555) 012-3456", status: "Active", cases: 12 },
  { name: "Marcus Thorne", id: "LX-4022", email: "m.thorne@vanguard.legal", phone: "+1 (555) 098-7654", status: "Active", cases: 8 },
  { name: "Lydia Bennett", id: "LX-3987", email: "lbennett@techventures.io", phone: "+1 (555) 246-8101", status: "Inactive", cases: 4 },
  { name: "David Chen", id: "LX-4055", email: "david.chen@horizon.dev", phone: "+1 (555) 321-6540", status: "Active", cases: 21 },
];

const columns = [
  {
    header: "Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <AvatarInitials name={row.name} />
        <div>
          <p className="font-semibold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">ID: {row.id}</p>
        </div>
      </div>
    ),
  },
  {
    header: "Contact Information",
    render: (row) => (
      <div className="space-y-0.5">
        <p className="text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-outline">mail</span>
          {row.email}
        </p>
        <p className="text-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[14px] text-outline">call</span>
          {row.phone}
        </p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (row) => <StatusBadge status={row.status} />,
  },
  {
    header: "Total Cases",
    render: (row) => <span className="font-semibold text-on-surface">{row.cases}</span>,
  },
  {
    header: "Actions",
    render: () => (
      <button className="p-1 text-on-surface-variant hover:text-on-surface rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    ),
  },
];

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState("All Clients");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
        <span className="material-symbols-outlined text-[16px]">group</span>
        <span className="uppercase tracking-wider font-bold text-primary">Enterprise Directory</span>
      </div>

      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships, active legal matters, and contact information through a unified interface."
      >
        <Button variant="secondary" icon="file_download">Export CSV</Button>
        <Button variant="primary" icon="person_add">Add Client</Button>
      </PageHeader>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard icon="group" label="Total Clients" value="1,284" badge="+12%" badgeColor="bg-success-light text-success" />
        <KpiCard icon="person" iconBg="bg-success-light" iconColor="text-success" label="Active Now" value="842" badge="●" badgeColor="text-success bg-transparent" />
        <KpiCard icon="pending" iconBg="bg-warning-light" iconColor="text-warning" label="Pending Review" value="31" badge="Needs Action" badgeColor="bg-warning-light text-warning" />
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Retention Rate</p>
          <div className="flex items-center gap-3 mt-2">
            <h3 className="text-2xl font-semibold text-on-surface">94%</h3>
            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: "94%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs + Sort */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-1">
          {["All Clients", "Active", "Inactive"].map((tab) => (
            <FilterChip key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">sort</span>
          <span className="font-medium">Sorted by Name</span>
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={clientsData}
        pagination={{
          label: "Showing 1-10 of 1,284 clients",
          pages: [
            { label: "1", active: true },
            { label: "2", active: false },
            { label: "3", active: false },
          ],
        }}
      />

      {/* Bottom Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-container p-6 rounded-xl shadow-elevated text-on-primary relative overflow-hidden">
          <h4 className="text-lg font-semibold">Automated Compliance Check</h4>
          <p className="text-sm text-on-primary/70 mt-2 max-w-sm">
            LexAgile AI can now automatically run background compliance checks for new client onboarding. Enable this in settings to save 4+ hours per client.
          </p>
          <Button variant="secondary" size="sm" className="mt-4 !bg-white/15 !text-on-primary !border-white/20 hover:!bg-white/25">
            Configure Automation
          </Button>
          <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card">
          <h4 className="text-lg font-semibold text-on-surface">Client Relationship Insights</h4>
          <p className="text-sm text-on-surface-variant mt-2">
            Analyze billing patterns and case outcomes to identify your highest-value relationships and optimize resource allocation.
          </p>
          <Button variant="secondary" size="sm" className="mt-4">View Analytics</Button>
        </div>
      </div>
    </div>
  );
}
