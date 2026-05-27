"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/lib/api";

const promptTemplates = [
  { title: "Khula procedure", description: "What is the legal procedure for Khula in Pakistan?", icon: "family_restroom" },
  { title: "Child custody", description: "What factors do courts consider for child custody under Pakistani family law?", icon: "child_care" },
  { title: "Maintenance (Nafqa)", description: "What are a wife's rights to maintenance during separation?", icon: "payments" },
];

export default function AIAssistantPage() {
  const [inputValue, setInputValue] = useState("");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setUserInfo(info);
    fetchChats();
  }, []);

  const fetchChats = async (token) => {
    try {
      const res = await apiFetch("/ai/chats?ragType=family_law");
      const data = await res.json();
      if (res.ok) {
        setChats(data);
      }
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  const loadChat = async (id) => {
    setCurrentChatId(id);
    setIsLoading(true);
    try {
      const res = await apiFetch(`/ai/chats/${id}`);
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load chat", err);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setCurrentChatId("new");
    setMessages([]);
    setError("");
  };

  const handleDeleteChat = async (chatId, e) => {
    e?.stopPropagation();
    if (!confirm("Delete this conversation? This cannot be undone.")) return;

    try {
      const res = await apiFetch(`/ai/chats/${chatId}`, { method: "DELETE" });
      if (res.ok) {
        setChats((prev) => prev.filter((c) => c._id !== chatId));
        if (currentChatId === chatId) startNewChat();
      } else {
        const data = await res.json();
        setError(data.message || "Failed to delete chat");
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
      setError("Could not delete chat");
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

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
      } else {
        setMessages((prev) => prev.slice(0, -1));
        setError(data.message || `Request failed (${res.status}). Log in again if you see 401.`);
      }
    } catch (err) {
      console.error("Error sending message", err);
      setMessages((prev) => prev.slice(0, -1));
      setError("Could not reach the server. Ensure Express (port 5000) and Python (port 8000) are running.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiFetch("/ai/chats/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        setInputValue(`Please analyze the following extracted text from ${data.filename}:\n\n${data.text}`);
      } else {
        alert("Extraction failed: " + data.message);
      }
    } catch (err) {
      console.error("File upload error", err);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] animate-fade-in">
      {/* Left Panel */}
      <div className="w-80 border-r border-outline-variant/20 bg-surface-container-lowest p-6 hidden lg:flex flex-col overflow-y-auto">
        <button 
          onClick={startNewChat}
          className="w-full mb-6 flex items-center justify-center gap-2 bg-primary text-on-primary py-2.5 rounded-xl font-semibold shadow-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Conversation
        </button>

        {/* AI Assistant */}
        <div className="rounded-xl border border-primary/20 bg-primary-fixed/20 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px] text-primary">family_restroom</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">AI Assistant</p>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Pakistani family law — statutes & case law with cited answers
              </p>
            </div>
          </div>
        </div>

        {/* Prompt Templates */}
        <div className="mt-8">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Prompt Templates</p>
          <div className="space-y-2">
            {promptTemplates.map((t, i) => (
              <button
                key={i}
                onClick={() => setInputValue(t.description)}
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
            {chats.map((chat) => (
              <div
                key={chat._id}
                className={`group flex items-center gap-1 rounded-lg ${
                  currentChatId === chat._id
                    ? "bg-surface-container-high"
                    : "hover:bg-surface-container-low"
                }`}
              >
                <button
                  type="button"
                  onClick={() => loadChat(chat._id)}
                  className={`flex-1 min-w-0 text-left flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                    currentChatId === chat._id
                      ? "text-on-surface font-semibold"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-outline shrink-0">chat_bubble_outline</span>
                  <span className="truncate">{chat.title}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => handleDeleteChat(chat._id, e)}
                  className="shrink-0 p-2 mr-1 rounded-lg text-outline opacity-0 group-hover:opacity-100 hover:text-error hover:bg-error/10 transition-all"
                  title="Delete conversation"
                  aria-label="Delete conversation"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <span className="material-symbols-outlined text-[48px] text-primary mb-4">family_restroom</span>
              <h2 className="text-xl font-bold text-on-surface">Family Law AI Assistant</h2>
              <p className="text-sm text-on-surface-variant w-full max-w-[400px] px-4 mt-2 mx-auto">
                Ask about Khula, custody, maintenance, and other Pakistani family law topics. Answers are grounded in statutes and court decisions with sources.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-primary-container text-on-primary text-xs font-bold' : 'bg-surface-container-high'
                }`}>
                  {msg.role === 'user' ? (userInfo?.name?.charAt(0) || 'U') : <span className="material-symbols-outlined text-[16px]">smart_toy</span>}
                </div>
                
                <div className={msg.role === 'user' ? 'text-right' : 'flex-1'}>
                  <div className={`rounded-2xl p-5 inline-block text-left ${
                    msg.role === 'user' 
                      ? 'bg-primary text-on-primary rounded-tr-md' 
                      : 'bg-surface-container-lowest border border-outline-variant/20 rounded-tl-md'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="text-sm leading-relaxed text-on-surface markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/10 space-y-2">
                        <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">Sources</p>
                        {msg.citations.map((cit, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs bg-surface-container-low p-2 rounded-lg">
                            <span className="material-symbols-outlined text-[14px] text-primary">gavel</span>
                            <span className="text-on-surface">
                              {cit.act_name ? `${cit.act_name} - ${cit.section}` : (cit.source || cit.case_number || 'Legal Document')}
                              {cit.source_url && (
                                <a href={cit.source_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline font-semibold">
                                  [Source]
                                </a>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-outline mt-1.5">{msg.role === 'user' ? 'You' : 'LexAgile AI'}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex gap-3 max-w-3xl">
              <div className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[16px] animate-pulse">smart_toy</span>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl rounded-tl-md p-5 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-outline-variant/20 bg-surface">
          <div className="max-w-3xl mx-auto">
            {error && (
              <div className="mb-3 p-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm">
                {error}
              </div>
            )}
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your legal query, or upload a PDF to analyze..."
                className="w-full resize-none bg-transparent text-on-surface placeholder:text-outline/50 text-sm focus:outline-none min-h-[48px]"
                rows={2}
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept=".pdf"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className={`p-2 rounded-lg transition-colors ${isLoading ? 'opacity-50' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                    title="Upload PDF for Extraction"
                  >
                    <span className="material-symbols-outlined text-[20px]">{isLoading ? 'hourglass_empty' : 'attach_file'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-outline border border-outline-variant/30 rounded-full px-3 py-1">
                    Family Law AI
                  </span>
                  <button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                    className="w-10 h-10 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-primary disabled:opacity-50 disabled:active:scale-100"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
