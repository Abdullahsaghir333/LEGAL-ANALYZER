"use client";

import { useState } from "react";
import { Button, FilterChip } from "@/components/ui";

const tabs = ["Profile", "Billing", "Security", "Notifications"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-[30px] font-semibold text-on-surface tracking-tight">Account Settings</h1>

      {/* Tabs */}
      <div className="border-b border-outline-variant/20">
        <div className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-on-surface-variant border-transparent hover:text-on-surface"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === "Profile" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8 text-center">
            <div className="relative w-28 h-28 mx-auto mb-4">
              <div className="w-28 h-28 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-3xl font-bold">
                JS
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-opacity">
                <span className="material-symbols-outlined text-[16px]">edit</span>
              </button>
            </div>
            <h3 className="text-xl font-semibold text-on-surface">Julian Sterling</h3>
            <p className="text-sm text-on-surface-variant">Senior Legal Counsel</p>
            <div className="mt-4 inline-flex items-center gap-1.5 bg-success-light text-success px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Enterprise Admin
            </div>
            <p className="text-xs text-outline mt-3">Member since Jan 2024</p>
          </div>

          {/* Personal Information */}
          <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-8">
            <h3 className="text-xl font-semibold text-on-surface tracking-tight">Personal Information</h3>
            <p className="text-sm text-on-surface-variant mt-1 mb-6">Update your personal details and how others see you on the platform.</p>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1.5">First Name</label>
                  <input type="text" defaultValue="Julian"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
                <div>
                  <label className="text-sm font-medium text-on-surface-variant block mb-1.5">Last Name</label>
                  <input type="text" defaultValue="Sterling"
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1.5">Email Address</label>
                <input type="email" defaultValue="j.sterling@lexagile.ai"
                  className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all" />
              </div>

              <div>
                <label className="text-sm font-medium text-on-surface-variant block mb-1.5">Role</label>
                <select className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg text-on-surface appearance-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all">
                  <option>Senior Legal Counsel</option>
                  <option>Managing Partner</option>
                  <option>Associate</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary">Cancel</Button>
                <Button variant="primary">Save Changes</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-primary-container rounded-xl p-6 text-on-primary shadow-elevated relative overflow-hidden">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </div>
          <h4 className="text-lg font-semibold">Legal AI Pro Plan</h4>
          <p className="text-on-primary/70 text-sm mt-2">
            You have access to advanced summarization and profitability predictive models.
          </p>
          <Button variant="secondary" size="sm" className="mt-4 !bg-white/15 !text-on-primary !border-white/20 hover:!bg-white/25">
            Manage Subscription
          </Button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="material-symbols-outlined text-[22px] text-on-surface-variant">history</span>
            <div>
              <h4 className="font-semibold text-on-surface">Recent Activity</h4>
              <p className="text-xs text-on-surface-variant">Last login: 2 hours ago from London, UK</p>
            </div>
          </div>
          <button className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 mt-auto">
            View audit logs
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  );
}
