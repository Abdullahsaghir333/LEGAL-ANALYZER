"use client";

export default function DocumentTextModal({ doc, text, loading, onClose }) {
  if (!doc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
          <div className="min-w-0">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Extracted Text
            </p>
            <h3 className="text-lg font-semibold text-on-surface truncate">{doc.file_name}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-on-surface-variant text-sm">
              Loading extracted text...
            </div>
          ) : text ? (
            <pre className="text-sm text-on-surface whitespace-pre-wrap leading-relaxed font-sans">
              {text}
            </pre>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-12">
              No extracted text available for this document.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
