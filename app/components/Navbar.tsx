"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartDrawer from "./CartDrawer";
import AccountDrawer from "./AccountDrawer";

export default function Navbar() {
  const { count } = useCart();
  const { user } = useAuth();
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [busquedaMobileOpen, setBusquedaMobileOpen] = useState(false);

  return (
    <>
      {/* TOPBAR */}
      <div className="bg-[#1A1A1A] text-[#aaa] text-xs py-2 px-4 sm:px-6 border-b border-[#333]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <span className="hidden md:inline">📍 Ignacio Crespo 1136, Recreo — Santa Fe</span>
          <a href="tel:+543425128458" className="md:hidden font-semibold text-white">
            ☎️ (0342) 5128458
          </a>
          <div className="hidden md:flex gap-4">
            <span>☎️ (0342) 5128458</span>
            <span>🕐 Lun–Vie 8:00–18:00 | Sáb 8:00–13:00</span>
          </div>
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="bg-white border-b border-black/8 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-3 sm:gap-4">

          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center" aria-label="Electricidad Nestor — Inicio">
            <Image
              src="/logo3d.png"
              alt="Electricidad Nestor"
              width={160}
              height={40}
              className="h-9 sm:h-10 w-auto object-contain"
              priority
            />
          </Link>

          {/* Buscador (oculto en móviles pequeños, visible desde sm) */}
          <div
            className="hidden sm:flex flex-1 rounded-full overflow-hidden transition-colors"
            style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8", maxWidth: "320px" }}
          >
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent flex-1 px-5 py-2 text-sm outline-none min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const term = e.currentTarget.value;
                  window.location.href = `/productos?search=${encodeURIComponent(term)}`;
                }
              }}
            />
            <button
              className="px-5 text-sm transition-colors flex-shrink-0"
              style={{ background: "#1B87C8", color: "white" }}
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input) {
                  window.location.href = `/productos?search=${encodeURIComponent(input.value)}`;
                }
              }}
              aria-label="Buscar"
            >
              🔍
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Links (Escritorio) */}
          <div className="hidden lg:flex gap-0">
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

          {/* Ícono de búsqueda — solo mobile, abre la barra desplegable */}
          <button
            onClick={() => setBusquedaMobileOpen(true)}
            className="flex sm:hidden items-center justify-center rounded-full border border-black/10 hover:bg-gray-100 transition-colors flex-shrink-0 w-11 h-11 text-lg text-gray-700"
            type="button"
            aria-label="Buscar productos"
          >
            🔍
          </button>

          {/* Botón cuenta */}
          <button
            onClick={() => setAccountOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 h-11 rounded-full text-sm font-semibold transition-all flex-shrink-0"
            style={{
              background: user ? "#F0F7FD" : "transparent",
              border: "1.5px solid rgba(0,0,0,0.1)",
              color: user ? "#1B87C8" : "#555",
            }}
            aria-label="Mi cuenta"
          >
            <span>{user ? "👤" : "🔐"}</span>
            <span className="hidden md:inline">
              {user ? user.nombre.split(" ")[0] : "Mi Cuenta"}
            </span>
          </button>

          {/* Carrito */}
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-2 px-3 sm:px-4 h-11 rounded-full text-sm font-semibold transition-all flex-shrink-0"
            style={{ background: "#1B87C8", color: "white" }}
            aria-label="Ver carrito"
          >
            🛒
            <span
              className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: "#F5A623", color: "#1A1A1A" }}
            >
              {count}
            </span>
          </button>

          {/* Botón menú hamburguesa (Móvil) */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex lg:hidden items-center justify-center rounded-full border border-black/10 hover:bg-gray-100 transition-colors flex-shrink-0 w-11 h-11 text-xl text-gray-700"
            type="button"
            aria-label="Abrir menú"
          >
            ☰
          </button>

        </div>
      </nav>

      {/* BARRA DE BÚSQUEDA MOBILE DESPLEGABLE */}
      {busquedaMobileOpen && (
        <div className="sm:hidden bg-white border-b border-black/8 px-4 py-3 sticky top-16 z-40 shadow-sm">
          <div
            className="flex rounded-full overflow-hidden"
            style={{ background: "#F0F7FD", border: "1.5px solid #D6EAF8" }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Buscar productos..."
              className="bg-transparent flex-1 px-4 py-2.5 text-sm outline-none min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.location.href = `/productos?search=${encodeURIComponent(e.currentTarget.value)}`;
                  setBusquedaMobileOpen(false);
                }
              }}
            />
            <button
              className="px-4 text-sm text-white flex-shrink-0"
              style={{ background: "#1B87C8" }}
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input && input.value.trim()) {
                  window.location.href = `/productos?search=${encodeURIComponent(input.value)}`;
                  setBusquedaMobileOpen(false);
                }
              }}
              aria-label="Buscar"
            >
              🔍
            </button>
            <button
              className="px-4 text-sm flex-shrink-0"
              style={{ color: "#aaa" }}
              onClick={() => setBusquedaMobileOpen(false)}
              aria-label="Cerrar búsqueda"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* MOBILE DRAWER (menú hamburguesa) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity animate-fade-in"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full w-full max-w-[280px] bg-white z-50 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/8 flex-shrink-0">
          <Image src="/logo3d.png" alt="Electricidad Nestor" width={140} height={35} className="h-8 w-auto object-contain" />
          <button
            onClick={() => setMenuOpen(false)}
            className="text-gray-400 hover:text-black text-2xl leading-none transition-colors w-9 h-9 flex items-center justify-center"
            aria-label="Cerrar menú"
          >
            ✕
          </button>
        </div>

        {/* Buscador dentro del menú */}
        <div className="px-6 py-4 border-b border-black/8 flex-shrink-0">
          <div
            className="flex rounded-full overflow-hidden border border-[#D6EAF8]"
            style={{ background: "#F0F7FD" }}
          >
            <input
              type="text"
              placeholder="Buscar productos..."
              className="bg-transparent flex-1 px-4 py-2 text-xs outline-none w-full min-w-0"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.location.href = `/productos?search=${encodeURIComponent(e.currentTarget.value)}`;
                  setMenuOpen(false);
                }
              }}
            />
            <button
              className="px-4 text-xs text-white flex-shrink-0"
              style={{ background: "#1B87C8" }}
              onClick={(e) => {
                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                if (input && input.value.trim()) {
                  window.location.href = `/productos?search=${encodeURIComponent(input.value)}`;
                  setMenuOpen(false);
                }
              }}
              aria-label="Buscar"
            >
              🔍
            </button>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
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
              onClick={() => setMenuOpen(false)}
              className="text-base font-semibold px-4 py-3 rounded-xl hover:bg-[#F0F7FD] hover:text-[#1B87C8] transition-all text-gray-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Footer del Drawer */}
        <div className="p-6 border-t border-black/8 bg-[#fdfdfd] text-xs text-gray-400 flex flex-col gap-2 flex-shrink-0">
          <a href="tel:+543425128458">📞 (0342) 5128458</a>
          <span>📍 Ignacio Crespo 1136, Recreo</span>
        </div>
      </div>

      {/* DRAWERS EXISTENTES */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <AccountDrawer isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
    </>
  );
}