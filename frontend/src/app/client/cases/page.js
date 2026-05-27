"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader, DataTable, StatusBadge, Button } from "@/components/ui";
import { useCases } from "@/hooks/useCases";

function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10">
      {[...Array(5)].map((_, i) => (
        <td key={i} className="py-4 px-4">
          <div className="h-6 w-24 bg-surface-container-high animate-pulse rounded" />
        </td>
      ))}
    </tr>
  );
}

export default function ClientCasesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const { data: cases, isLoading, error } = useCases();

  const filteredCases =
    cases?.filter((c) => {
      if (activeFilter === "All") return true;
      return c.status === activeFilter.toLowerCase();
    }) || [];

  const columns = [
    {
      header: "Case",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-primary">gavel</span>
          </div>
          <div>
            <Link
              href={`/client/cases/${row._id}`}
              className="font-semibold text-primary hover:underline"
            >
              {row.title || "Untitled Case"}
            </Link>
            <p className="text-xs text-on-surface-variant line-clamp-1">
              {row.description || "Family law matter"}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: "Lawyer",
      render: (row) => (
        <span className="text-on-surface font-medium">{row.lawyer_id?.name || "—"}</span>
      ),
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status === "open" ? "Active" : row.status} />,
    },
    {
      header: "Priority",
      render: (row) => <StatusBadge status={row.priority || "medium"} />,
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <Link href={`/client/cases/${row._id}#chat`}>
            <button className="px-3 py-1.5 bg-[#d9fdd3] text-[#00a884] hover:bg-[#c2fad5] rounded-full text-xs font-bold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">forum</span>
              Chat
            </button>
          </Link>
          <Link
            href={`/client/cases/${row._id}`}
            className="p-1.5 text-on-surface-variant hover:text-primary rounded-full"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="My Cases"
        subtitle="View all your legal matters and communicate directly with your assigned lawyer."
      >
        <Link href="/client/explore-lawyers">
          <Button variant="primary" icon="add">Request New Lawyer</Button>
        </Link>
      </PageHeader>

      <div className="flex flex-wrap gap-2">
        {["All", "Open", "Pending", "Closed"].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
              activeFilter === f
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-error-container p-4 rounded-lg text-error text-center">
          Failed to load cases. Make sure the backend server is running.
        </div>
      )}

      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden">
          <table className="w-full">
            <tbody>
              {[...Array(4)].map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      ) : filteredCases.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-2xl border border-outline-variant/30 text-center">
          <span className="material-symbols-outlined text-6xl text-outline">folder_off</span>
          <h3 className="text-xl font-bold text-on-surface mt-4">No cases yet</h3>
          <p className="text-on-surface-variant mt-2">
            Once a lawyer accepts your request, your case will appear here.
          </p>
          <Link href="/client/explore-lawyers" className="inline-block mt-6">
            <Button variant="primary" icon="search">Explore Lawyers</Button>
          </Link>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCases}
          pagination={{
            label: `Showing ${filteredCases.length} case${filteredCases.length !== 1 ? "s" : ""}`,
            pages: [{ label: "1", active: true }],
          }}
        />
      )}
    </div>
  );
}
