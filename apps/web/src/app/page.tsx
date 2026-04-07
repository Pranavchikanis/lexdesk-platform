"use client";

import { motion, useInView } from "framer-motion";
import {
  Scale, ShieldCheck, Clock, ArrowRight, User,
  FileText, MessageSquare, CreditCard, Gavel,
  Star, CheckCircle2, Phone, Mail, MapPin, ChevronRight
} from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import InquiryModal from "./components/InquiryModal";

// ── Framer variants ───────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65 } },
};
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };

// ── Data ─────────────────────────────────────────────────────────────────────
const stats = [
  { value: "500+", label: "Cases Won", sub: "Over two decades" },
  { value: "98%", label: "Client Satisfaction", sub: "Verified reviews" },
  { value: "24/7", label: "Portal Access", sub: "Always connected" },
  { value: "15+", label: "Years in Practice", sub: "Trusted expertise" },
];

const features = [
  { icon: ShieldCheck, title: "Bank-Grade Security", desc: "AES-256 encrypted document vault and end-to-end messaging. Your attorney-client privilege is always ironclad.", accent: "#3b82f6" },
  { icon: Clock, title: "Real-Time Case Tracking", desc: "Live hearing dates, case milestones, and invoice updates. No more chasing emails — everything in one dashboard.", accent: "#6366f1" },
  { icon: FileText, title: "Digital Document Vault", desc: "Securely upload, version-control, and share case documents with your advocate at any time, from any device.", accent: "#8b5cf6" },
  { icon: MessageSquare, title: "Encrypted Messaging", desc: "Direct, encrypted communication with your advocate team. Guaranteed responses within 4 business hours.", accent: "#0ea5e9" },
  { icon: CreditCard, title: "Transparent Billing", desc: "Real-time invoices with GST breakdowns, time-tracking logs, and secure Razorpay-powered payments.", accent: "#10b981" },
  { icon: Gavel, title: "Conflict-Free Intake", desc: "Automated conflict-of-interest screening before onboarding, ensuring full Bar Council compliance.", accent: "#f59e0b" },
];

const practiceAreas = [
  "Civil & Commercial Litigation", "Family Law & Matrimonial Disputes",
  "Property & Real Estate Law", "Corporate & Contract Law",
  "Consumer Protection", "Criminal Defense",
  "Labour & Employment Law", "Intellectual Property",
];

const testimonials = [
  { name: "Ritu Sharma", role: "Business Owner", content: "LexDesk transformed how I interact with my legal counsel. The secure portal and real-time updates gave me complete peace of mind during a complicated property dispute.", initials: "RS", color: "#3b82f6" },
  { name: "Arjun Menon", role: "HR Director", content: "Transparent billing and time-tracking eliminated all the bill-shock I used to dread. I see exactly what I'm charged for, in real-time.", initials: "AM", color: "#8b5cf6" },
  { name: "Priya Nair", role: "Startup Founder", content: "Filing a consumer complaint used to feel overwhelming. LexDesk's intake system handled the conflict check automatically and onboarded me within hours.", initials: "PN", color: "#10b981" },
];

