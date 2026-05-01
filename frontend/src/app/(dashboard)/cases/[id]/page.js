"use client";

import { PageHeader, StatusBadge, Button, AvatarInitials } from "@/components/ui";

const timeline = [
  { icon: "check_circle", iconColor: "text-success", title: "Complaint Filed with Court", time: "Today, 10:30 AM", by: "Marcus Thorne" },
  { icon: "schedule", iconColor: "text-primary", title: "Document Reviewed by AI", time: "Yesterday, 4:15 PM", by: "LexAgile AI", note: '"3 potential inconsistencies found in Section 4.2..."' },
  { icon: "event", iconColor: "text-outline", title: "Client Meeting: Strategy", time: "Jan 22, 2:00 PM", by: "Sarah Chen" },
];

const documents = [
  { name: "Initial_Complaint_Final.pdf", icon: "picture_as_pdf", iconColor: "text-error", type: "Legal Filing", updated: "2h ago", size: "2.4 MB" },
  { name: "Discovery_Request_Draft_v2.docx", icon: "description", iconColor: "text-primary", type: "Discovery", updated: "Yesterday", size: "842 KB" },
  { name: "Damages_Analysis_Q1.xlsx", icon: "table_chart", iconColor: "text-success", type: "Financial", updated: "Jan 18, 2024", size: "1.1 MB" },
];

const invoices = [
  { status: "Paid", statusColor: "bg-success-light text-success", id: "#INV-9920", amount: "$4,500.00", desc: "Retainer - Feb 2024" },
  { status: "Pending", statusColor: "bg-warning-light text-warning", id: "#INV-9981", amount: "$12,750.00", desc: "Discovery Phase I" },
];

export default function CaseDetailPage() {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <PageHeader
        title="Lexington vs. Quantum Synergies"
        breadcrumb={["Cases", "Intellectual Property", "Matter #2024-IP-882"]}
      >
        <Button variant="secondary" icon="share">Share Case</Button>
        <Button variant="primary" icon="edit">Manage Case</Button>
      </PageHeader>

      {/* Status Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <StatusBadge status="Active" />
        <div className="flex items-center gap-2 text-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
          Opened Jan 12, 2024
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
                <p className="text-sm text-on-surface leading-relaxed">
                  Strategic patent infringement lawsuit regarding next-generation neural processing units.
                  The client alleges Quantum Synergies misappropriated core architecture designs from their
                  2022 semiconductor filing.
                </p>
              </div>
              <div className="md:w-60 space-y-4">
                <div>
                  <p className="text-xs text-on-surface-variant">Primary Client</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">Lexington Dynamics Corp.</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Lead Counsel</p>
                  <p className="text-sm font-semibold text-on-surface mt-0.5">Marcus Thorne, Esq.</p>
                </div>
                <div>
                  <p className="text-xs text-on-surface-variant">Est. Value</p>
                  <p className="text-sm font-bold text-primary mt-0.5">$12.5M USD</p>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Documents */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card">
            <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">folder_open</span>
                <h3 className="text-xl font-semibold text-on-surface tracking-tight">Attached Documents</h3>
              </div>
              <Button variant="secondary" size="sm" icon="upload_file">Upload New</Button>
            </div>

            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant/15">
                  <th className="px-8 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">File Name</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Updated</th>
                  <th className="px-4 py-3 text-left text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Size</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc, i) => (
                  <tr key={i} className="border-b border-outline-variant/10 last:border-0 hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${doc.iconColor}`}>{doc.icon}</span>
                        <span className="text-sm font-medium text-on-surface">{doc.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{doc.type}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{doc.updated}</td>
                    <td className="px-4 py-4 text-sm text-on-surface-variant">{doc.size}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
              {invoices.map((inv, i) => (
                <div key={i} className="p-4 rounded-xl border border-outline-variant/20 hover:shadow-card transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${inv.statusColor}`}>
                      {inv.status}
                    </span>
                    <span className="text-xs text-on-surface-variant">{inv.id}</span>
                  </div>
                  <p className="text-xl font-bold text-on-surface">{inv.amount}</p>
                  <p className="text-xs text-on-surface-variant mt-1">{inv.desc}</p>
                </div>
              ))}
              <button className="p-4 rounded-xl border border-dashed border-outline-variant/40 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:bg-surface-container-low hover:border-primary/30 transition-all">
                <span className="material-symbols-outlined text-[24px]">add_circle_outline</span>
                <span className="text-xs font-semibold uppercase tracking-wider">Generate Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">schedule</span>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Timeline</h3>
            </div>

            <div className="space-y-6 relative">
              <div className="absolute left-[18px] top-6 bottom-6 w-px bg-outline-variant/30" />

              {timeline.map((item, i) => (
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
              ))}
            </div>

            <button className="w-full text-center text-sm font-semibold text-primary hover:underline mt-6 pt-4 border-t border-outline-variant/20">
              View Full History
            </button>
          </div>

          {/* Internal Notes */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">sticky_note_2</span>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Internal Notes</h3>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-outline-variant/15 bg-surface-container-low/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">Marcus Thorne</span>
                  <span className="text-xs text-outline">2h ago</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">
                  Need to double check the jurisdiction clause in the master agreement before Friday&apos;s hearing.
                </p>
              </div>
              <div className="p-4 rounded-lg border border-outline-variant/15 bg-surface-container-low/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-primary">Sarah Chen</span>
                  <span className="text-xs text-outline">Jan 20</span>
                </div>
                <p className="text-sm text-on-surface leading-relaxed">
                  Discovery phase documents should be ready by EOW. Coordinating with the paralegal team.
                </p>
              </div>
            </div>

            {/* Add Note */}
            <div className="mt-4 flex items-center gap-2 bg-surface-container-low rounded-lg p-2">
              <input
                type="text"
                placeholder="Add a private note..."
                className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline/50 px-2 py-1.5 focus:outline-none"
              />
              <button className="w-8 h-8 bg-primary text-on-primary rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
