"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, Eye, EyeOff, ArrowRight, Shield, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { login, isLoggedIn, getUser } from "../../lib/auth";

const DEMO_ACCOUNTS = [
  { label: "Client Account", email: "client@lexdesk.law", password: "Client@123", role: "CLIENT", color: "#3b82f6" },
  { label: "Advocate Account", email: "advocate@lexdesk.law", password: "Advocate@123", role: "ADVOCATE", color: "#8b5cf6" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn()) {
      router.replace("/portal");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true);
    setError(null);

    const result = await login(email, password);
    setLoading(false);

    if (result.success && result.user) {
      setSuccess(true);
      setTimeout(() => {
        if (result.user?.role === "ADVOCATE") {
          router.push("/portal/advocate");
        } else {
          router.push("/portal");
        }
      }, 1200);
    } else {
      setError(result.error || "Login failed. Please try again.");
    }
  };

  const s = {
    page: {
      minHeight: "100vh", background: "#070b16",
      display: "flex", fontFamily: "'Inter', -apple-system, sans-serif",
      color: "#f0f4ff", position: "relative" as const, overflow: "hidden",
    },
    // Left panel — branding
    left: {
      flex: "0 0 480px", background: "linear-gradient(160deg, #0f1628 0%, #0a0f1e 60%, #060b18 100%)",
      borderRight: "1px solid rgba(255,255,255,0.05)",
      display: "flex", flexDirection: "column" as const,
      padding: "48px 56px", position: "relative" as const, overflow: "hidden",
    },
    // Right panel — form
    right: {
      flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "48px 64px",
    },
    formBox: { width: "100%", maxWidth: 420 },
    logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 56 },
    logoIcon: {
      background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)",
      borderRadius: 12, padding: 10, display: "flex",
    },
    logoText: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em" },
    logoAccent: { color: "#60a5fa" },
    // Left content
    leftHeading: { fontSize: 36, fontWeight: 900, lineHeight: 1.1, letterSpacing: "-0.03em", marginBottom: 20, marginTop: "auto" },
    leftGradient: { background: "linear-gradient(135deg, #60a5fa, #818cf8)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent", backgroundClip: "text" as const },
    leftSub: { fontSize: 15, color: "rgba(255,255,255,0.4)", lineHeight: 1.65, marginBottom: 48 },
    trustItem: { display: "flex", alignItems: "center", gap: 12, marginBottom: 16 },
    trustDot: (color: string) => ({ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }),
    trustText: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
    // Form title
    formTitle: { fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 6 },
    formSub: { fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 32 },
    // Demo quick-fill
    demoRow: { display: "flex", gap: 10, marginBottom: 28 },
    demoBtn: (color: string) => ({
      flex: 1, background: "rgba(255,255,255,0.03)", border: `1px solid ${color}28`,
      borderRadius: 10, padding: "10px 12px", cursor: "pointer", transition: "all 0.2s",
      textAlign: "center" as const,
    }),
    demoBtnLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" as const, marginBottom: 2 },
    demoBtnEmail: { fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 500 },
    // Fields
    fieldGroup: { marginBottom: 18 },
    fieldLabel: { fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: 8, display: "block" },
    fieldWrap: (focused: boolean, hasError: boolean) => ({
      position: "relative" as const,
      background: focused ? "rgba(59,130,246,0.06)" : "rgba(255,255,255,0.04)",
      border: `1px solid ${hasError ? "#ef4444" : focused ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 12, transition: "all 0.2s",
    }),
    fieldInput: {
      width: "100%", background: "transparent", border: "none", outline: "none",
      padding: "14px 16px", fontSize: 14, color: "#fff", fontFamily: "inherit",
    },
    eyeBtn: {
      position: "absolute" as const, right: 14, top: "50%", transform: "translateY(-50%)",
      background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)",
      display: "flex", padding: 4,
    },
    // Error box
    errorBox: {
      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
      borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
      marginBottom: 20, fontSize: 13, color: "#f87171",
    },
    // Submit
    btnSubmit: {
      width: "100%", background: "linear-gradient(135deg, #3b82f6, #6366f1)",
      border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600,
      color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, boxShadow: "0 8px 24px rgba(59,130,246,0.3)", transition: "all 0.25s",
    },
    // Success btn
    btnSuccess: {
      width: "100%", background: "linear-gradient(135deg, #10b981, #059669)",
      border: "none", borderRadius: 12, padding: "14px", fontSize: 15, fontWeight: 600,
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      gap: 8, boxShadow: "0 8px 24px rgba(16,185,129,0.3)",
    },
    // Footer
    formFooter: { textAlign: "center" as const, marginTop: 24, fontSize: 12, color: "rgba(255,255,255,0.25)" },
    formLink: { color: "#60a5fa", cursor: "pointer", textDecoration: "underline" },
  };

  if (checkingAuth) {
    return (
      <div style={{ ...s.page, alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} color="#3b82f6" style={{ animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #070b16; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        .demo-btn:hover { border-color: rgba(99,102,241,0.4) !important; background: rgba(255,255,255,0.06) !important; }
        .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 14px 36px rgba(59,130,246,0.45) !important; }
        .submit-btn:disabled { opacity: 0.65; cursor: not-allowed; }
      `}</style>

      <div style={s.page}>

        {/* ── Ambient blobs ── */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: -100, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>

        {/* ── Left branding panel ── */}
        <motion.div style={{ ...s.left, zIndex: 1 }}
          initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

          {/* Top decorative orb */}
          <div style={{ position: "absolute", top: -80, left: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)" }} />
          <div style={{ position: "absolute", bottom: 80, right: -60, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 60%)" }} />

          {/* Logo */}
          <div style={s.logo}>
            <div style={s.logoIcon}><Scale size={20} color="#60a5fa" /></div>
            <span style={s.logoText}>LexDesk<span style={s.logoAccent}>.Law</span></span>
          </div>

          {/* Floating portal mockup illustration */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <motion.div
              style={{ width: 280, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: 20, boxShadow: "0 24px 64px rgba(0,0,0,0.4)" }}
              animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 12 }}>Your Portal Dashboard</div>
              {/* Case row */}
              {[{ title: "Property Dispute", status: "ACTIVE", color: "#34d399" }, { title: "Consumer Complaint", status: "REVIEW", color: "#fbbf24" }].map((c, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px", marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.title}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: c.color, background: `${c.color}15`, padding: "2px 7px", borderRadius: 9999 }}>{c.status}</div>
                  </div>
                </div>
              ))}
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "12px 0" }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[{ l: "Docs", v: "12" }, { l: "Msgs", v: "3" }, { l: "Bills", v: "₹24K" }].map(({ l, v }) => (
                  <div key={l} style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: 8, padding: "8px 4px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#60a5fa" }}>{v}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Bottom trust content */}
          <div>
            <h2 style={s.leftHeading}>
              Your legal world,<br /><span style={s.leftGradient}>all in one place.</span>
            </h2>
            <p style={s.leftSub}>Track cases, access documents, communicate with your advocate, and manage invoices — securely and in real-time.</p>
            {[
              { color: "#34d399", text: "AES-256 encrypted data vault" },
              { color: "#60a5fa", text: "Real-time case status updates" },
              { color: "#a78bfa", text: "DPDPA 2023 compliant platform" },
            ].map(({ color, text }) => (
              <div key={text} style={s.trustItem}>
                <div style={s.trustDot(color)} />
                <span style={s.trustText}>{text}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Right login panel ── */}
        <div style={{ ...s.right, zIndex: 1 }}>
          <motion.div style={s.formBox}
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}>

            <div style={s.formTitle}>Welcome back</div>
            <div style={s.formSub}>Sign in to your LexDesk client portal</div>

            {/* Demo quick-fill */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.25)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Quick demo access</div>
              <div style={s.demoRow}>
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.email} style={s.demoBtn(acc.color)} className="demo-btn" onClick={() => fillDemo(acc)}>
                    <div style={{ ...s.demoBtnLabel, color: acc.color }}>{acc.label}</div>
                    <div style={s.demoBtnEmail}>{acc.email}</div>
                  </button>
                ))}
              </div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
              <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 12 }}>or sign in manually below</div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={s.fieldGroup}>
                <label style={s.fieldLabel}>Email address</label>
                <div style={s.fieldWrap(focusedField === "email", false)}>
                  <input
                    id="login-email"
                    type="email"
                    style={s.fieldInput}
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div style={s.fieldGroup}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <label style={{ ...s.fieldLabel, marginBottom: 0 }}>Password</label>
                  <span style={{ fontSize: 12, color: "#60a5fa", cursor: "pointer" }}>Forgot password?</span>
                </div>
                <div style={s.fieldWrap(focusedField === "password", false)}>
                  <input
                    id="login-password"
                    type={showPwd ? "text" : "password"}
                    style={{ ...s.fieldInput, paddingRight: 44 }}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); setError(null); }}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    autoComplete="current-password"
                  />
                  <button type="button" style={s.eyeBtn} onClick={() => setShowPwd(v => !v)}>
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div style={s.errorBox} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              {success ? (
                <motion.div style={s.btnSuccess} initial={{ scale: 0.95 }} animate={{ scale: 1 }}>
                  <CheckCircle2 size={18} /> Redirecting to your portal…
                </motion.div>
              ) : (
                <button id="login-submit" type="submit" style={s.btnSubmit} className="submit-btn" disabled={loading}>
                  {loading
                    ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Signing in…</>
                    : <><Lock size={15} /> Sign in to Portal <ArrowRight size={15} /></>}
                </button>
              )}
            </form>

            {/* Footer */}
            <div style={s.formFooter}>
              <div style={{ marginBottom: 8 }}>
                Not yet a client?{" "}
                <span style={s.formLink} onClick={() => router.push("/")}>Submit an inquiry</span> on our homepage.
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Shield size={12} color="#34d399" />
                <span>Protected by TLS 1.3 · DPDPA 2023 compliant</span>
              </div>
            </div>

          </motion.div>
        </div>
      </div>
    </>
  );
}
