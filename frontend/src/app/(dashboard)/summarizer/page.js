"use client";

import { useRef, useState } from "react";
import { Button, FilterChip, PageHeader } from "@/components/ui";
import { apiFetch } from "@/lib/api";

export default function SummarizerPage() {
  const [summaryLength, setSummaryLength] = useState("Medium");
  const [tone, setTone] = useState("Professional");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [executiveSummary, setExecutiveSummary] = useState("");
  const [keyPoints, setKeyPoints] = useState([]);
  const [documentText, setDocumentText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef(null);

  const runSummarizer = async (text) => {
    if (!text?.trim()) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await apiFetch("/ai/summarize", {
        method: "POST",
        body: JSON.stringify({ text, summaryLength, tone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Summarization failed");
        return;
      }
      setExecutiveSummary(data.executiveSummary || "");
      setKeyPoints(data.keyPoints || []);
    } catch (e) {
      console.error(e);
      setError("Could not reach summarizer service. Ensure Express (:5000) and Python (:8000) are running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setError("");
    setExecutiveSummary("");
    setKeyPoints([]);
    setFileName(file.name);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch("/ai/chats/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "PDF extraction failed");
        return;
      }
      setDocumentText(data.text || "");
      await runSummarizer(data.text || "");
    } catch (e) {
      console.error(e);
      setError("Upload failed. Please try again.");
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasteText = () => {
    const text = prompt("Paste the legal document text to summarize:");
    if (text?.trim()) {
      setFileName("");
      setDocumentText(text);
      runSummarizer(text);
    }
  };

  const downloadSummary = () => {
    if (!executiveSummary && !keyPoints.length) return;
    const body = [
      "EXECUTIVE SUMMARY",
      executiveSummary,
      "",
      "KEY PROVISIONS",
      ...keyPoints.map((p, i) => `${i + 1}. ${p}`),
    ].join("\n");
    const blob = new Blob([body], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "summary.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 lg:p-8 w-full min-w-0 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <PageHeader
        title="Document Summarizer"
        subtitle="Upload a PDF or paste text to generate an AI-powered legal summary."
        breadcrumb={["Dashboard", "Summarizer"]}
      />

      {/* Upload zone */}
      <div className="w-full bg-surface-container-lowest border-2 border-dashed border-outline-variant/50 rounded-2xl hover:border-primary/40 transition-colors">
        <div className="w-full px-6 py-10 sm:py-12">
          <div className="mx-auto w-full max-w-2xl text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />

            <div className="w-16 h-16 bg-primary-fixed/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-[32px] text-primary">upload_file</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-on-surface">Upload legal document</h2>

            <p
              className="mt-3 text-sm sm:text-base text-on-surface-variant leading-relaxed"
              style={{ width: "100%", wordBreak: "normal" }}
            >
              Upload a PDF to extract and summarize it with AI. You can also paste plain text directly.
              Maximum file size 50MB.
            </p>

            {fileName && (
              <p className="mt-3 text-sm font-medium text-primary">
                Selected: {fileName}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Button
                variant="primary"
                icon={isLoading ? "hourglass_empty" : "upload_file"}
                disabled={isLoading}
                onClick={() => fileInputRef.current?.click()}
              >
                {isLoading ? "Processing..." : "Upload PDF"}
              </Button>
              <Button variant="secondary" icon="content_paste" disabled={isLoading} onClick={handlePasteText}>
                Paste text
              </Button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="w-full p-4 rounded-xl bg-error/10 border border-error/20 text-error text-sm text-center">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 w-full min-w-0">
        {/* Original document */}
        <section className="w-full min-w-0 bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card overflow-hidden flex flex-col min-h-[420px]">
          <div className="px-6 py-4 border-b border-outline-variant/15 shrink-0 w-full">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant shrink-0">description</span>
              <span className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">
                Original document
              </span>
              {documentText && (
                <span className="ml-auto text-xs text-on-surface-variant">
                  {documentText.length.toLocaleString()} characters
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 min-h-0 w-full min-w-0">
            {documentText ? (
              <div
                className="w-full min-w-0 rounded-lg bg-surface-container-low/50 border border-outline-variant/20 p-5 sm:p-6"
                style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
              >
                <div
                  className="text-sm text-on-surface leading-7"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    overflowWrap: "break-word",
                    wordWrap: "break-word",
                  }}
                >
                  {documentText.slice(0, 12000)}
                  {documentText.length > 12000 ? "\n\n…(truncated for display)" : ""}
                </div>
              </div>
            ) : (
              <div className="min-h-[280px] flex flex-col items-center justify-center w-full">
                <div className="text-center px-6" style={{ width: "100%", maxWidth: "24rem" }}>
                  <span className="material-symbols-outlined text-[48px] text-outline mb-3 block">article</span>
                  <p
                    className="text-sm text-on-surface-variant leading-relaxed"
                    style={{ width: "100%", wordBreak: "normal" }}
                  >
                    Your extracted document text will appear here after you upload a PDF or paste content.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Summary panel */}
        <div className="w-full min-w-0 space-y-6">
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6 w-full">
            <div className="space-y-5">
              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-3">
                  Summary length
                </span>
                <div className="flex flex-wrap gap-2">
                  {["Short", "Medium", "Detailed"].map((len) => (
                    <FilterChip
                      key={len}
                      label={len}
                      active={summaryLength === len}
                      onClick={() => setSummaryLength(len)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider block mb-3">
                  Tone
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${tone === "Simple" ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
                    Simple
                  </span>
                  <button
                    type="button"
                    onClick={() => setTone(tone === "Professional" ? "Simple" : "Professional")}
                    className={`w-11 h-6 rounded-full transition-colors shrink-0 ${
                      tone === "Professional" ? "bg-primary" : "bg-outline-variant"
                    } relative`}
                    aria-label="Toggle tone"
                  >
                    <span
                      className={`absolute top-1 block w-4 h-4 rounded-full bg-white shadow transition-all ${
                        tone === "Professional" ? "left-6" : "left-1"
                      }`}
                    />
                  </button>
                  <span className={`text-sm ${tone === "Professional" ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
                    Professional
                  </span>
                </div>
              </div>

              <Button
                variant="primary"
                className="w-full"
                icon={isLoading ? "hourglass_empty" : "refresh"}
                disabled={isLoading || !documentText}
                onClick={() => runSummarizer(documentText)}
              >
                {isLoading ? "Generating..." : "Regenerate summary"}
              </Button>
            </div>
          </div>

          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card p-6 w-full">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">auto_awesome</span>
                <span className="text-xs font-bold text-primary uppercase tracking-wider">AI insight summary</span>
              </div>
              <button
                type="button"
                onClick={downloadSummary}
                disabled={!executiveSummary && !keyPoints.length}
                className="text-primary text-xs font-semibold hover:underline flex items-center gap-1 shrink-0 disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                Download
              </button>
            </div>

            <div className="border-l-2 border-primary pl-4 mb-5">
              <h4 className="text-sm font-semibold text-on-surface mb-2">Executive summary</h4>
              <p
                className="text-sm text-on-surface-variant leading-relaxed"
                style={{ width: "100%", wordBreak: "normal" }}
              >
                {executiveSummary || (isLoading ? "Generating summary..." : "Upload a document to generate a summary.")}
              </p>
            </div>

            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">
              Key provisions
            </p>
            <div className="space-y-3">
              {keyPoints.length > 0 ? (
                keyPoints.map((point, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-success text-[18px] mt-0.5 shrink-0">check_circle</span>
                    <p className="text-sm text-on-surface leading-relaxed flex-1 min-w-0">{point}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-on-surface-variant">
                  {isLoading ? "Extracting key points..." : "Key points will appear here after summarization."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
