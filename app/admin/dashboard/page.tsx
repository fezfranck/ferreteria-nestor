"use client";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const { user } = useAuth();
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);

  useEffect(() => {
    async function fetchStats() {
      const { count: cp } = await supabase
        .from("productos")
        .select("*", { count: "exact", head: true });
      const { count: co } = await supabase
        .from("pedidos")
        .select("*", { count: "exact", head: true });
      setTotalProductos(cp || 0);
      setTotalPedidos(co || 0);
    }
    fetchStats();
  }, []);

  const stats = [
    { icon: "📦", label: "Productos activos", value: totalProductos, color: "#1B87C8" },
    { icon: "🛒", label: "Pedidos totales", value: totalPedidos, color: "#38A169" },
    { icon: "👥", label: "Usuarios", value: 3, color: "#805AD5" },
    { icon: "💰", label: "Ventas del mes", value: "$0", color: "#D69E2E" },
  ];

  const actividad = [
    { texto: "Nuevo pedido recibido", tiempo: "Hace 5 min", icon: "🛒" },
    { texto: "Producto actualizado: Disyuntor 20A", tiempo: "Hace 1 hora", icon: "📦" },
    { texto: "Usuario nuevo registrado", tiempo: "Hace 2 horas", icon: "👤" },
    { texto: "Stock actualizado desde DUX", tiempo: "Hace 3 horas", icon: "🔗" },
  ];

  return (
    <div>
      {/* Bienvenida */}
      <div className="mb-8">
        <h1
          className="font-black uppercase text-4xl leading-none mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Bienvenido, <span style={{ color: "#1B87C8" }}>{user?.nombre}</span>
        </h1>
        <p style={{ color: "#555" }}>Resumen del sistema al día de hoy</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-6"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <div className="text-3xl mb-3">{s.icon}</div>
            <div
              className="font-black text-4xl mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-sm" style={{ color: "#555" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Grid inferior */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Actividad reciente */}
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
        >
          <div
            className="px-6 py-4 font-bold text-sm"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
          >
            Actividad reciente
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            {actividad.map((a, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <span className="text-2xl">{a.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{a.texto}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#aaa" }}>{a.tiempo}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accesos rápidos */}
        <div
          className="bg-white rounded-xl overflow-hidden"
          style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
        >
          <div
            className="px-6 py-4 font-bold text-sm"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}
          >
            Accesos rápidos
          </div>
          <div className="p-6 grid grid-cols-2 gap-4">
            {[
              { icon: "📦", label: "Nuevo producto", href: "/admin/productos", color: "#1B87C8" },
              { icon: "🛒", label: "Ver pedidos", href: "/admin/pedidos", color: "#38A169" },
              { icon: "👥", label: "Usuarios", href: "/admin/usuarios", color: "#805AD5" },
              { icon: "🌐", label: "Ver tienda", href: "/", color: "#D69E2E" },
            ].map((a) => (
              <a
                key={a.label}
                href={a.href}
                className="flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center transition-all"
                style={{ background: `${a.color}10`, border: `1.5px solid ${a.color}20` }}
              >
                <span className="text-3xl">{a.icon}</span>
                <span className="text-xs font-bold uppercase" style={{ color: a.color }}>
                  {a.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}