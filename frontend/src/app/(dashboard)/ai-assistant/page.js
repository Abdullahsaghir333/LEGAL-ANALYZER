"use client";

import { useState } from "react";

const promptTemplates = [
  { title: "Draft a legal memo", description: "Generate a formal inter-office memorandum based on current case facts.", icon: "edit_note" },
  { title: "Research case law precedents", description: "Find relevant rulings from the Supreme Court on liability issues.", icon: "search" },
  { title: "Clause Comparison", description: "Audit termination clauses across three separate lease agreements.", icon: "compare" },
];

const recentHistory = [
  "NDA Review for Global Tech Inc.",
  "IP Dispute Precedents - NY Co...",
  "Contractual Force Majeure Anal...",
];

const messages = [
  {
    role: "assistant",
    content: "Hello Marcus. I have indexed the latest filings for Case #8821. I'm ready to assist with document drafting, legal research, or risk assessment for the upcoming hearing. How can I help you today?",
    time: "09:12 AM",
  },
  {
    role: "user",
    content: "Can you summarize the primary arguments from the plaintiff's opposition brief filed yesterday? Focus specifically on the breach of fiduciary duty claim.",
    time: "09:14 AM",
  },
  {
    role: "assistant",
    content: null,
    structured: true,
    time: "09:15 AM",
  },
];

export default function AIAssistantPage() {
  const [inputValue, setInputValue] = useState("");
  const [contextMode, setContextMode] = useState("Contracts");

  return (
    <div className="flex h-[calc(100vh-64px)] animate-fade-in">
      {/* Left Panel */}
      <div className="w-80 border-r border-outline-variant/20 bg-surface-container-lowest p-6 hidden lg:flex flex-col overflow-y-auto">
        {/* Context Mode */}
        <div>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Context Mode</p>
          <div className="flex gap-2">
            {["Contracts", "Cases", "Clients"].map((mode) => (
              <button
                key={mode}
                onClick={() => setContextMode(mode)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-medium transition-all ${
                  contextMode === mode
                    ? "bg-primary-fixed/30 text-primary border border-primary/20"
                    : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-transparent"
                }`}
              >
                <span className="material-symbols-outlined text-[22px]">
                  {mode === "Contracts" ? "description" : mode === "Cases" ? "gavel" : "group"}
                </span>
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Templates */}
        <div className="mt-8">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Prompt Templates</p>
          <div className="space-y-2">
            {promptTemplates.map((t, i) => (
              <button
                key={i}
                className="w-full text-left p-3 rounded-xl border border-outline-variant/20 hover:bg-surface-container-low hover:border-primary/20 transition-all"
              >
                <p className="text-sm font-semibold text-on-surface">{t.title}</p>
                <p className="text-xs text-on-surface-variant mt-0.5 line-clamp-2">{t.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Recent History */}
        <div className="mt-8">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Recent History</p>
          <div className="space-y-1">
            {recentHistory.map((item, i) => (
              <button
                key={i}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-lg transition-colors"
              >
                <span className="material-symbols-outlined text-[18px] text-outline">chat_bubble_outline</span>
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="px-6 py-3 border-b border-outline-variant/20 flex items-center gap-4">
          <div className="flex items-center gap-2 bg-primary-fixed/20 text-primary px-3 py-1.5 rounded-full text-xs font-semibold">
            <span className="material-symbols-outlined text-[16px]">link</span>
            Linked to: Active Case #8821
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Assistant message 1 */}
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">smart_toy</span>
            </div>
            <div>
              <div className="bg-surface-container-low border border-outline-variant/20 rounded-2xl rounded-tl-md p-5">
                <p className="text-sm text-on-surface leading-relaxed">
                  Hello Marcus. I have indexed the latest filings for Case #8821. I&apos;m ready to assist with document drafting, legal research, or risk assessment for the upcoming hearing. How can I help you today?
                </p>
              </div>
              <p className="text-xs text-outline mt-1.5">LexAgile AI • 09:12 AM</p>
            </div>
          </div>

          {/* User message */}
          <div className="flex gap-3 max-w-3xl ml-auto flex-row-reverse">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 text-on-primary text-xs font-bold">
              MS
            </div>
            <div className="text-right">
              <div className="bg-primary text-on-primary rounded-2xl rounded-tr-md p-5 inline-block text-left">
                <p className="text-sm leading-relaxed">
                  Can you summarize the primary arguments from the plaintiff&apos;s opposition brief filed yesterday? Focus specifically on the breach of fiduciary duty claim.
                </p>
              </div>
              <p className="text-xs text-outline mt-1.5">You • 09:14 AM</p>
            </div>
          </div>

          {/* Assistant structured response */}
          <div className="flex gap-3 max-w-3xl">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-on-primary text-[16px]">smart_toy</span>
            </div>
            <div className="flex-1">
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl rounded-tl-md p-5">
                <p className="text-sm text-on-surface leading-relaxed mb-4">
                  Based on the opposition brief filed on October 24th, the plaintiff hinges their fiduciary duty claim on three main pillars:
                </p>
                <div className="space-y-3">
                  {[
                    { title: "Conflict of Interest:", desc: "They allege the board approved the merger despite undisclosed personal ties to the acquiring entity's directors." },
                    { title: "Duty of Care:", desc: "Claiming the valuation process was expedited (48 hours) without a formal fairness opinion." },
                    { title: "Information Suppression:", desc: "Allegations that shareholders were provided with misleading EBITDA projections." },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-success text-[20px] mt-0.5">check_circle</span>
                      <p className="text-sm text-on-surface">
                        <strong>{item.title}</strong> {item.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Source document */}
                <div className="mt-5 p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">description</span>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Opposition_Brief_Final.pdf</p>
                      <p className="text-xs text-on-surface-variant">Source Document • 1.2 MB</p>
                    </div>
                  </div>
                  <button className="text-primary text-sm font-semibold hover:underline">View Source</button>
                </div>
              </div>
              <p className="text-xs text-outline mt-1.5">LexAgile AI • 09:15 AM</p>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-outline-variant/20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your legal query or request here..."
                className="w-full resize-none bg-transparent text-on-surface placeholder:text-outline/50 text-sm focus:outline-none min-h-[48px]"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">attach_file</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">mic</span>
                  </button>
                  <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors">
                    <span className="material-symbols-outlined text-[20px]">format_size</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-outline border border-outline-variant/30 rounded-full px-3 py-1">
                    GPT-4 LEGAL
                  </span>
                  <button className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-primary">
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-outline mt-2">
              LexAgile AI can make mistakes. Always verify legal citations and summaries against source documents.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
