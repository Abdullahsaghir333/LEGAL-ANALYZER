"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  PageHeader,
  DataTable,
  StatusBadge,
  Button,
  KpiCard,
  AvatarInitials,
  FilterChip,
} from "@/components/ui";
import { useInvoices, useUpdateInvoice } from "@/hooks/useInvoices";

function formatPkr(amount) {
  return `Rs. ${Number(amount || 0).toLocaleString("en-PK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function isThisMonth(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
}

function isOverdue(inv) {
  if (inv.status === "paid") return false;
  if (inv.status === "overdue") return true;
  if (!inv.due_date) return false;
  return new Date(inv.due_date) < new Date();
}

function SkeletonTable() {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden">
      <div className="px-6 py-4 border-b border-outline-variant/15 bg-surface-container-low">
        <div className="h-4 w-48 bg-surface-container-high animate-pulse rounded" />
      </div>
      <div className="divide-y divide-outline-variant/10">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="px-6 py-5 flex gap-4">
            <div className="w-10 h-10 rounded-full bg-surface-container-high animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 bg-surface-container-high animate-pulse rounded" />
              <div className="h-3 w-24 bg-surface-container-high animate-pulse rounded" />
            </div>
            <div className="h-6 w-16 bg-surface-container-high animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { id: "all", label: "All Invoices" },
  { id: "paid", label: "Paid" },
  { id: "pending", label: "Pending" },
  { id: "unpaid", label: "Unpaid" },
  { id: "overdue", label: "Overdue" },
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { data: invoices = [], isLoading, error, refetch, isFetching } = useInvoices();
  const updateInvoice = useUpdateInvoice();

  const stats = useMemo(() => {
    const list = invoices || [];
    const unpaidStatuses = ["unpaid", "pending", "overdue"];
    const outstanding = list
      .filter((i) => unpaidStatuses.includes(i.status) || isOverdue(i))
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const paidMonth = list
      .filter((i) => i.status === "paid" && isThisMonth(i.updatedAt || i.createdAt))
      .reduce((sum, i) => sum + (i.total || 0), 0);
    const paidMonthCount = list.filter(
      (i) => i.status === "paid" && isThisMonth(i.updatedAt || i.createdAt)
    ).length;
    const totalBilled = list.reduce((sum, i) => sum + (i.total || 0), 0);
    const totalPaid = list.filter((i) => i.status === "paid").reduce((sum, i) => sum + (i.total || 0), 0);
    const collectionRate = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0;

    const tabCounts = {
      all: list.length,
      paid: list.filter((i) => i.status === "paid").length,
      pending: list.filter((i) => i.status === "pending").length,
      unpaid: list.filter((i) => i.status === "unpaid").length,
      overdue: list.filter((i) => isOverdue(i) && i.status !== "paid").length,
    };

    return {
      outstanding,
      unpaidCount: list.filter((i) => unpaidStatuses.includes(i.status)).length,
      paidMonth,
      paidMonthCount,
      collectionRate,
      tabCounts,
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const list = invoices || [];
    if (activeTab === "all") return list;
    if (activeTab === "paid") return list.filter((i) => i.status === "paid");
    if (activeTab === "pending") return list.filter((i) => i.status === "pending");
    if (activeTab === "unpaid") return list.filter((i) => i.status === "unpaid");
    if (activeTab === "overdue") return list.filter((i) => isOverdue(i) && i.status !== "paid");
    return list;
  }, [invoices, activeTab]);

  const handleMarkPaid = async (id) => {
    try {
      await updateInvoice.mutateAsync({ id, status: "paid" });
    } catch (err) {
      console.error(err);
      alert("Could not update invoice status");
    }
  };

  const columns = [
    {
      header: "Client",
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[200px]">
          <AvatarInitials name={row.client_id?.name || "?"} />
          <div className="min-w-0">
            <p className="font-semibold text-on-surface truncate">{row.client_id?.name || "Unknown Client"}</p>
            <p className="text-xs text-on-surface-variant truncate">
              {row.case_id?.title || row.client_id?.company || "Legal services"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Invoice",
      render: (row) => (
        <div>
          <p className="font-mono text-sm font-medium text-on-surface">{row.invoice_number}</p>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Issued {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "—"}
          </p>
        </div>
      ),
    },
    {
      header: "Due Date",
      render: (row) => {
        const overdue = isOverdue(row);
        return (
          <span className={`text-sm ${overdue ? "text-error font-semibold" : "text-on-surface-variant"}`}>
            {row.due_date ? new Date(row.due_date).toLocaleDateString() : "—"}
            {overdue && row.status !== "paid" && (
              <span className="block text-[10px] uppercase font-bold mt-0.5">Overdue</span>
            )}
          </span>
        );
      },
    },
    {
      header: "Amount",
      render: (row) => (
        <div className="text-right sm:text-left">
          <p className="font-bold text-on-surface">{formatPkr(row.total)}</p>
          {row.tax > 0 && (
            <p className="text-[10px] text-on-surface-variant">incl. tax {formatPkr(row.tax)}</p>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      render: (row) => (
        <StatusBadge status={isOverdue(row) && row.status !== "paid" ? "overdue" : row.status || "unpaid"} />
      ),
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-1 justify-end">
          {row.status !== "paid" && (
            <button
              type="button"
              onClick={() => handleMarkPaid(row._id)}
              disabled={updateInvoice.isPending}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-success-light text-success hover:opacity-90 transition-opacity"
              title="Mark as paid"
            >
              Mark paid
            </button>
          )}
          {row.case_id?._id && (
            <Link
              href={`/cases/${row.case_id._id}`}
              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors"
              title="View case"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            </Link>
          )}
        </div>
      ),
    },
  ];

  const exportCsv = () => {
    if (!filteredInvoices.length) return;
    const headers = ["Invoice", "Client", "Amount", "Status", "Due Date", "Issued"];
    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      inv.client_id?.name || "",
      inv.total,
      inv.status,
      inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "",
      inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoices.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 w-full min-w-0 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Invoices"
        subtitle="Manage and track your legal service billings across all clients."
        breadcrumb={["Dashboard", "Billing"]}
      >
        <Button variant="secondary" icon="refresh" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? "Refreshing..." : "Refresh"}
        </Button>
        <Link href="/client-requests">
          <Button variant="primary" icon="mark_email_unread">From Client Requests</Button>
        </Link>
      </PageHeader>

      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm">
          Failed to load invoices. Ensure you are logged in and the backend is running.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-surface-container-high animate-pulse rounded-xl" />
          ))
        ) : (
          <>
            <KpiCard
              icon="pending_actions"
              iconBg="bg-warning-light"
              iconColor="text-warning"
              label="Total Outstanding"
              value={formatPkr(stats.outstanding)}
              badge={`${stats.unpaidCount} open`}
              badgeColor="bg-warning-light text-warning"
            />
            <KpiCard
              icon="check_circle"
              iconBg="bg-success-light"
              iconColor="text-success"
              label="Paid This Month"
              value={formatPkr(stats.paidMonth)}
              badge={`${stats.paidMonthCount} paid`}
              badgeColor="bg-success-light text-success"
            />
            <div className="bg-primary-container p-6 rounded-xl shadow-elevated flex flex-col justify-between min-h-[140px]">
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-lg bg-white/10">
                  <span className="material-symbols-outlined text-[22px] text-on-primary">analytics</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/15 text-on-primary">
                  Collection rate
                </span>
              </div>
              <div className="mt-4">
                <p className="text-[11px] font-semibold text-on-primary/70 uppercase tracking-wider">
                  Payment efficiency
                </p>
                <h3 className="text-3xl font-bold text-on-primary mt-1">{stats.collectionRate}%</h3>
                <p className="text-sm text-on-primary/60 mt-2">
                  {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} on record
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <FilterChip
                key={tab.id}
                label={`${tab.label}${!isLoading ? ` (${stats.tabCounts[tab.id]})` : ""}`}
                active={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
              />
            ))}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant="secondary"
              icon="file_download"
              size="sm"
              onClick={exportCsv}
              disabled={filteredInvoices.length === 0}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable />
      ) : filteredInvoices.length === 0 ? (
        <div className="w-full bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-12 sm:p-16">
          <div
            className="mx-auto text-center"
            style={{ width: "100%", maxWidth: "32rem" }}
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-primary-fixed/30 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px] text-primary">receipt_long</span>
            </div>
            <h3 className="text-xl font-bold text-on-surface">
              {activeTab === "all" ? "No invoices yet" : `No ${activeTab} invoices`}
            </h3>
            <p
              className="text-on-surface-variant mt-3 text-sm leading-relaxed"
              style={{ width: "100%", wordBreak: "normal", overflowWrap: "normal" }}
            >
              {activeTab === "all"
                ? "Invoices are created automatically when you accept a client request. Accept a request to generate billing for a new case."
                : "Try another filter or check back after more client activity."}
            </p>
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              <Link href="/client-requests">
                <Button variant="primary" icon="mark_email_unread">View Client Requests</Button>
              </Link>
              <Link href="/clients">
                <Button variant="secondary" icon="group">View Clients</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredInvoices}
          pagination={{
            label: `Showing ${filteredInvoices.length} invoice${filteredInvoices.length !== 1 ? "s" : ""}`,
            pages: [{ label: "1", active: true }],
          }}
        />
      )}

      <section className="rounded-2xl overflow-hidden border border-outline-variant/20 shadow-card">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-0"
          style={{ background: "linear-gradient(135deg, #2d3133 0%, #1a1d1f 100%)" }}
        >
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary-fixed text-[24px]">insights</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-fixed">
                Billing insights
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              LexAgile billing overview
            </h3>
            <p className="text-white/70 mt-4 text-sm sm:text-base leading-relaxed max-w-none">
              Track outstanding balances, collection rate, and payment timing across your practice.
              Invoices tied to accepted client requests appear here automatically.
            </p>
            <Link
              href="/analytics"
              className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-primary-fixed hover:underline w-fit"
            >
              Open revenue analytics
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
          </div>

          <div className="lg:col-span-7 p-6 sm:p-8 bg-white/5 border-t lg:border-t-0 lg:border-l border-white/10">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  label: "Total billed",
                  value: formatPkr(invoices.reduce((s, i) => s + (i.total || 0), 0)),
                  icon: "payments",
                },
                {
                  label: "Collected",
                  value: formatPkr(
                    invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (i.total || 0), 0)
                  ),
                  icon: "account_balance",
                },
                {
                  label: "Pending",
                  value: stats.tabCounts.pending,
                  icon: "schedule",
                },
                {
                  label: "Overdue",
                  value: stats.tabCounts.overdue,
                  icon: "warning",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl bg-white/10 backdrop-blur-sm p-4 border border-white/10"
                >
                  <span className="material-symbols-outlined text-primary-fixed text-[20px] mb-2 block">
                    {item.icon}
                  </span>
                  <p className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{item.label}</p>
                  <p className="text-lg sm:text-xl font-bold text-white mt-1 truncate" title={String(item.value)}>
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-white/60 leading-relaxed">
                <strong className="text-white/90">Tip:</strong> Use{" "}
                <span className="text-primary-fixed font-semibold">Mark paid</span> on each row when a client
                settles an invoice. Your analytics dashboard will reflect collected revenue in real time.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
