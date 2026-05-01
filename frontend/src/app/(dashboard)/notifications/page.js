"use client";

import { Button } from "@/components/ui";

const notifications = [
  {
    icon: "warning",
    iconColor: "text-error",
    borderColor: "border-l-error",
    title: "Urgent Filing Deadline",
    tag: "Urgent",
    tagColor: "bg-error-container text-error",
    time: "2 mins ago",
    description: "The response for Case #7742 (Smith vs. Global Corp) is due within the next 4 hours. No draft has been submitted yet.",
    actions: [
      { label: "View Case File", primary: true },
      { label: "Dismiss", primary: false },
    ],
  },
  {
    icon: "swap_horiz",
    iconColor: "text-primary",
    borderColor: "border-l-primary",
    title: "Contract Revision Approved",
    tag: "Updates",
    tagColor: "bg-surface-container-high text-on-surface-variant",
    time: "1 hour ago",
    description: "Counter-party 'Loomis & Co' has accepted the liability clauses in the master service agreement. Document ready for signing.",
    actions: [{ label: "Open Document", primary: true }],
  },
  {
    icon: "auto_awesome",
    iconColor: "text-warning",
    borderColor: "border-l-warning",
    title: "AI Strategy Recommendation",
    tag: "Insights",
    tagColor: "bg-warning-light text-warning",
    time: "3 hours ago",
    description: "Based on 50+ recent precedents, LexAgile AI suggests a 12% increase in the settlement offer to reach an agreement faster.",
    actions: [
      { label: "Explore Logic", primary: true },
      { label: "Mark as Read", primary: false },
    ],
  },
  {
    icon: "cloud_upload",
    iconColor: "text-info",
    borderColor: "border-l-info",
    title: "Bulk Ingestion Complete",
    tag: "Updates",
    tagColor: "bg-surface-container-high text-on-surface-variant",
    time: "5 hours ago",
    description: "The 450 documents from the 'Project Alpha' data room have been successfully processed and tagged for discovery.",
    actions: [{ label: "View Folder", primary: true }],
  },
  {
    icon: "trending_up",
    iconColor: "text-error",
    borderColor: "border-l-error/50",
    title: "Revenue Anomaly Detected",
    tag: "Insights",
    tagColor: "bg-warning-light text-warning",
    time: "Yesterday",
    description: "Invoicing for the Q3 litigation cycle shows a 15% variance compared to projected legal spend. Automated audit recommended.",
    actions: [
      { label: "Review Analytics", primary: true },
      { label: "Dismiss", primary: false },
    ],
  },
];

export default function NotificationsPage() {
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-semibold text-on-surface tracking-tight">Notifications</h1>
          <p className="text-sm text-on-surface-variant mt-1">Stay updated with the latest legal intelligence and case activities.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon="done_all" size="sm">Mark as Read</Button>
          <Button variant="secondary" icon="delete_sweep" size="sm" className="!text-error !border-error/20 hover:!bg-error-container/20">
            Clear All
          </Button>
        </div>
      </div>

      {/* Notification List */}
      <div className="space-y-4">
        {notifications.map((notif, i) => (
          <div
            key={i}
            className={`bg-surface-container-lowest rounded-xl border border-outline-variant/20 shadow-card p-6 border-l-4 ${notif.borderColor} hover:shadow-elevated transition-shadow`}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                <span className={`material-symbols-outlined text-[22px] ${notif.iconColor}`}>{notif.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-base font-semibold text-on-surface">{notif.title}</h3>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${notif.tagColor}`}>
                    {notif.tag}
                  </span>
                  <span className="text-xs text-outline ml-auto shrink-0">{notif.time}</span>
                </div>
                <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">{notif.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  {notif.actions.map((action, j) => (
                    <button
                      key={j}
                      className={`text-sm font-semibold transition-colors ${
                        action.primary ? "text-primary hover:underline" : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
