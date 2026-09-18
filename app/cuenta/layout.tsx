"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const navTabs = [
  { href: "/cuenta/pedidos", label: "Mis pedidos", icon: "🛒" },
  { href: "/cuenta/datos", label: "Mis datos", icon: "👤" },
  { href: "/cuenta/direcciones", label: "Mis direcciones", icon: "📍" },
];

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  const roleColors: Record<string, string> = {
    superadmin: "#805AD5",
    admin: "#1B87C8",
    vendedor: "#38A169",
    comprador: "#D69E2E",
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] text-[#1A1A1A] pb-16">
      {/* CABECERA / HERO */}
      <section className="bg-white border-b border-black/8 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl text-white shadow-sm flex-shrink-0"
                style={{ background: "#1B87C8" }}
              >
                {user.nombre.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1
                  className="font-black uppercase text-2xl sm:text-3xl text-gray-900 leading-tight"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Mi Cuenta
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{user.nombre}</span>
                  <span>•</span>
                  <span>{user.email}</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: `${roleColors[user.rol] || "#1B87C8"}18`,
                      color: roleColors[user.rol] || "#1B87C8",
                      border: `1px solid ${roleColors[user.rol] || "#1B87C8"}40`,
                    }}
                  >
                    {user.rol}
                  </span>
                </div>
              </div>
            </div>

            {["superadmin", "admin", "vendedor"].includes(user.rol) && (
              <Link
                href="/admin/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all self-start sm:self-center border border-[#1B87C8]/20 bg-[#F0F7FD] text-[#1B87C8] hover:bg-[#1B87C8] hover:text-white"
              >
                <span>⚙️</span> Panel de administración
              </Link>
            )}
          </div>

          {/* TABS DE NAVEGACIÓN */}
          <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Navegación de cuenta">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#1B87C8] text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        {children}
      </section>
    </main>
  );
}
