"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user && pathname !== "/admin") {
      router.push("/admin");
    }
  }, [user, pathname, router]);

  // En la página de login no mostramos el sidebar
  if (pathname === "/admin") {
    return <>{children}</>;
  }

  if (!user) return null;

 const navItems = [
  { icon: "📊", label: "Dashboard", href: "/admin/dashboard", roles: ["superadmin", "admin", "vendedor", "comprador"] },
  { icon: "📦", label: "Productos", href: "/admin/productos", roles: ["superadmin", "admin", "vendedor"] },
  { icon: "🛒", label: "Pedidos", href: "/admin/pedidos", roles: ["superadmin", "admin", "vendedor"] },
  { icon: "👥", label: "Usuarios", href: "/admin/usuarios", roles: ["superadmin"] },
  { icon: "🔐", label: "Permisos", href: "/admin/permisos", roles: ["superadmin"] },
  { icon: "⚙️", label: "Configuración", href: "/admin/configuracion", roles: ["superadmin", "admin"] },  // ← nueva línea
].filter(item => item.roles.includes(user.rol));

  const roleColors: Record<string, string> = {
    superadmin: "#805AD5",
    admin: "#1B87C8",
    vendedor: "#38A169",
    comprador: "#D69E2E",
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f7fa" }}>

      {/* SIDEBAR */}
      <aside
        className="flex flex-col flex-shrink-0"
        style={{ width: "240px", background: "#1A1A1A", color: "white" }}
      >
        {/* Logo */}
        <div
          className="px-5 py-5 font-black uppercase text-lg"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", borderBottom: "1px solid #333" }}
        >
          ⚡ Electricidad <span style={{ color: "#1B87C8" }}>Nestor</span>
        </div>

        {/* Usuario */}
        <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid #333" }}>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
            style={{ background: roleColors[user.rol] }}
          >
            {user.nombre.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{user.nombre}</div>
            <div className="text-xs" style={{ color: "#888" }}>{user.rol}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: pathname === item.href ? "#1B87C8" : "transparent",
                color: pathname === item.href ? "white" : "#aaa",
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4" style={{ borderTop: "1px solid #333" }}>
          <button
            onClick={() => { logout(); router.push("/admin"); }}
            className="w-full px-3 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ background: "rgba(220,38,38,0.15)", color: "#f87171" }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div
          className="px-8 py-4 flex items-center justify-between flex-shrink-0"
          style={{ background: "white", borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          <div
            className="font-black uppercase text-xl"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {navItems.find(i => i.href === pathname)?.label || "Panel"}
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: "#555" }}>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ background: `${roleColors[user.rol]}20`, color: roleColors[user.rol] }}
            >
              {user.rol}
            </span>
            <span>{user.nombre}</span>
          </div>
        </div>

        {/* Página */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}