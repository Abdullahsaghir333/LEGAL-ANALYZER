"use client";

import { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Button, KpiCard, AvatarInitials, FilterChip } from "@/components/ui";

const invoicesData = [
  { name: "Global Motors Co.", industry: "Auto Manufacturing", initials: "GM", id: "INV-2023-0891", issued: "Oct 12, 2023", due: "Nov 12, 2023", amount: "Rs. 12,450.00", status: "Paid" },
  { name: "Horizon Tech Labs", industry: "Software Engineering", initials: "HT", id: "INV-2023-0892", issued: "Oct 15, 2023", due: "Nov 15, 2023", amount: "Rs. 8,900.00", status: "Unpaid" },
  { name: "Bridge Capital Partners", industry: "Financial Services", initials: "BC", id: "INV-2023-0885", issued: "Sep 28, 2023", due: "Oct 28, 2023", amount: "Rs. 24,100.00", status: "Overdue" },
  { name: "Alpha Systems Inc.", industry: "SaaS Provider", initials: "AS", id: "INV-2023-0894", issued: "Oct 18, 2023", due: "Nov 18, 2023", amount: "Rs. 5,420.00", status: "Paid" },
  { name: "Vertex Dynamics", industry: "Legal Consulting", initials: "VD", id: "INV-2023-0895", issued: "Oct 20, 2023", due: "Nov 20, 2023", amount: "Rs. 17,800.00", status: "Unpaid" },
];

const columns = [
  {
    header: "Client Name",
    render: (row) => (
      <div className="flex items-center gap-3">
        <AvatarInitials name={row.name} />
        <div>
          <p className="font-semibold text-on-surface">{row.name}</p>
          <p className="text-xs text-on-surface-variant">{row.industry}</p>
        </div>
      </div>
    ),
  },
  { header: "Invoice ID", key: "id" },
  { header: "Date Issued", key: "issued" },
  { header: "Due Date", key: "due" },
  {
    header: "Amount",
    render: (row) => <span className="font-semibold text-on-surface">{row.amount}</span>,
  },
  { header: "Status", render: (row) => <StatusBadge status={row.status} /> },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("All Invoices");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader title="Invoices" subtitle="Manage and track your legal service billings across all clients.">
        <Button variant="primary" icon="add">Create Invoice</Button>
      </PageHeader>

      {/* KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card relative overflow-hidden">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Total Outstanding</p>
          <h3 className="text-[28px] font-bold text-on-surface mt-2">Rs. 142,500.00</h3>
          <p className="text-sm text-success flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            12% from last month
          </p>
          <div className="absolute top-4 right-4 w-16 h-16 bg-primary-fixed/10 rounded-full" />
        </div>
        <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card relative overflow-hidden">
          <p className="text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">Paid This Month</p>
          <h3 className="text-[28px] font-bold text-on-surface mt-2">Rs. 84,200.50</h3>
          <p className="text-sm text-success flex items-center gap-1 mt-2">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            24% target reach
          </p>
          <div className="absolute top-4 right-4 w-16 h-16 bg-success-light/40 rounded-full" />
        </div>
        <div className="bg-primary-container p-6 rounded-xl shadow-elevated text-on-primary">
          <p className="text-on-primary/70 text-[11px] font-semibold uppercase tracking-wider">Efficiency Rating</p>
          <h3 className="text-[40px] font-bold mt-2 leading-tight">98.4%</h3>
          <p className="text-sm text-on-primary/60 mt-2">Automated reconciliation active.<br />124 invoices matched today.</p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex gap-1">
          {["All Invoices", "Paid", "Unpaid", "Overdue"].map((tab) => (
            <FilterChip key={tab} label={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="tune" size="sm">More Filters</Button>
          <Button variant="secondary" icon="file_download" size="sm">Export CSV</Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={invoicesData}
        pagination={{
          label: "Showing 1 to 5 of 124 results",
          pages: [
            { label: "1", active: true },
            { label: "2", active: false },
            { label: "3", active: false },
          ],
        }}
      />

      {/* Analytics Banner */}
      <div className="bg-inverse-surface rounded-xl p-8 text-inverse-on-surface relative overflow-hidden">
        <h3 className="text-2xl font-semibold">LexAgile AI Analytics</h3>
        <p className="text-inverse-on-surface/70 mt-2 max-w-md text-sm">
          Deep insights into your billing performance and client payment patterns. Our AI suggests optimal billing windows for faster payments.
        </p>
      </div>
    </div>
  );
}
