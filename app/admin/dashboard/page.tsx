"use client";
import { useAuth } from "../../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import { ESTADOS_CONFIG } from "../../lib/constants";

interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  icon?: string;
}

interface PedidoComprador {
  id: number;
  user_id?: string | null;
  cliente_nombre: string;
  cliente_email: string;
  total: number;
  items: OrderItem[] | string;
  estado: string;
  created_at?: string;
  creado_en?: string;
  fecha?: string;
  metodo_entrega?: "domicilio" | "retiro" | null;
  direccion_envio?: {
    calle?: string;
    altura?: string;
    localidad?: string;
    provincia?: string;
    codigoPostal?: string;
  } | null;
  costo_envio?: number;
  forma_pago?: string;
  nota_staff?: string;
}

function parseItems(itemsData: unknown): OrderItem[] {
  if (!itemsData) return [];
  if (Array.isArray(itemsData)) return itemsData as OrderItem[];
  if (typeof itemsData === "string") {
    try {
      return JSON.parse(itemsData);
    } catch {
      return [];
    }
  }
  return [];
}

export default function Dashboard() {
  const { user } = useAuth();

  // Estados para vista Staff (admin, superadmin, vendedor)
  const [totalProductos, setTotalProductos] = useState(0);
  const [totalPedidos, setTotalPedidos] = useState(0);
  const [pedidosPendientes, setPedidosPendientes] = useState(0);

  // Estados para vista Comprador
  const [misPedidos, setMisPedidos] = useState<PedidoComprador[]>([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  // Cargar estadísticas globales solo para personal administrativo
  useEffect(() => {
    if (!user || user.rol === "comprador") return;

    async function fetchStats() {
      try {
        const { count: cp } = await supabase
          .from("productos")
          .select("*", { count: "exact", head: true });
        const { count: co } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true });
        const { count: cPend } = await supabase
          .from("pedidos")
          .select("*", { count: "exact", head: true })
          .eq("estado", "Pendiente de revisión");

        setTotalProductos(cp || 0);
        setTotalPedidos(co || 0);
        setPedidosPendientes(cPend || 0);
      } catch (err) {
        console.error("Error cargando estadísticas del dashboard:", err);
      }
    }
    fetchStats();
  }, [user]);

  // Cargar pedidos personales solo si el usuario es comprador
  useEffect(() => {
    if (!user || user.rol !== "comprador") return;
    const userId = user.id;
    const userEmail = user.email;

    async function fetchMisPedidos() {
      setLoadingPedidos(true);
      try {
        let query = supabase.from("pedidos").select("*");

        if (userId && userEmail) {
          query = query.or(`user_id.eq.${userId},cliente_email.ilike.${userEmail}`);
        } else if (userId) {
          query = query.eq("user_id", userId);
        } else if (userEmail) {
          query = query.ilike("cliente_email", userEmail);
        }

        const { data, error } = await query.order("id", { ascending: false });

        if (!error && data) {
          setMisPedidos(data);
        } else {
          console.error("Error fetching user orders:", error);
        }
      } catch (err) {
        console.error("Connection error loading orders:", err);
      } finally {
        setLoadingPedidos(false);
      }
    }

    fetchMisPedidos();
  }, [user]);

  // -------------------------------------------------------------
  // VISTA EXCLUSIVA PARA COMPRADOR
  // -------------------------------------------------------------
  if (user?.rol === "comprador") {
    return (
      <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
        {/* Encabezado y Saludo */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1
              className="font-black uppercase text-4xl md:text-5xl leading-none mb-1 text-gray-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Bienvenido, <span style={{ color: "#1B87C8" }}>{user?.nombre}</span>
            </h1>
            <p className="text-sm md:text-base text-gray-500">
              Historial y estado de tus compras en Electricidad Néstor
            </p>
          </div>
          <Link
            href="/productos"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white transition-all shadow-sm hover:brightness-105 self-start sm:self-auto"
            style={{ background: "#1B87C8" }}
          >
            <span>🛒</span> Ver catálogo
          </Link>
        </div>

        {/* Estado de Carga */}
        {loadingPedidos ? (
          <div
            className="bg-white rounded-2xl p-12 text-center"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <div className="text-3xl mb-3 animate-pulse">⏳</div>
            <p className="text-gray-500 font-medium text-sm">Cargando tus pedidos...</p>
          </div>
        ) : misPedidos.length === 0 ? (
          /* Estado Vacío (Sin Pedidos) */
          <div
            className="bg-white rounded-2xl p-10 md:p-14 text-center flex flex-col items-center justify-center shadow-sm"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
              style={{ background: "#F0F7FD", border: "1px solid #D6EAF8" }}
            >
              🛒
            </div>
            <h2
              className="font-black uppercase text-2xl md:text-3xl mb-2 text-gray-900"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              Todavía no realizaste pedidos
            </h2>
            <p className="text-gray-500 text-sm md:text-base max-w-md mb-6 leading-relaxed">
              Explorá nuestro catálogo con los mejores materiales eléctricos, cables, iluminación y herramientas.
            </p>
            <Link
              href="/productos"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold text-white transition-all shadow-md hover:brightness-105"
              style={{ background: "#1B87C8" }}
            >
              <span>⚡</span> Explorar productos
            </Link>
          </div>
        ) : (
          /* Listado de Pedidos del Comprador */
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2
                className="font-black uppercase text-2xl text-gray-900"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Mis pedidos ({misPedidos.length})
              </h2>
              <span className="text-xs text-gray-400 font-medium">
                Actualizado en tiempo real
              </span>
            </div>

            <div className="flex flex-col gap-5">
              {misPedidos.map((pedido) => {
                const itemsList = parseItems(pedido.items);
                const est = ESTADOS_CONFIG[pedido.estado] || {
                  label: pedido.estado,
                  color: "#555",
                  bg: "rgba(0,0,0,0.06)",
                  icon: "📋",
                };
                const dateStr = pedido.creado_en || pedido.created_at || pedido.fecha;
                const dateFormatted = dateStr
                  ? new Date(dateStr).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Fecha no registrada";

                return (
                  <div
                    key={pedido.id}
                    className="bg-white rounded-2xl overflow-hidden transition-all shadow-sm"
                    style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
                  >
                    {/* Barra superior de la tarjeta */}
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
                        <span className="text-xs text-gray-500 font-medium">
                          📅 {dateFormatted}
                        </span>
                      </div>

                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                        style={{
                          background: est.bg,
                          color: est.color,
                          border: `1px solid ${est.color}40`,
                        }}
                      >
                        <span>{est.icon}</span> {est.label}
                      </span>
                    </div>

                    {/* Desglose de Productos */}
                    <div className="p-6">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Productos ({itemsList.length})
                      </div>
                      <div className="divide-y divide-gray-100">
                        {itemsList.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-lg bg-[#F0F7FD] flex items-center justify-center text-xl flex-shrink-0 border border-[#D6EAF8]">
                                {item.icon || "🔌"}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[10px] font-bold text-[#1B87C8] uppercase tracking-wider">
                                  {item.brand || "Material"}
                                </div>
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                  {item.name}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Cantidad: <span className="font-semibold text-gray-700">{item.quantity}</span>
                                  {item.price ? ` × $${item.price.toLocaleString("es-AR")}` : ""}
                                </div>
                              </div>
                            </div>

                            <div className="text-right font-bold text-sm text-gray-900 flex-shrink-0">
                              ${((item.price || 0) * (item.quantity || 1)).toLocaleString("es-AR")}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Detalles complementarios (entrega y método de pago) */}
                      {(pedido.metodo_entrega || pedido.forma_pago) && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                          {pedido.metodo_entrega && (
                            <div className="flex items-center gap-1.5">
                              <span>
                                {pedido.metodo_entrega === "domicilio" ? "🚚 Envío a domicilio" : "🏪 Retiro en el local"}
                              </span>
                              {pedido.direccion_envio?.calle ? (
                                <span className="text-gray-400">
                                  ({pedido.direccion_envio.calle} {pedido.direccion_envio.altura})
                                </span>
                              ) : pedido.nota_staff?.includes("[Dirección de entrega]:") ? (
                                <span className="text-gray-400 truncate max-w-[200px]" title={pedido.nota_staff.replace("[Dirección de entrega]:", "").trim()}>
                                  ({pedido.nota_staff.replace("[Dirección de entrega]:", "").trim().slice(0, 30)}...)
                                </span>
                              ) : null}
                            </div>
                          )}
                          {pedido.forma_pago && (
                            <div className="flex items-center gap-1">
                              <span>Forma de pago:</span>
                              <strong className="text-gray-700">{pedido.forma_pago}</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Pie de Tarjeta con Total Abonado */}
                    <div
                      className="px-6 py-4 flex items-center justify-between"
                      style={{ background: "#F0F7FD", borderTop: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <span className="text-xs font-bold uppercase text-gray-600 tracking-wider">
                        Total del pedido
                      </span>
                      <span
                        className="font-black text-2xl text-gray-900"
                        style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                      >
                        ${pedido.total ? pedido.total.toLocaleString("es-AR") : "0"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA PARA STAFF (SUPERADMIN, ADMIN, VENDEDOR) - INTACTA
  // -------------------------------------------------------------
  const stats = [
    { icon: "📦", label: "Productos activos", value: totalProductos, color: "#1B87C8", href: "/admin/productos" },
    { icon: "⏳", label: "Pendientes revisión", value: pedidosPendientes, color: "#F5A623", href: "/admin/pedidos?filtro=pendiente" },
    { icon: "🛒", label: "Pedidos totales", value: totalPedidos, color: "#38A169", href: "/admin/pedidos?filtro=all" },
    { icon: "👥", label: "Usuarios", value: 4, color: "#805AD5", href: "/admin/usuarios" },
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
      <div className="mb-6">
        <h1
          className="font-black uppercase text-4xl leading-none mb-1"
          style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
        >
          Bienvenido, <span style={{ color: "#1B87C8" }}>{user?.nombre}</span>
        </h1>
        <p style={{ color: "#555" }}>Resumen del sistema y gestión de ventas al día de hoy</p>
      </div>

      {/* Alerta de pedidos pendientes de revisión para administrar ventas */}
      {pedidosPendientes > 0 && (
        <Link
          href="/admin/pedidos?filtro=pendiente"
          className="mb-8 bg-amber-50 border-2 border-amber-300 hover:border-amber-400 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm hover:shadow-md cursor-pointer group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
              ⏳
            </div>
            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-800">
                Atención Requerida · Ventas por coordinar
              </div>
              <div className="text-xl font-black text-amber-950 mt-0.5" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                {pedidosPendientes} {pedidosPendientes === 1 ? "solicitud pendiente" : "solicitudes pendientes"} de revisión
              </div>
              <p className="text-xs text-amber-800/80 mt-0.5">
                Hay solicitudes de clientes esperando confirmación de stock y aprobación para concretar la venta.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-xs flex items-center gap-2">
            Revisar y Administrar →
          </span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white rounded-xl p-6 transition-all hover:scale-[1.02] hover:shadow-xs block"
            style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
          >
            <div className="text-3xl mb-3">{s.icon}</div>
            <div
              className="font-black text-4xl mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif", color: s.color }}
            >
              {s.value}
            </div>
            <div className="text-sm font-medium" style={{ color: "#555" }}>{s.label}</div>
          </Link>
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
              {
                icon: "⏳",
                label: pedidosPendientes > 0 ? `Revisar ventas (${pedidosPendientes})` : "Revisar ventas",
                desc: "Solicitudes pendientes",
                href: "/admin/pedidos?filtro=pendiente",
                color: "#F5A623",
                badge: pedidosPendientes > 0 ? `${pedidosPendientes} nuevas` : null,
              },
              {
                icon: "🛒",
                label: "Todos los pedidos",
                desc: "Historial completo",
                href: "/admin/pedidos?filtro=all",
                color: "#38A169",
              },
              {
                icon: "📦",
                label: "Nuevo producto",
                desc: "Catálogo",
                href: "/admin/productos",
                color: "#1B87C8",
              },
              {
                icon: "🌐",
                label: "Ver tienda",
                desc: "Sitio web",
                href: "/",
                color: "#D69E2E",
              },
            ].map((a) => (
              <Link
                key={a.label}
                href={a.href}
                className="relative flex flex-col items-center justify-center gap-2 rounded-xl p-5 text-center transition-all hover:scale-[1.02] hover:shadow-xs"
                style={{ background: `${a.color}10`, border: `1.5px solid ${a.color}25` }}
              >
                {a.badge && (
                  <span className="absolute top-2 right-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                    {a.badge}
                  </span>
                )}
                <span className="text-3xl">{a.icon}</span>
                <div>
                  <span className="text-xs font-bold uppercase block" style={{ color: a.color }}>
                    {a.label}
                  </span>
                  {a.desc && <span className="text-[10px] text-gray-400 block">{a.desc}</span>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}