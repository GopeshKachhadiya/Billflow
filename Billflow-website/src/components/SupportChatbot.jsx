import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Phone, User, Info, CheckCircle2, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://tdjwytrtmgsxbfvlqjtl.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_sg13WITxOmD5EMcPccuBXA_bu41qGJ3";
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/support-ticket"; // Fallback URL, updates dynamically if settings loaded

export function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMode, setChatMode] = useState("ai"); // "ai" or "ticket"
  const [step, setStep] = useState(1); // For ticket mode: 1: Name, 2: Phone, 3: Topic, 4: Message, 5: Submitting, 6: Success
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const [ticketData, setTicketData] = useState({
    name: "",
    phone: "",
    topic: "",
    message: ""
  });

  const [aiMessages, setAiMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to BillFlow Support 🤖. I am your AI assistant. How can I help you today? You can ask me questions about GST, offline billing, or printer configuration. If you need a phone callback, click the 'Request Callback' button."
    }
  ]);

  const [ticketMessages, setTicketMessages] = useState([
    {
      sender: "bot",
      text: "I can help you raise a support ticket and schedule a call back. To get started, please tell me your name."
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiMessages, ticketMessages, isTyping, chatMode, isOpen]);

  const callOpenRouter = async (chatHistory) => {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer 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",
          "HTTP-Referer": "https://billflow.in",
          "X-Title": "BillFlow Website Support Chatbot"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a helpful, professional customer support assistant for BillFlow, a local-first billing and GST management desktop app built for Indian SMBs.
Your goals:
1. Answer customer queries about BillFlow, GST compliance (CGST, SGST, IGST), invoicing, printer setup, Tally/Excel imports, data backups, and reports.
2. BillFlow runs as a local-first desktop application using better-sqlite3 for local database operations and syncs data to Supabase cloud via n8n workflows.
3. Be concise, polite, and format your text cleanly. Use bullet points for steps where appropriate.
4. If the user indicates they want to talk to a human, raise a ticket, schedule a call back, or has a complex technical issue that requires manual intervention, invite them to click the "Request Callback" button at the top/bottom to register their ticket directly in our support system.

Key details about BillFlow:
- Platform: Built on Electron (supports Windows 10/11) and also has an legacy float-based build (using NW.js) for Windows XP compatibility.
- GST Engine: Automated CGST, SGST, and IGST calculations, HSN/SAC code lookups, GSTR-1 structured exports.
- Sync Queue: Runs an offline sync queue to sync local changes to Supabase cloud using n8n workflows once internet is restored.
- Communication: Auto-sends PDF invoices, payment reminders, and reports via Email (SMTP), WhatsApp (WATI), and SMS (MSG91/DLT templates) via n8n.
- SaaS Admin Dashboard: Built with Vite, React, and Tailwind CSS for the SaaS owner to manage licensing, user accounts, and billing.`
            },
            ...chatHistory.map(m => ({
              role: m.sender === "user" ? "user" : "assistant",
              content: m.text
            }))
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to connect to AI server");
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error("OpenRouter LLM error:", error);
      return "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment, or click 'Request Callback' to speak directly with our support team.";
    }
  };

  const handleSend = async (textToSend = null) => {
    const val = textToSend || inputVal.trim();
    if (!val) return;

    setInputVal("");

    if (chatMode === "ai") {
      const updatedMessages = [...aiMessages, { sender: "user", text: val }];
      setAiMessages(updatedMessages);
      setIsTyping(true);

      const reply = await callOpenRouter(updatedMessages);
      
      setAiMessages(prev => [...prev, { sender: "bot", text: reply }]);
      setIsTyping(false);
    } else {
      // Ticket flow
      setTicketMessages(prev => [...prev, { sender: "user", text: val }]);

      if (step === 1) {
        setTicketData(prev => ({ ...prev, name: val }));
        setTicketMessages(prev => [...prev, { 
          sender: "bot", 
          text: `Nice to meet you, ${val}! Please enter your WhatsApp number so our customer care team can call you back.` 
        }]);
        setStep(2);
      } else if (step === 2) {
        const phoneRegex = /^[+]?[0-9\s-]{10,14}$/;
        if (!phoneRegex.test(val)) {
          setTicketMessages(prev => [...prev, { 
            sender: "bot", 
            text: "Oops! That phone number looks invalid. Please enter a valid 10-digit mobile number." 
          }]);
          return;
        }
        setTicketData(prev => ({ ...prev, phone: val }));
        setTicketMessages(prev => [...prev, { 
          sender: "bot", 
          text: "Got it. Please select the topic of your technical query or click one below:" 
        }]);
        setStep(3);
      } else if (step === 3) {
        setTicketData(prev => ({ ...prev, topic: val }));
        setTicketMessages(prev => [...prev, { 
          sender: "bot", 
          text: `Understood. Please describe the issue you are facing with '${val}' in detail.` 
        }]);
        setStep(4);
      } else if (step === 4) {
        const updatedData = { ...ticketData, message: val };
        setTicketData(updatedData);
        setTicketMessages(prev => [...prev, { 
          sender: "bot", 
          text: "Filing support ticket and scheduling priority callback..." 
        }]);
        setStep(5);
        submitTicket(updatedData);
      }
    }
  };

  const submitTicket = (data) => {
    const payload = Object.assign({}, data, { status: "Open", created_at: new Date().toISOString() });
    fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    })
    .then(res => {
      if (!res.ok) console.error("Supabase insert warning:", res.statusText);
      return fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).catch(function() {});
    })
    .then(res => {
      setTicketMessages(prev => [...prev, { 
        sender: "bot", 
        text: `Success! 🎉 Ticket raised. One of our support engineers will call you back on ${data.phone} within the next 2 hours.` 
      }]);
      setStep(6);
    })
    .catch(err => {
      console.error(err);
      setTicketMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Your ticket was registered. However, we had trouble connecting to the n8n webhook. Our team will review the log and contact you shortly." 
      }]);
      setStep(6);
    });
  };

  const startTicketMode = () => {
    setChatMode("ticket");
    setStep(1);
    setTicketData({ name: "", phone: "", topic: "POS Printer Setup", message: "" });
  };

  const cancelTicketMode = () => {
    setChatMode("ai");
    setStep(1);
  };

  const resetChat = () => {
    setChatMode("ai");
    setStep(1);
    setInputVal("");
    setTicketData({ name: "", phone: "", topic: "POS Printer Setup", message: "" });
    setAiMessages([
      {
        sender: "bot",
        text: "Hello! Welcome to BillFlow Support 🤖. I am your AI assistant. How can I help you today? You can ask me questions about GST, offline billing, or printer configuration. If you need a phone callback, click the 'Request Callback' button."
      }
    ]);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const phoneRegex = /^[+]?[0-9\s-]{10,14}$/;
    if (!phoneRegex.test(ticketData.phone)) {
      alert("Please enter a valid WhatsApp or phone number (10-14 digits).");
      return;
    }

    const finalMessage = ticketData.message.trim() || "No details provided";
    const finalData = { ...ticketData, message: finalMessage };

    setTicketMessages([
      { sender: "user", text: `Name: ${finalData.name}\nPhone: ${finalData.phone}\nTopic: ${finalData.topic}\nMessage: ${finalData.message}` },
      { sender: "bot", text: "Filing support ticket and scheduling priority callback..." }
    ]);
    setStep(5);
    submitTicket(finalData);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 rounded-full bg-fountain text-white flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer relative"
        style={{
          boxShadow: '0 4px 14px 0 rgba(48, 43, 36, 0.3)',
        }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <X key="close" className="w-6 h-6" />
          ) : (
            <MessageSquare key="msg" className="w-6 h-6" />
          )}
        </AnimatePresence>
        
        {/* Unread dot pulse */}
        {!isOpen && chatMode === "ai" && aiMessages.length === 1 && (
          <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stamp-gold opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-stamp-gold"></span>
          </span>
        )}
      </motion.button>

      {/* Chat Window Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="absolute bottom-18 right-0 w-85 h-120 bg-surface border border-border rounded-paper-lg shadow-paper-md flex flex-col overflow-hidden"
            style={{
              boxShadow: '0 10px 25px -5px rgba(24, 19, 14, 0.15), 0 8px 10px -6px rgba(24, 19, 14, 0.1)'
            }}
          >
            {/* Header */}
            <div className="bg-brand-primary p-4 text-white flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg font-serif">B</div>
                <div>
                  <h4 className="font-serif font-bold text-sm leading-tight text-white">BillFlow AI Assistant</h4>
                  <span className="text-[10px] text-white/70 font-mono tracking-wider">AI Support Live</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Banner */}
            {chatMode === "ai" ? (
              <div className="bg-stamp-gold/10 px-4 py-2 border-b border-border flex justify-between items-center text-xs">
                <span className="text-text-secondary font-medium">Need a human?</span>
                <button
                  onClick={startTicketMode}
                  className="px-2.5 py-1 bg-fountain text-white rounded text-[11px] font-semibold hover:bg-fountain-light cursor-pointer transition-all"
                >
                  📞 Request Callback
                </button>
              </div>
            ) : (
              <div className="bg-surface-elevated px-4 py-2 border-b border-border flex justify-between items-center text-xs">
                <span className="text-text-secondary font-medium">Callback Setup</span>
                <button
                  onClick={cancelTicketMode}
                  className="px-2.5 py-1 bg-background border border-border text-text-primary rounded text-[11px] font-semibold hover:border-fountain cursor-pointer transition-all"
                >
                  ⬅️ Back to AI Chat
                </button>
              </div>
            )}

            {/* Content Screen */}
            {chatMode === "ticket" && step < 5 ? (
              <form onSubmit={handleFormSubmit} className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFBF7] text-xs text-text-primary flex flex-col justify-between">
                <div className="space-y-2">
                  <div>
                    <label className="block font-semibold mb-1 text-text-secondary">Your Name</label>
                    <input
                      type="text"
                      required
                      value={ticketData.name}
                      onChange={(e) => setTicketData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. Gopesh Kachhadiya"
                      className="w-full px-3 py-1.5 border border-border rounded bg-background focus:outline-none focus:border-fountain text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-text-secondary">WhatsApp Number</label>
                    <input
                      type="tel"
                      required
                      value={ticketData.phone}
                      onChange={(e) => setTicketData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-3 py-1.5 border border-border rounded bg-background focus:outline-none focus:border-fountain text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-text-secondary">Topic</label>
                    <select
                      value={ticketData.topic}
                      onChange={(e) => setTicketData(prev => ({ ...prev, topic: e.target.value }))}
                      className="w-full px-3 py-1.5 border border-border rounded bg-background focus:outline-none focus:border-fountain text-xs cursor-pointer"
                    >
                      <option value="POS Printer Setup">POS Printer Setup</option>
                      <option value="Excel/Tally Migration">Excel/Tally Migration</option>
                      <option value="GST Lookup Error">GST Lookup Error</option>
                      <option value="SaaS Subscriptions">SaaS Subscriptions</option>
                      <option value="Other Support Request">Other Support Request</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-text-secondary">Complaint Details (Optional)</label>
                    <textarea
                      rows={2.5}
                      value={ticketData.message}
                      onChange={(e) => setTicketData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="Describe your technical issue or complaint..."
                      className="w-full px-3 py-1.5 border border-border rounded bg-background focus:outline-none focus:border-fountain text-xs resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-fountain hover:bg-fountain-light text-white rounded font-bold transition-colors cursor-pointer text-center text-xs mt-2"
                >
                  Submit Complaint
                </button>
              </form>
            ) : (
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFBF7] flex flex-col">
                {(chatMode === "ai" ? aiMessages : ticketMessages).map((m, idx) => (
                  <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-paper px-3 py-2 text-xs sm:text-[13px] leading-relaxed shadow-sm whitespace-pre-line ${
                        m.sender === "user"
                          ? "bg-fountain text-white rounded-tr-none"
                          : "bg-surface-elevated text-text-primary border border-border rounded-tl-none"
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-surface-elevated text-text-primary border border-border rounded-paper rounded-tl-none px-3 py-2 text-xs sm:text-[13px] flex items-center gap-1">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-fountain" />
                      <span className="text-text-muted">AI is thinking...</span>
                    </div>
                  </div>
                )}

                {/* Submitting indicator */}
                {chatMode === "ticket" && step === 5 && (
                  <div className="flex justify-start items-center gap-2 text-xs text-text-muted mt-2 pl-2">
                    <Loader2 className="w-4 h-4 animate-spin text-fountain" />
                    <span>Connecting to customer care desk...</span>
                  </div>
                )}

                {/* Success screen reset button */}
                {chatMode === "ticket" && step === 6 && (
                  <div className="text-center pt-2">
                    <button 
                      onClick={resetChat}
                      className="px-4 py-1.5 bg-background border border-border text-xs font-semibold rounded text-text-primary hover:border-fountain cursor-pointer"
                    >
                      Back to AI Chat
                    </button>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Footer Input Bar */}
            {chatMode === "ai" && !isTyping && (
              <div className="p-3 bg-surface border-t border-border flex gap-2 items-center">
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder="Ask me a question..."
                  className="flex-1 px-3 py-2 border border-border rounded text-xs sm:text-[13px] bg-background focus:outline-none focus:border-fountain text-text-primary"
                />
                <button
                  onClick={() => handleSend()}
                  className="w-8 h-8 rounded bg-fountain text-white flex items-center justify-center hover:bg-fountain-light cursor-pointer flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
