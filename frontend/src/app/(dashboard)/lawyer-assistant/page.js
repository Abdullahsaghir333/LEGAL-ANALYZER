"use client";

import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/lib/api";

const promptTemplates = [
  { title: "Draft a legal memo", description: "Generate a formal inter-office memorandum based on current case facts.", icon: "edit_note" },
  { title: "Research case law precedents", description: "Find relevant rulings from the Supreme Court on liability issues.", icon: "search" },
  { title: "Clause Comparison", description: "Audit termination clauses across three separate lease agreements.", icon: "compare" },
];

const contextModes = [
  { id: "General", label: "General", icon: "auto_awesome", description: "Search all uploaded documents" },
  { id: "Cases", label: "Cases", icon: "folder_open", description: "Focus on case files" },
];

const documentTypeByMode = {
  General: "general",
  Cases: "case_file",
};

export default function LawyerAssistantPage() {
  const [inputValue, setInputValue] = useState("");
  const [contextMode, setContextMode] = useState("General");
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState("new");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const info = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setUserInfo(info);
    fetchChats();
  }, []);

  const fetchChats = async (token) => {
    try {
      const res = await apiFetch("/ai/chats?ragType=lawyer");
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
        if (data.contextMode) setContextMode(data.contextMode);
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
    setContextMode("General");
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
        alert("Failed to delete chat");
      }
    } catch (err) {
      console.error("Failed to delete chat", err);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = { role: "user", content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const res = await apiFetch(`/ai/chats/${currentChatId}/message`, {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          contextMode,
          ragType: "lawyer",
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
      console.error("Error sending message", err);
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
    formData.append("documentType", documentTypeByMode[contextMode] || "general");

    try {
      const res = await apiFetch("/ai/chats/lawyer-docs/upload", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      if (res.ok) {
        const sysMessage = {
          role: "assistant",
          content: `Document **${file.name}** was indexed under **${contextMode}** context. You can now ask questions about it.`,
        };
        setMessages(prev => [...prev, sysMessage]);
      } else {
        alert("Upload failed: " + (data.message || "Unknown error"));
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

        {/* Context Mode */}
        <div className="mt-6">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-3">Context Mode</p>
          <div className="space-y-2">
            {contextModes.map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setContextMode(mode.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  contextMode === mode.id
                    ? "border-primary bg-primary-fixed/20"
                    : "border-outline-variant/20 hover:bg-surface-container-low hover:border-primary/20"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`material-symbols-outlined text-[18px] ${
                    contextMode === mode.id ? "text-primary" : "text-outline"
                  }`}>
                    {mode.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-on-surface">{mode.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5">{mode.description}</p>
                  </div>
                </div>
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
              <span className="material-symbols-outlined text-[48px] text-primary mb-4">psychology</span>
              <h2 className="text-xl font-bold text-on-surface">Lawyer AI Assistant</h2>
              <p className="text-sm text-on-surface-variant w-full max-w-[400px] px-4 mt-2 mx-auto">
                I am your private Legal AI. Upload your case files and documents. They will be securely stored and isolated. Ask me questions and I will fetch answers strictly from your uploaded files.
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
                    className={`p-2 rounded-lg transition-colors ${isLoading ? 'opacity-50' : 'text-on-surface-variant hover:bg-surface-container-low text-primary'}`}
                    title="Upload Document to Private Knowledge Base"
                  >
                    <span className="material-symbols-outlined text-[20px]">{isLoading ? 'hourglass_empty' : 'upload_file'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-outline border border-outline-variant/30 rounded-full px-3 py-1">
                    {contextMode} · Private RAG
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
