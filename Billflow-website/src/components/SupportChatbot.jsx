import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Phone, User, Info, CheckCircle2, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://brpigwqhbqeqpxynhixf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJycGlnd3FoYnFlcXB4eW5oaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTY0ODksImV4cCI6MjA5NzI3MjQ4OX0.SB-o6Zpk4J5yJz2VhrTv2FvY-OXC6-AKRpnLznEp81I";
const N8N_WEBHOOK_URL = "http://localhost:5678/webhook/support-ticket"; // Fallback URL, updates dynamically if settings loaded

export function SupportChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: Name, 2: Phone, 3: Topic, 4: Message, 5: Submitting, 6: Success
  const [inputVal, setInputVal] = useState("");
  
  const [ticketData, setTicketData] = useState({
    name: "",
    phone: "",
    topic: "",
    message: ""
  });

  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hello! Welcome to BillFlow Support 🤖. How can we help you today? To get started, please tell me your name."
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend = null) => {
    const val = textToSend || inputVal.trim();
    if (!val) return;

    // Add user message
    setMessages(prev => [...prev, { sender: "user", text: val }]);
    setInputVal("");

    if (step === 1) {
      // Save name
      setTicketData(prev => ({ ...prev, name: val }));
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `Nice to meet you, ${val}! Please enter your WhatsApp number so our customer care team can call you back.` 
      }]);
      setStep(2);
    } else if (step === 2) {
      // Validate and save phone number
      const phoneRegex = /^[+]?[0-9\s-]{10,14}$/;
      if (!phoneRegex.test(val)) {
        setMessages(prev => [...prev, { 
          sender: "bot", 
          text: "Oops! That phone number looks invalid. Please enter a valid 10-digit mobile number." 
        }]);
        return;
      }
      setTicketData(prev => ({ ...prev, phone: val }));
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Got it. Please select the topic of your technical query or click one below:" 
      }]);
      setStep(3);
    } else if (step === 3) {
      // Save topic
      setTicketData(prev => ({ ...prev, topic: val }));
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `Understood. Please describe the issue you are facing with '${val}' in detail.` 
      }]);
      setStep(4);
    } else if (step === 4) {
      // Save message and submit
      const updatedData = { ...ticketData, message: val };
      setTicketData(updatedData);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Filing support ticket and scheduling priority callback..." 
      }]);
      setStep(5);
      submitTicket(updatedData);
    }
  };

  const submitTicket = (data) => {
    // 1. Insert into Supabase (via anonymous RLS insert)
    fetch(`${SUPABASE_URL}/rest/v1/support_tickets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify(data)
    })
    .then(res => {
      if (!res.ok) console.error("Supabase insert warning:", res.statusText);
      
      // 2. Call n8n Webhook for WhatsApp / Email alert
      return fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
    })
    .then(res => {
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: `Success! 🎉 Ticket raised. One of our support engineers will call you back on ${data.phone} within the next 2 hours.` 
      }]);
      setStep(6);
    })
    .catch(err => {
      console.error(err);
      setMessages(prev => [...prev, { 
        sender: "bot", 
        text: "Your ticket was registered. However, we had trouble connecting to the n8n webhook. Our team will review the log and contact you shortly." 
      }]);
      setStep(6);
    });
  };

  const selectTopic = (topicName) => {
    handleSend(topicName);
  };

  const resetChat = () => {
    setStep(1);
    setInputVal("");
    setTicketData({ name: "", phone: "", topic: "", message: "" });
    setMessages([
      {
        sender: "bot",
        text: "Hello! Welcome to BillFlow Support 🤖. How can we help you today? To get started, please tell me your name."
      }
    ]);
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
        {!isOpen && step === 1 && (
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
                  <h4 className="font-serif font-bold text-sm leading-tight text-white">BillFlow Priority Support</h4>
                  <span className="text-[10px] text-white/70 font-mono tracking-wider">Avg Response: 2 Mins</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Screen */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FCFBF7]">
              {messages.map((m, idx) => (
                <div key={idx} className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-paper px-3 py-2 text-xs sm:text-[13px] leading-relaxed shadow-sm ${
                      m.sender === "user"
                        ? "bg-fountain text-white rounded-tr-none"
                        : "bg-surface-elevated text-text-primary border border-border rounded-tl-none"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              
              {/* Common topics options */}
              {step === 3 && (
                <div className="flex flex-col gap-1.5 pl-2 mt-2">
                  {["POS Printer Setup", "Excel/Tally Migration", "GST Lookup Error", "SaaS Subscriptions", "Other Support Request"].map((topic) => (
                    <button
                      key={topic}
                      onClick={() => selectTopic(topic)}
                      className="text-left w-full px-3 py-2 bg-white hover:bg-surface-elevated text-xs font-medium text-text-secondary border border-border rounded shadow-sm hover:border-fountain transition-all cursor-pointer"
                    >
                      💡 {topic}
                    </button>
                  ))}
                </div>
              )}

              {/* Submitting indicator */}
              {step === 5 && (
                <div className="flex justify-start items-center gap-2 text-xs text-text-muted mt-2 pl-2">
                  <Loader2 className="w-4 h-4 animate-spin text-fountain" />
                  <span>Connecting to customer care desk...</span>
                </div>
              )}

              {/* Success screen reset button */}
              {step === 6 && (
                <div className="text-center pt-2">
                  <button 
                    onClick={resetChat}
                    className="px-4 py-1.5 bg-background border border-border text-xs font-semibold rounded text-text-primary hover:border-fountain cursor-pointer"
                  >
                    Raise Another Ticket
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Footer Input Bar */}
            {step < 5 && (
              <div className="p-3 bg-surface border-t border-border flex gap-2 items-center">
                <input
                  type={step === 2 ? "tel" : "text"}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                  placeholder={
                    step === 1 ? "Enter your name..." 
                    : step === 2 ? "Enter mobile number..." 
                    : step === 3 ? "Type topic or select..." 
                    : "Describe the issue..."
                  }
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
