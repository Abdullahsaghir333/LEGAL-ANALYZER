"use client";

import { KpiCard, Button } from "@/components/ui";
import { useDashboard, useRevenue } from "@/hooks/useDashboard";

function SkeletonCard() {
  return (
    <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-card animate-pulse">
      <div className="h-4 w-20 bg-surface-container-high rounded mb-4"></div>
      <div className="h-8 w-32 bg-surface-container-high rounded mb-2"></div>
      <div className="h-4 w-16 bg-surface-container-high rounded"></div>
    </div>
  );
}

function SkeletonActivity() {
  return (
    <div className="px-8 py-4 flex items-center gap-6">
      <div className="w-12 h-12 rounded-xl bg-surface-container-high animate-pulse"></div>
      <div className="flex-1 min-w-0">
        <div className="h-4 w-48 bg-surface-container-high rounded mb-2"></div>
        <div className="h-3 w-64 bg-surface-container-high rounded"></div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashboardLoading, error: dashboardError } = useDashboard();
  const { data: revenue, isLoading: revenueLoading } = useRevenue(6);

  const monthlyRevenue = revenue?.monthlyRevenue ?? [];
  const totalEarnings =
    revenue?.kpis?.totalRevenue ??
    monthlyRevenue.reduce((sum, item) => sum + (item.revenue || 0), 0);

  const maxMonthRevenue = Math.max(1, ...monthlyRevenue.map((m) => m.revenue || 0));

  const caseActivity = [
    { label: "Corporate Law", value: 65, color: "bg-primary-container" },
    { label: "Intellectual Property", value: 42, color: "bg-primary-container/70" },
    { label: "Real Estate", value: 28, color: "bg-primary-container/40" },
    { label: "Litigation", value: 15, color: "bg-primary-fixed" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-[30px] font-semibold text-on-surface tracking-tight">
            Good Morning, Marcus
          </h2>
          <p className="text-base text-secondary mt-1">
            Here is what&apos;s happening with your practice today.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon="calendar_today">
            June 14, 2024
          </Button>
          <Button variant="primary" icon="file_download">
            Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : dashboardError ? (
          <div className="col-span-3 bg-error-container p-6 rounded-xl text-error">
            Failed to load dashboard data. Please try again.
          </div>
        ) : (
          <>
            <KpiCard
              icon="payments"
              iconBg="bg-primary-fixed/30"
              iconColor="text-primary"
              label="Total Earnings"
              value={`Rs. ${totalEarnings.toLocaleString()}.00`}
              badge="+12.5%"
              badgeColor="bg-success-light text-success"
            />
            <KpiCard
              icon="business_center"
              iconBg="bg-warning-light"
              iconColor="text-warning"
              label="Active Cases"
              value={dashboard?.activeCases?.toString() || "0"}
              badge="Steady"
              badgeColor="bg-surface-container-high text-on-surface-variant"
            />
            <KpiCard
              icon="pending_actions"
              iconBg="bg-error-container/50"
              iconColor="text-error"
              label="Pending Invoices"
              value={dashboard?.unpaidInvoices?.toString() || "0"}
              badge="Overdue"
              badgeColor="bg-error-container text-error"
            />
          </>
        )}

        {/* Quick Actions */}
        <div className="bg-primary-container p-6 rounded-xl shadow-elevated flex flex-col gap-3">
          <p className="text-on-primary/70 text-[10px] uppercase font-bold tracking-[0.15em] mb-1">
            Quick Actions
          </p>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-on-primary rounded-lg text-sm font-medium flex items-center gap-3 px-3 transition-colors">
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            Upload document
          </button>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-on-primary rounded-lg text-sm font-medium flex items-center gap-3 px-3 transition-colors">
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            Create invoice
          </button>
          <button className="w-full py-2.5 bg-white/10 hover:bg-white/20 text-on-primary rounded-lg text-sm font-medium flex items-center gap-3 px-3 transition-colors">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Add client
          </button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-semibold text-on-surface tracking-tight">Monthly Revenue</h3>
              <p className="text-sm text-secondary mt-0.5">Performance comparison over the last 6 months</p>
            </div>
            <select className="bg-surface-container-low border border-outline-variant/30 rounded-lg px-3 py-2 text-sm text-on-surface-variant focus:ring-primary focus:outline-none">
              <option>Year 2024</option>
              <option>Year 2023</option>
            </select>
          </div>

          {/* Chart */}
          <div className="h-64 flex flex-col justify-end relative">
            {revenueLoading ? (
              <div className="flex items-end justify-between h-full px-4 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex-1 bg-surface-container-high animate-pulse rounded-t" style={{ height: '30%' }}></div>
                ))}
              </div>
            ) : monthlyRevenue.length > 0 ? (
              <>
                <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="border-b border-surface-container-high/60 w-full h-0" />
                  ))}
                </div>
                <div className="flex items-end justify-between h-full relative z-10 px-4 gap-2">
                  {monthlyRevenue.map((item) => (
                    <div
                      key={item.month}
                      className="flex-1 bg-primary rounded-t-sm transition-all duration-500 min-h-[4px]"
                      style={{ height: `${((item.revenue || 0) / maxMonthRevenue) * 100}%` }}
                      title={`${item.month}: Rs. ${(item.revenue || 0).toLocaleString()}`}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-on-surface-variant">
                No paid revenue in the last 6 months yet.
              </div>
            )}
            <div className="flex justify-between mt-4 px-2 text-[11px] font-medium text-outline">
              {monthlyRevenue.length > 0 ? (
                monthlyRevenue.map((item) => (
                  <span key={item.month} className="flex-1 text-center">{item.month}</span>
                ))
              ) : (
                <><span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span></>
              )}
            </div>
          </div>
        </div>

        {/* Case Activity */}
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/30 shadow-card">
          <h3 className="text-xl font-semibold text-on-surface tracking-tight mb-2">Case Activity</h3>
          <p className="text-sm text-secondary mb-8">Workload distribution per type</p>

          <div className="space-y-6">
            {caseActivity.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-on-surface">{item.label}</span>
                  <span className="text-primary font-semibold">{item.value}%</span>
                </div>
                <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${item.color}`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-8 border-t border-outline-variant/20">
            <button className="w-full text-center text-sm font-bold text-primary hover:underline">
              View Detailed Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden">
        <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-on-surface tracking-tight">Recent Activity</h3>
          <button className="text-primary text-sm font-semibold hover:underline">View All</button>
        </div>
        <div className="divide-y divide-outline-variant/10">
          {dashboardLoading ? (
            [...Array(3)].map((_, i) => <SkeletonActivity key={i} />)
          ) : dashboard?.recentActivity?.length > 0 ? (
            dashboard.recentActivity.map((item, i) => (
              <div
                key={i}
                className="px-8 py-4 flex items-center gap-6 hover:bg-surface-container-low/50 transition-colors cursor-pointer"
              >
                <div className="w-12 h-12 rounded-xl bg-surface-container-low flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{item.title}</p>
                  <p className="text-xs text-on-surface-variant truncate">{item.subtitle}</p>
                </div>
                <div className="text-right hidden sm:block shrink-0">
                  <p className="text-sm font-medium text-on-surface">{item.time}</p>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-8 py-8 text-center text-on-surface-variant">
              No recent activity found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