// ── Scroll-reveal wrapper ────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.65, delay }}>
      {children}
    </motion.div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const openModal = () => setModalOpen(true);
  const closeModal = () => setModalOpen(false);
  const router = useRouter();
  const goPortal = () => router.push("/portal/login");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = {
    // Page shell
    page: { background: "#0a0f1e", minHeight: "100vh", color: "#f0f4ff", fontFamily: "'Inter', -apple-system, sans-serif", overflowX: "hidden" as const },

    // Nav
    nav: { position: "fixed" as const, top: 0, left: 0, right: 0, zIndex: 100, height: 68, display: "flex", alignItems: "center",
      background: scrolled ? "rgba(10,15,30,0.92)" : "rgba(10,15,30,0.6)",
      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.04)",
      transition: "all 0.3s ease" },
    navInner: { maxWidth: 1200, margin: "0 auto", padding: "0 32px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" },
    logo: { display: "flex", alignItems: "center", gap: 10 },
    logoIcon: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 10, padding: 8, display: "flex", alignItems: "center", justifyContent: "center" },
    logoText: { fontWeight: 700, fontSize: 18, letterSpacing: "-0.02em", color: "#fff" },
    logoAccent: { color: "#60a5fa", fontWeight: 300 },
    navLinks: { display: "flex", gap: 36, listStyle: "none" as const },
    navLink: { fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.55)", cursor: "pointer", transition: "color 0.2s", textDecoration: "none" },
    navActions: { display: "flex", alignItems: "center", gap: 12 },
    btnPortal: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)", background: "none", border: "none", cursor: "pointer", padding: "6px 12px" },
    btnBook: { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", borderRadius: 9999, padding: "10px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.35)", transition: "all 0.2s" },

    // Hero
    hero: { maxWidth: 1200, margin: "0 auto", padding: "120px 32px 80px", display: "flex", alignItems: "center", gap: 64, minHeight: "100vh" },
    heroLeft: { flex: 1, display: "flex", flexDirection: "column" as const, gap: 28 },
    badge: { display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 9999, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.25)", color: "#60a5fa", fontSize: 13, fontWeight: 500, width: "fit-content" },
    pingOuter: { position: "relative" as const, display: "flex", width: 8, height: 8 },
    pingAnim: { position: "absolute" as const, inset: 0, borderRadius: "50%", background: "#60a5fa", opacity: 0.6, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite" },
    pingDot: { position: "relative" as const, width: 8, height: 8, borderRadius: "50%", background: "#60a5fa" },
    h1: { fontSize: 64, fontWeight: 900, lineHeight: 1.06, letterSpacing: "-0.03em", color: "#fff", margin: 0 },
    h1Gradient: { background: "linear-gradient(135deg, #60a5fa 0%, #818cf8 60%, #a78bfa 100%)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent", backgroundClip: "text" as const },
    tagline: { fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.65, maxWidth: 500, margin: 0 },
    ctaRow: { display: "flex", gap: 14, flexWrap: "wrap" as const },
    btnPrimary: { display: "inline-flex", alignItems: "center", gap: 8, background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", borderRadius: 9999, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", boxShadow: "0 8px 28px rgba(59,130,246,0.35)", transition: "all 0.25s" },
    btnGhost: { display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.8)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9999, padding: "14px 28px", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.25s", backdropFilter: "blur(10px)" },
    socialProof: { display: "flex", alignItems: "center", gap: 14 },
    avatarStack: { display: "flex" },
    spText: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
    spBold: { color: "#fff", fontWeight: 600 },
    spGreen: { color: "#34d399", fontWeight: 600 },

    // Hero right card
    heroRight: { flex: 1, maxWidth: 430, position: "relative" as const },
    heroGlow: { position: "absolute" as const, inset: -40, background: "radial-gradient(ellipse, rgba(59,130,246,0.12) 0%, transparent 70%)", borderRadius: "50%", zIndex: 0, pointerEvents: "none" as const },
    portalCard: { position: "relative" as const, zIndex: 1, background: "rgba(255,255,255,0.04)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 28, padding: 28, boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" },
    cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
    cardLabel: { fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: 4 },
    cardTitle: { fontSize: 18, fontWeight: 700, color: "#fff" },
    cardIconBox: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 12, padding: 10, display: "flex" },
    caseItem: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: 14, marginBottom: 10 },
    caseRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
    caseTitle: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 },
    caseDate: { fontSize: 11, color: "rgba(255,255,255,0.35)" },
    tagActive: { fontSize: 10, fontWeight: 700, color: "#34d399", background: "rgba(52,211,153,0.1)", padding: "3px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const },
    tagReview: { fontSize: 10, fontWeight: 700, color: "#fbbf24", background: "rgba(251,191,36,0.1)", padding: "3px 8px", borderRadius: 9999, whiteSpace: "nowrap" as const },
    divider: { height: 1, background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.3), transparent)", margin: "16px 0" },
    quickGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 },
    quickItem: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 8px", textAlign: "center" as const },
    quickLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 6, fontWeight: 500 },
    quickVal: { fontSize: 13, fontWeight: 700, color: "#fff", marginTop: 2 },
    btnAccess: { width: "100%", background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "#fff", border: "none", borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 },

    // Section container
    section: { maxWidth: 1200, margin: "0 auto", padding: "0 32px" },

    // Stats
    statsBar: { borderTop: "1px solid rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)", padding: "48px 0" },
    statsGrid: { maxWidth: 1200, margin: "0 auto", padding: "0 32px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 2 },
    statCard: { textAlign: "center" as const, padding: "28px 20px", background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, transition: "all 0.25s" },
    statVal: { fontSize: 40, fontWeight: 900, background: "linear-gradient(135deg, #60a5fa, #818cf8)", WebkitBackgroundClip: "text" as const, WebkitTextFillColor: "transparent", backgroundClip: "text" as const, marginBottom: 4 },
    statLabel: { fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 4 },
    statSub: { fontSize: 12, color: "rgba(255,255,255,0.35)" },

    // Features
    featuresSection: { padding: "100px 0" },
    sectionTag: { display: "inline-flex", alignItems: "center", padding: "7px 16px", borderRadius: 9999, background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", color: "#60a5fa", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 20 },
    sectionTagGold: { display: "inline-flex", alignItems: "center", padding: "7px 16px", borderRadius: 9999, background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "#fbbf24", fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", marginBottom: 20 },
    sectionTitle: { fontSize: 44, fontWeight: 900, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1, margin: "0 0 16px" },
    sectionSub: { fontSize: 17, color: "rgba(255,255,255,0.45)", lineHeight: 1.65, maxWidth: 560 },
    sectionHead: { textAlign: "center" as const, marginBottom: 60 },
    featuresGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 },
    featureCard: { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: 28, transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)", cursor: "pointer", position: "relative" as const, overflow: "hidden" as const },
    featureIcon: { width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 },
    featureTitle: { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 10 },
    featureDesc: { fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.65 },
    featureMore: { display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14 },

    // Practice areas
    practiceSection: { padding: "100px 0", borderTop: "1px solid rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)" },
    practiceInner: { display: "flex", gap: 80, alignItems: "center" },
    practiceLeft: { flex: "0 0 400px" },
    practiceRight: { flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    practiceItem: { display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s" },
    practiceText: { fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.7)" },

    // Testimonials
    testimonialsSection: { padding: "100px 0" },
    testimonialsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 },
    testimonialCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 22, padding: 28, display: "flex", flexDirection: "column" as const, transition: "all 0.3s" },
    stars: { display: "flex", gap: 4, marginBottom: 18 },
    testimonialText: { fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7, flex: 1, marginBottom: 22, fontStyle: "italic" as const },
    testimonialAuthor: { display: "flex", alignItems: "center", gap: 12 },
    authorAvatar: { width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 },
    authorName: { fontSize: 14, fontWeight: 600, color: "#fff" },
    authorRole: { fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 },

    // CTA
    ctaSection: { padding: "80px 0 100px" },
    ctaBox: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 36, padding: "72px 48px", textAlign: "center" as const, position: "relative" as const, overflow: "hidden" as const, boxShadow: "0 0 80px rgba(59,130,246,0.08), 0 0 160px rgba(59,130,246,0.04)" },
    ctaGlow: { position: "absolute" as const, inset: 0, background: "radial-gradient(ellipse at center, rgba(59,130,246,0.1) 0%, transparent 60%)", pointerEvents: "none" as const },
    ctaTagline: { fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#60a5fa", textTransform: "uppercase" as const, marginBottom: 20 },
    ctaTitle: { fontSize: 48, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 18, lineHeight: 1.1 },
    ctaBody: { fontSize: 17, color: "rgba(255,255,255,0.45)", maxWidth: 480, margin: "0 auto 40px", lineHeight: 1.65 },
    ctaBtns: { display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap" as const },

    // Footer
    footer: { borderTop: "1px solid rgba(255,255,255,0.05)", padding: "60px 0 40px" },
    footerGrid: { maxWidth: 1200, margin: "0 auto", padding: "0 32px 40px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 48 },
    footerBrand: {},
    footerLogoRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
    footerDesc: { fontSize: 13, color: "rgba(255,255,255,0.35)", lineHeight: 1.7, maxWidth: 320, marginBottom: 24 },
    footerContact: { display: "flex", flexDirection: "column" as const, gap: 10 },
    footerContactItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255,255,255,0.35)" },
    footerColTitle: { fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const, marginBottom: 18 },
    footerLinks: { display: "flex", flexDirection: "column" as const, gap: 12 },
    footerLink: { fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.2s", cursor: "pointer" },
    footerDivider: { maxWidth: 1200, margin: "0 auto", padding: "24px 32px 0", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" },
    footerCopy: { fontSize: 12, color: "rgba(255,255,255,0.2)" },
    footerStatus: { display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.25)" },
    statusDot: { width: 7, height: 7, borderRadius: "50%", background: "#34d399" },
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: #0a0f1e; }
        @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        .feature-card:hover { transform: translateY(-6px); border-color: rgba(255,255,255,0.14) !important; box-shadow: 0 20px 48px rgba(0,0,0,0.4); }
        .practice-item:hover { border-color: rgba(59,130,246,0.35) !important; background: rgba(59,130,246,0.06) !important; }
        .practice-item:hover span { color: #fff !important; }
        .footer-link:hover { color: rgba(255,255,255,0.8) !important; }
        .stat-item:hover { border-color: rgba(59,130,246,0.3) !important; background: rgba(59,130,246,0.05) !important; }
        .testimonial-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-4px); }
        .btn-book:hover { box-shadow: 0 12px 36px rgba(59,130,246,0.5) !important; transform: translateY(-1px); }
        .btn-ghost:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(59,130,246,0.4) !important; }
        .btn-access:hover { box-shadow: 0 8px 24px rgba(59,130,246,0.4) !important; }
      `}</style>

      <div style={s.page}>

        {/* ── Ambient blobs ── */}
        <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -200, left: -200, width: 700, height: 700, borderRadius: "50%", background: "radial-gradient(circle, rgba(59,130,246,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "40%", right: -200, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", bottom: 0, left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)" }} />
          {/* Grid */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
        </div>

        {/* ── Navbar ── */}
        <nav style={{ ...s.nav, zIndex: 1000 }}>
          <div style={s.navInner}>
            <div style={s.logo}>
              <div style={s.logoIcon}><Scale size={18} color="#60a5fa" /></div>
              <span style={s.logoText}>LexDesk<span style={s.logoAccent}>.Law</span></span>
            </div>
            <div className="nav-links-desktop" style={{ display: "flex", gap: 36 }}>
              {["Practice Areas", "Our Firm", "Testimonials", "Contact"].map(l => (
                <a key={l} href={`#${l.toLowerCase().replace(" ", "-")}`} style={s.navLink} className="footer-link">{l}</a>
              ))}
            </div>
            <div style={s.navActions}>
              <button style={s.btnPortal} onClick={goPortal}><User size={14} /> Client Portal</button>
              <button style={s.btnBook} className="btn-book" onClick={openModal}>Book Consultation</button>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={s.hero} className="hero-container">

            {/* Left */}
            <motion.div style={s.heroLeft} variants={stagger} initial="hidden" animate="show">
              <motion.div variants={fadeUp}>
                <div style={s.badge}>
                  <span style={s.pingOuter}><span style={s.pingAnim} /><span style={s.pingDot} /></span>
                  Accepting New Clients
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} style={s.h1} className="hero-title">
                Legal Clarity,<br />
                <span style={s.h1Gradient}>Delivered Digitally.</span>
              </motion.h1>

              <motion.p variants={fadeUp} style={s.tagline} className="hero-subtitle">
                A modern approach to legal advocacy. Secure communication, transparent billing, and 24/7 access to your case files — all through your private Client Portal.
              </motion.p>

              <motion.div variants={fadeUp} style={s.ctaRow}>
                <button style={s.btnPrimary} id="hero-submit-inquiry" className="btn-book" onClick={openModal}>
                  Submit Inquiry <ArrowRight size={16} />
                </button>
                <button style={s.btnGhost} id="hero-view-areas" className="btn-ghost">
                  View Practice Areas
                </button>
              </motion.div>

              <motion.div variants={fadeUp} style={s.socialProof}>
                <div style={s.avatarStack}>
                  {[["RS", "#3b82f6"], ["AM", "#8b5cf6"], ["PN", "#10b981"], ["KV", "#f59e0b"]].map(([init, bg], i) => (
                    <div key={i} style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${bg}, ${bg}cc)`, border: "2px solid #0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", marginLeft: i > 0 ? -10 : 0 }}>{init}</div>
                  ))}
                </div>
                <span style={s.spText}>
                  <span style={s.spBold}>500+</span> clients served with a <span style={s.spGreen}>98% satisfaction</span> rate
                </span>
              </motion.div>
            </motion.div>

            {/* Right — Portal card */}
            <motion.div style={s.heroRight} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
              <div style={s.heroGlow} />
              <div style={s.portalCard}>
                <div style={s.cardHeader}>
                  <div>
                    <div style={s.cardLabel}>Client Portal Preview</div>
                    <div style={s.cardTitle}>Active Cases</div>
                  </div>
                  <div style={s.cardIconBox}><Gavel size={18} color="#60a5fa" /></div>
                </div>

                {/* Case 1 */}
                <div style={s.caseItem}>
                  <div style={s.caseRow}>
                    <div><div style={s.caseTitle}>Property Dispute — Pune District Court</div><div style={s.caseDate}>Hearing: Tomorrow, 10:30 AM</div></div>
                    <div style={s.tagActive}>ACTIVE</div>
                  </div>
                </div>
                {/* Case 2 */}
                <div style={s.caseItem}>
                  <div style={s.caseRow}>
                    <div><div style={s.caseTitle}>Consumer Complaint — NCDRC</div><div style={s.caseDate}>Filing deadline: Apr 12, 2026</div></div>
                    <div style={s.tagReview}>REVIEW</div>
                  </div>
                </div>

                <div style={s.divider} />

                <div style={s.quickGrid} className="quick-grid">
                  {[{ icon: FileText, label: "Documents", val: "12 files" }, { icon: MessageSquare, label: "Messages", val: "3 new" }, { icon: CreditCard, label: "Invoices", val: "₹24,500" }].map(({ icon: Icon, label, val }) => (
                    <div key={label} style={s.quickItem}>
                      <Icon size={15} color="#60a5fa" style={{ margin: "0 auto" }} />
                      <div style={s.quickLabel}>{label}</div>
                      <div style={s.quickVal}>{val}</div>
                    </div>
                  ))}
                </div>

                <button style={s.btnAccess} className="btn-access">
                  Access Your Portal <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ ...s.statsBar, position: "relative", zIndex: 1 }}>
          <div style={s.statsGrid} className="stats-grid">
            {stats.map(({ value, label, sub }, i) => (
              <Reveal key={label} delay={i * 0.08}>
                <div style={s.statCard} className="stat-item">
                  <div style={s.statVal}>{value}</div>
                  <div style={s.statLabel}>{label}</div>
                  <div style={s.statSub}>{sub}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <div style={{ ...s.featuresSection, position: "relative", zIndex: 1 }} id="our-firm">
          <div style={s.section}>
            <Reveal>
              <div style={s.sectionHead}>
                <div style={s.sectionTag}>BUILT FOR MODERN LEGAL PRACTICE</div>
                <h2 style={s.sectionTitle}>Everything you need,<br /><span style={s.h1Gradient}>nothing you don't.</span></h2>
                <p style={{ ...s.sectionSub, margin: "0 auto" }}>LexDesk combines enterprise-grade security with an intuitive experience, giving both advocates and clients full transparency at every stage.</p>
              </div>
            </Reveal>
            <div style={s.featuresGrid}>
              {features.map(({ icon: Icon, title, desc, accent }, i) => (
                <Reveal key={title} delay={i * 0.07}>
                  <div style={s.featureCard} className="feature-card">
                    <div style={{ ...s.featureIcon, background: `${accent}18`, border: `1px solid ${accent}30` }}>
                      <Icon size={22} color={accent} />
                    </div>
                    <div style={s.featureTitle}>{title}</div>
                    <div style={s.featureDesc}>{desc}</div>
                    <div style={s.featureMore}>Learn more <ChevronRight size={12} /></div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ── Practice Areas ── */}
        <div style={{ ...s.practiceSection, position: "relative", zIndex: 1 }} id="practice-areas">
          <div style={s.section}>
            <div style={s.practiceInner} className="practice-container">
              <Reveal>
                <div style={s.practiceLeft}>
                  <div style={s.sectionTag}>AREAS OF EXPERTISE</div>
                  <h2 style={s.sectionTitle}>Comprehensive<br /><span style={s.h1Gradient}>Legal Coverage.</span></h2>
                  <p style={{ ...s.sectionSub, marginBottom: 32 }}>From complex corporate litigation to sensitive family matters, our chambers brings decades of courtroom expertise across all branches of Indian law.</p>
                  <button style={s.btnPrimary} className="btn-book" onClick={openModal}>Submit an Inquiry <ArrowRight size={16} /></button>
                </div>
              </Reveal>
              <div style={s.practiceRight}>
                {practiceAreas.map((area, i) => (
                  <Reveal key={area} delay={i * 0.06}>
                    <div style={s.practiceItem} className="practice-item">
                      <CheckCircle2 size={15} color="#60a5fa" style={{ flexShrink: 0 }} />
                      <span style={s.practiceText}>{area}</span>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Testimonials ── */}
        <div style={{ ...s.testimonialsSection, position: "relative", zIndex: 1 }} id="testimonials">
          <div style={s.section}>
            <Reveal>
              <div style={s.sectionHead}>
                <div style={s.sectionTagGold}>CLIENT TESTIMONIALS</div>
                <h2 style={s.sectionTitle}>Trusted by hundreds,<br /><span style={{ background: "linear-gradient(135deg, #fbbf24, #fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>loved by all.</span></h2>
              </div>
            </Reveal>
            <div style={s.testimonialsGrid} className="testimonials-grid">
              {testimonials.map(({ name, role, content, initials, color }, i) => (
                <Reveal key={name} delay={i * 0.1}>
                  <div style={s.testimonialCard} className="testimonial-card">
                    <div style={s.stars}>{[1,2,3,4,5].map(n => <Star key={n} size={13} fill="#fbbf24" color="#fbbf24" />)}</div>
                    <p style={s.testimonialText}>"{content}"</p>
                    <div style={s.testimonialAuthor}>
                      <div style={{ ...s.authorAvatar, background: `linear-gradient(135deg, ${color}, ${color}99)` }}>{initials}</div>
                      <div><div style={s.authorName}>{name}</div><div style={s.authorRole}>{role}</div></div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ── */}
        <div style={{ ...s.ctaSection, position: "relative", zIndex: 1 }}>
          <div style={s.section}>
            <Reveal>
              <div style={s.ctaBox}>
                <div style={s.ctaGlow} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={s.ctaTagline}>START TODAY</div>
                  <h2 style={s.ctaTitle}>Ready for legal clarity?</h2>
                  <p style={s.ctaBody}>Submit your inquiry today. Our team will review your case, run a conflict check, and reach out within 24 hours.</p>
                  <div style={s.ctaBtns}>
                    <button style={s.btnPrimary} id="cta-book" className="btn-book" onClick={openModal}>Book Free Consultation <ArrowRight size={16} /></button>
                    <button style={s.btnGhost} id="cta-portal" className="btn-ghost" onClick={goPortal}><User size={15} /> Existing Client Login</button>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer style={{ ...s.footer, position: "relative", zIndex: 1 }} id="contact">
          <div style={s.footerGrid} className="footer-grid">
            <div style={s.footerBrand}>
              <div style={s.footerLogoRow}>
                <div style={s.logoIcon}><Scale size={16} color="#60a5fa" /></div>
                <span style={s.logoText}>LexDesk<span style={s.logoAccent}>.Law</span></span>
              </div>
              <p style={s.footerDesc}>A digitally-native legal advocacy platform built for the modern Indian client. DPDPA 2023 compliant. Bar Council registered.</p>
              <div style={s.footerContact}>
                {[{ icon: Phone, text: "+91 98765 43210" }, { icon: Mail, text: "contact@lexdesk.law" }, { icon: MapPin, text: "Pune, Maharashtra — India" }].map(({ icon: Icon, text }) => (
                  <div key={text} style={s.footerContactItem}><Icon size={13} color="#60a5fa" />{text}</div>
                ))}
              </div>
            </div>
            <div>
              <div style={s.footerColTitle}>Platform</div>
              <div style={s.footerLinks}>
                <a style={s.footerLink} className="footer-link" onClick={goPortal} href="#!">Client Portal</a>
                <a style={s.footerLink} className="footer-link" onClick={openModal} href="#!">Book Consultation</a>
                <a style={s.footerLink} className="footer-link" href="#!">Document Vault</a>
                <a style={s.footerLink} className="footer-link" href="#!">Secure Messaging</a>
                <a style={s.footerLink} className="footer-link" href="#!">Invoice Portal</a>
              </div>
            </div>
            <div>
              <div style={s.footerColTitle}>Legal</div>
              <div style={s.footerLinks}>
                {["Privacy Policy", "Terms of Service", "DPDPA Compliance", "Bar Council Disclosure", "Refund Policy"].map(l => <a key={l} href="#!" style={s.footerLink} className="footer-link">{l}</a>)}
              </div>
            </div>
          </div>
          <div style={s.footerDivider}>
            <span style={s.footerCopy}>© 2026 LexDesk Legal Services LLP. All rights reserved.</span>
            <div style={s.footerStatus}><div style={{ ...s.statusDot, animation: "pulse 2s infinite" }} />All systems operational</div>
          </div>
        </footer>

      </div>

      {/* ── Inquiry Modal ── */}
      <InquiryModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
