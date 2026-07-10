"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  icon?: string;
}

interface Pedido {
  id: number;
  cliente_nombre: string;
  cliente_email: string;
  total: number;
  items: OrderItem[] | string; // Can be JSON array or stringified JSON
  estado: "Pendiente" | "Preparando" | "Enviado" | "Completado" | "Cancelado";
  created_at?: string;
  fecha?: string;
}

const ESTADOS = [
  { value: "Pendiente", color: "#F5A623", bg: "rgba(245,166,35,0.1)" },
  { value: "Preparando", color: "#1B87C8", bg: "rgba(27,135,200,0.1)" },
  { value: "Enviado", color: "#805AD5", bg: "rgba(128,90,213,0.1)" },
  { value: "Completado", color: "#38A169", bg: "rgba(56,161,105,0.1)" },
  { value: "Cancelado", color: "#DC2626", bg: "rgba(220,38,38,0.1)" },
];

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("all");
  const [pedidoDetalle, setPedidoDetalle] = useState<Pedido | null>(null);

  useEffect(() => {
    fetchPedidos();
  }, []);

  async function fetchPedidos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("id", { ascending: false });

    if (!error && data) {
      setPedidos(data);
    } else {
      console.error("Error fetching orders:", error);
    }
    setLoading(false);
  }

  async function actualizarEstado(id: number, nuevoEstado: string) {
    const { error } = await supabase
      .from("pedidos")
      .update({ estado: nuevoEstado })
      .eq("id", id);

    if (!error) {
      setMensaje(`Pedido #${id} actualizado a ${nuevoEstado}`);
      fetchPedidos();
      if (pedidoDetalle && pedidoDetalle.id === id) {
        setPedidoDetalle(prev => prev ? { ...prev, estado: nuevoEstado as Pedido["estado"] } : null);
      }
      setTimeout(() => setMensaje(""), 3000);
    } else {
      console.error("Error updating order status:", error);
    }
  }

  async function eliminarPedido(id: number) {
    if (!confirm(`¿Estás seguro de eliminar el pedido #${id}? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase
      .from("pedidos")
      .delete()
      .eq("id", id);

    if (!error) {
      setMensaje(`Pedido #${id} eliminado correctamente`);
      setPedidoDetalle(null);
      fetchPedidos();
      setTimeout(() => setMensaje(""), 3000);
    } else {
      console.error("Error deleting order:", error);
    }
  }

  // Helper to parse items safely
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

  // Filter orders
  const filtrados = pedidos.filter(p => {
    const coincideBusqueda =
      p.cliente_nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.cliente_email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.id.toString().includes(busqueda);
    
    const coincideEstado = estadoFiltro === "all" || p.estado === estadoFiltro;

    return coincideBusqueda && coincideEstado;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Mensaje de alerta */}
      {mensaje && (
        <div
          className="rounded-lg px-4 py-3 text-sm font-medium flex items-center gap-2 animate-fade-in transition-all"
          style={{ background: "rgba(22,163,74,0.08)", color: "#16A34A", border: "1px solid rgba(22,163,74,0.2)" }}
        >
          <span>✅</span> {mensaje}
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
            {pedidos.length} pedidos registrados en total
          </p>
        </div>
      </div>

      {/* Buscador e Interfaz de Filtros */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div
          className="flex rounded-full overflow-hidden w-full md:max-w-md border"
          style={{ background: "#F0F7FD", borderColor: "#D6EAF8" }}
        >
          <input
            type="text"
            placeholder="Buscar por ID, nombre o email del cliente..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="flex-1 px-5 py-2.5 text-sm outline-none bg-transparent"
          />
          <span className="px-4 flex items-center text-gray-400">🔍</span>
        </div>

        <div className="flex gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setEstadoFiltro("all")}
            className="text-xs font-bold px-4 py-2 rounded-full border transition-all"
            style={
              estadoFiltro === "all"
                ? { background: "#1B87C8", color: "white", borderColor: "#1B87C8" }
                : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
            }
          >
            Todos
          </button>
          {ESTADOS.map(est => (
            <button
              key={est.value}
              onClick={() => setEstadoFiltro(est.value)}
              className="text-xs font-bold px-4 py-2 rounded-full border transition-all"
              style={
                estadoFiltro === est.value
                  ? { background: est.color, color: "white", borderColor: est.color }
                  : { background: "white", color: "#555", borderColor: "rgba(0,0,0,0.1)" }
              }
            >
              {est.value}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Contenedor Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tabla de Pedidos */}
        <div
          className="lg:col-span-2 bg-white rounded-xl overflow-hidden self-start"
          style={{ border: "1.5px solid rgba(0,0,0,0.08)" }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ background: "#F0F7FD", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  {["Pedido", "Cliente", "Fecha", "Total", "Estado", "Acciones"].map(h => (
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
                      <div className="animate-pulse">Cargando pedidos...</div>
                    </td>
                  </tr>
                ) : filtrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                      No se encontraron pedidos registrados.
                    </td>
                  </tr>
                ) : (
                  filtrados.map(p => {
                    const est = ESTADOS.find(e => e.value === p.estado) || ESTADOS[0];
                    const dateStr = p.created_at || p.fecha || "";
                    const dateObj = dateStr ? new Date(dateStr) : null;
                    const dateFormatted = dateObj 
                      ? dateObj.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
                      : "Sin fecha";

                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-gray-50/50 transition-colors cursor-pointer ${pedidoDetalle?.id === p.id ? "bg-blue-50/20" : ""}`}
                        onClick={() => setPedidoDetalle(p)}
                      >
                        <td className="px-5 py-4 font-bold text-[#1B87C8]">
                          #{p.id}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-gray-900">{p.cliente_nombre || "Cliente Anónimo"}</div>
                          <div className="text-xs text-gray-400">{p.cliente_email || "sin-email@correo.com"}</div>
                        </td>
                        <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
                          {dateFormatted}
                        </td>
                        <td className="px-5 py-4 font-bold text-gray-900">
                          ${p.total ? p.total.toLocaleString("es-AR") : "0"}
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <select
                            value={p.estado}
                            onChange={e => actualizarEstado(p.id, e.target.value)}
                            className="text-xs font-bold px-2.5 py-1 rounded-full border outline-none cursor-pointer transition-all"
                            style={{
                              borderColor: est.color,
                              color: est.color,
                              background: est.bg
                            }}
                          >
                            {ESTADOS.map(e => (
                              <option key={e.value} value={e.value} style={{ color: "#1A1A1A", background: "#ffffff" }}>
                                {e.value}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPedidoDetalle(p)}
                              className="px-3 py-1 rounded text-xs font-bold transition-all text-[#1B87C8] hover:bg-[#1B87C810]"
                              style={{ border: "1px solid #1B87C830" }}
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => eliminarPedido(p.id)}
                              className="px-3 py-1 rounded text-xs font-bold transition-all text-red-500 hover:bg-red-50"
                              style={{ border: "1px solid rgba(220,38,38,0.15)" }}
                            >
                              Eliminar
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

        {/* Detalle del Pedido Lateral */}
        <div className="lg:col-span-1">
          {pedidoDetalle ? (
            <div
              className="bg-white rounded-xl p-6 flex flex-col gap-5 sticky top-24"
              style={{ border: "1.5px solid rgba(0,0,0,0.08)", boxShadow: "0 4px 20px rgba(0,0,0,0.02)" }}
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-black text-2xl uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Detalle Pedido <span className="text-[#1B87C8]">#{pedidoDetalle.id}</span>
                  </h3>
                  <span className="text-xs text-gray-400">
                    {pedidoDetalle.created_at || pedidoDetalle.fecha ? new Date(pedidoDetalle.created_at || pedidoDetalle.fecha!).toLocaleString("es-AR") : ""}
                  </span>
                </div>
                <button 
                  onClick={() => setPedidoDetalle(null)} 
                  className="text-gray-400 hover:text-gray-600 text-lg p-1.5 hover:bg-gray-100 rounded-full transition-all"
                >
                  ✕
                </button>
              </div>

              {/* Cliente */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Información del Cliente</h4>
                <div className="bg-gray-50 rounded-xl p-3 text-sm flex flex-col gap-1 border border-gray-100">
                  <div className="font-bold text-gray-800">👤 {pedidoDetalle.cliente_nombre}</div>
                  <div className="text-gray-500">📧 {pedidoDetalle.cliente_email}</div>
                </div>
              </div>

              {/* Estado */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Estado del Pedido</h4>
                <div className="flex gap-2">
                  {ESTADOS.map(est => {
                    const esActivo = pedidoDetalle.estado === est.value;
                    return (
                      <button
                        key={est.value}
                        onClick={() => actualizarEstado(pedidoDetalle.id, est.value)}
                        className="flex-1 py-2 text-[10px] font-bold uppercase rounded-lg border transition-all"
                        style={{
                          borderColor: esActivo ? est.color : "rgba(0,0,0,0.08)",
                          color: esActivo ? "white" : "#777",
                          background: esActivo ? est.color : "transparent"
                        }}
                      >
                        {est.value}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Productos Compra</h4>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {parseItems(pedidoDetalle.items).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-[#F0F7FD] rounded-lg p-2.5 border border-[#D6EAF8]">
                      <div className="text-xl w-9 h-9 bg-white rounded-md flex items-center justify-center flex-shrink-0">
                        {item.icon || "🔌"}
                      </div>
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="font-bold text-gray-800 truncate">{item.name}</div>
                        <div className="text-gray-400">{item.brand} | x{item.quantity}</div>
                      </div>
                      <div className="text-right font-bold text-xs text-gray-800">
                        ${(item.price * item.quantity).toLocaleString("es-AR")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total y Acciones */}
              <div className="border-t pt-4 mt-2 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-500 text-sm">Monto Total:</span>
                  <span className="font-black text-2xl text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    ${pedidoDetalle.total ? pedidoDetalle.total.toLocaleString("es-AR") : "0"}
                  </span>
                </div>
                <button
                  onClick={() => eliminarPedido(pedidoDetalle.id)}
                  className="w-full font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg text-red-500 hover:bg-red-50 border border-red-200 transition-all text-center"
                >
                  🗑️ Eliminar Registro de Compra
                </button>
              </div>
            </div>
          ) : (
            <div
              className="bg-gray-50 border border-dashed rounded-xl p-10 text-center text-gray-400 sticky top-24"
              style={{ borderColor: "rgba(0,0,0,0.12)" }}
            >
              <div className="text-5xl mb-3">🛒</div>
              <p className="font-semibold text-sm">Selecciona un pedido</p>
              <p className="text-xs mt-1">Haz clic en cualquier fila para inspeccionar los productos y detalles de la compra.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}