"use client";

import { useState, useEffect } from "react";
import {
  Scale, Users, Briefcase, FileText, Bell, LogOut, Search,
  ChevronDown, Calendar, CheckSquare, MessageSquare, Plus,
  MoreHorizontal, Play, CheckCircle2, Clock, Inbox, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { isLoggedIn, getUser, logout, type AuthUser } from "../../lib/auth";
import { Loader2 } from "lucide-react";

const TABS = [
  { id: "command", label: "Command Center", icon: Scale },
  { id: "intake", label: "Intake Queue", icon: Inbox, badge: "2" },
  { id: "cases", label: "Case Kanban", icon: Briefcase },
  { id: "billing", label: "Billing & Invoices", icon: FileText },
  { id: "clients", label: "Clients", icon: Users },
  { id: "calendar", label: "Calendar", icon: Calendar },
];

const KANBAN_STAGES = ["INTAKE", "DRAFTING", "NEGOTIATION", "HEARING", "CLOSED"];

export default function AdvocateDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState("command");
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<any>({});
  const [allCases, setAllCases] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [dbCases, setDbCases] = useState<any[]>([]); // Real Prisma cases with UUIDs for billing
  
  // Billing States
  const [invCaseId, setInvCaseId] = useState("");
  const [invDueDate, setInvDueDate] = useState("");
  const [invGstRate, setInvGstRate] = useState(18);
  const [invItems, setInvItems] = useState([{ description: "", quantity: 1, rate_inr: 0 }]);
  const [invLoading, setInvLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/portal/login");
      return;
    }
    
    const currentUser = getUser();
    if (currentUser?.role !== "ADVOCATE") {
      router.replace("/portal"); // Kick clients back to client portal
      return;
    }
    
    setUser(currentUser);

    const safeJson = async (res: Response) => {
      if (!res.ok) return res.headers.get('content-type')?.includes('json') ? res.json().catch(() => ({})) : {};
      try { return await res.json(); } catch { return {}; }
    };
    const safeJsonArr = async (res: Response) => {
      if (!res.ok) return [];
      try { const d = await res.json(); return Array.isArray(d) ? d : []; } catch { return []; }
    };

    const API = process.env.NEXT_PUBLIC_API_URL || "https://lexdesk-platform-production.up.railway.app";
    Promise.all([
      fetch(`${API}/demo-dashboard-stats`).then(safeJson).catch(() => ({})),
      fetch(`${API}/demo-all-cases`).then(safeJsonArr).catch(() => []),
      fetch(`${API}/demo-inquiries`).then(r => safeJson(r)).catch(() => ({ inquiries: [] })),
      fetch(`${API}/api/v1/cases`).then(safeJsonArr).catch(() => []),
    ]).then(([statsData, casesData, inquiriesData, dbCasesData]) => {
      setStats(statsData || {});
      setAllCases(Array.isArray(casesData) ? casesData : []);
      setInquiries(Array.isArray((inquiriesData as any)?.inquiries) ? (inquiriesData as any).inquiries : []);
      setDbCases(Array.isArray(dbCasesData) ? dbCasesData : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push("/portal/login");
  };

  const s = {
    page: { minHeight: "100vh", background: "#050811", fontFamily: "'Inter', sans-serif", color: "#f0f4ff", display: "flex" },
    sidebar: { width: 260, borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column" as const, background: "rgba(255,255,255,0.01)" },
    brand: { padding: "24px 24px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 12 },
    logoIcon: { background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, padding: 6, display: "flex" },
    logoText: { fontWeight: 700, fontSize: 16, letterSpacing: "-0.01em" },
    logoBadge: { background: "rgba(139,92,246,0.15)", color: "#c084fc", fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4, letterSpacing: "0.05em" },
    
    // Sidebar nav
    navList: { padding: "0 12px", flex: 1 },
    navBtn: (active: boolean) => ({
      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderRadius: 10, border: "none", cursor: "pointer", transition: "all 0.2s", marginBottom: 4,
      background: active ? "rgba(139,92,246,0.1)" : "transparent",
      color: active ? "#c084fc" : "rgba(255,255,255,0.45)",
      fontFamily: "inherit", fontSize: 13, fontWeight: active ? 600 : 500,
    }),
    
    // User profile in sidebar
    profileWrap: { padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #8b5cf6, #d946ef)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 },
    
    // Main Panel
    main: { flex: 1, display: "flex", flexDirection: "column" as const, height: "100vh", overflow: "hidden" as const },
    header: { height: 72, borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", background: "rgba(5,8,17,0.8)", backdropFilter: "blur(12px)" },
    searchBar: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", padding: "0 14px", width: 320, height: 40 },
    searchInput: { background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: 13, width: "100%", paddingLeft: 10 },
    
    content: { flex: 1, overflowY: "auto" as const, padding: "32px", position: "relative" as const },
    pageTitle: { fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 },
    pageSub: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 },

    // KPIs
    kpiGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 },
    kpiCard: { background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "20px" },
    
    // Intake Queue
    table: { width: "100%", borderCollapse: "collapse" as const },
    th: { textAlign: "left" as const, padding: "14px 16px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, borderBottom: "1px solid rgba(255,255,255,0.08)" },
    td: { padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, color: "#e2e8f0" },
    tag: (color: string) => ({ fontSize: 10, fontWeight: 700, color: color, background: `${color}15`, padding: "3px 8px", borderRadius: 9999, display: "inline-block" }),
    
    // Kanban Board
    kanbanBoard: { display: "flex", gap: 16, overflowX: "auto" as const, paddingBottom: 16, height: "calc(100vh - 200px)" },
    kanbanCol: { flex: "0 0 320px", display: "flex", flexDirection: "column" as const },
    kanbanHeader: { fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, marginBottom: 12, display: "flex", justifyContent: "space-between" },
    kanbanCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "16px", marginBottom: 12, cursor: "grab" },
  };

  if (loading) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#c084fc" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        .nav-btn:hover { background: rgba(255,255,255,0.04) !important; color: #fff !important; }
        .k-card:hover { border-color: rgba(139,92,246,0.3) !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes adv-fade { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .nav-btn:hover { background: rgba(255,255,255,0.04) !important; color: #fff !important; }
        .k-card:hover { border-color: rgba(139,92,246,0.3) !important; background: rgba(255,255,255,0.05) !important; }
        /* Advocate Mobile Responsive */
        @media (max-width: 850px) {
          .adv-page { flex-direction: column !important; }
          .adv-sidebar { width: 100% !important; border-right: none !important; border-bottom: 1px solid rgba(255,255,255,0.06) !important; flex-direction: row !important; align-items: center !important; padding: 0 !important; }
          .adv-brand { padding: 12px 16px !important; border-bottom: none !important; margin-bottom: 0 !important; flex-shrink: 0; }
          .adv-navlist { display: flex !important; flex-direction: row !important; overflow-x: auto !important; padding: 0 8px !important; flex: 1 !important; gap: 0 !important; }
          .adv-navbtn { width: auto !important; padding: 10px 12px !important; border-radius: 8px !important; white-space: nowrap !important; font-size: 12px !important; flex-shrink: 0 !important; }
          .adv-navbtn span.nav-label { display: none !important; }
          .adv-profile { display: none !important; }
          .adv-header { padding: 0 16px !important; height: 56px !important; }
          .adv-search { display: none !important; }
          .adv-content { padding: 16px !important; }
          .adv-kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .adv-main { height: auto !important; }
          .mobile-logout-adv { display: flex !important; }
        }
        .mobile-logout-adv { display: none; align-items: center; gap: 6px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 8px; padding: 6px 10px; font-size: 12px; font-weight: 600; color: #f87171; cursor: pointer; flex-shrink: 0; }
      `}</style>
      
      <div style={s.page} className="adv-page">
        {/* SIDEBAR */}
        <aside style={s.sidebar} className="adv-sidebar">
          <div style={s.brand} className="adv-brand">
            <div style={s.logoIcon}><Scale size={16} color="#c084fc" /></div>
            <span style={s.logoText}>LexDesk<span style={{ color: "rgba(255,255,255,0.3)" }}>.Law</span></span>
            <span style={s.logoBadge}>PRO</span>
          </div>

          <div style={s.navList} className="adv-navlist">
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "16px 12px 12px" }} className="adv-section-label">Firm Operations</div>
            {TABS.map(t => (
              <button key={t.id} className="nav-btn adv-navbtn" style={s.navBtn(activeTab === t.id)} onClick={() => setActiveTab(t.id)}>
                <t.icon size={16} />
                <span style={{ flex: 1, textAlign: "left" }} className="nav-label">{t.label}</span>
                {t.badge && (
                  <div style={{ background: "#c084fc", color: "#fff", fontSize: 9, padding: "1px 6px", borderRadius: 9999 }}>{t.badge}</div>
                )}
              </button>
            ))}
          </div>

          <div style={s.profileWrap} className="adv-profile">
            <div style={s.avatar}>{user?.avatar_initials}</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Advocate</div>
            </div>
            <button onClick={handleLogout} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", padding: 4 }} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
          {/* Mobile sign out */}
          <button className="mobile-logout-adv" onClick={handleLogout} title="Sign Out">
            <LogOut size={13} /> Sign Out
          </button>
        </aside>

        {/* MAIN AREA */}
        <main style={s.main} className="adv-main">
          <header style={s.header} className="adv-header">
            <div style={s.searchBar} className="adv-search">
              <Search size={14} color="rgba(255,255,255,0.4)" />
              <input type="text" style={s.searchInput} placeholder="Search cases, clients, or documents..." />
              <div style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 6px", borderRadius: 4, color: "rgba(255,255,255,0.5)" }}>⌘K</div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c084fc", fontSize: 12, fontWeight: 600, padding: "8px 14px", borderRadius: 8, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                <Plus size={14} /> New Case
              </button>
              <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.1)" }} />
              <Bell size={18} color="rgba(255,255,255,0.5)" style={{ cursor: "pointer" }} />
            </div>
          </header>

          <div style={s.content} className="adv-content">
            <div key={activeTab} style={{ animation: "adv-fade 0.2s ease" }}>
                
                {/* ── COMMAND CENTER ── */}
                {activeTab === "command" && (
                  <div>
                    <div style={s.pageTitle}>Command Center</div>
                    <div style={s.pageSub}>Monday, April 6, 2026. You have 3 hearings scheduled today.</div>
                    
                    <div style={s.kpiGrid} className="adv-kpi-grid">
                      {[
                        { l: "Total Active Cases", v: stats.active_cases || 0, c: "#c084fc" },
                        { l: "Pending Intakes", v: stats.pending_intakes || 0, c: "#fbbf24" },
                        { l: "Upcoming Hearings (7d)", v: stats.upcoming_hearings || 0, c: "#38bdf8" },
                        { l: "MTD Billed Revenue", v: stats.monthly_revenue || "₹0", c: "#34d399" },
                      ].map(({ l, v, c }) => (
                        <div key={l} style={{ ...s.kpiCard, borderTop: `2px solid ${c}` }}>
                          <div style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{v}</div>
                          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{l}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
                      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 24 }}>
                        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#fff" }}>Recent Activity</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle2 size={16} color="#c084fc"/></div>
                            <div>
                              <div style={{ fontSize: 13, color: "#e2e8f0" }}>Anjali Mehta uploaded <span style={{ color: "#c084fc" }}>Property Sale Agreement.pdf</span></div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>1 hour ago · Case C-2026-001</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(56,189,248,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}><MessageSquare size={16} color="#38bdf8"/></div>
                            <div>
                              <div style={{ fontSize: 13, color: "#e2e8f0" }}>New message from Rakesh Singh</div>
                              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>3 hours ago · Case C-2026-004</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── KANBAN BOARD ── */}
                {activeTab === "cases" && (
                  <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                      <div>
                        <div style={s.pageTitle}>Case Pipeline</div>
                        <div style={s.pageSub}>Drag and drop cases to update their operational stage.</div>
                      </div>
                    </div>
                    
                    <div style={s.kanbanBoard}>
                      {KANBAN_STAGES.map(stage => {
                        const stageCases = allCases.filter(c => c.status === stage);
                        const colors: any = { "INTAKE": "#94a3b8", "DRAFTING": "#fbbf24", "NEGOTIATION": "#38bdf8", "HEARING": "#c084fc", "CLOSED": "#34d399" };
                        return (
                          <div key={stage} style={s.kanbanCol}>
                            <div style={s.kanbanHeader}>
                              <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: colors[stage] }} />
                                {stage}
                              </span>
                              <span>{stageCases.length}</span>
                            </div>
                            <div style={{ flex: 1, background: "rgba(0,0,0,0.2)", borderRadius: 16, padding: "12px", border: "1px dashed rgba(255,255,255,0.05)" }}>
                              {stageCases.map((c, i) => (
                                <div key={c.id} className="k-card" style={{ ...s.kanbanCard, animation: `adv-fade ${0.2 + i * 0.05}s ease` }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{c.id}</span>
                                    <span style={s.tag(colors[stage])}>{c.status}</span>
                                  </div>
                                  <div style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{c.title}</div>
                                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>{c.client}</div>
                                  
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 10 }}>
                                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 4 }}>
                                      <Play size={10} color={colors[stage]} fill={colors[stage]} /> {c.next_action}
                                    </div>
                                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>{c.client.charAt(0)}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── INTAKE QUEUE ── */}
                {activeTab === "intake" && (
                  <div>
                    <div style={s.pageTitle}>Lead & Inquiry Queue</div>
                    <div style={s.pageSub}>Inquiries automatically fetched from the public website forms.</div>
                    
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, overflow: "hidden" }}>
                      <table style={s.table}>
                        <thead>
                          <tr>
                            <th style={s.th}>ID</th>
                            <th style={s.th}>Visitor</th>
                            <th style={s.th}>Matter Type</th>
                            <th style={s.th}>Received</th>
                            <th style={s.th}>Urgency</th>
                            <th style={s.th}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inquiries.map((iq, i) => (
                            <tr key={i}>
                              <td style={s.td}><span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>{iq.id.split("-").pop()}</span></td>
                              <td style={s.td}>
                                <div style={{ fontWeight: 600 }}>{iq.visitor_name}</div>
                                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{iq.visitor_email}</div>
                              </td>
                              <td style={s.td}>{iq.matter_type}</td>
                              <td style={s.td}>{new Date(iq.created_at || iq.received_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                              <td style={s.td}>
                                <span style={s.tag(iq.urgency === "HIGH" ? "#ef4444" : "#f59e0b")}>{iq.urgency}</span>
                              </td>
                              <td style={s.td}>
                                <button style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>Review Lead</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {inquiries.length === 0 && (
                        <div style={{ padding: 48, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
                          No pending inquiries.
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* ── BILLING & INVOICING ── */}
                {activeTab === "billing" && (
                  <div>
                    <div style={s.pageTitle}>Generate Invoice</div>
                    <div style={s.pageSub}>Create and issue structured invoices directly to client portals.</div>
                    
                    <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 32, maxWidth: 800 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 24 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Select Case</label>
                          <select 
                            value={invCaseId} 
                            onChange={e => setInvCaseId(e.target.value)}
                            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13, outline: "none" }}
                          >
                            <option value="">-- Choose active case --</option>
                            {dbCases.filter(c => c.status !== "NEW").map(c => (
                              <option key={c.id} value={c.id}>{c.title} ({c.case_number})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Due Date</label>
                          <input 
                            type="date" 
                            value={invDueDate}
                            onChange={e => setInvDueDate(e.target.value)}
                            style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "9px 14px", borderRadius: 8, fontSize: 13, outline: "none" }}
                            color-scheme="dark"
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: 24 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                          <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Line Items</label>
                          <button 
                            onClick={() => setInvItems([...invItems, { description: "", quantity: 1, rate_inr: 0 }])}
                            style={{ background: "rgba(139,92,246,0.1)", color: "#c084fc", border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                          >
                            <Plus size={12}/> Add Item
                          </button>
                        </div>
                        
                        {invItems.map((item, idx) => (
                          <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                            <input 
                              type="text" 
                              placeholder="Description e.g., Drafting Petition" 
                              value={item.description}
                              onChange={e => { const n = [...invItems]; n[idx].description = e.target.value; setInvItems(n); }}
                              style={{ flex: 1, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}
                            />
                            <input 
                              type="number" 
                              placeholder="Qty" 
                              value={item.quantity}
                              onChange={e => { const n = [...invItems]; n[idx].quantity = Number(e.target.value); setInvItems(n); }}
                              style={{ width: 80, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 13 }}
                            />
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 14, top: 11, color: "rgba(255,255,255,0.4)", fontSize: 13 }}>₹</span>
                              <input 
                                type="number" 
                                placeholder="Rate" 
                                value={item.rate_inr || ""}
                                onChange={e => { const n = [...invItems]; n[idx].rate_inr = Number(e.target.value); setInvItems(n); }}
                                style={{ width: 120, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "10px 14px 10px 28px", borderRadius: 8, fontSize: 13 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: 24, background: "rgba(0,0,0,0.2)", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Subtotal</span>
                          <span style={{ fontSize: 13, color: "#fff" }}>
                            ₹{invItems.reduce((acc, i) => acc + (i.quantity * i.rate_inr), 0).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Tax Segment</span>
                            <select 
                              value={invGstRate} 
                              onChange={e => setInvGstRate(Number(e.target.value))}
                              style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", padding: "4px 8px", borderRadius: 4, fontSize: 12, outline: "none" }}
                            >
                              <option value="0">0% (Nil)</option>
                              <option value="5">5% GST</option>
                              <option value="12">12% GST</option>
                              <option value="18">18% GST (Standard)</option>
                            </select>
                          </div>
                          <span style={{ fontSize: 13, color: "#fff" }}>
                            ₹{Math.round(invItems.reduce((acc, i) => acc + (i.quantity * i.rate_inr), 0) * (invGstRate / 100)).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ borderTop: "1px dashed rgba(255,255,255,0.1)", margin: "16px 0" }}></div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Total (INR)</span>
                          <span style={{ fontSize: 20, fontWeight: 800, color: "#c084fc" }}>
                            ₹{Math.round(invItems.reduce((acc, i) => acc + (i.quantity * i.rate_inr), 0) * (1 + invGstRate / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
                        <button 
                          disabled={invLoading || !invCaseId || !invDueDate}
                          onClick={async () => {
                            setInvLoading(true);
                            try {
                              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3008"}/api/v1/billing/invoices`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ case_id: invCaseId, line_items: invItems, gst_rate_percent: invGstRate, due_date: invDueDate })
                              });
                              if(res.ok) {
                                alert("Invoice successfully drafted and issued to Client Portal!");
                                setInvCaseId(""); setInvItems([{ description: "", quantity: 1, rate_inr: 0 }]);
                              }
                            } finally { setInvLoading(false); }
                          }}
                          style={{ background: "linear-gradient(135deg, #8b5cf6, #d946ef)", color: "#fff", border: "none", padding: "12px 24px", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: (invLoading || !invCaseId || !invDueDate) ? 0.5 : 1 }}
                        >
                          {invLoading ? "Processing..." : "Generate & Issue Invoice"}
                        </button>
                      </div>

                    </div>
                  </div>
                )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
