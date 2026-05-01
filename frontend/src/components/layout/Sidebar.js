"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainNavItems = [
  { label: "Dashboard", icon: "dashboard", href: "/dashboard" },
  { label: "Clients", icon: "group", href: "/clients" },
  { label: "Cases", icon: "business_center", href: "/cases" },
  { label: "Contracts", icon: "description", href: "/contracts" },
  { label: "Billing", icon: "receipt_long", href: "/billing" },
  { label: "Analytics", icon: "analytics", href: "/analytics" },
];

const aiNavItems = [
  { label: "AI Assistant", icon: "smart_toy", href: "/ai-assistant" },
  { label: "Summarizer", icon: "summarize", href: "/summarizer" },
];

const bottomNavItems = [
  { label: "Notifications", icon: "notifications", href: "/notifications" },
  { label: "Settings", icon: "settings", href: "/settings" },
];

export default function Sidebar({ collapsed = false, onToggle }) {
  const pathname = usePathname();

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname.startsWith(href);
  };

  const NavItem = ({ item }) => {
    const active = isActive(item.href);
    return (
      <Link
        href={item.href}
        id={`nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200 ease-in-out group relative
          ${
            active
              ? "text-primary bg-primary-fixed/30 border-r-[3px] border-primary"
              : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low"
          }
        `}
      >
        <span
          className={`material-symbols-outlined text-[20px] transition-colors ${
            active ? "text-primary" : "text-on-surface-variant group-hover:text-on-surface"
          }`}
        >
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={`
        h-screen fixed left-0 top-0 z-50 bg-surface-container-lowest border-r border-outline-variant/30
        flex flex-col transition-all duration-300 ease-in-out
        ${collapsed ? "w-[72px]" : "w-64"}
        hidden md:flex
      `}
    >
      {/* Brand */}
      <div className={`px-4 py-6 ${collapsed ? "px-3" : "px-6"}`}>
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shadow-sm shrink-0">
            <span className="material-symbols-outlined text-white text-[20px] filled">
              gavel
            </span>
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-black text-on-surface leading-tight tracking-tight">
                LexAgile
              </h1>
              <p className="text-[10px] uppercase tracking-[0.15em] text-on-surface-variant font-semibold">
                Legal Enterprise
              </p>
            </div>
          )}
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className="space-y-0.5">
          {mainNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* AI Section */}
        {!collapsed && (
          <p className="px-4 pt-6 pb-2 text-[10px] uppercase tracking-[0.15em] text-outline font-bold">
            AI Tools
          </p>
        )}
        {collapsed && <div className="my-4 mx-3 h-px bg-outline-variant/40" />}
        <div className="space-y-0.5">
          {aiNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>

        {/* Bottom section separator */}
        {!collapsed && (
          <p className="px-4 pt-6 pb-2 text-[10px] uppercase tracking-[0.15em] text-outline font-bold">
            System
          </p>
        )}
        {collapsed && <div className="my-4 mx-3 h-px bg-outline-variant/40" />}
        <div className="space-y-0.5">
          {bottomNavItems.map((item) => (
            <NavItem key={item.href} item={item} />
          ))}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 space-y-3 border-t border-outline-variant/20">
        <Link
          href="/cases/new"
          id="nav-create-case"
          className={`
            flex items-center justify-center gap-2 py-3 bg-primary text-on-primary rounded-xl
            font-semibold text-sm shadow-primary hover:opacity-90 active:scale-[0.98]
            transition-all duration-200
            ${collapsed ? "px-3" : "px-4"}
          `}
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          {!collapsed && <span>Create New Case</span>}
        </Link>

        <Link
          href="/help"
          className="flex items-center gap-3 px-4 py-2.5 text-on-surface-variant hover:text-on-surface
            hover:bg-surface-container-low rounded-lg text-sm font-medium transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">contact_support</span>
          {!collapsed && <span>Help Center</span>}
        </Link>
      </div>
    </aside>
  );
}
