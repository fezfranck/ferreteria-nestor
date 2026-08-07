"use client";
import { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import AddressForm, { Direccion } from "./AddressForm";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const DIRECCION_LOCAL: Direccion = {
  provincia: "Santa Fe",
  localidad: "Recreo",
  calle: "Ignacio Crespo",
  altura: "1136",
  piso: "",
  indicaciones: "Retiro en el local",
  codigoPostal: "3018",
  lat: null,
  lon: null
};

export default function CartDrawer({ isOpen, onClose }: Props) {
  const { items, addItem, removeItem, decrementItem, total, count, clearCart } = useCart();
  const { user } = useAuth();

  // Estados de checkout
  const [comprando, setComprando] = useState(false);
  const [checkoutExitoso, setCheckoutExitoso] = useState(false);
  const [pedidoId, setPedidoId] = useState<number | null>(null);

  // Formulario para invitado
  const [mostrarFormInvitado, setMostrarFormInvitado] = useState(false);
  const [invitadoNombre, setInvitadoNombre] = useState("");
  const [invitadoEmail, setInvitadoEmail] = useState("");
  const [invitadoTelefono, setInvitadoTelefono] = useState("");
  const [errorForm, setErrorForm] = useState("");

  // Paso de dirección
  const [mostrarFormDireccion, setMostrarFormDireccion] = useState(false);
  const [direccion, setDireccion] = useState<Direccion | null>(null);

  // Nuevos estados para método de entrega, resumen y pagos
  const [costoEnvioConfig, setCostoEnvioConfig] = useState<number>(0);
  const [formasPagoConfig, setFormasPagoConfig] = useState<string[]>([]);
  const [mostrarMetodoEntrega, setMostrarMetodoEntrega] = useState(false);
  const [metodoEntrega, setMetodoEntrega] = useState<"domicilio" | "retiro" | null>(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [formaPago, setFormaPago] = useState<string>("");

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from("configuracion")
          .select("costo_envio, formas_pago")
          .eq("id", 1)
          .single();
        if (!error && data) {
          setCostoEnvioConfig(Number(data.costo_envio) || 0);
          setFormasPagoConfig(data.formas_pago || ["Efectivo", "Transferencia bancaria"]);
        } else {
          setCostoEnvioConfig(0);
          setFormasPagoConfig(["Efectivo", "Transferencia bancaria"]);
        }
      } catch (err) {
        console.error("Error cargando configuracion de envío:", err);
        setCostoEnvioConfig(0);
        setFormasPagoConfig(["Efectivo", "Transferencia bancaria"]);
      }
    }
    if (isOpen) {
      fetchConfig();
    }
  }, [isOpen]);

  async function procesarCompra(nombre: string, email: string, telefono: string, direccionEnvio: Direccion | null) {
    setComprando(true);
    setErrorForm("");

    const finalCostoEnvio = metodoEntrega === "domicilio" ? costoEnvioConfig : 0;
    const totalPedido = total + finalCostoEnvio;

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .insert([
          {
            cliente_nombre: nombre,
            cliente_email: email,
            total: totalPedido,
            items: items.map(item => ({
              id: item.id,
              name: item.name,
              brand: item.brand,
              price: item.price,
              quantity: item.quantity,
              icon: item.icon
            })),
            direccion_envio: direccionEnvio,
            estado: "Pendiente",
            created_at: new Date().toISOString(),
            metodo_entrega: metodoEntrega,
            costo_envio: finalCostoEnvio,
            forma_pago: formaPago
          }
        ])
        .select();

      if (error) {
        console.error("Error creating order:", error);
        setErrorForm("No pudimos registrar tu compra. Intentalo de nuevo.");
      } else {
        const nuevoId = data && data[0] ? data[0].id : Math.floor(1000 + Math.random() * 9000);
        setPedidoId(nuevoId);
        setCheckoutExitoso(true);
        clearCart();
      }
    } catch (err) {
      console.error("Connection error:", err);
      setErrorForm("Error de conexión al procesar la compra.");
    } finally {
      setComprando(false);
    }
  }

  function handleFinalizarClick() {
    if (user) {
      // Usuario logueado: directo al paso de método de entrega
      setMostrarMetodoEntrega(true);
    } else {
      // Invitado: primero pedimos datos de contacto
      setMostrarFormInvitado(true);
    }
  }

  function handleFormInvitadoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!invitadoNombre.trim() || !invitadoEmail.trim()) {
      setErrorForm("Por favor completa los campos requeridos.");
      return;
    }
    setErrorForm("");
    setMostrarFormInvitado(false);
    setMostrarMetodoEntrega(true);
  }

  function handleDireccionValida(direccionRecibida: Direccion) {
    setDireccion(direccionRecibida);
  }

  function handleConfirmarPedido() {
    if (user) {
      procesarCompra(user.nombre, user.email, "", direccion);
    } else {
      procesarCompra(invitadoNombre, invitadoEmail, invitadoTelefono, direccion);
    }
  }

  function handleVolverDesdeDireccion() {
    setMostrarFormDireccion(false);
    setMostrarMetodoEntrega(true);
    setDireccion(null);
  }

  function resetState() {
    setCheckoutExitoso(false);
    setPedidoId(null);
    setMostrarFormInvitado(false);
    setMostrarMetodoEntrega(false);
    setMostrarFormDireccion(false);
    setMostrarResumen(false);
    setMetodoEntrega(null);
    setDireccion(null);
    setFormaPago("");
    setInvitadoNombre("");
    setInvitadoEmail("");
    setInvitadoTelefono("");
    setErrorForm("");
    onClose();
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "#fafafa",
    color: "#1A1A1A"
  };

  return (
    <>
      {/* FONDO OSCURO */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={resetState}
        />
      )}

      {/* PANEL LATERAL */}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}>

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/8 flex-shrink-0">
          <div>
            <h2 className="font-bold text-lg">Mi carrito</h2>
            <p className="text-sm text-gray-400">{count} {count === 1 ? "producto" : "productos"}</p>
          </div>
          <button
            onClick={resetState}
            className="text-gray-400 hover:text-black text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">

          {checkoutExitoso ? (
            /* COMPRA EXITOSA */
            <div className="flex flex-col items-center justify-center text-center gap-4 py-10 my-auto animate-fade-in">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-5xl border border-green-200">
                🎉
              </div>
              <h3 className="font-black text-3xl uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                ¡Compra Exitosa!
              </h3>
              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Registramos tu pedido <span className="font-bold text-[#1B87C8]">#{pedidoId}</span> correctamente. En breve nos pondremos en contacto contigo para coordinar el pago y el envío.
              </p>
              <div className="bg-[#F0F7FD] border border-[#D6EAF8] rounded-xl p-4 text-xs text-[#1B87C8] font-semibold mt-2">
                ¡Gracias por confiar en Electricidad Néstor!
              </div>
              <button
                onClick={resetState}
                className="mt-6 bg-[#1B87C8] hover:bg-[#1569A0] text-white text-sm font-semibold px-8 py-3 rounded-full transition-colors w-full"
              >
                Cerrar y seguir comprando
              </button>
            </div>
          ) : items.length === 0 ? (
            /* CARRITO VACÍO */
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 my-auto">
              <div className="text-6xl">🛒</div>
              <p className="font-semibold text-gray-600">Tu carrito está vacío</p>
              <p className="text-sm text-gray-400">Agregá productos para empezar</p>
              <button
                onClick={onClose}
                className="mt-4 bg-[#1B87C8] text-white text-sm font-semibold px-6 py-2 rounded-full hover:bg-[#1569A0] transition-colors"
              >
                Ver productos
              </button>
            </div>
          ) : mostrarResumen ? (
            /* PASO DE RESUMEN DEL PEDIDO */
            <div className="flex flex-col gap-4 py-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-base text-gray-900">Resumen del pedido</h3>
                <p className="text-xs text-gray-500">Revisá los detalles de tu compra antes de confirmar.</p>
              </div>

              {/* Lista de productos en el resumen */}
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto mb-2 border border-black/5 rounded-xl p-3 bg-gray-50/50">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs py-1.5 border-b border-black/5 last:border-0">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="font-semibold text-gray-955 truncate">{item.name}</div>
                      <div className="text-[10px] text-gray-400">{item.brand} (x{item.quantity})</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-bold text-gray-900">${(item.price * item.quantity).toLocaleString("es-AR")}</div>
                      <div className="text-[9px] text-gray-400">c/u: ${item.price.toLocaleString("es-AR")}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Detalle de entrega */}
              {metodoEntrega === "domicilio" ? (
                <div className="bg-[#F0F7FD] border border-[#1B87C8]/10 rounded-xl p-3 text-xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1">📍 Dirección de envío</div>
                  <p className="text-gray-700 font-medium">
                    {direccion?.calle} {direccion?.altura} {direccion?.piso && `, Piso/Depto: ${direccion.piso}`}
                  </p>
                  <p className="text-gray-500">
                    {direccion?.localidad}, {direccion?.provincia} (CP {direccion?.codigoPostal})
                  </p>
                  {direccion?.indicaciones && (
                    <p className="text-gray-500 italic mt-1">Ref: {direccion.indicaciones}</p>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200/50 rounded-xl p-3 text-xs">
                  <div className="font-bold text-gray-900 mb-1 flex items-center gap-1">🏪 Retiro en el local</div>
                  <p className="text-gray-700 font-medium">Ignacio Crespo 1136</p>
                  <p className="text-gray-500">Recreo, Santa Fe (CP 3018)</p>
                  <p className="text-gray-400 mt-1 italic">Retiralo gratis en nuestra sucursal.</p>
                </div>
              )}

              {/* Desglose de totales */}
              <div className="border-t border-dashed border-black/10 pt-3 text-xs flex flex-col gap-1.5">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal productos</span>
                  <span>${total.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Costo de envío</span>
                  {metodoEntrega === "domicilio" ? (
                    <span>${costoEnvioConfig.toLocaleString("es-AR")}</span>
                  ) : (
                    <span className="text-[#16A34A] font-bold">Gratis</span>
                  )}
                </div>
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-1">
                  <span>Total final</span>
                  <span className="text-lg text-[#1B87C8] font-black">
                    ${(total + (metodoEntrega === "domicilio" ? costoEnvioConfig : 0)).toLocaleString("es-AR")}
                  </span>
                </div>
              </div>

              {/* Selector de forma de pago */}
              <div className="mt-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Forma de Pago *</label>
                <div className="flex flex-col gap-2">
                  {formasPagoConfig.map((fp) => (
                    <label
                      key={fp}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        formaPago === fp
                          ? "border-[#1B87C8] bg-[#F0F7FD] font-bold text-gray-900"
                          : "border-black/10 text-gray-700 hover:border-black/20"
                      }`}
                    >
                      <input
                        type="radio"
                        name="formaPago"
                        value={fp}
                        checked={formaPago === fp}
                        onChange={() => setFormaPago(fp)}
                        className="accent-[#1B87C8] h-4 w-4"
                      />
                      {fp}
                    </label>
                  ))}
                </div>
              </div>

              {errorForm && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-xs px-3 py-2.5 rounded-lg mt-2">
                  ❌ {errorForm}
                </div>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarResumen(false);
                    if (metodoEntrega === "domicilio") {
                      setMostrarFormDireccion(true);
                    } else {
                      setMostrarMetodoEntrega(true);
                      setDireccion(null);
                    }
                  }}
                  className="flex-1 py-3 border border-black/10 hover:border-black/25 text-gray-600 rounded-full text-xs font-semibold transition-all"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarPedido}
                  disabled={!formaPago || comprando}
                  className="flex-1 py-3 bg-[#1B87C8] hover:bg-[#1569A0] disabled:bg-gray-400 text-white rounded-full text-xs font-semibold transition-all"
                >
                  {comprando ? "Procesando..." : "Confirmar pedido"}
                </button>
              </div>
            </div>
          ) : mostrarFormDireccion ? (
            /* PASO DE DIRECCIÓN DE ENVÍO */
            <div className="flex flex-col gap-4 py-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-base text-gray-900">Dirección de envío</h3>
                <p className="text-xs text-gray-500">Verificamos que la dirección exista antes de confirmar el pedido.</p>
              </div>

              <AddressForm onDireccionValida={handleDireccionValida} />

              {errorForm && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-xs px-3 py-2.5 rounded-lg">
                  ❌ {errorForm}
                </div>
              )}

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={handleVolverDesdeDireccion}
                  className="flex-1 py-3 border border-black/10 hover:border-black/25 text-gray-600 rounded-full text-xs font-semibold transition-all"
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormDireccion(false);
                    setMostrarResumen(true);
                  }}
                  disabled={!direccion}
                  className="flex-1 py-3 bg-[#1B87C8] hover:bg-[#1569A0] disabled:bg-gray-400 text-white rounded-full text-xs font-semibold transition-all"
                >
                  Continuar al resumen →
                </button>
              </div>
            </div>
          ) : mostrarMetodoEntrega ? (
            /* PASO DE MÉTODO DE ENTREGA */
            <div className="flex flex-col gap-5 py-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-base text-gray-900">Método de entrega</h3>
                <p className="text-xs text-gray-500">Seleccioná cómo querés recibir tu compra.</p>
              </div>

              <div className="flex flex-col gap-3">
                {/* Opción Domicilio */}
                <div
                  className={metodoEntrega === "domicilio" ? "flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#1B87C8] bg-[#F0F7FD] cursor-pointer text-center transition-all w-full" : "flex flex-col items-center gap-2 p-4 rounded-xl border border-black/10 hover:border-black/20 cursor-pointer text-center transition-all w-full"}
                  onClick={() => setMetodoEntrega("domicilio")}
                >
                  <span className="text-3xl">🚚</span>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Envío a domicilio</div>
                    <div className="text-xs text-gray-500">Recibí el pedido en tu puerta.</div>
                    <div className="text-xs font-bold text-[#1B87C8] mt-1">
                      Costo: ${costoEnvioConfig.toLocaleString("es-AR")}
                    </div>
                  </div>
                </div>

                {/* Opción Retiro */}
                <div
                  className={metodoEntrega === "retiro" ? "flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-[#1B87C8] bg-[#F0F7FD] cursor-pointer text-center transition-all w-full" : "flex flex-col items-center gap-2 p-4 rounded-xl border border-black/10 hover:border-black/20 cursor-pointer text-center transition-all w-full"}
                  onClick={() => setMetodoEntrega("retiro")}
                >
                  <span className="text-3xl">🏪</span>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Retiro en el local</div>
                    <div className="text-xs text-gray-500">Ignacio Crespo 1136, Recreo.</div>
                    <div className="text-xs font-bold text-[#16A34A] mt-1">
                      Gratis
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMostrarMetodoEntrega(false);
                    if (user) {
                      // Volver al carrito, se controla al ocultar mostrarMetodoEntrega
                    } else {
                      setMostrarFormInvitado(true);
                    }
                  }}
                  className="flex-1 py-3 border border-black/10 hover:border-black/25 text-gray-600 rounded-full text-xs font-semibold transition-all"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={!metodoEntrega}
                  onClick={() => {
                    setMostrarMetodoEntrega(false);
                    if (metodoEntrega === "domicilio") {
                      setMostrarFormDireccion(true);
                    } else {
                      setDireccion(DIRECCION_LOCAL);
                      setMostrarResumen(true);
                    }
                  }}
                  className="flex-1 py-3 bg-[#1B87C8] hover:bg-[#1569A0] disabled:bg-gray-400 text-white rounded-full text-xs font-semibold transition-all"
                >
                  Continuar →
                </button>
              </div>
            </div>
          ) : mostrarFormInvitado ? (
            /* FORMULARIO DE INVITADO */
            <div className="flex flex-col gap-5 py-4 animate-fade-in">
              <div>
                <h3 className="font-bold text-base text-gray-900">Completa tus datos</h3>
                <p className="text-xs text-gray-500">Necesitamos estos datos para registrar tu pedido de compra.</p>
              </div>

              {errorForm && (
                <div className="bg-red-50 text-red-600 border border-red-100 text-xs px-3 py-2.5 rounded-lg">
                  ❌ {errorForm}
                </div>
              )}

              <form onSubmit={handleFormInvitadoSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    style={inputStyle}
                    value={invitadoNombre}
                    onChange={e => setInvitadoNombre(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email *</label>
                  <input
                    type="email"
                    required
                    style={inputStyle}
                    value={invitadoEmail}
                    onChange={e => setInvitadoEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Teléfono (WhatsApp)</label>
                  <input
                    type="tel"
                    style={inputStyle}
                    value={invitadoTelefono}
                    onChange={e => setInvitadoTelefono(e.target.value)}
                    placeholder="Ej. +54 342 5128458"
                  />
                </div>

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setMostrarFormInvitado(false)}
                    className="flex-1 py-3 border border-black/10 hover:border-black/25 text-gray-600 rounded-full text-xs font-semibold transition-all"
                  >
                    Volver al carrito
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-[#1B87C8] hover:bg-[#1569A0] text-white rounded-full text-xs font-semibold transition-all"
                  >
                    Continuar →
                  </button>
                </div>
              </form>

              <div className="text-center text-xs text-gray-400 mt-4 border-t pt-4">
                ¿Ya tienes una cuenta? <br />
                Cierra este panel e inicia sesión haciendo clic en <strong className="text-gray-600">&quot;Mi Cuenta&quot;</strong> en la barra superior.
              </div>
            </div>
          ) : (
            /* LISTADO DE ITEMS DEL CARRITO */
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 bg-[#F0F7FD] rounded-xl p-3 border border-[#F0F7FD] hover:border-[#1B87C8]/20 transition-all">
                  <div className="text-4xl w-14 h-14 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.icon || "🔌"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-[#1B87C8] uppercase tracking-wide">{item.brand}</div>
                    <div className="font-semibold text-sm truncate text-gray-900">{item.name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">SKU: {item.id}</div>
                    <div className="font-bold text-gray-800 mt-0.5 text-xs">
                      ${(item.price * item.quantity).toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <div className="flex items-center bg-white border border-black/10 rounded-full overflow-hidden shadow-sm">
                      <button
                        onClick={() => decrementItem(item.id)}
                        className="px-2 py-1 text-xs font-black text-gray-500 hover:bg-[#F0F7FD] hover:text-[#1B87C8] transition-colors"
                        type="button"
                      >
                        -
                      </button>
                      <span className="px-1 text-xs font-bold text-gray-800 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price: item.price, brand: item.brand, icon: item.icon })}
                        className="px-2 py-1 text-xs font-black text-gray-500 hover:bg-[#F0F7FD] hover:text-[#1B87C8] transition-colors"
                        type="button"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-400 hover:text-red-600 text-xs transition-colors p-1 flex items-center gap-1"
                      title="Eliminar producto"
                      type="button"
                    >
                      <span>Eliminar</span> 🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER CON TOTAL */}
        {!checkoutExitoso && items.length > 0 && !mostrarFormDireccion && !mostrarFormInvitado && !mostrarMetodoEntrega && !mostrarResumen && (
          <div className="px-6 py-5 border-t border-black/8 bg-white flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500 font-medium">Total</span>
              <span className="text-2xl font-bold text-gray-900">${total.toLocaleString("es-AR")}</span>
            </div>

            <button
              onClick={handleFinalizarClick}
              className="w-full bg-[#1B87C8] hover:bg-[#1569A0] text-white font-semibold py-3 rounded-full transition-colors mb-2 text-sm"
            >
              Finalizar compra
            </button>

            <button
              onClick={resetState}
              className="w-full border border-black/10 hover:border-[#1B87C8] text-gray-500 hover:text-[#1B87C8] font-medium py-3 rounded-full transition-colors text-xs"
            >
              Seguir comprando
            </button>
          </div>
        )}

        {/* TOTAL PARCIAL VISIBLE DURANTE OTROS PASOS DE CHECKOUT */}
        {!checkoutExitoso && items.length > 0 && (mostrarFormDireccion || mostrarMetodoEntrega || mostrarFormInvitado) && (
          <div className="px-6 py-4 border-t border-black/8 bg-white flex-shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium text-sm">Total parcial</span>
              <span className="text-xl font-bold text-gray-900">${total.toLocaleString("es-AR")}</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
}