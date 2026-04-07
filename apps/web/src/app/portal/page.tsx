"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Scale, Gavel, FileText, MessageSquare, CreditCard,
  Bell, LogOut, Settings, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, User, Home, Calendar, ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUser, logout, type AuthUser } from "../lib/auth";
import { Loader2 } from "lucide-react";

// Real billing data will override these defaults during load
const MOCK_INVOICE = { total: "₹0", pending: "₹0", paid: "₹0", next_due: "None" };

const TABS = [
  { id: "overview", label: "Overview", icon: Home },
  { id: "cases", label: "Cases", icon: Gavel },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare, badge: 2 },
  { id: "billing", label: "Billing", icon: CreditCard },
];

export default function PortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // States for demo data
  const [cases, setCases] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/portal/login");
    } else {
      const currentUser = getUser();
      setUser(currentUser);
      
      // Fetch demo data concurrently
      Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3005"}/demo-cases`).then(r => r.json()).catch(() => []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006"}/demo-documents`).then(r => r.json()).catch(() => []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007"}/demo-messages`).then(r => r.json()).catch(() => []),
        fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008"}/api/v1/billing/invoices?client_id=` + currentUser?.id).then(r => r.json()).catch(() => [])
      ]).then(([casesData, docsData, msgsData, invData]) => {
        setCases(casesData);
        setDocs(docsData);
        setMessages(msgsData);
        setInvoices(Array.isArray(invData) ? invData : []);
        setLoading(false);
      });
    }
  }, [router]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3007"}/demo-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage, sender: user?.full_name })
      });
      const data = await res.json();
      setMessages(prev => [data, ...prev]);
      setNewMessage("");
    } catch {}
    setSendingMessage(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/portal/login");
  };

  const s = {
    page: { minHeight: "100vh", background: "#070b16", fontFamily: "'Inter', -apple-system, sans-serif", color: "#f0f4ff", display: "flex", flexDirection: "column" as const },
    // Navbar
    nav: { background: "rgba(7,11,22,0.96)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 32px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky" as const, top: 0, zIndex: 100, backdropFilter: "blur(20px)" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: 8, display: "flex" },
    logoText: { fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em" },
    logoAccent: { color: "#60a5fa" },
    navRight: { display: "flex", alignItems: "center", gap: 16 },
    avatarBtn: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer", border: "2px solid rgba(59,130,246,0.3)" },
    navIconBtn: { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 8, display: "flex", cursor: "pointer", color: "rgba(255,255,255,0.4)", position: "relative" as const },
    // Layout
    layout: { display: "flex", flex: 1 },
    sidebar: { width: 220, borderRight: "1px solid rgba(255,255,255,0.06)", padding: "24px 16px", display: "flex", flexDirection: "column" as const, background: "rgba(255,255,255,0.01)" },
    // User card in sidebar
    userCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 14px", marginBottom: 24 },
    userAvatar: { width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 10 },
    userName: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 2 },
    userRole: { fontSize: 11, color: "rgba(255,255,255,0.3)", display: "flex", alignItems: "center", gap: 4 },
    // Tabs
    tabBtn: (active: boolean) => ({
      width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s", marginBottom: 4,
      background: active ? "rgba(59,130,246,0.1)" : "transparent",
      color: active ? "#60a5fa" : "rgba(255,255,255,0.4)",
      fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 500,
      borderLeft: active ? "2px solid #3b82f6" : "2px solid transparent",
    }),
    // Main content
    main: { flex: 1, padding: "32px 36px", overflowY: "auto" as const },
    pageTitle: { fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 },
    pageSub: { fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 32 },
    // Summary cards
    summaryGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 16, marginBottom: 32 },
    summaryCard: (accent: string) => ({
      background: `rgba(255,255,255,0.025)`, border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 18, padding: "20px 20px 18px",
      borderTop: `2px solid ${accent}`,
    }),
    summaryVal: { fontSize: 28, fontWeight: 800, marginBottom: 4, letterSpacing: "-0.02em" },
    summaryLabel: { fontSize: 12, color: "rgba(255,255,255,0.35)", fontWeight: 500 },
    // Section
    sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 },
    sectionDot: (color: string) => ({ width: 8, height: 8, borderRadius: "50%", background: color }),
    // Case cards
    caseCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "18px 20px", marginBottom: 12, cursor: "pointer", transition: "all 0.2s" },
    caseHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
    caseTitle: { fontSize: 14, fontWeight: 600, color: "#fff" },
    caseTag: (color: string) => ({ fontSize: 10, fontWeight: 700, color, background: `${color}18`, padding: "3px 9px", borderRadius: 9999, whiteSpace: "nowrap" as const }),
    caseMeta: { fontSize: 12, color: "rgba(255,255,255,0.35)", display: "flex", gap: 16 },
    // Doc rows
    docRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" },
    docIcon: { width: 36, height: 36, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 12, flexShrink: 0 },
    docName: { fontSize: 13, fontWeight: 500, color: "#fff", marginBottom: 2 },
    docMeta: { fontSize: 11, color: "rgba(255,255,255,0.3)" },
    // Message rows
    msgRow: (unread: boolean) => ({ padding: "14px 16px", borderRadius: 14, marginBottom: 10, background: unread ? "rgba(59,130,246,0.05)" : "rgba(255,255,255,0.02)", border: `1px solid ${unread ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)"}`, cursor: "pointer" }),
    msgFrom: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4, display: "flex", justifyContent: "space-between" },
    msgPreview: { fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 },
    // Billing
    billBox: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: 24 },
    billGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 },
    billItem: { textAlign: "center" as const, padding: 16, background: "rgba(255,255,255,0.02)", borderRadius: 12 },
    billVal: { fontSize: 20, fontWeight: 800, marginBottom: 4 },
    billLabel: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
    // Logout
    logoutBtn: { marginTop: "auto", display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 10, border: "none", cursor: "pointer", background: "rgba(239,68,68,0.06)", color: "rgba(239,68,68,0.7)", fontSize: 13, fontFamily: "inherit", width: "100%", transition: "all 0.2s" },
  };

  if (loading) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  const activeCases = cases.filter(c => c.status === "ACTIVE").length;
  const unreadMsgs = messages.filter(m => m.unread).length;
  const pendingAmount = invoices.reduce((acc, inv) => acc + (inv.total_inr - inv.amount_paid_inr), 0);
  const totalBilled = invoices.reduce((acc, inv) => acc + inv.total_inr, 0);
  const amountPaid = invoices.reduce((acc, inv) => acc + inv.amount_paid_inr, 0);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070b16; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .case-card:hover { border-color: rgba(255,255,255,0.14) !important; background: rgba(255,255,255,0.04) !important; }
        .msg-row:hover { border-color: rgba(59,130,246,0.3) !important; }
        .logout-btn:hover { background: rgba(239,68,68,0.12) !important; color: #f87171 !important; }
        .tab-btn:hover { color: rgba(255,255,255,0.7) !important; background: rgba(255,255,255,0.04) !important; }
      `}</style>

      <div style={s.page}>

        {/* Navbar */}
        <nav style={s.nav}>
          <div style={s.logo}>
            <div style={s.logoIcon}><Scale size={16} color="#60a5fa" /></div>
            <span style={s.logoText}>LexDesk<span style={s.logoAccent}>.Law</span></span>
            <div style={{ height: 16, width: 1, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Client Portal</span>
          </div>
          <div style={s.navRight}>
            <button style={s.navIconBtn} title="Notifications">
              <Bell size={16} />
              {unreadMsgs > 0 && <div style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", border: "1.5px solid #070b16" }} />}
            </button>
            <button style={s.navIconBtn} title="Settings"><Settings size={16} /></button>
            <div style={s.avatarBtn}>{user?.avatar_initials ?? "?"}</div>
          </div>
        </nav>

        <div style={s.layout}>

          {/* Sidebar */}
          <aside style={s.sidebar}>
            {/* User card */}
            <div style={s.userCard}>
              <div style={s.userAvatar}>{user?.avatar_initials}</div>
              <div style={s.userName}>{user?.full_name}</div>
              <div style={s.userRole}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
                {user?.role === "CLIENT" ? "Client" : "Advocate"} Account
              </div>
            </div>

            {/* Navigation tabs */}
            {TABS.map(({ id, label, icon: Icon, badge }) => (
              <button key={id} style={s.tabBtn(activeTab === id)} className="tab-btn" onClick={() => setActiveTab(id)}>
                <Icon size={15} />
                <span style={{ flex: 1, textAlign: "left" }}>{label}</span>
                {badge && badge > 0 && (
                  <div style={{ background: "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 9999 }}>{badge}</div>
                )}
              </button>
            ))}

            <button style={s.logoutBtn} className="logout-btn" onClick={handleLogout}>
              <LogOut size={14} /> Sign Out
            </button>
          </aside>

          {/* Main content */}
          <main style={s.main}>
            <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

              {/* ── OVERVIEW ── */}
              {activeTab === "overview" && (
                <>
                  <div style={s.pageTitle}>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.full_name?.split(" ")[0]} 👋</div>
                  <div style={s.pageSub}>Here's a summary of your active cases and recent activity.</div>

                  {/* Summary cards */}
                  <div style={s.summaryGrid}>
                    {[
                      { label: "Active Cases", val: activeCases.toString(), accent: "#3b82f6", icon: Gavel },
                      { label: "Documents", val: docs.length.toString(), accent: "#8b5cf6", icon: FileText },
                      { label: "Unread Messages", val: unreadMsgs.toString(), accent: "#0ea5e9", icon: MessageSquare },
                      { label: "Outstanding", val: `₹${pendingAmount.toLocaleString()}`, accent: "#f59e0b", icon: CreditCard },
                    ].map(({ label, val, accent, icon: Icon }) => (
                      <div key={label} style={s.summaryCard(accent)}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                          <div style={{ ...s.summaryVal, color: accent }}>{val}</div>
                          <Icon size={18} color={accent} style={{ opacity: 0.6 }} />
                        </div>
                        <div style={s.summaryLabel}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Two-col layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24 }}>
                    {/* Cases */}
                    <div>
                      <div style={s.sectionTitle}><div style={s.sectionDot("#3b82f6")} />Active Cases</div>
                      {cases.filter(c => c.status !== "CLOSED").map(c => (
                        <div key={c.id} style={s.caseCard} className="case-card" onClick={() => setActiveTab("cases")}>
                          <div style={s.caseHeader}>
                            <div style={s.caseTitle}>{c.title}</div>
                            <div style={s.caseTag(c.statusColor)}>{c.status}</div>
                          </div>
                          <div style={s.caseMeta}>
                            <span><Clock size={10} style={{ display: "inline", marginRight: 4 }} />{c.next_date}</span>
                            <span><User size={10} style={{ display: "inline", marginRight: 4 }} />{c.advocate}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Messages */}
                    <div>
                      <div style={s.sectionTitle}><div style={s.sectionDot("#0ea5e9")} />Recent Messages</div>
                      {messages.slice(0, 2).map((m, i) => (
                        <div key={i} style={s.msgRow(m.unread)} className="msg-row" onClick={() => setActiveTab("messages")}>
                          <div style={s.msgFrom}>
                            <span>{m.from}</span>
                            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{m.time}</span>
                          </div>
                          <div style={s.msgPreview}>{m.preview.slice(0, 75)}…</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#60a5fa", marginTop: 8, cursor: "pointer" }} onClick={() => setActiveTab("messages")}>
                        View all messages <ArrowUpRight size={13} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── CASES ── */}
              {activeTab === "cases" && (
                <>
                  <div style={s.pageTitle}>Your Cases</div>
                  <div style={s.pageSub}>All matters being handled by LexDesk on your behalf.</div>
                  {cases.map(c => (
                    <div key={c.id} style={s.caseCard} className="case-card">
                      <div style={s.caseHeader}>
                        <div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>{c.id}</div>
                          <div style={s.caseTitle}>{c.title}</div>
                        </div>
                        <div style={s.caseTag(c.statusColor)}>{c.status}</div>
                      </div>
                      <div style={s.caseMeta}>
                        <span><Gavel size={10} style={{ display: "inline", marginRight: 4 }} />{c.court}</span>
                        <span><Calendar size={10} style={{ display: "inline", marginRight: 4 }} />{c.next_date}</span>
                        <span><User size={10} style={{ display: "inline", marginRight: 4 }} />{c.advocate}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* ── DOCUMENTS ── */}
              {activeTab === "documents" && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                    <div>
                      <div style={s.pageTitle}>Document Vault</div>
                      <div style={s.pageSub}>Securely stored case documents. AES-256 encrypted.</div>
                    </div>
                    <label style={{ background: "#3b82f6", color: "#fff", padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      Upload Document
                      <input type="file" style={{ display: "none" }} onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        
                        // Mock upload
                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3006"}/demo-upload`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ file_name: file.name, file_size: (file.size / 1024 / 1024).toFixed(1) + " MB", case_id: "C-2026-001" })
                        });
                        if (res.ok) {
                          const newDoc = await res.json();
                          setDocs(prev => [...prev, newDoc]);
                        }
                      }} />
                    </label>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 18, padding: "4px 20px" }}>
                    {docs.map((d, i) => (
                      <div key={i} style={s.docRow}>
                        <div style={{ display: "flex", alignItems: "center" }}>
                          <div style={s.docIcon}><FileText size={16} color="#60a5fa" /></div>
                          <div>
                            <div style={s.docName}>{d.name}</div>
                            <div style={s.docMeta}>{d.date} · {d.size} · Case {d.case}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ fontSize: 12, color: "#60a5fa", background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, padding: "6px 12px", cursor: "pointer" }}>Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── MESSAGES ── */}
              {activeTab === "messages" && (
                <>
                  <div style={s.pageTitle}>Secure Messages</div>
                  <div style={s.pageSub}>End-to-end encrypted communications with your advocate team.</div>
                  
                  {/* Chat interface simple simulation */}
                  <div style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, display: "flex", flexDirection: "column", height: 500 }}>
                    <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column-reverse" }}>
                      {messages.map((m, i) => (
                        <div key={m.id} style={{ 
                          alignSelf: m.from === user?.full_name ? "flex-end" : "flex-start",
                          background: m.from === user?.full_name ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.05)",
                          border: `1px solid ${m.from === user?.full_name ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.1)"}`,
                          padding: "12px 16px", borderRadius: 12, marginBottom: 12, maxWidth: "80%"
                        }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: m.from === user?.full_name ? "#60a5fa" : "#a78bfa", marginBottom: 4 }}>
                            {m.from} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: 6 }}>{m.time}</span>
                          </div>
                          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                            {m.preview}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Chat Input */}
                    <form onSubmit={handleSendMessage} style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12 }}>
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message to your legal team..."
                        style={{ flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none" }}
                      />
                      <button 
                        type="submit" 
                        disabled={sendingMessage || !newMessage.trim()}
                        style={{ background: "#3b82f6", color: "#fff", border: "none", borderRadius: 10, padding: "0 20px", fontSize: 13, fontWeight: 600, cursor: newMessage.trim() ? "pointer" : "not-allowed", opacity: newMessage.trim() ? 1 : 0.5 }}
                      >
                        {sendingMessage ? "Sending..." : "Send"}
                      </button>
                    </form>
                  </div>
                </>
              )}

              {/* ── BILLING ── */}
              {activeTab === "billing" && (
                <>
                  <div style={s.pageTitle}>Billing & Invoices</div>
                  <div style={s.pageSub}>Transparent, real-time billing with GST breakdowns.</div>
                  <div style={s.billBox}>
                    <div style={s.billGrid}>
                      {[
                        { label: "Total Billed", val: `₹${totalBilled.toLocaleString()}`, color: "#fff" },
                        { label: "Amount Paid", val: `₹${amountPaid.toLocaleString()}`, color: "#34d399" },
                        { label: "Outstanding", val: `₹${pendingAmount.toLocaleString()}`, color: "#fbbf24" },
                      ].map(({ label, val, color }) => (
                        <div key={label} style={s.billItem}>
                          <div style={{ ...s.billVal, color }}>{val}</div>
                          <div style={s.billLabel}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 32 }}>
                    <div style={s.sectionTitle}><div style={s.sectionDot("#f59e0b")} />All Invoices</div>
                    
                    {invoices.length === 0 ? (
                      <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.02)", borderRadius: 16 }}>No invoices issued yet.</div>
                    ) : (
                      <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Invoice No</th>
                              <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Case</th>
                              <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Due Date</th>
                              <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Status</th>
                              <th style={{ textAlign: "right", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Amount (INR)</th>
                              <th style={{ textAlign: "right", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoices.map(inv => (
                              <tr key={inv.id}>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, fontFamily: "monospace", color: "#e2e8f0" }}>
                                  {inv.invoice_number.split("-").pop()}
                                </td>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "#e2e8f0" }}>{inv.case_title}</td>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{new Date(inv.due_date).toLocaleDateString()}</td>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 12 }}>
                                  <span style={{ padding: "4px 8px", borderRadius: "99px", background: inv.status === "PAID" ? "rgba(52,211,153,0.15)" : "rgba(251,191,36,0.15)", color: inv.status === "PAID" ? "#34d399" : "#fbbf24", fontWeight: 700 }}>
                                    {inv.status}
                                  </span>
                                </td>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 14, fontWeight: 700, color: "#fff", textAlign: "right" }}>
                                  ₹{inv.total_inr.toLocaleString()}
                                </td>
                                <td style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "right" }}>
                                  {(inv.status === "DRAFT" || inv.status === "ISSUED") && (
                                    <button 
                                      disabled={payLoading === inv.id}
                                      onClick={async () => {
                                        setPayLoading(inv.id);
                                        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008"}/api/v1/billing/invoices/${inv.id}/pay`, { method: "POST" });
                                        if (res.ok) {
                                          const { invoice } = await res.json();
                                          setInvoices(invoices.map(i => i.id === invoice.id ? invoice : i));
                                        }
                                        setPayLoading(null);
                                      }}
                                      style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#fff", cursor: "pointer", opacity: payLoading === inv.id ? 0.5 : 1 }}
                                    >
                                      {payLoading === inv.id ? "Processing..." : "Pay Now"}
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

            </motion.div>
          </main>
        </div>
      </div>
    </>
  );
}
