"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader, StatusBadge, Button } from "@/components/ui";
import CaseChat from "@/components/cases/CaseChat";
import CaseDocuments from "@/components/cases/CaseDocuments";
import { apiFetch } from "@/lib/api";

export default function ClientCaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCase = async () => {
    try {
      const res = await apiFetch(`/cases/${id}`);
      if (res.ok) setCaseData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCase();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-10 text-center">
        <p className="text-on-surface-variant">Case not found or you do not have access.</p>
        <Link href="/client/cases" className="text-primary font-semibold mt-4 inline-block hover:underline">
          Back to My Cases
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title={caseData.title}
        breadcrumb={["My Cases", "Details"]}
      >
        <Link href="/client/cases">
          <Button variant="secondary" icon="arrow_back">Back</Button>
        </Link>
      </PageHeader>

      <div className="flex items-center gap-4 flex-wrap">
        <StatusBadge status={caseData.status === "open" ? "Active" : caseData.status} />
        <span className="text-sm text-on-surface-variant flex items-center gap-1">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Opened {new Date(caseData.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-primary text-[22px]">info</span>
              <h3 className="text-xl font-semibold text-on-surface">Case Overview</h3>
            </div>
            <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
              {caseData.description || "No description provided."}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-outline-variant/15">
              <div>
                <p className="text-xs text-on-surface-variant">Priority</p>
                <p className="font-semibold text-on-surface capitalize mt-1">{caseData.priority}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Status</p>
                <p className="font-semibold text-on-surface capitalize mt-1">{caseData.status}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Messages</p>
                <p className="font-semibold text-on-surface mt-1">{caseData.messages?.length || 0}</p>
              </div>
            </div>
          </div>

          {caseData.lawyer_id && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="material-symbols-outlined text-primary text-[22px]">person</span>
                <h3 className="text-xl font-semibold text-on-surface">Your Lawyer</h3>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                  {caseData.lawyer_id.name?.charAt(0) || "L"}
                </div>
                <div>
                  <p className="font-bold text-lg text-on-surface">{caseData.lawyer_id.name}</p>
                  <p className="text-sm text-on-surface-variant">{caseData.lawyer_id.email}</p>
                  {caseData.lawyer_id.expertise?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {caseData.lawyer_id.expertise.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-surface-container-low text-[10px] uppercase font-bold rounded-md text-on-surface-variant"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {caseData.updates?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-8">
              <h3 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">schedule</span>
                Case Updates
              </h3>
              <div className="space-y-4">
                {caseData.updates.map((update, i) => (
                  <div key={i} className="p-4 bg-surface-container-low rounded-xl">
                    <p className="text-sm text-on-surface">{update.description}</p>
                    <p className="text-xs text-on-surface-variant mt-2">
                      {new Date(update.date).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <CaseDocuments
            caseId={id}
            documents={caseData.documents || []}
            onRefresh={fetchCase}
          />

          {caseData.invoices?.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card p-8">
              <h3 className="text-xl font-semibold text-on-surface mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">receipt</span>
                Invoices
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {caseData.invoices.map((inv, i) => (
                  <div key={i} className="p-4 rounded-xl border border-outline-variant/20">
                    <StatusBadge status={inv.status} />
                    <p className="text-lg font-bold text-on-surface mt-2">
                      PKR {inv.total?.toLocaleString()}
                    </p>
                    <p className="text-xs text-on-surface-variant">{inv.invoice_number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div id="chat" className="h-[calc(100vh-180px)] sticky top-6">
          <CaseChat
            caseId={id}
            caseData={caseData}
            onRefresh={fetchCase}
            chatTitle={caseData.lawyer_id?.name || "Your Lawyer"}
            chatSubtitle="Secure case messaging"
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
