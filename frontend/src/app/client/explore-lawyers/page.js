"use client";

import { useState, useEffect } from "react";
import { PageHeader, AvatarInitials, Button, StatusBadge } from "@/components/ui";
import { apiFetch } from "@/lib/api";


export default function ExploreLawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const [requestText, setRequestText] = useState("");
  const [caseType, setCaseType] = useState("General Legal Advice");
  const [urgency, setUrgency] = useState("Medium");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await apiFetch("/users/lawyers");
        const data = await res.json();
        if (res.ok) {
          setLawyers(data);
        }
      } catch (error) {
        console.error("Failed to fetch lawyers", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLawyers();
  }, []);

  const handleSendRequest = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await apiFetch("/requests", {
        method: "POST",
        body: JSON.stringify({
          lawyerId: selectedLawyer._id,
          description: requestText,
          urgency: urgency,
          caseType: caseType
        })
      });

      if (res.ok) {
        setSelectedLawyer(null);
        setRequestText("");
        setCaseType("General Legal Advice");
        setUrgency("Medium");
        setSuccessMsg("Request successfully sent! The lawyer will review your case shortly.");
        setTimeout(() => setSuccessMsg(""), 5000);
      } else {
        const errorData = await res.json();
        alert(`Failed to send request: ${errorData.message}`);
      }
    } catch (error) {
      alert("Error sending request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 animate-slide-up">

      <PageHeader 
        title="Find a Family Lawyer" 
        subtitle="Browse top-rated legal professionals in Pakistan and request representation."
      />

      {/* Success Toast */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-success-light border border-success/20 rounded-xl animate-slide-up">
          <span className="material-symbols-outlined text-success text-[22px]">check_circle</span>
          <p className="text-sm font-medium text-on-surface flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg("")} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="text-center py-10 text-on-surface-variant">No lawyers found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <div key={lawyer._id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-all flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <AvatarInitials name={lawyer.name} size="lg" />
                  <StatusBadge 
                    status={"Available"} 
                    variant={'success'} 
                  />
                </div>
                
                <h3 className="text-xl font-bold text-on-surface mb-1">{lawyer.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">
                  <span className="material-symbols-outlined text-[14px] align-middle mr-1">location_on</span>
                  {lawyer.location || "Unspecified"}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {lawyer.expertise?.length > 0 ? lawyer.expertise.map((tag, i) => (
                    <span key={i} className="px-2 py-1 bg-surface-container-low text-on-surface-variant text-[10px] uppercase font-bold tracking-wider rounded-md">
                      {tag}
                    </span>
                  )) : (
                    <span className="text-xs text-outline">General Practice</span>
                  )}
                </div>

                <p className="text-sm text-on-surface-variant leading-relaxed line-clamp-3 mb-6">
                  {lawyer.bio || "No biography provided."}
                </p>
                
                <div className="flex items-center gap-4 text-sm font-semibold text-on-surface">
                  <div className="flex items-center gap-1 text-warning">
                    <span className="material-symbols-outlined text-[18px] filled">star</span>
                    <span>5.0</span>
                    <span className="text-on-surface-variant text-xs font-normal">(0)</span>
                  </div>
                  <div className="w-1 h-1 bg-outline-variant rounded-full"></div>
                  <span className="text-on-surface-variant">{lawyer.experience}</span>
                </div>
              </div>
              
              <div className="p-6 bg-surface-container-low/30 border-t border-outline-variant/20 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider mb-0.5">Starting at</p>
                  <p className="text-sm font-bold text-on-surface">{lawyer.rate}</p>
                </div>
                <Button 
                  variant="primary" 
                  icon="send" 
                  onClick={() => setSelectedLawyer(lawyer)}
                >
                  Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Request Modal overlay */}
      {selectedLawyer && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelectedLawyer(null)}
        >
          <div 
            className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-modal overflow-hidden animate-slide-up"
            style={{ width: '100%', maxWidth: '32rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-outline-variant/20 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-on-surface">Request Representation</h2>
                <p className="text-sm text-on-surface-variant mt-1">Sending to {selectedLawyer.name}</p>
              </div>
              <button 
                onClick={() => setSelectedLawyer(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-low text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSendRequest} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-bold text-on-surface-variant block mb-2">Case Type</label>
                    <select 
                      value={caseType}
                      onChange={(e) => setCaseType(e.target.value)}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="General Legal Advice">General Legal Advice</option>
                      <option value="Family Law / Khula">Family Law / Khula</option>
                      <option value="Civil Litigation">Civil Litigation</option>
                      <option value="Criminal Defense">Criminal Defense</option>
                      <option value="Corporate / Contracts">Corporate / Contracts</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-on-surface-variant block mb-2">Urgency</label>
                    <select 
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value)}
                      className="w-full p-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High (Immediate)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold text-on-surface-variant block mb-2">Briefly describe your case</label>
                  <textarea 
                    required
                    value={requestText}
                    onChange={(e) => setRequestText(e.target.value)}
                    placeholder="E.g., I am seeking a Khula from my husband and need to know the procedure regarding return of Haq Meher..."
                    className="w-full h-32 p-4 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm text-on-surface placeholder:text-outline/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none transition-all"
                  ></textarea>
                </div>
                
                <div className="bg-info-light/30 border border-info/20 p-4 rounded-xl flex items-start gap-3">
                  <span className="material-symbols-outlined text-info mt-0.5">info</span>
                  <p className="text-xs text-on-surface leading-relaxed">
                    By sending this request, you agree to share your contact information with the lawyer. The lawyer will review your case description and decide whether to accept the case.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex gap-3 justify-end">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setSelectedLawyer(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={isSubmitting || !requestText.trim()}
                >
                  {isSubmitting ? "Sending..." : "Send Request"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
