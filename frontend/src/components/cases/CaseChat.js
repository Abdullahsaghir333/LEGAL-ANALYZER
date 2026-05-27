"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export default function CaseChat({
  caseId,
  caseData,
  onRefresh,
  chatTitle,
  chatSubtitle,
  className = "h-full",
  readOnly = false,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setUserId(info?._id);
  }, []);

  useEffect(() => {
    if (caseData?.messages) {
      setMessages(caseData.messages);
    }
  }, [caseData]);

  const handleSend = async () => {
    if (!newMessage.trim() || !caseId) return;
    setIsSubmitting(true);
    try {
      const res = await apiFetch(`/cases/${caseId}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: newMessage }),
      });
      if (res.ok) {
        setNewMessage("");
        onRefresh?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`${className} bg-[#EFEAE2] rounded-xl shadow-card flex flex-col overflow-hidden border border-outline-variant/20`}
    >
      <div className="bg-surface-container-lowest px-4 py-3 flex items-center justify-between border-b border-outline-variant/20 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-[20px]">forum</span>
          </div>
          <div>
            <h3 className="font-semibold text-on-surface text-sm truncate max-w-[220px]">
              {chatTitle || caseData?.title || "Case Chat"}
            </h3>
            <p className="text-xs text-on-surface-variant">{chatSubtitle || "Secure messaging"}</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length > 0 ? (
          messages.map((msg, idx) => {
            const senderId = msg.sender_id?._id || msg.sender_id;
            const isOwn = senderId?.toString() === userId?.toString();
            return (
              <div key={idx} className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                <div
                  className={`p-2.5 rounded-2xl max-w-[85%] shadow-sm ${
                    isOwn
                      ? "bg-[#d9fdd3] text-[#111b21] rounded-tr-sm"
                      : "bg-white text-[#111b21] rounded-tl-sm"
                  }`}
                >
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  <div className="flex justify-end mt-1">
                    <span className="text-[10px] text-gray-500">
                      {new Date(msg.created_at || msg.createdAt).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <div className="bg-[#FFEECD] text-[#54411C] px-4 py-3 rounded-lg text-xs font-medium shadow-sm text-center max-w-[85%]">
              <span className="material-symbols-outlined text-[16px] mb-1 block">lock</span>
              Start a secure conversation. Only you and your lawyer can read these messages.
            </div>
          </div>
        )}
      </div>

      {readOnly ? (
        <div className="bg-surface-container-low px-4 py-3 text-center text-xs text-on-surface-variant shrink-0 border-t border-outline-variant/20">
          This case is closed. Messaging is disabled.
        </div>
      ) : (
        <div className="bg-[#f0f2f5] p-3 flex items-end gap-2 shrink-0">
          <div className="flex-1 bg-white rounded-xl shadow-sm flex items-end overflow-hidden">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="w-full bg-transparent text-[15px] text-on-surface px-4 py-3 max-h-[120px] min-h-[44px] resize-none focus:outline-none"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={isSubmitting || !newMessage.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shrink-0 ${
              newMessage.trim()
                ? "bg-[#00a884] text-white hover:bg-[#008f6f] shadow-sm"
                : "text-[#54656f] hover:bg-[#d1d7db]"
            }`}
          >
            <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
          </button>
        </div>
      )}
    </div>
  );
}
