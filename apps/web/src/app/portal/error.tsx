"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  useEffect(() => {
    console.error("[Portal Error]", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh", background: "#070b16", display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
      fontFamily: "'Inter', sans-serif", color: "#f0f4ff", gap: 20, padding: 24,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 48 }}>⚠️</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>Something went wrong</h2>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.45)", maxWidth: 400 }}>
        {error?.message || "An unexpected error occurred loading your portal."}
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
        <button
          onClick={() => reset()}
          style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", borderRadius: 9999, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Try Again
        </button>
        <button
          onClick={() => router.push("/portal/login")}
          style={{ background: "rgba(255,255,255,0.07)", color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 9999, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
