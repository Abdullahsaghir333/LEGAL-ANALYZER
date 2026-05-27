"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, AvatarInitials, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export default function ClientRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await apiFetch("/requests");
      const data = await res.json();
      if (res.ok) {
        setRequests(data);
      }
    } catch (error) {
      console.error("Failed to fetch requests", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Poll for new requests every 10 seconds
    const interval = setInterval(fetchRequests, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id, action) => {
    try {
      const status = action === 'accept' ? 'accepted' : 'declined';
      
      const res = await apiFetch(`/requests/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) {
        setRequests(requests.filter(req => req._id !== id));
        if (action === "accept") {
          const caseId = data.case?._id;
          if (caseId) {
            alert(data.message || "Request accepted. A new case has been added for this client.");
            router.push(`/cases/${caseId}`);
          } else {
            alert("Request accepted! A new case has been added for this client.");
          }
        }
      } else {
        alert(data.message || "Failed to update request.");
      }
    } catch (error) {
      alert("Error updating request.");
    }
  };

  return (
    <div className="animate-slide-up">
      <PageHeader 
        title="Client Requests" 
        subtitle="Review and manage incoming legal representation requests from the marketplace."
        breadcrumb={["Dashboard", "Client Requests"]}
      />

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-card">
          <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[32px] text-outline">inbox</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface mb-1">No pending requests</h3>
          <p className="text-sm text-on-surface-variant w-full max-w-[400px] px-4">
            You have responded to all prospective clients. New requests from the marketplace will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div 
              key={req._id} 
              className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6 flex flex-col md:flex-row gap-6 hover:shadow-elevated transition-shadow"
            >
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <AvatarInitials name={req.clientId?.name || "Unknown Client"} size="lg" />
                    <div>
                      <h3 className="text-base font-semibold text-on-surface">{req.clientId?.name || "Unknown Client"}</h3>
                      <p className="text-xs text-on-surface-variant">{req.clientId?.email || "No email provided"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs font-medium text-on-surface-variant">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </span>
                    <StatusBadge status={req.status || 'pending'} />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-primary/10 text-primary uppercase tracking-wider">
                    {req.caseType || 'General Case'}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${req.urgency === 'High' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                    Urgency: {req.urgency || 'Normal'}
                  </span>
                </div>

                <div className="bg-surface-container-low/50 p-4 rounded-lg border border-outline-variant/20">
                  <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Case Description</h4>
                  <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">
                    {req.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-stretch justify-center gap-3 md:w-48 shrink-0 md:border-l border-t md:border-t-0 border-outline-variant/20 pt-4 md:pt-0 md:pl-6">
                {(!req.status || req.status === 'pending') ? (
                  <>
                    <button 
                      onClick={() => handleAction(req._id, 'accept')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-success text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span>
                      Accept Request
                    </button>
                    <button 
                      onClick={() => handleAction(req._id, 'decline')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-error/30 text-error hover:bg-error/5 text-sm font-semibold rounded-xl transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span>
                      Decline
                    </button>
                  </>
                ) : req.status === 'accepted' ? (
                  <button 
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-on-primary shadow-primary text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">forum</span>
                    Message Client
                  </button>
                ) : (
                  <div className="w-full text-center py-2 px-4 bg-surface-container-high rounded-xl text-sm font-medium text-on-surface-variant">
                    Declined
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
