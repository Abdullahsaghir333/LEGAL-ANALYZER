"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";
import { apiFetch } from "@/lib/api";
import DocumentTextModal from "./DocumentTextModal";

export default function CaseDocuments({ caseId, documents = [], onRefresh, allowUpload = true }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [viewDoc, setViewDoc] = useState(null);
  const [viewText, setViewText] = useState("");
  const [loadingText, setLoadingText] = useState(false);

  const openDocumentText = async (doc, prefetchedText) => {
    setViewDoc(doc);
    if (prefetchedText) {
      setViewText(prefetchedText);
      return;
    }

    setLoadingText(true);
    setViewText("");
    try {
      const res = await apiFetch(`/cases/${caseId}/documents/${doc._id}`);
      if (res.ok) {
        const data = await res.json();
        setViewText(data.extracted_text || "");
      } else {
        setViewText("");
      }
    } catch (err) {
      console.error("Failed to load document text", err);
      setViewText("");
    } finally {
      setLoadingText(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);

    try {
      const res = await apiFetch(`/cases/${caseId}/documents`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        await onRefresh?.();
        openDocumentText(data.file || { _id: data.file?._id, file_name: file.name }, data.extracted_text);
      } else {
        alert(data.message || "Failed to upload document");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 shadow-card">
        <div className="px-8 py-6 border-b border-outline-variant/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[22px]">folder_open</span>
            <h3 className="text-xl font-semibold text-on-surface tracking-tight">Attached Documents</h3>
          </div>
          {allowUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleUpload}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={uploading ? "hourglass_empty" : "upload_file"}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload New"}
              </Button>
            </>
          )}
        </div>

        {documents.length > 0 ? (
          <ul className="divide-y divide-outline-variant/10">
            {documents.map((doc) => (
              <li
                key={doc._id}
                className="flex items-center justify-between gap-4 px-8 py-4 hover:bg-surface-container-low/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-error shrink-0">picture_as_pdf</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-on-surface truncate" title={doc.file_name}>
                      {doc.file_name}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openDocumentText(doc)}
                  className="shrink-0 text-sm font-semibold text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  View Text
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-8 py-8 text-center text-sm text-on-surface-variant">
            No documents attached yet.
          </p>
        )}
      </div>

      <DocumentTextModal
        doc={viewDoc}
        text={viewText}
        loading={loadingText}
        onClose={() => {
          setViewDoc(null);
          setViewText("");
        }}
      />
    </>
  );
}
