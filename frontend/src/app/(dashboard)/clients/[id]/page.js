"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader, StatusBadge, Button, AvatarInitials } from "@/components/ui";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

export default function ClientDetailPage() {
  const { id } = useParams();
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = async () => {
    try {
      const res = await apiFetch(`/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClientData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchClient();
  }, [id]);

  const handleEmailClient = () => {
    if (!clientData?.email) {
      alert("No email address on file for this client.");
      return;
    }
    const subject = encodeURIComponent(`Regarding your legal matter - ${clientData.name}`);
    window.location.href = `mailto:${clientData.email}?subject=${subject}`;
  };

  if (loading) return <div className="p-10 text-center">Loading client details...</div>;
  if (!clientData) return <div className="p-10 text-center">Client not found.</div>;

  const allCases = clientData.cases || [];
  const activeCases = allCases.filter((c) => c.status === "open" || c.status === "pending");
  const closedCases = allCases.filter((c) => c.status === "closed");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title={clientData.name}
        breadcrumb={["Clients", "Details", clientData.name]}
      >
        {activeCases.length > 0 && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-light text-success text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">gavel</span>
            {activeCases.length} active case{activeCases.length !== 1 ? "s" : ""}
          </span>
        )}
        <Button variant="secondary" icon="mail" onClick={handleEmailClient}>
          Email Client
        </Button>
        <Button variant="primary" icon="edit">Edit Client</Button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                <h3 className="text-xl font-semibold text-on-surface tracking-tight">Client Profile</h3>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-6">
                  <AvatarInitials name={clientData.name} size="lg" />
                  <div>
                    <h4 className="text-lg font-bold text-on-surface">{clientData.name}</h4>
                    <p className="text-sm text-on-surface-variant">{clientData.company || "Individual Client"}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">mail</span>
                    {clientData.email ? (
                      <button
                        type="button"
                        onClick={handleEmailClient}
                        className="text-sm text-primary hover:underline text-left"
                      >
                        {clientData.email}
                      </button>
                    ) : (
                      <span className="text-sm">No email provided</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">call</span>
                    <span className="text-sm">{clientData.phone || "No phone provided"}</span>
                  </div>
                  <div className="flex items-center gap-3 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[20px]">business</span>
                    <span className="text-sm">{clientData.company || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card">
            <div className="px-8 py-6 border-b border-outline-variant/15">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">work</span>
                <div>
                  <h3 className="text-xl font-semibold text-on-surface tracking-tight">Active Cases</h3>
                  <p className="text-xs text-on-surface-variant mt-1">
                    New cases are added when this client submits a request and you accept it under{" "}
                    <Link href="/client-requests" className="text-primary font-semibold hover:underline">
                      Client Requests
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="px-8 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Case Title</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Priority</th>
                </tr>
              </thead>
              <tbody>
                {activeCases.length > 0 ? (
                  activeCases.map((caseItem) => (
                    <tr key={caseItem._id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-8 py-4">
                        <Link href={`/cases/${caseItem._id}`} className="flex items-center gap-3 group">
                          <span className="material-symbols-outlined text-[20px] text-primary group-hover:scale-110 transition-transform">gavel</span>
                          <span className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors truncate max-w-[250px] block" title={caseItem.title}>
                            {caseItem.title}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={caseItem.status === "open" ? "Active" : caseItem.status} />
                      </td>
                      <td className="px-4 py-4 text-sm font-medium text-on-surface-variant capitalize">{caseItem.priority}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-8 py-8 text-center text-sm text-on-surface-variant">
                      No active cases. Waiting for a new client request.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {closedCases.length > 0 && (
              <>
                <div className="px-8 py-4 border-t border-outline-variant/15 bg-surface-container-low/30">
                  <h4 className="text-sm font-semibold text-on-surface-variant">Closed Cases</h4>
                </div>
                <table className="w-full">
                  <tbody>
                    {closedCases.map((caseItem) => (
                      <tr key={caseItem._id} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors opacity-75">
                        <td className="px-8 py-4">
                          <Link href={`/cases/${caseItem._id}`} className="flex items-center gap-3 group">
                            <span className="material-symbols-outlined text-[20px] text-outline">gavel</span>
                            <span className="text-sm font-medium text-on-surface-variant group-hover:text-primary transition-colors truncate max-w-[250px] block">
                              {caseItem.title}
                            </span>
                          </Link>
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status="closed" />
                        </td>
                        <td className="px-4 py-4 text-sm text-on-surface-variant capitalize">{caseItem.priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">analytics</span>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Client Activity</h3>
            </div>
            <div className="space-y-6 relative">
              <div className="absolute left-[18px] top-6 bottom-6 w-px bg-outline-variant/30" />

              <div className="flex gap-4 relative z-10">
                <span className="material-symbols-outlined text-[20px] text-primary bg-surface-container-lowest">
                  person_add
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-on-surface">Client Onboarded</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {new Date(clientData.createdAt).toLocaleString()} • System
                  </p>
                </div>
              </div>

              {allCases.map((caseItem) => (
                <div key={caseItem._id} className="flex gap-4 relative z-10">
                  <span className={`material-symbols-outlined text-[20px] bg-surface-container-lowest ${
                    caseItem.status === "closed" ? "text-outline" : "text-success"
                  }`}>
                    {caseItem.status === "closed" ? "cancel" : "add_circle"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">
                      {caseItem.status === "closed" ? "Case Closed" : "Case Opened"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(caseItem.updatedAt || caseItem.createdAt).toLocaleString()} •{" "}
                      {caseItem.title.length > 30 ? `${caseItem.title.substring(0, 30)}...` : caseItem.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
