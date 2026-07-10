"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const ok = await login(email, password);
    if (ok) {
      router.push("/admin/dashboard");
    } else {
      setError("Email o contraseña incorrectos");
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#1A1A1A" }}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="font-black uppercase text-3xl mb-2"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", color: "white" }}
          >
            ELECTRICIDAD <span style={{ color: "#1B87C8" }}>NESTOR</span>
          </div>
          <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            Panel de administración
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-xl p-8"
          style={{ background: "#242424", border: "1px solid #333" }}
        >
          <h2
            className="font-black uppercase text-2xl mb-6 text-white"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Iniciar sesión
          </h2>

          {error && (
            <div
              className="rounded-lg px-4 py-3 mb-5 text-sm"
              style={{ background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#f87171" }}
            >
              ❌ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                style={{ background: "#2E2E2E", border: "1.5px solid #444", color: "white" }}
                onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                onBlur={e => (e.target.style.borderColor = "#444")}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 text-sm rounded-lg outline-none transition-colors"
                style={{ background: "#2E2E2E", border: "1.5px solid #444", color: "white" }}
                onFocus={e => (e.target.style.borderColor = "#1B87C8")}
                onBlur={e => (e.target.style.borderColor = "#444")}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3 rounded-lg transition-all mt-2"
              style={{
                background: loading ? "#555" : "#1B87C8",
                color: "white",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "16px",
                letterSpacing: "0.5px",
              }}
            >
              {loading ? "Ingresando..." : "Ingresar →"}
            </button>
          </form>

          {/* Usuarios de prueba */}
          <div
            className="mt-6 rounded-lg p-4 text-xs"
            style={{ background: "#2E2E2E", border: "1px solid #3a3a3a", color: "rgba(255,255,255,0.4)" }}
          >
            <div className="font-bold uppercase mb-2" style={{ color: "rgba(255,255,255,0.6)" }}>
              Usuarios de prueba
            </div>
            <div className="flex flex-col gap-1">
              <span>admin@nestor.com / admin123</span>
              <span>maria@nestor.com / maria123</span>
              <span>carlos@nestor.com / carlos123</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            ← Volver a la tienda
          </Link>
        </div>
      </div>
    </div>
  );
}