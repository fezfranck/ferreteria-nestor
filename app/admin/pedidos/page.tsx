"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  ESTADOS_PEDIDO,
  ESTADOS_CONFIG,
  LISTA_ESTADOS_ADMIN,
} from "../../lib/constants";

interface OrderItem {
  id: string; // SKU
  name: string;
  brand: string;
  price: number;
  quantity: number;
  icon?: string;
}

interface DireccionEnvio {
  calle?: string;
  altura?: string;
  piso?: string;
  localidad?: string;
  provincia?: string;
  codigoPostal?: string;
  indicaciones?: string;
}

interface Pedido {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono?: string;
  total: number;
  items: OrderItem[] | string;
  estado: string;
  created_at?: string;
  fecha?: string;
  metodo_entrega?: "domicilio" | "retiro" | null;
  direccion_envio?: DireccionEnvio | null;
  costo_envio?: number;
  forma_pago?: string;
  nota_staff?: string;
  user_id?: string | null;
}

interface StockInfo {
  sku: string;
  nombre: string;
  stock: number;
  encontrado: boolean;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);

  // Información de stock para el pedido seleccionado
  const [stockMap, setStockMap] = useState<Record<string, StockInfo>>({});
  const [cargandoStock, setCargandoStock] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Modal para rechazar pedido con nota
  const [modalRechazoOpen, setModalRechazoOpen] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState("");

  useEffect(() => {
    fetchPedidos();
  }, []);

  // Cargar pedidos
  async function fetchPedidos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setPedidos(data as Pedido[]);
    } else {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  }

  // Helper para parsear items de forma segura
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

  // Cargar stock disponible cruzando por SKU cada vez que cambia el pedido seleccionado
  useEffect(() => {
    if (!pedidoDetalle) {
      setStockMap({});
      return;
    }

    const itemsList = parseItems(pedidoDetalle.items);
    if (itemsList.length === 0) {
      setStockMap({});
      return;
    }

    async function fetchStockPorSKUs() {
      setCargandoStock(true);
      const skus = itemsList.map((i) => i.id);

      const { data, error } = await supabase
        .from("productos")
        .select("sku, stock, nombre")
        .in("sku", skus);

      if (!error && data) {
        const mapping: Record<string, StockInfo> = {};
        data.forEach((p: { sku: string; stock: number; nombre: string }) => {
          mapping[p.sku] = {
            sku: p.sku,
            nombre: p.nombre,
            stock: Number(p.stock) || 0,
            encontrado: true,
          };
        });
        setStockMap(mapping);
      } else {
        console.error("Error cargando stock de productos:", error);
      }
      setCargandoStock(false);
    }

    fetchStockPorSKUs();
  }, [pedidoDetalle]);

  function mostrarAlerta(tipo: "success" | "error", texto: string) {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 5000);
  }

  // Actualización genérica de estado
  async function actualizarEstado(id: number, nuevoEstado: string, notaExtra?: string) {
    const updateData: Record<string, unknown> = { estado: nuevoEstado };
    if (notaExtra !== undefined) {
      updateData.nota_staff = notaExtra;
    }

    const { error } = await supabase
      .from("pedidos")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      mostrarAlerta("success", `Pedido #${id} actualizado a "${nuevoEstado}"`);
      await fetchPedidos();
      if (pedidoDetalle && pedidoDetalle.id === id) {
        setPedidoDetalle((prev) =>
          prev ? { ...prev, estado: nuevoEstado, ...(notaExtra !== undefined ? { nota_staff: notaExtra } : {}) } : null
        );
      }
    } else {
      console.error("Error updating order status:", error);
      mostrarAlerta("error", "No se pudo actualizar el estado del pedido.");
    }
  }

  // -------------------------------------------------------------
  // FLUJO DE APROBACIÓN: Verifica stock en tiempo real y descuenta
  // -------------------------------------------------------------
  async function aprobarPedido(pedido: Pedido) {
    const itemsList = parseItems(pedido.items);
    if (itemsList.length === 0) {
      mostrarAlerta("error", "El pedido no contiene ningún producto para aprobar.");
      return;
    }

    setProcesandoAccion(true);

    try {
      const skus = itemsList.map((i) => i.id);

      // 1. Revalidar stock actual directamente en Supabase para evitar condiciones de carrera
      const { data: prodsActuales, error: errFetch } = await supabase
        .from("productos")
        .select("id, sku, stock, nombre")
        .in("sku", skus);

      if (errFetch || !prodsActuales) {
        mostrarAlerta("error", "Error al verificar el stock actual en base de datos.");
        setProcesandoAccion(false);
        return;
      }

      // 2. Verificar que cada ítem tenga stock suficiente
      const productosFaltantes: string[] = [];
      const mapaProds = new Map<string, { id: number; stock: number; nombre: string }>();
      prodsActuales.forEach((p) => {
        mapaProds.set(p.sku, { id: p.id, stock: Number(p.stock) || 0, nombre: p.nombre });
      });

      for (const item of itemsList) {
        const prod = mapaProds.get(item.id);
        if (!prod) {
          productosFaltantes.push(`"${item.name}" (SKU ${item.id}) no existe en catálogo`);
        } else if (prod.stock < item.quantity) {
          productosFaltantes.push(
            `"${prod.nombre}" (SKU ${item.id}): se solicitan ${item.quantity}, pero solo hay ${prod.stock} disponibles`
          );
        }
      }

      // Si algún producto no tiene stock suficiente, abortar
      if (productosFaltantes.length > 0) {
        mostrarAlerta(
          "error",
          `No se puede aprobar. Stock insuficiente:\n• ${productosFaltantes.join("\n• ")}`
        );
        setProcesandoAccion(false);
        return;
      }

      // 3. Descontar stock para cada producto en la tabla productos
      for (const item of itemsList) {
        const prod = mapaProds.get(item.id)!;
        const nuevoStock = prod.stock - item.quantity;

        const { error: errStock } = await supabase
          .from("productos")
          .update({ stock: nuevoStock })
          .eq("sku", item.id);

        if (errStock) {
          console.error(`Error al descontar stock para SKU ${item.id}:`, errStock);
          mostrarAlerta("error", `Error al descontar stock para "${prod.nombre}".`);
          setProcesandoAccion(false);
          return;
        }
      }

      // 4. Actualizar estado del pedido a "Aprobado"
      const { error: errPedido } = await supabase
        .from("pedidos")
        .update({ estado: ESTADOS_PEDIDO.APROBADO })
        .eq("id", pedido.id);

      if (errPedido) {
        console.error("Error al actualizar estado del pedido:", errPedido);
        mostrarAlerta("error", "Se descontó el stock pero hubo un error al actualizar el estado del pedido.");
      } else {
        mostrarAlerta("success", `Pedido #${pedido.id} aprobado con éxito. Se descontó el stock de los productos.`);
        await fetchPedidos();
        setPedidoDetalle((prev) => (prev && prev.id === pedido.id ? { ...prev, estado: ESTADOS_PEDIDO.APROBADO } : null));
      }
    } catch (err) {
      console.error("Error durante la aprobación del pedido:", err);
      mostrarAlerta("error", "Ocurrió un error inesperado al procesar la aprobación.");
    } finally {
      setProcesandoAccion(false);
    }
  }

  // -------------------------------------------------------------
  // FLUJO DE RECHAZO: No descuenta stock y guarda nota opcional
  // -------------------------------------------------------------
  async function confirmarRechazo() {
    if (!pedidoDetalle) return;
    setProcesandoAccion(true);

    try {
      await actualizarEstado(pedidoDetalle.id, ESTADOS_PEDIDO.RECHAZADO, motivoRechazo.trim() || undefined);
      setModalRechazoOpen(false);
      setMotivoRechazo("");
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function eliminarPedido(id: number) {
    if (!confirm(`¿Estás seguro de eliminar el pedido #${id}? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase.from("pedidos").delete().eq("id", id);

    if (!error) {
      mostrarAlerta("success", `Pedido #${id} eliminado correctamente`);
      setPedidoDetalle(null);
      fetchPedidos();
    } else {
      console.error("Error deleting order:", error);
      mostrarAlerta("error", "Error al eliminar el pedido.");
    }
  }

  // Conteo de pedidos pendientes de revisión
  const countPendientes = pedidos.filter((p) => p.estado === ESTADOS_PEDIDO.PENDIENTE_REVISION).length;

  // Filtrado de pedidos
  const filtrados = pedidos.filter((p) => {
    const coincideBusqueda =
      p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cliente_email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.cliente_telefono && p.cliente_telefono.includes(busqueda)) ||
      p.id.toString().includes(busqueda);

    const coincideEstado = estadoFiltro === "all" || p.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  // Items del pedido seleccionado
  const itemsDetalle = pedidoDetalle ? parseItems(pedidoDetalle.items) : [];

  // Comprobar si hay artículos con stock insuficiente en el pedido seleccionado
  const algunItemSinStock = itemsDetalle.some((item) => {
    const info = stockMap[item.id];
    if (!info) return false;
    return info.stock < item.quantity;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Alerta flotante de mensajes */}
      {mensaje && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 animate-fade-in transition-all ${
            mensaje.tipo === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <span>{mensaje.tipo === "success" ? "✅" : "⚠️"}</span>
          <span className="whitespace-pre-line">{mensaje.texto}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1
            className="font-black uppercase text-4xl leading-none text-[#1A1A1A]"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Gestión de <span style={{ color: "#1B87C8" }}>Pedidos</span>
          </h1>
          <p className="text-sm mt-1 text-gray-500">
            {pedidos.length} pedidos registrados · Modelo de pre-compra con revisión previa
          </p>
        </div>

        {countPendientes > 0 && (
          <div
            onClick={() => setEstadoFiltro(ESTADOS_PEDIDO.PENDIENTE_REVISION)}
            className="cursor-pointer bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl flex items-center gap-3 hover:bg-amber-100/70 transition-all shadow-xs"
          >
            <span className="text-2xl animate-pulse">⏳</span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wide text-amber-800">
                Atención requerida
              </div>
              <div className="text-sm font-black text-amber-900">
                {countPendientes} {countPendientes === 1 ? "solicitud pendiente" : "solicitudes pendientes"} de revisión
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buscador e Interfaz de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div
          className="flex rounded-full overflow-hidden w-full md:max-w-md border"
          style={{ background: "#F0F7FD", borderColor: "#D6EAF8" }}
        >
          <input
            type="text"
            placeholder="Buscar por ID, cliente, email o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 px-5 py-2.5 text-sm outline-none bg-transparent"
          />
          <span className="px-4 flex items-center text-gray-400">🔍</span>
        </div>

        {/* Barra de Filtros de Estado */}
        <div className="flex gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setEstadoFiltro("all")}
            className="text-xs font-bold px-4 py-2 rounded-full border transition-all whitespace-nowrap"
            style={
              estadoFiltro === "all"
                ? { background: "#1B87C8", color: "white", borderColor: "#1B87C8" }
                : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
            }
          >
            Todos ({pedidos.length})
          </button>

          {LISTA_ESTADOS_ADMIN.map((est) => {
            const countEstado = pedidos.filter((p) => p.estado === est.value).length;
            const esActivo = estadoFiltro === est.value;
            const esPendiente = est.value === ESTADOS_PEDIDO.PENDIENTE_REVISION;

            return (
              <button
                key={est.value}
                onClick={() => setEstadoFiltro(est.value)}
                className={`text-xs font-bold px-3.5 py-2 rounded-full border transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  esPendiente && countEstado > 0 && !esActivo ? "ring-2 ring-amber-400/50" : ""
                }`}
                style={
                  esActivo
                    ? { background: est.color, color: "white", borderColor: est.color }
                    : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
                }
              >
                <span>{est.icon}</span>
                <span>{est.label}</span>
                <span
                  className="ml-1 px-1.5 py-0.2 rounded-full text-[10px]"
                  style={{
                    background: esActivo ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                    color: esActivo ? "white" : "#666",
                  }}
                >
                  {countEstado}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tabla de Pedidos */}
        <div
          className="lg:col-span-2 bg-white rounded-xl overflow-hidden self-start shadow-xs"
          style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  {["Solicitud", "Cliente", "Fecha", "Total", "Estado", "Acciones"].map((h) => (
                    <th key={h} className="px-5 py-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      <div className="animate-pulse">Cargando solicitudes de pedidos...</div>
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      No se encontraron pedidos con el criterio seleccionado.
                    </td>
                  </tr>
                ) : (
                  filtrados.map((p) => {
                    const cfg = ESTADOS_CONFIG[p.estado] || {
                      label: p.estado,
                      color: "#64748B",
                      bg: "rgba(100,116,139,0.1)",
                      icon: "📋",
                    };
                    const dateStr = p.created_at || p.fecha || "";
                    const dateObj = dateStr ? new Date(dateStr) : null;
                    const dateFormatted = dateObj
                      ? dateObj.toLocaleDateString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Sin fecha";

                    const esSeleccionado = pedidoDetalle?.id === p.id;
                    const esPendiente = p.estado === ESTADOS_PEDIDO.PENDIENTE_REVISION;

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-gray-50/70 transition-colors cursor-pointer ${
                          esSeleccionado ? "bg-blue-50/30" : ""
                        }`}
                        onClick={() => setPedidoDetalle(p)}
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#1B87C8]">#{p.id}</div>
                          {esPendiente && (
                            <span className="inline-block mt-0.5 text-[10px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                              ⏳ Por revisar
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{p.cliente_nombre || "Cliente Anónimo"}</div>
                          <div className="text-xs text-gray-400">{p.cliente_email || "sin-email@correo.com"}</div>
                          {p.cliente_telefono && (
                            <div className="text-[11px] text-gray-500 font-mono mt-0.5">📞 {p.cliente_telefono}</div>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">{dateFormatted}</td>
                        <td className="px-5 py-4 font-bold text-gray-900">
                          ${p.total ? p.total.toLocaleString("es-AR") : "0"}
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                            style={{
                              borderColor: `${cfg.color}40`,
                              color: cfg.color,
                              background: cfg.bg,
                            }}
                          >
                            <span>{cfg.icon}</span>
                            <span>{cfg.label}</span>
                          </span>
                        </td>
                        <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPedidoDetalle(p)}
                              className="px-3 py-1 rounded text-xs font-bold transition-all text-[#1B87C8] hover:bg-[#1B87C815]"
                              style={{ border: "1px solid #1B87C840" }}
                            >
                              Revisar
                            </button>
                            <button
                              onClick={() => eliminarPedido(p.id)}
                              className="px-2.5 py-1 rounded text-xs font-bold transition-all text-red-500 hover:bg-red-50"
                              style={{ border: "1px solid rgba(220,38,38,0.2)" }}
                              title="Eliminar pedido"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel Lateral: Detalle e Inspección de Stock */}
        <div className="lg:col-span-1">
          {pedidoDetalle ? (
            <div
              className="bg-white rounded-xl p-6 flex flex-col gap-5 sticky top-24 shadow-sm"
              style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
            >
              {/* Encabezado del Detalle */}
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Solicitud de Pre-compra</div>
                  <h3
                    className="font-black text-2xl uppercase text-gray-900"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    Pedido <span className="text-[#1B87C8]">#{pedidoDetalle.id}</span>
                  </h3>
                  <span className="text-xs text-gray-400">
                    {pedidoDetalle.created_at || pedidoDetalle.fecha
                      ? new Date(pedidoDetalle.created_at || pedidoDetalle.fecha!).toLocaleString("es-AR")
                      : ""}
                  </span>
                </div>
                <button
                  onClick={() => setPedidoDetalle(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg p-1.5 hover:bg-gray-100 rounded-full transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Acciones principales de revisión */}
              {pedidoDetalle.estado === ESTADOS_PEDIDO.PENDIENTE_REVISION && (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-900">
                    <span>⚡</span> Revisión de Stock y Disponibilidad
                  </div>

                  {algunItemSinStock && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 leading-snug">
                      <strong>⚠️ Stock insuficiente:</strong> Uno o más productos solicitados superan el stock disponible
                      actual en el sistema. No se puede aprobar hasta reponer stock o coordinar con el cliente.
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => aprobarPedido(pedidoDetalle)}
                      disabled={procesandoAccion || algunItemSinStock}
                      className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <span>✓</span> {procesandoAccion ? "Procesando..." : "Aprobar pedido"}
                    </button>

                    <button
                      onClick={() => {
                        setMotivoRechazo("");
                        setModalRechazoOpen(true);
                      }}
                      disabled={procesandoAccion}
                      className="flex-1 py-2.5 px-3 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>✕</span> Rechazar
                    </button>
                  </div>
                </div>
              )}

              {/* Si está Aprobado: botón para marcar como Contactado */}
              {pedidoDetalle.estado === ESTADOS_PEDIDO.APROBADO && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col gap-2">
                  <div className="text-xs text-emerald-800">
                    <strong>✓ Pedido Aprobado:</strong> El stock ya fue descontado del catálogo. El siguiente paso es
                    contactar al cliente para cobrar y coordinar entrega.
                  </div>
                  <button
                    onClick={() => actualizarEstado(pedidoDetalle.id, ESTADOS_PEDIDO.CONTACTADO)}
                    disabled={procesandoAccion}
                    className="w-full py-2 bg-[#1B87C8] hover:bg-[#1569A0] text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span>📞</span> Marcar como Contactado
                  </button>
                </div>
              )}

              {/* Si está Rechazado */}
              {pedidoDetalle.estado === ESTADOS_PEDIDO.RECHAZADO && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
                  <div className="font-bold">❌ Solicitud Rechazada</div>
                  <div className="text-[11px] mt-0.5 text-red-700">
                    No se descontó stock de ningún producto.
                  </div>
                  {pedidoDetalle.nota_staff && (
                    <div className="mt-2 bg-white/70 p-2 rounded border border-red-100 text-xs">
                      <strong>Motivo:</strong> {pedidoDetalle.nota_staff}
                    </div>
                  )}
                </div>
              )}

              {/* Si está Contactado */}
              {pedidoDetalle.estado === ESTADOS_PEDIDO.CONTACTADO && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                  <div className="font-bold">📞 Cliente Contactado</div>
                  <div className="text-[11px] mt-0.5 text-blue-800">
                    Se coordinó la operación. El pedido puede continuar su entrega normalmente.
                  </div>
                </div>
              )}

              {/* Información del Cliente */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Datos de Contacto del Cliente
                </h4>
                <div className="bg-gray-50 rounded-xl p-3 text-xs flex flex-col gap-1.5 border border-gray-100">
                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span>👤</span> {pedidoDetalle.cliente_nombre}
                  </div>
                  <div className="text-gray-600 flex items-center gap-1.5">
                    <span>📧</span> {pedidoDetalle.cliente_email}
                  </div>
                  <div className="text-gray-600 flex items-center gap-1.5">
                    <span>📱</span>{" "}
                    {pedidoDetalle.cliente_telefono ? (
                      <span className="font-semibold text-gray-800">{pedidoDetalle.cliente_telefono}</span>
                    ) : (
                      <span className="text-gray-400 italic">No proporcionó teléfono</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Método de Entrega y Pago */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Entrega y Forma de Pago
                </h4>
                <div className="flex flex-col gap-2">
                  {/* Entrega */}
                  {pedidoDetalle.metodo_entrega === "domicilio" ? (
                    <div className="bg-[#F0F7FD] border border-[#D6EAF8] rounded-xl p-3 text-xs">
                      <div className="font-bold text-gray-900 mb-1 flex items-center gap-1">
                        <span>🚚</span> Envío a Domicilio
                      </div>
                      {pedidoDetalle.direccion_envio ? (
                        <div className="text-gray-600 leading-snug">
                          <p className="font-medium text-gray-800">
                            {pedidoDetalle.direccion_envio.calle} {pedidoDetalle.direccion_envio.altura}
                            {pedidoDetalle.direccion_envio.piso ? ` (Piso/Dpto: ${pedidoDetalle.direccion_envio.piso})` : ""}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {pedidoDetalle.direccion_envio.localidad}, {pedidoDetalle.direccion_envio.provincia} (CP:{" "}
                            {pedidoDetalle.direccion_envio.codigoPostal})
                          </p>
                          {pedidoDetalle.direccion_envio.indicaciones && (
                            <p className="text-[11px] italic text-gray-500 mt-1">
                              Ref: {pedidoDetalle.direccion_envio.indicaciones}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-400 italic">Sin dirección especificada</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-3 text-xs">
                      <div className="font-bold text-emerald-950 flex items-center gap-1">
                        <span>🏪</span> Retiro en el Local
                      </div>
                      <p className="text-emerald-800 text-[11px] mt-0.5">Ignacio Crespo 1136, Recreo (Santa Fe)</p>
                    </div>
                  )}

                  {/* Forma de pago preferida */}
                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Forma de pago preferida:</span>
                    <span className="font-bold text-gray-800">{pedidoDetalle.forma_pago || "A convenir"}</span>
                  </div>
                </div>
              </div>

              {/* Lista de Productos con Comparación de Stock */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Productos y Stock ({itemsDetalle.length})
                  </h4>
                  {cargandoStock && <span className="text-[10px] text-gray-400 animate-pulse">Consultando stock...</span>}
                </div>

                <div className="flex flex-col gap-2.5 max-h-64 overflow-y-auto pr-1">
                  {itemsDetalle.map((item, idx) => {
                    const infoStock = stockMap[item.id];
                    const stockDisponible = infoStock ? infoStock.stock : 0;
                    const stockSuficiente = stockDisponible >= item.quantity;
                    const encontrado = infoStock?.encontrado;

                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 border transition-all ${
                          !stockSuficiente
                            ? "bg-red-50/50 border-red-200"
                            : "bg-[#F0F7FD] border-[#D6EAF8]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="text-xl w-9 h-9 bg-white rounded-md flex items-center justify-center flex-shrink-0 border border-black/5 shadow-2xs">
                            {item.icon || "🔌"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-gray-900 truncate">{item.name}</div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>SKU: {item.id}</span>
                              {item.brand && <span>· {item.brand}</span>}
                            </div>

                            {/* Comparación de stock */}
                            <div className="mt-2 flex items-center justify-between">
                              <div className="text-xs">
                                <span className="font-bold text-gray-700">Pide: x{item.quantity}</span>
                              </div>

                              {cargandoStock ? (
                                <span className="text-[10px] text-gray-400">Verificando...</span>
                              ) : !encontrado ? (
                                <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  SKU no hallado
                                </span>
                              ) : stockSuficiente ? (
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span>✓</span> {stockDisponible} en stock
                                </span>
                              ) : (
                                <span className="text-[11px] font-black text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                  <span>⚠️</span> Solo hay {stockDisponible}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right text-xs font-bold text-gray-800 border-t border-black/5 pt-1.5 mt-2">
                          ${(item.price * item.quantity).toLocaleString("es-AR")}
                          <span className="text-[10px] text-gray-400 font-normal ml-1">
                            (${item.price.toLocaleString("es-AR")} c/u)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desglose de Total y Acciones Finales */}
              <div className="border-t pt-4 mt-1 flex flex-col gap-3">
                <div className="flex flex-col gap-1 text-xs text-gray-500">
                  <div className="flex justify-between">
                    <span>Subtotal productos:</span>
                    <span>
                      $
                      {itemsDetalle
                        .reduce((acc, i) => acc + i.price * i.quantity, 0)
                        .toLocaleString("es-AR")}
                    </span>
                  </div>
                  {pedidoDetalle.metodo_entrega === "domicilio" && (
                    <div className="flex justify-between">
                      <span>Costo de envío:</span>
                      <span>
                        ${Number(pedidoDetalle.costo_envio || 0).toLocaleString("es-AR")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-dashed pt-2">
                  <span className="font-bold text-gray-700 text-sm">Total a coordinar:</span>
                  <span
                    className="font-black text-2xl text-[#1B87C8]"
                    style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                  >
                    ${pedidoDetalle.total ? pedidoDetalle.total.toLocaleString("es-AR") : "0"}
                  </span>
                </div>

                {/* Cambio manual de estado si es necesario */}
                <div className="border-t pt-3">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Cambiar estado manualmente:
                  </label>
                  <select
                    value={pedidoDetalle.estado}
                    onChange={(e) => actualizarEstado(pedidoDetalle.id, e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 outline-none bg-white cursor-pointer hover:border-[#1B87C8] transition-all"
                  >
                    {LISTA_ESTADOS_ADMIN.map((e) => (
                      <option key={e.value} value={e.value}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => eliminarPedido(pedidoDetalle.id)}
                  className="w-full font-bold text-xs uppercase tracking-wider py-2 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 transition-all text-center mt-1"
                >
                  🗑️ Eliminar Registro
                </button>
              </div>
            </div>
          ) : (
            <div
              className="bg-gray-50 border border-dashed rounded-xl p-10 text-center text-gray-400 sticky top-24"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-semibold text-sm text-gray-700">Seleccioná un pedido</p>
              <p className="text-xs mt-1 text-gray-400">
                Hacé clic en cualquier fila para inspeccionar los productos, comparar el stock disponible y gestionar la
                aprobación.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para ingresar motivo de rechazo */}
      {modalRechazoOpen && pedidoDetalle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3
                className="font-black text-2xl uppercase text-red-600"
                style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
              >
                Rechazar Pedido #{pedidoDetalle.id}
              </h3>
              <button
                onClick={() => setModalRechazoOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              El estado pasará a <strong>Rechazado</strong>. No se descontará stock de ningún producto. Podés registrar
              un motivo u observación interna para el equipo.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                Motivo del rechazo (opcional):
              </label>
              <textarea
                rows={3}
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                placeholder="Ej. Sin stock en depósito y proveedor no tiene entrega; zona de entrega fuera de radio..."
                className="w-full text-xs p-3 rounded-lg border border-gray-200 outline-none focus:border-red-400 resize-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setModalRechazoOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarRechazo}
                disabled={procesandoAccion}
                className="px-5 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all shadow-xs"
              >
                {procesandoAccion ? "Procesando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}