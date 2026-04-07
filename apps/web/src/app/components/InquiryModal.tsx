"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  X, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  User, Mail, Phone, FileText, AlertCircle, Scale
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface FormData {
  visitor_name: string;
  visitor_email: string;
  visitor_phone: string;
  matter_type: string;
  description: string;
  urgency: string;
  consent_given: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
}

const MATTER_TYPES = [
  { value: "CIVIL_LITIGATION", label: "Civil & Commercial Litigation" },
  { value: "FAMILY_LAW", label: "Family Law & Matrimonial" },
  { value: "PROPERTY", label: "Property & Real Estate" },
  { value: "CORPORATE", label: "Corporate & Contract Law" },
  { value: "CONSUMER", label: "Consumer Protection" },
  { value: "CRIMINAL", label: "Criminal Defense" },
  { value: "LABOUR", label: "Labour & Employment" },
  { value: "IP", label: "Intellectual Property" },
  { value: "OTHER", label: "Other / Not Sure" },
];

const URGENCY_OPTIONS = [
  { value: "NORMAL", label: "Normal", desc: "No immediate deadline" },
  { value: "HIGH", label: "Urgent", desc: "Response needed within 48 hours" },
  { value: "CRITICAL", label: "Emergency", desc: "Court date or legal deadline imminent" },
];

