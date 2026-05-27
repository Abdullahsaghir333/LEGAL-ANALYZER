"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { PageHeader, StatusBadge, Button, AvatarInitials } from "@/components/ui";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import CaseChat from "@/components/cases/CaseChat";
import CaseDocuments from "@/components/cases/CaseDocuments";



export default function CaseDetailPage() {
  const { id } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await apiFetch(`/cases/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCase();
  }, [id]);

  const isCaseClosed = caseData?.status === "closed";

  const handleEndCase = async () => {
    if (!confirm("End this case? The client will no longer have an active matter for this case. You can still view history and documents.")) {
      return;
    }
    setClosing(true);
    try {
      const res = await apiFetch(`/cases/${id}/close`, { method: "PATCH" });
      if (res.ok) {
        await fetchCase();
      } else {
        const data = await res.json();
        alert(data.message || "Failed to end case");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to end case");
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <div className="p-10 text-center">Loading case details...</div>;
  if (!caseData) return <div className="p-10 text-center">Case not found.</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <PageHeader
        title={caseData.title}
        breadcrumb={["Cases", "Details", `Matter #${caseData._id.substring(0, 8)}`]}
      >
        {!isCaseClosed && (
          <Button
            variant="danger"
            icon={closing ? "hourglass_empty" : "cancel"}
            onClick={handleEndCase}
            disabled={closing}
          >
            {closing ? "Ending..." : "End Case"}
          </Button>
        )}
        <Button variant="secondary" icon="share">Share Case</Button>
      </PageHeader>

      {isCaseClosed && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-high border border-outline-variant/30">
          <span className="material-symbols-outlined text-outline">info</span>
          <p className="text-sm text-on-surface-variant">
            This case has been closed. Messaging and uploads are disabled; history remains available below.
          </p>
        </div>
      )}

      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatusBadge status={caseData.status === 'open' ? 'Active' : caseData.status === 'closed' ? 'Closed' : caseData.status} />
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Opened {new Date(caseData.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Overview */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-[22px]">info</span>
                <h3 className="text-xl font-semibold text-on-surface tracking-tight">Case Overview</h3>
              </div>
              <button className="text-primary text-sm font-semibold hover:underline">Full Summary</button>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Summary</p>
                <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                  {caseData.description || "No description provided."}
                </p>
              </div>
              <div className="md:w-60 space-y-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Primary Client</p>
                  <Link href={`/clients/${caseData.client_id?._id}`} className="text-sm font-semibold text-primary hover:underline mt-0.5 block">
                    {caseData.client_id?.name}
                  </Link>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Client Email</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">{caseData.client_id?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Case Priority</p>
                  <p className="text-sm font-bold text-primary mt-0.5 capitalize">{caseData.priority}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Documents */}
          <CaseDocuments
            caseId={id}
            documents={caseData.documents || []}
            onRefresh={fetchCase}
            allowUpload={!isCaseClosed}
          />

          {/* Related Invoices */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">receipt</span>
                <h3 className="text-xl font-semibold text-on-surface tracking-tight">Related Invoices</h3>
              </div>
              <button className="text-primary text-sm font-semibold hover:underline">View All Billing</button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {caseData.invoices && caseData.invoices.length > 0 ? (
                caseData.invoices.map((inv, i) => (
                  <div key={i} className="p-4 rounded-xl border border-outline-variant/20 hover:shadow-card transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        inv.status === 'paid' ? 'bg-success-light text-success' : inv.status === 'pending' ? 'bg-warning-light text-warning' : 'bg-error-light text-error'
                      }`}>
                        {inv.status}
                      </span>
                      <span className="text-xs text-on-surface-variant">{inv.invoice_number}</span>
                    </div>
                    <p className="text-xl font-bold text-on-surface">${inv.total?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className="text-xs text-on-surface-variant mt-1">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-outline-variant/30 flex items-center justify-center text-sm text-on-surface-variant">
                  No invoices generated yet.
                </div>
              )}
              <button className="p-4 rounded-xl border border-dashed border-outline-variant/40 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-[24px]">add_circle_outline</span>
                <span className="text-xs font-semibold uppercase tracking-wider">Generate Invoice</span>
              </button>
            </div>
          </div>
          
          {/* Timeline */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">schedule</span>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Timeline</h3>
            </div>

            <div className="space-y-6 relative">
              <div className="absolute left-[18px] top-6 bottom-6 w-px bg-outline-variant/30" />

              {(() => {
                const dynamicTimeline = [
                  { icon: "add_circle", iconColor: "text-primary", title: "Case Opened", time: new Date(caseData.createdAt).toLocaleString(), by: caseData.client_id?.name || "System" }
                ];
                if (caseData.documents && caseData.documents.length > 0) {
                  const latestDoc = caseData.documents[caseData.documents.length - 1];
                  dynamicTimeline.push({
                    icon: "upload_file", iconColor: "text-warning", title: "Document Uploaded", time: new Date(latestDoc.createdAt).toLocaleString(), by: "User", note: latestDoc.file_name
                  });
                }
                if (caseData.messages && caseData.messages.length > 0) {
                  const latestMsg = caseData.messages[caseData.messages.length - 1];
                  dynamicTimeline.push({
                    icon: "forum", iconColor: "text-success", title: "New Message", time: new Date(latestMsg.createdAt || latestMsg.created_at).toLocaleString(), by: "User", note: latestMsg.text.length > 50 ? latestMsg.text.substring(0, 50) + "..." : latestMsg.text
                  });
                }
                
                // Sort by time descending
                dynamicTimeline.sort((a, b) => new Date(b.time) - new Date(a.time));

                return dynamicTimeline.map((item, i) => (
                  <div key={i} className="flex gap-4 relative z-10">
                    <span className={`material-symbols-outlined text-[20px] ${item.iconColor} bg-surface-container-lowest`}>
                      {item.icon}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">{item.title}</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">{item.time} • {item.by}</p>
                      {item.note && (
                        <p className="mt-2 text-xs italic text-on-surface-variant bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/15">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>

            <button className="w-full text-center text-sm font-semibold text-primary hover:underline mt-6 pt-4 border-t border-outline-variant/20">
              View Full History
            </button>
          </div>
        </div>

        <div className="h-[calc(100vh-140px)] sticky top-6">
          <CaseChat
            caseId={id}
            caseData={caseData}
            onRefresh={fetchCase}
            chatTitle={caseData.title}
            chatSubtitle={caseData.client_id?.name || "Client Chat"}
            className="h-full"
            readOnly={isCaseClosed}
          />
        </div>
      </div>
    </div>
  );
}
