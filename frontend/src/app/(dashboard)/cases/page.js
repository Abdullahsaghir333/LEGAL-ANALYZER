"use client";

import { useState } from "react";
import { PageHeader, DataTable, StatusBadge, Button, KpiCard, FilterChip } from "@/components/ui";
import { useCases } from "@/hooks/useCases";

function SkeletonRow() {
  return (
    <tr className="border-b border-outline-variant/10">
      <td className="py-4 px-4"><div className="h-10 w-48 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-24 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-16 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-14 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-6 w-20 bg-surface-container-high animate-pulse rounded"></div></td>
      <td className="py-4 px-4"><div className="h-8 w-8 bg-surface-container-high animate-pulse rounded"></div></td>
    </tr>
  );
}

import Link from "next/link";
import { useEffect } from "react";
import { apiFetch } from "@/lib/api";

function ChatPanel({ caseId, onClose }) {
  const [caseData, setCaseData] = useState(null);
  const [newUpdate, setNewUpdate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCase = async () => {
    try {
      const res = await apiFetch(`/cases/${caseId}`);
      if (res.ok) setCaseData(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (caseId) fetchCase(); }, [caseId]);

  const handleSend = async () => {
    if (!newUpdate.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/cases/${caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: newUpdate }),
      });
      if (res.ok) {
        setNewUpdate("");
        fetchCase();
      }
    } catch (err) { console.error(err); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
      <div className="w-[450px] max-w-full h-full bg-[#EFEAE2] shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="bg-surface-container-lowest px-4 py-3 flex items-center justify-between border-b border-outline-variant/20 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_back</span>
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[20px]">gavel</span>
            </div>
            <div>
              <h3 className="font-semibold text-on-surface text-sm truncate max-w-[200px]">{caseData?.title || "Loading..."}</h3>
              <p className="text-xs text-on-surface-variant">{caseData?.client_id?.name || "Client Chat"}</p>
            </div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant">
            <span className="material-symbols-outlined text-[20px]">more_vert</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[url('https://i.pinimg.com/originals/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center">
          {caseData?.messages && caseData.messages.length > 0 ? (
            caseData.messages.map((msg, idx) => {
              const isOwn = msg.sender_id === (typeof window !== "undefined" ? JSON.parse(localStorage.getItem('userInfo'))?._id : null);
              return (
                <div key={idx} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                  <div className={`p-2.5 rounded-2xl max-w-[85%] shadow-sm ${
                    isOwn ? 'bg-[#d9fdd3] text-[#111b21] rounded-tr-sm' : 'bg-white text-[#111b21] rounded-tl-sm'
                  }`}>
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-gray-500">
                        {new Date(msg.created_at || msg.createdAt).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="bg-[#FFEECD] text-[#54411C] px-4 py-2 rounded-lg text-xs font-medium shadow-sm text-center max-w-[80%]">
                <span className="material-symbols-outlined text-[16px] mb-1 block">lock</span>
                Messages are end-to-end encrypted. No one outside of this case, not even LexAgile, can read to them. Click to learn more.
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="bg-[#f0f2f5] p-3 flex items-end gap-2 shrink-0">
          <button className="w-10 h-10 flex items-center justify-center text-[#54656f] hover:bg-[#d1d7db] rounded-full transition-colors shrink-0">
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
          <div className="flex-1 bg-white rounded-xl border border-transparent focus-within:border-primary/30 shadow-sm flex items-end overflow-hidden">
            <textarea
              value={newUpdate}
              onChange={(e) => setNewUpdate(e.target.value)}
              placeholder="Type a message"
              className="w-full bg-transparent text-[15px] text-on-surface px-4 py-3 max-h-[120px] min-h-[44px] resize-none focus:outline-none"
              rows="1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button 
            onClick={handleSend}
            disabled={isSubmitting || !newUpdate.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              newUpdate.trim() ? 'bg-[#00a884] text-white hover:bg-[#008f6f] shadow-sm' : 'text-[#54656f] hover:bg-[#d1d7db]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px] ml-0.5">{newUpdate.trim() ? 'send' : 'mic'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CasesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [chatCaseId, setChatCaseId] = useState(null);
  const { data: cases, isLoading, error } = useCases();

  const columns = [
    {
      header: "Case Name",
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">gavel</span>
          </div>
          <div>
            <Link href={`/cases/${row._id}`} className="font-semibold text-primary hover:underline">{row.title || "Untitled Case"}</Link>
            <p className="text-xs text-on-surface-variant">{row.description ? (row.description.substring(0, 30) + (row.description.length > 30 ? '...' : '')) : "Legal Case"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Client",
      render: (row) => <span className="text-on-surface">{row.client_id?.name || "N/A"}</span>,
    },
    {
      header: "Status",
      render: (row) => <StatusBadge status={row.status || "pending"} />,
    },
    {
      header: "Priority",
      render: (row) => <StatusBadge status={row.priority || "medium"} />,
    },
    {
      header: "Date Opened",
      render: (row) => <span className="text-on-surface-variant">{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "N/A"}</span>,
    },
    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setChatCaseId(row._id)} className="px-3 py-1.5 bg-[#d9fdd3] text-[#00a884] hover:bg-[#c2fad5] rounded-full transition-colors flex items-center gap-1.5 text-xs font-bold">
            <span className="material-symbols-outlined text-[16px]">forum</span> Chat
          </button>
          <Link href={`/cases/${row._id}`} className="p-1.5 text-on-surface-variant hover:text-primary rounded-full transition-colors">
            <span className="material-symbols-outlined text-[20px]">open_in_new</span>
          </Link>
        </div>
      ),
    },
  ];

  // Filter cases based on status
  const filteredCases = cases?.filter(c => {
    if (activeFilter === "All") return true;
    return c.status === activeFilter.toLowerCase();
  }) || [];

  // Calculate stats
  const openCases = cases?.filter(c => c.status === "active").length || 0;
  const pendingCases = cases?.filter(c => c.status === "pending").length || 0;
  const closedCases = cases?.filter(c => c.status === "closed").length || 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {chatCaseId && <ChatPanel caseId={chatCaseId} onClose={() => setChatCaseId(null)} />}
      
      <PageHeader title="Active Cases" subtitle="Manage and monitor legal proceedings across your client portfolio.">
        <div className="flex items-center gap-2 bg-surface-container-lowest border border-outline-variant/30 rounded-lg overflow-hidden">
          <button className="px-4 py-2 text-sm font-medium bg-primary text-on-primary">Table</button>
          <button className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container-low transition-colors">Board</button>
        </div>
        <Button variant="secondary" icon="file_download">Export</Button>
      </PageHeader>

      {/* Filters + KPI */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Status</label>
              <select 
                className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
              >
                <option>All</option>
                <option>Active</option>
                <option>Pending</option>
                <option>Closed</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Priority</label>
              <select className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option>All Priorities</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">Date Opened</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">calendar_today</span>
                <input type="text" placeholder="Select range" className="bg-surface-container-low border border-outline-variant/30 rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>
          <button className="mt-3 text-sm font-semibold text-primary hover:underline" onClick={() => setActiveFilter("All")}>Clear all filters</button>
        </div>

        <div className="bg-primary-container p-6 rounded-xl shadow-elevated text-on-primary">
          <p className="text-on-primary/70 text-xs font-medium">Total Active Cases</p>
          <p className="text-[40px] font-bold mt-1 leading-tight">{cases?.length || 0}</p>
          <p className="text-sm text-on-primary/60 mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">trending_up</span>
            {openCases} open
          </p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error-container p-4 rounded-lg text-error text-center">
          Failed to load cases. Please try again.
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
      ) : filteredCases.length === 0 ? (
        <div className="bg-surface-container-lowest p-12 rounded-xl border border-outline-variant/30 shadow-card text-center">
          <span className="material-symbols-outlined text-6xl text-outline">folder_off</span>
          <h3 className="text-xl font-semibold text-on-surface mt-4">No cases found</h3>
          <p className="text-on-surface-variant mt-2">Get started by creating your first case.</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredCases}
          pagination={{
            label: `Showing 1 to ${Math.min(10, filteredCases.length)} of ${filteredCases.length} entries`,
            pages: [
              { label: "1", active: true },
            ],
          }}
        />
      )}
    </div>
  );
}
