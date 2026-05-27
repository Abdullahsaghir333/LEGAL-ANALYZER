"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PageHeader, StatusBadge, KpiCard, Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export default function ClientDashboardPage() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setUserInfo(info);

    const fetchCases = async () => {
      try {
        const res = await apiFetch("/cases");
        if (res.ok) setCases(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCases();
  }, []);

  const openCases = cases.filter((c) => c.status === "open").length;
  const pendingCases = cases.filter((c) => c.status === "pending").length;
  const activeCase = cases.find((c) => c.status === "open") || cases[0];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in">
      <PageHeader
        title={`Welcome${userInfo?.name ? `, ${userInfo.name.split(" ")[0]}` : ""}`}
        subtitle="Track your legal matters, communicate with your lawyer, and get family law guidance."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard label="Active Cases" value={loading ? "—" : openCases} icon="business_center" badge={loading ? undefined : `${cases.length} total`} />
        <KpiCard label="Pending Review" value={loading ? "—" : pendingCases} icon="hourglass_top" />
        <KpiCard label="Lawyers Connected" value={loading ? "—" : new Set(cases.map((c) => c.lawyer_id?._id).filter(Boolean)).size} icon="groups" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : cases.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-outline">gavel</span>
          <h3 className="text-xl font-bold text-on-surface mt-4">No active cases yet</h3>
          <p className="text-on-surface-variant mt-2 max-w-md mx-auto">
            Explore family law specialists and send a representation request to get started.
          </p>
          <Link href="/client/explore-lawyers" className="inline-block mt-6">
            <Button variant="primary" icon="search">Find a Lawyer</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeCase && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-6 lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Primary Case</p>
                  <h2 className="text-2xl font-bold text-on-surface">{activeCase.title}</h2>
                  <p className="text-sm text-on-surface-variant mt-1 line-clamp-2">{activeCase.description}</p>
                </div>
                <StatusBadge status={activeCase.status === "open" ? "Active" : activeCase.status} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant">Your Lawyer</p>
                  <p className="font-semibold text-on-surface mt-1">{activeCase.lawyer_id?.name || "Assigned"}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant">Priority</p>
                  <p className="font-semibold text-on-surface mt-1 capitalize">{activeCase.priority}</p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-xl">
                  <p className="text-xs text-on-surface-variant">Opened</p>
                  <p className="font-semibold text-on-surface mt-1">
                    {new Date(activeCase.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`/client/cases/${activeCase._id}`}>
                  <Button variant="primary" icon="visibility">View Case Details</Button>
                </Link>
                <Link href={`/client/cases/${activeCase._id}#chat`}>
                  <Button variant="secondary" icon="forum">Message Lawyer</Button>
                </Link>
              </div>
            </div>
          )}

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-6">
            <h3 className="font-bold text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              All Your Cases
            </h3>
            <div className="space-y-3">
              {cases.slice(0, 5).map((c) => (
                <Link
                  key={c._id}
                  href={`/client/cases/${c._id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-low transition-colors group"
                >
                  <div>
                    <p className="font-semibold text-on-surface group-hover:text-primary transition-colors">{c.title}</p>
                    <p className="text-xs text-on-surface-variant">{c.lawyer_id?.name || "Lawyer"}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              ))}
            </div>
            {cases.length > 5 && (
              <Link href="/client/cases" className="block text-center text-sm font-semibold text-primary mt-4 hover:underline">
                View all {cases.length} cases
              </Link>
            )}
          </div>

          <div className="bg-primary-container/20 rounded-2xl border border-primary/20 p-6 flex flex-col justify-between">
            <div>
              <span className="material-symbols-outlined text-primary text-[32px]">smart_toy</span>
              <h3 className="font-bold text-on-surface mt-3">Family Law AI</h3>
              <p className="text-sm text-on-surface-variant mt-2">
                Ask basic questions about Pakistani family law before speaking with your lawyer.
              </p>
            </div>
            <Link href="/client/ai-assistant" className="mt-4">
              <Button variant="primary" icon="arrow_forward">Open AI Assistant</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
