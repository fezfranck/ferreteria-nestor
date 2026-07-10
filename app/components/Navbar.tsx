"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./CartDrawer";
import AccountDrawer from "./AccountDrawer";

export default function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  return (
    <>
      {/* TOPBAR */}
      <div className="bg-[#1A1A1A] text-[#aaa] text-xs py-2 px-6 border-b border-[#333]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span>📍 Ignacio Crespo 1136, Recreo — Santa Fe</span>
          <div className="flex gap-4">
            <span>☎️ (0342) 5128458</span>
            <span>🕐 Lun–Vie 8:00–18:00 | Sáb 8:00–13:00</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="bg-white border-b border-black/8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 flex items-center h-16 gap-4">

          {/* Logo */}
          <Link
            href="/"
            className="font-black uppercase tracking-tight flex-shrink-0"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "22px" }}
          >
            ELECTRICIDAD <span style={{ color: "#1B87C8" }}>NESTOR</span>
          </Link>

          {/* Buscador */}
          <div
            className="flex-1 flex rounded-full overflow-hidden transition-colors"
            style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8", maxWidth: "320px" }}
          >
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent flex-1 px-5 py-2 text-sm outline-none"
            />
            <button
              className="px-5 text-sm transition-colors"
              style={{ background: "#1B87C8", color: "white" }}
            >
              🔍
            </button>
          </div>

          {/* Links */}
          <div className="flex-1" />
          <div className="flex gap-0">
            {[
              { label: "Inicio", href: "/" },
              { label: "Productos", href: "/productos" },
              { label: "Empresas", href: "/empresas" },
              { label: "Nosotros", href: "/nosotros" },
              { label: "Contacto", href: "/contacto" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium px-3 py-2 rounded-lg transition-all whitespace-nowrap"
                style={{ color: "#555" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Botón cuenta */}
          <button
            onClick={() => setAccountOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0"
            style={{
              background: user ? "#F0F7FD" : "transparent",
              border: "1.5px solid rgba(0,0,0,0.1)",
              color: user ? "#1B87C8" : "#555",
            }}
          >
            <span>{user ? "👤" : "🔐"}</span>
            <span className="hidden md:inline">
              {user ? user.nombre.split(" ")[0] : "Mi Cuenta"}
            </span>
          </button>

          {/* Carrito */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all flex-shrink-0"
            style={{ background: "#1B87C8", color: "white" }}
          >
            🛒
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#F5A623", color: "#1A1A1A" }}
            >
              {count}
            </span>
          </button>

        </div>
      </nav>

      {/* DRAWERS */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}