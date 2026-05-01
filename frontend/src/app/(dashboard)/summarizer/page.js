"use client";

import { useState } from "react";
import { Button, FilterChip } from "@/components/ui";

export default function SummarizerPage() {
  const [summaryLength, setSummaryLength] = useState("Medium");
  const [tone, setTone] = useState("Professional");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-[30px] font-semibold text-on-surface tracking-tight">Document Summarizer</h1>

      {/* Upload Zone */}
      <div className="bg-surface-container-lowest border-2 border-dashed border-outline-variant/40 rounded-2xl p-12 text-center hover:border-primary/30 transition-colors cursor-pointer">
        <div className="w-14 h-14 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-[28px] text-on-surface-variant">upload_file</span>
        </div>
        <h3 className="text-xl font-semibold text-on-surface">Upload Legal Document</h3>
        <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
          Drag and drop your PDF, DOCX, or text files here to begin the AI-powered summarization process. Supported up to 50MB per document.
        </p>
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="primary" icon="upload_file">Select File</Button>
          <Button variant="secondary">Past Text</Button>
        </div>
      </div>

      {/* Document View + Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Original Document */}
        <div className="lg:col-span-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">description</span>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Original Document</span>
            </div>
            <div className="flex items-center gap-1">
              <button className="p-1.5 hover:bg-surface-container-low rounded transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">zoom_in</span>
              </button>
              <button className="p-1.5 hover:bg-surface-container-low rounded transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">zoom_out</span>
              </button>
              <button className="p-1.5 hover:bg-surface-container-low rounded transition-colors">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">fullscreen</span>
              </button>
            </div>
          </div>
          <div className="p-8 prose prose-sm max-w-none">
            <h2 className="text-xl font-bold text-on-surface">MASTER SERVICE AGREEMENT</h2>
            <p className="text-sm text-on-surface/80 leading-relaxed mt-4">
              This Master Service Agreement (&quot;Agreement&quot;) is entered into as of October 12, 2023, by and between LexAgile Systems Inc., a Delaware corporation (&quot;Provider&quot;), and Global FinTech Solutions LLC (&quot;Client&quot;).
            </p>
            <h3 className="text-base font-bold text-on-surface mt-6">1. Services.</h3>
            <p className="text-sm text-on-surface/80 leading-relaxed">
              Provider shall provide the professional services described in one or more Statements of Work (&quot;SOW&quot;) executed by the parties. Each SOW shall be subject to the terms and conditions of this Agreement. Provider will perform the services in a professional and workmanlike manner in accordance with generally recognized industry standards.
            </p>
            <h3 className="text-base font-bold text-on-surface mt-6">2. Fees and Payment.</h3>
            <p className="text-sm text-on-surface/80 leading-relaxed">
              Client shall pay Provider the fees set forth in the applicable SOW. Unless otherwise stated in an SOW, all invoices are due and payable within thirty (30) days of the invoice date. Late payments shall bear interest at the rate of 1.5% per month or the maximum rate permitted by law, whichever is lower.
            </p>
            <h3 className="text-base font-bold text-on-surface mt-6">3. Term and Termination.</h3>
            <p className="text-sm text-on-surface/80 leading-relaxed">
              This Agreement shall commence on the Effective Date and continue until terminated by either party. Either party may terminate this Agreement for convenience upon sixty (60) days&apos; written notice to the other party.
            </p>
          </div>
        </div>

        {/* Summary Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Controls */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Summary Length</span>
              <div className="flex gap-1">
                {["Short", "Medium", "Detailed"].map((len) => (
                  <FilterChip key={len} label={len} active={summaryLength === len} onClick={() => setSummaryLength(len)} />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Tone</span>
              <div className="flex items-center gap-3">
                <span className="text-sm text-on-surface-variant">Simple</span>
                <button
                  onClick={() => setTone(tone === "Professional" ? "Simple" : "Professional")}
                  className={`w-10 h-6 rounded-full transition-colors ${tone === "Professional" ? "bg-primary" : "bg-outline-variant"} relative`}
                >
                  <span className={`block w-4 h-4 rounded-full bg-white shadow transition-transform ${tone === "Professional" ? "translate-x-5" : "translate-x-1"}`} />
                </button>
                <span className="text-sm font-medium text-on-surface">Professional</span>
              </div>
            </div>
            <Button variant="primary" className="w-full mt-4" icon="refresh">Regenerate Summary</Button>
          </div>

          {/* AI Summary */}
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI Insight Summary</span>
              </div>
              <button className="text-primary text-xs font-semibold hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download Summary
              </button>
            </div>

            <div className="border-l-2 border-primary-fixed pl-4 mb-4">
              <h4 className="text-sm font-semibold text-on-surface mb-1">Executive Summary</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                This MSA outlines the standard engagement framework for LexAgile Systems and Global FinTech Solutions. Key risks involve strict payment terms and limited liability clauses.
              </p>
            </div>

            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Key Provisions</p>
            <div className="space-y-3">
              {[
                { title: "Payment Terms:", desc: "Net-30 day cycle with a 1.5% monthly penalty for late payments." },
                { title: "Termination:", desc: "Flexible termination for convenience requiring 60-day written notice." },
                { title: "Liability:", desc: "Mutual exclusion of indirect and consequential damages." },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-success text-[18px] mt-0.5">check_circle</span>
                  <p className="text-sm text-on-surface">
                    <strong>{item.title}</strong> {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
