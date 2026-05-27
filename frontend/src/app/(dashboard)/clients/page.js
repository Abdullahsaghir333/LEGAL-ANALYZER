"use client";

import { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Button, KpiCard, AvatarInitials, FilterChip } from "@/components/ui";
import { useClients, useCreateClient } from "@/hooks/useClients";

import Link from "next/link";

function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10">
      <td className="py-4 px-4"><div className="h-10 w-32 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-8 w-40 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-16 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-8 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-8 w-8 bg-surface-container-high animate-pulse rounded"></div></td>
    </tr>
  );
}

const columns = [
  {
    header: "Name",
    render: (row) => (
      <Link href={`/clients/${row._id}`} className="flex items-center gap-3 group">
        <AvatarInitials name={row.name} />
        <div>
          <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{row.name}</p>
          <p className="text-xs text-on-surface-variant group-hover:text-primary/70 transition-colors">ID: {row._id ? "LX-" + row._id.substring(row._id.length - 4).toUpperCase() : "N/A"}</p>
        </div>
      </Link>
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
          {row.phone || "N/A"}
        </p>
      </div>
    ),
  },
  {
    header: "Status",
    render: (row) => <StatusBadge status={row.status || "active"} />,
  },
  {
    header: "Active Cases",
    render: (row) => (
      <div className="text-center sm:text-left">
        <span className="font-semibold text-on-surface">
          {row.activeCaseCount ?? row.cases?.filter((c) => c.status === "open" || c.status === "pending").length ?? 0}
        </span>
        {(row.caseCount ?? row.cases?.length ?? 0) > 0 && (
          <p className="text-[10px] text-on-surface-variant mt-0.5">
            {row.caseCount ?? row.cases?.length} total
          </p>
        )}
      </div>
    ),
  },
  {
    header: "Actions",
    render: (row) => (
      <button className="p-1 text-on-surface-variant hover:text-on-surface rounded transition-colors">
        <span className="material-symbols-outlined text-[20px]">more_vert</span>
      </button>
    ),
  },
];

export default function ClientsPage() {
  const [activeTab, setActiveTab] = useState("All Clients");
  const { data: clients, isLoading, error } = useClients();
  const createClient = useCreateClient();

  // Filter clients based on active tab
  const filteredClients = clients?.filter(client => {
    if (activeTab === "All Clients") return true;
    if (activeTab === "Active") return client.status === "active";
    if (activeTab === "Inactive") return client.status === "inactive";
    return true;
  }) || [];

  // Calculate stats
  const activeClients = clients?.filter(c => c.status === "active").length || 0;
  const inactiveClients = clients?.filter(c => c.status === "inactive").length || 0;
  const totalActiveCases =
    clients?.reduce((sum, c) => sum + (c.activeCaseCount ?? 0), 0) ?? 0;

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
        <KpiCard icon="group" label="Total Clients" value={clients?.length || 0} badge="Updated" badgeColor="bg-success-light text-success" />
        <KpiCard icon="person" iconBg="bg-success-light" iconColor="text-success" label="Active Now" value={activeClients} badge="●" badgeColor="text-success bg-transparent" />
        <KpiCard icon="pending" iconBg="bg-warning-light" iconColor="text-warning" label="Inactive" value={inactiveClients} badge="All clear" badgeColor="bg-surface-container-high text-on-surface-variant" />
        <KpiCard
          icon="gavel"
          iconBg="bg-primary-fixed/30"
          iconColor="text-primary"
          label="Active Cases"
          value={totalActiveCases}
          badge="Open matters"
          badgeColor="bg-primary-fixed/40 text-primary"
        />
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

      {/* Error State */}
      {error && (
        <div className="bg-error-container p-4 rounded-lg text-error text-center">
          Failed to load clients. Please try again.
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="text-left py-4 px-4 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
            </tbody>
          </table>
        </div>
      ) : filteredClients.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/30 shadow-card text-center">
          <span className="material-symbols-outlined text-6xl text-outline">group_remove</span>
          <h3 className="text-xl font-semibold text-on-surface mt-4">No clients found</h3>
          <p className="text-on-surface-variant mt-2">Get started by adding your first client.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredClients}
          pagination={{
            label: `Showing 1-${Math.min(10, filteredClients.length)} of ${filteredClients.length} clients`,
            pages: [
              { label: "1", active: true },
            ],
          }}
        />
      )}


    </div>
  );
}
