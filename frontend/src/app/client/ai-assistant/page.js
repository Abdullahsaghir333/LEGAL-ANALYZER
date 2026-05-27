"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/lib/api";

const clientPrompts = [
  {
    title: "Khula procedure",
    description: "What is the legal procedure for Khula in Pakistan?",
    icon: "family_restroom",
  },
  {
    title: "Child custody rights",
    description: "What factors do courts consider for child custody under Pakistani family law?",
    icon: "child_care",
  },
  {
    title: "Maintenance (Nafqa)",
    description: "What are a wife's rights to maintenance during separation?",
    icon: "payments",
  },
];

export default function ClientAIAssistantPage() {
  const [inputValue, setInputValue] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setUserInfo(info);
    fetchChats();
  }, []);

  const fetchChats = async () => {
    try {
      const res = await apiFetch("/ai/chats?ragType=family_law");
      if (res.ok) setChats(await res.json());
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const startNewChat = () => {
    setCurrentChatId("new");
    setMessages([]);
  };

  const loadChat = async (chatId) => {
    setCurrentChatId(chatId);
    setIsLoading(true);
    try {
      const res = await apiFetch(`/ai/chats/${chatId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChat = async (chatId, e) => {
    e?.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    try {
      const res = await apiFetch(`/ai/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (currentChatId === chatId) startNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await apiFetch(`/ai/chats/${currentChatId}/message`, {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          contextMode: "General",
          ragType: "family_law",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages);
        if (currentChatId === "new") {
          setCurrentChatId(data._id);
          fetchChats();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] animate-fade-in">
      <div className="w-72 border-r border-outline-variant/20 bg-surface-container-lowest p-5 hidden lg:flex flex-col overflow-y-auto">
        <button
          onClick={startNewChat}
          className="w-full mb-5 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-semibold text-sm hover:opacity-90"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Question
        </button>

        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          Suggested Topics
        </p>
        <div className="space-y-2 mb-6">
          {clientPrompts.map((t, i) => (
            <button
              key={i}
              onClick={() => setInputValue(t.description)}
              className="w-full text-left p-3 rounded-xl border border-outline-variant/20 hover:border-primary/30 hover:bg-surface-container-low text-sm transition-all"
            >
              <p className="font-semibold text-on-surface">{t.title}</p>
            </button>
          ))}
        </div>

        <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
          History
        </p>
        <div className="space-y-1 flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div
              key={chat._id}
              className={`group flex items-center gap-1 rounded-lg ${
                currentChatId === chat._id
                  ? "bg-primary-fixed/30"
                  : "hover:bg-surface-container-low"
              }`}
            >
              <button
                type="button"
                onClick={() => loadChat(chat._id)}
                className={`flex-1 min-w-0 text-left px-3 py-2 rounded-lg text-sm truncate ${
                  currentChatId === chat._id
                    ? "text-primary font-semibold"
                    : "text-on-surface-variant"
                }`}
              >
                {chat.title}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteChat(chat._id, e)}
                className="shrink-0 p-1.5 mr-1 rounded-lg text-outline opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
                title="Delete conversation"
                aria-label="Delete conversation"
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-warning-light/40 border-b border-warning/30 px-6 py-3 flex items-start gap-3 shrink-0">
          <span className="material-symbols-outlined text-warning text-[22px] shrink-0">warning</span>
          <p className="text-sm text-on-surface leading-relaxed">
            <strong>Legal information only — not legal advice.</strong> Answers are drawn from Pakistani
            family law statutes and case law. Always consult your assigned lawyer before taking action.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[48px] text-primary mb-4">family_restroom</span>
              <h2 className="text-xl font-bold text-on-surface">Family Law Assistant</h2>
              <p className="text-sm text-on-surface-variant max-w-md mt-2">
                Ask about Khula, custody, maintenance, and other Pakistani family law topics in English or Urdu.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-3xl ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-primary-container text-on-primary text-xs font-bold"
                      : "bg-surface-container-high"
                  }`}
                >
                  {msg.role === "user" ? (
                    userInfo?.name?.charAt(0) || "U"
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">family_restroom</span>
                  )}
                </div>
                <div className={msg.role === "user" ? "text-right" : "flex-1"}>
                  <div
                    className={`rounded-2xl p-5 inline-block text-left ${
                      msg.role === "user"
                        ? "bg-primary text-on-primary rounded-tr-md"
                        : "bg-surface-container-lowest border border-outline-variant/20 rounded-tl-md"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                      </div>
                    )}
                    {msg.citations?.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-outline-variant/10 space-y-2">
                        <p className="text-xs font-bold text-on-surface-variant uppercase">Sources</p>
                        {msg.citations.map((cit, i) => (
                          <div key={i} className="text-xs bg-surface-container-low p-2 rounded-lg">
                            {cit.act_name ? `${cit.act_name} - ${cit.section}` : cit.source || "Legal Document"}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-2 items-center text-on-surface-variant text-sm">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-2">Searching family law database...</span>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/20">
          <div className="max-w-3xl mx-auto bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex gap-3">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask a family law question..."
              className="flex-1 resize-none bg-transparent text-sm focus:outline-none min-h-[44px]"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center disabled:opacity-50 self-end"
            >
              <span className="material-symbols-outlined">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
