"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

interface OrderItem {
  id: string | number;
  name: string;
  brand?: string;
  price: number;
  quantity: number;
  icon?: string;
}

interface Pedido {
  id: number;
  user_id?: string;
  cliente_nombre: string;
  cliente_email: string;
  total: number;
  items: OrderItem[] | string;
  estado: "Pendiente" | "Preparando" | "Enviado" | "Completado" | "Cancelado";
  created_at?: string;
  fecha?: string;
  metodo_entrega?: string;
  forma_pago?: string;
  costo_envio?: number;
}

const ESTADOS_INFO: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  Pendiente: { label: "Pendiente", color: "#F5A623", bg: "rgba(245,166,35,0.12)", icon: "⏳" },
  Preparando: { label: "Preparando", color: "#1B87C8", bg: "rgba(27,135,200,0.12)", icon: "📦" },
  Enviado: { label: "Enviado", color: "#805AD5", bg: "rgba(128,90,213,0.12)", icon: "🚚" },
  Completado: { label: "Completado", color: "#38A169", bg: "rgba(56,161,105,0.12)", icon: "✅" },
  Cancelado: { label: "Cancelado", color: "#DC2626", bg: "rgba(220,38,38,0.12)", icon: "❌" },
};

function parseOrderItems(itemsData: unknown): OrderItem[] {
  if (!itemsData) return [];
  if (Array.isArray(itemsData)) return itemsData as OrderItem[];
  if (typeof itemsData === "string") {
    try {
      const parsed = JSON.parse(itemsData);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function MisPedidosPage() {
  const { user } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchUserPedidos() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select("*")
          .eq("user_id", user?.id)
          .order("id", { ascending: false });

        if (!error && data) {
          setPedidos(data as Pedido[]);
        } else {
          console.error("Error al cargar pedidos del usuario:", error);
        }
      } catch (err) {
        console.error("Error de conexión al cargar pedidos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUserPedidos();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg mb-2" />
        {[1, 2].map((n) => (
          <div key={n} className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs animate-pulse">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 w-36 bg-gray-200 rounded" />
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-4 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
            </div>
            <div className="h-8 w-32 bg-gray-200 rounded ml-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-10 sm:p-14 text-center border border-black/8 shadow-xs max-w-2xl mx-auto">
        <div
          className="w-20 h-20 mx-auto rounded-full flex items-center justify-center text-4xl mb-5"
          style={{ background: "#F0F7FD", color: "#1B87C8" }}
        >
          🛒
        </div>
        <h2
          className="font-black uppercase text-2xl sm:text-3xl mb-2 text-gray-900"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Todavía no realizaste ningún pedido
        </h2>
        <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto mb-8 leading-relaxed">
          Descubrí nuestro catálogo con los mejores materiales eléctricos, iluminación, cables y herramientas de confianza.
        </p>
        <Link
          href="/productos"
          className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-bold text-sm text-white transition-all shadow-md hover:brightness-105"
          style={{ background: "#1B87C8" }}
        >
          <span>⚡</span> Explorar productos
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="font-black uppercase text-2xl sm:text-3xl text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Mis Pedidos ({pedidos.length})
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">Historial completo de tus compras en la tienda</p>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        {pedidos.map((pedido) => {
          const itemsList = parseOrderItems(pedido.items);
          const est = ESTADOS_INFO[pedido.estado] || {
            label: pedido.estado,
            color: "#64748B",
            bg: "rgba(100,116,139,0.1)",
            icon: "📋",
          };

          const rawDate = pedido.created_at || pedido.fecha;
          const fechaFormateada = rawDate
            ? new Date(rawDate).toLocaleDateString("es-AR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Fecha no registrada";

          return (
            <article
              key={pedido.id}
              className="bg-white rounded-2xl overflow-hidden border border-black/8 shadow-xs hover:border-[#1B87C8]/40 transition-colors"
            >
              {/* Encabezado de la tarjeta */}
              <div
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-3"
                style={{ background: "#FAFCFE", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-black text-2xl text-[#1B87C8]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    Pedido #{pedido.id}
                  </span>
                  <span className="text-xs text-gray-300">•</span>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">
                    📅 {fechaFormateada}
                  </span>
                </div>

                <span
                  className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: est.bg,
                    color: est.color,
                    border: `1px solid ${est.color}40`,
                  }}
                >
                  <span>{est.icon}</span> {est.label}
                </span>
              </div>

              {/* Lista de productos */}
              <div className="px-6 py-4 divide-y divide-gray-100">
                {itemsList.length > 0 ? (
                  itemsList.map((item, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-700 flex-shrink-0">
                          {item.quantity}x
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                          {item.brand && (
                            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
                              {item.brand}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm font-bold text-gray-900">
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                        </span>
                        <p className="text-xs text-gray-400">
                          ${item.price.toLocaleString("es-AR")} c/u
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400 py-2 italic">Sin detalle de artículos disponible.</p>
                )}
              </div>

              {/* Pie de pedido con método y total */}
              <div
                className="px-6 py-4 flex flex-wrap items-center justify-between gap-4"
                style={{ background: "#FAFBFD", borderTop: "1px solid rgba(0,0,0,0.06)" }}
              >
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {pedido.metodo_entrega && (
                    <span className="px-2.5 py-1 rounded-md bg-white border border-black/8 font-medium">
                      🚚 {pedido.metodo_entrega === "domicilio" ? "Envío a domicilio" : "Retiro en local"}
                    </span>
                  )}
                  {pedido.forma_pago && (
                    <span className="px-2.5 py-1 rounded-md bg-white border border-black/8 font-medium">
                      💳 {pedido.forma_pago}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2 ml-auto">
                  <span className="text-xs uppercase font-bold text-gray-500">Total pagado:</span>
                  <span
                    className="text-2xl font-black text-[#1B87C8]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    ${Number(pedido.total || 0).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