// ── Styles ─────────────────────────────────────────────────────────────────────
const s = {
  overlay: {
    position: "fixed" as const, inset: 0, zIndex: 9999,
    background: "rgba(5, 8, 20, 0.85)",
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  modal: {
    background: "#0d1223",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 28,
    width: "100%", maxWidth: 560,
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.1)",
    overflow: "hidden",
    maxHeight: "90vh",
    display: "flex", flexDirection: "column" as const,
  },
  header: {
    padding: "28px 32px 0",
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    flexShrink: 0,
  },
  closeBtn: {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 10, padding: 8, cursor: "pointer", color: "rgba(255,255,255,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.2s",
  },
  body: { padding: "24px 32px 32px", overflowY: "auto" as const },
  label: {
    display: "block", fontSize: 12, fontWeight: 600,
    color: "rgba(255,255,255,0.4)", letterSpacing: "0.06em",
    textTransform: "uppercase" as const, marginBottom: 8,
  },
  input: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
    padding: "12px 16px", fontSize: 14, color: "#fff",
    outline: "none", transition: "border-color 0.2s",
    fontFamily: "inherit",
  },
  inputError: { borderColor: "#ef4444" },
  textarea: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
    padding: "12px 16px", fontSize: 14, color: "#fff",
    outline: "none", resize: "vertical" as const, minHeight: 100,
    fontFamily: "inherit", transition: "border-color 0.2s",
  },
  errorText: { fontSize: 11, color: "#f87171", marginTop: 6, display: "flex", alignItems: "center", gap: 4 },
  fieldGroup: { marginBottom: 20 },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  select: {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
    padding: "12px 16px", fontSize: 14, color: "#fff",
    outline: "none", cursor: "pointer", appearance: "none" as const,
    fontFamily: "inherit", transition: "border-color 0.2s",
  },
  urgencyGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 },
  urgencyCard: (selected: boolean) => ({
    background: selected ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${selected ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.08)"}`,
    borderRadius: 12, padding: "12px", cursor: "pointer", transition: "all 0.2s",
    textAlign: "center" as const,
  }),
  urgencyLabel: { fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 },
  urgencyDesc: { fontSize: 10, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 },
  checkboxRow: {
    display: "flex", gap: 12, alignItems: "flex-start",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 12, padding: "14px 16px",
  },
  checkbox: { width: 18, height: 18, marginTop: 1, accentColor: "#3b82f6", cursor: "pointer", flexShrink: 0 },
  checkboxText: { fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.6 },
  btnRow: { display: "flex", gap: 12, marginTop: 24 },
  btnBack: {
    display: "flex", alignItems: "center", gap: 6,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 600,
    color: "rgba(255,255,255,0.6)", cursor: "pointer",
  },
  btnNext: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: "linear-gradient(135deg, #3b82f6, #6366f1)",
    border: "none", borderRadius: 12, padding: "13px 24px", fontSize: 14, fontWeight: 600,
    color: "#fff", cursor: "pointer", boxShadow: "0 4px 20px rgba(59,130,246,0.3)",
    transition: "all 0.2s",
  },
  btnDisabled: { opacity: 0.5, cursor: "not-allowed" },
  progress: { height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 2, margin: "20px 32px 0" },
  progressBar: (pct: number) => ({
    height: "100%", width: `${pct}%`, borderRadius: 2,
    background: "linear-gradient(90deg, #3b82f6, #6366f1)", transition: "width 0.4s ease",
  }),
  successBox: {
    padding: "48px 32px", textAlign: "center" as const,
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 16,
  },
  successIcon: {
    width: 72, height: 72, borderRadius: "50%",
    background: "rgba(52,211,153,0.12)", border: "1px solid rgba(52,211,153,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  caseTag: {
    background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 9999, padding: "6px 16px", fontSize: 13, fontWeight: 700, color: "#60a5fa",
    fontFamily: "monospace",
  },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function InquiryModal({ open, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    visitor_name: "", visitor_email: "", visitor_phone: "",
    matter_type: "", description: "", urgency: "NORMAL", consent_given: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; inquiry_id?: string; message?: string } | null>(null);

  // Reset on open
  useEffect(() => {
    if (open) { setStep(1); setForm({ visitor_name: "", visitor_email: "", visitor_phone: "", matter_type: "", description: "", urgency: "NORMAL", consent_given: false }); setErrors({}); setResult(null); }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const set = (field: keyof FormData, val: string | boolean) => {
    setForm(f => ({ ...f, [field]: val }));
    setErrors(e => ({ ...e, [field]: undefined }));
  };

  const validateStep1 = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.visitor_name.trim()) e.visitor_name = "Name is required";
    if (!form.visitor_email.trim()) e.visitor_email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.visitor_email)) e.visitor_email = "Enter a valid email";
    setErrors(e as Partial<Record<keyof FormData, string>>);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (!form.matter_type) e.matter_type = "Please select a matter type";
    if (!form.description.trim() || form.description.length < 20) e.description = "Please describe your matter in at least 20 characters";
    setErrors(e as Partial<Record<keyof FormData, string>>);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleSubmit = async () => {
    if (!form.consent_given) { setErrors({ consent_given: "You must consent to proceed" }); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003"}/public-submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, inquiry_id: data.inquiry_id, message: data.message });
        setStep(4);
      } else {
        setResult({ success: false, message: data.message || "Something went wrong. Please try again." });
      }
    } catch {
      setResult({ success: false, message: "Could not connect to the server. Please try again shortly." });
    } finally {
      setLoading(false);
    }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : step === 3 ? 90 : 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          style={s.overlay}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            style={s.modal}
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            {/* Header */}
            <div style={s.header}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, padding: 8, display: "flex" }}>
                  <Scale size={16} color="#60a5fa" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
                    {step < 4 ? "Submit Legal Inquiry" : "Inquiry Submitted"}
                  </div>
                  {step < 4 && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>Step {step} of 3</div>}
                </div>
              </div>
              <button style={s.closeBtn} onClick={onClose}>
                <X size={16} />
              </button>
            </div>

            {/* Progress bar */}
            {step < 4 && (
              <div style={s.progress}>
                <div style={s.progressBar(progress)} />
              </div>
            )}

            {/* Body */}
            <div style={s.body}>
              <AnimatePresence mode="wait">

                {/* Step 1 — Contact Details */}
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Your Contact Details</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>We'll use this to contact you about your inquiry.</div>
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}><User size={10} style={{ display: "inline", marginRight: 4 }} />Full Name *</label>
                      <input id="inquiry-name" style={{ ...s.input, ...(errors.visitor_name ? s.inputError : {}) }} placeholder="e.g. Priya Sharma" value={form.visitor_name} onChange={e => set("visitor_name", e.target.value)} />
                      {errors.visitor_name && <div style={s.errorText}><AlertCircle size={10} />{errors.visitor_name}</div>}
                    </div>

                    <div style={s.row}>
                      <div style={s.fieldGroup}>
                        <label style={s.label}><Mail size={10} style={{ display: "inline", marginRight: 4 }} />Email *</label>
                        <input id="inquiry-email" type="email" style={{ ...s.input, ...(errors.visitor_email ? s.inputError : {}) }} placeholder="you@example.com" value={form.visitor_email} onChange={e => set("visitor_email", e.target.value)} />
                        {errors.visitor_email && <div style={s.errorText}><AlertCircle size={10} />{errors.visitor_email}</div>}
                      </div>
                      <div style={s.fieldGroup}>
                        <label style={s.label}><Phone size={10} style={{ display: "inline", marginRight: 4 }} />Phone</label>
                        <input id="inquiry-phone" type="tel" style={s.input} placeholder="+91 98765 43210" value={form.visitor_phone} onChange={e => set("visitor_phone", e.target.value)} />
                      </div>
                    </div>

                    <div style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: 12, padding: "12px 16px", fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                      🔒 Your information is encrypted and protected under DPDPA 2023. We will never share your details without consent.
                    </div>

                    <div style={s.btnRow}>
                      <button style={s.btnNext} id="step1-next" onClick={handleNext}>Continue <ArrowRight size={15} /></button>
                    </div>
                  </motion.div>
                )}

                {/* Step 2 — Case Details */}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Your Legal Matter</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Tell us about your case so we can evaluate it properly.</div>
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}><FileText size={10} style={{ display: "inline", marginRight: 4 }} />Area of Law *</label>
                      <select id="inquiry-matter" style={{ ...s.select, ...(errors.matter_type ? s.inputError : {}) }} value={form.matter_type} onChange={e => set("matter_type", e.target.value)}>
                        <option value="" style={{ background: "#0d1223" }}>Select matter type…</option>
                        {MATTER_TYPES.map(m => <option key={m.value} value={m.value} style={{ background: "#0d1223" }}>{m.label}</option>)}
                      </select>
                      {errors.matter_type && <div style={s.errorText}><AlertCircle size={10} />{errors.matter_type}</div>}
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}>Brief Description *</label>
                      <textarea id="inquiry-description" style={{ ...s.textarea, ...(errors.description ? s.inputError : {}) }} placeholder="Briefly describe your legal matter, what happened, and what you need help with…" value={form.description} onChange={e => set("description", e.target.value)} />
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 4, textAlign: "right" }}>{form.description.length} characters {form.description.length < 20 ? `(${20 - form.description.length} more needed)` : "✓"}</div>
                      {errors.description && <div style={s.errorText}><AlertCircle size={10} />{errors.description}</div>}
                    </div>

                    <div style={s.fieldGroup}>
                      <label style={s.label}>Urgency Level</label>
                      <div style={s.urgencyGrid}>
                        {URGENCY_OPTIONS.map(u => (
                          <div key={u.value} style={s.urgencyCard(form.urgency === u.value)} onClick={() => set("urgency", u.value)}>
                            <div style={s.urgencyLabel}>{u.label}</div>
                            <div style={s.urgencyDesc}>{u.desc}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={s.btnRow}>
                      <button style={s.btnBack} onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
                      <button style={s.btnNext} id="step2-next" onClick={handleNext}>Continue <ArrowRight size={15} /></button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3 — Review & Consent */}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Review & Submit</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Please confirm the details below before submitting.</div>
                    </div>

                    {/* Summary card */}
                    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                      {[
                        { label: "Name", value: form.visitor_name },
                        { label: "Email", value: form.visitor_email },
                        { label: "Phone", value: form.visitor_phone || "Not provided" },
                        { label: "Matter Type", value: MATTER_TYPES.find(m => m.value === form.matter_type)?.label || form.matter_type },
                        { label: "Urgency", value: URGENCY_OPTIONS.find(u => u.value === form.urgency)?.label },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                          <span style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>
                          <span style={{ color: "#fff", fontWeight: 500, maxWidth: "60%", textAlign: "right" }}>{value}</span>
                        </div>
                      ))}
                      <div style={{ paddingTop: 10, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                        <div style={{ fontWeight: 600, marginBottom: 4, color: "rgba(255,255,255,0.5)" }}>Description</div>
                        {form.description}
                      </div>
                    </div>

                    {/* Consent */}
                    <div style={s.checkboxRow}>
                      <input id="inquiry-consent" type="checkbox" style={s.checkbox} checked={form.consent_given} onChange={e => set("consent_given", e.target.checked)} />
                      <label htmlFor="inquiry-consent" style={s.checkboxText}>
                        I consent to LexDesk collecting and processing my personal information for the purpose of evaluating my legal inquiry. I understand this information is protected under DPDPA 2023 and will not be shared without my explicit consent.
                      </label>
                    </div>
                    {errors.consent_given && <div style={{ ...s.errorText, marginTop: 8 }}><AlertCircle size={10} />You must consent to proceed</div>}

                    {/* Server error */}
                    {result && !result.success && (
                      <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 16px", marginTop: 16, fontSize: 13, color: "#f87171" }}>
                        {result.message}
                      </div>
                    )}

                    <div style={s.btnRow}>
                      <button style={s.btnBack} onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
                      <button id="submit-inquiry" style={{ ...s.btnNext, ...(loading ? s.btnDisabled : {}) }} onClick={handleSubmit} disabled={loading}>
                        {loading ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Submitting…</> : <>Submit Inquiry <ArrowRight size={15} /></>}
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Step 4 — Success */}
                {step === 4 && (
                  <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
                    <div style={s.successBox}>
                      <motion.div style={s.successIcon} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}>
                        <CheckCircle2 size={36} color="#34d399" />
                      </motion.div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>Inquiry Received!</div>
                      {result?.inquiry_id && <div style={s.caseTag}>{result.inquiry_id}</div>}
                      <div style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 340, textAlign: "center", lineHeight: 1.65 }}>
                        {result?.message || "Your inquiry has been submitted. Our team will contact you within 24 hours."} We'll send a confirmation to <strong style={{ color: "rgba(255,255,255,0.7)" }}>{form.visitor_email}</strong>.
                      </div>
                      <div style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)", borderRadius: 14, padding: "14px 20px", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
                        📋 Our team will run an automated <strong style={{ color: "rgba(255,255,255,0.6)" }}>conflict-of-interest check</strong> before your first consultation.
                      </div>
                      <button style={{ ...s.btnNext, width: "100%", justifyContent: "center" }} onClick={onClose}>
                        Done
                      </button>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
