"use client";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import {
  useConfig,
  HorariosConfig,
  RedSocialConfig,
  AccesoRapidoConfig,
  CONFIG_DEFAULTS,
} from "../../context/ConfigContext";
import { esUrlSegura, mensajeErrorUrl } from "../../lib/urlValidation";

const COLORES_DISPONIBLES = [
  { label: "Naranja", value: "#F5A623" },
  { label: "Azul institucional", value: "#1B87C8" },
  { label: "Verde", value: "#38A169" },
  { label: "Púrpura", value: "#805AD5" },
  { label: "Rojo", value: "#DC2626" },
  { label: "Dorado", value: "#D69E2E" },
];

const EMOJIS_SUGERIDOS = ["⏳", "🛒", "📦", "🌐", "⚙️", "👥", "📈", "🔧", "💬", "🏢", "🚚", "📑"];

export default function AdminConfiguracion() {
  const { user } = useAuth();
  const { refreshConfig } = useConfig();

  // Estados generales
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);

  // 1. Tienda y Ventas
  const [descuento, setDescuento] = useState(30);
  const [costoEnvio, setCostoEnvio] = useState(0);
  const [formasPago, setFormasPago] = useState<string[]>([]);
  const [nuevaFormaPago, setNuevaFormaPago] = useState("");

  // 2. Contacto institucional
  const [telefono, setTelefono] = useState("");
  const [whatsappContacto, setWhatsappContacto] = useState("");
  const [emailContacto, setEmailContacto] = useState("");
  const [direccion, setDireccion] = useState("");

  // 3. Horarios
  const [horarios, setHorarios] = useState<HorariosConfig>(CONFIG_DEFAULTS.horarios);

  // 4. Redes sociales
  const [redesSociales, setRedesSociales] = useState<RedSocialConfig[]>([]);
  const [nuevaRedNombre, setNuevaRedNombre] = useState("");
  const [nuevaRedUrl, setNuevaRedUrl] = useState("");
  const [nuevaRedIcono, setNuevaRedIcono] = useState("");

  // 5. Accesos rápidos
  const [accesosRapidos, setAccesosRapidos] = useState<AccesoRapidoConfig[]>([]);
  const [nuevoAccesoEtiqueta, setNuevoAccesoEtiqueta] = useState("");
  const [nuevoAccesoIcono, setNuevoAccesoIcono] = useState("📌");
  const [nuevoAccesoUrl, setNuevoAccesoUrl] = useState("");
  const [nuevoAccesoColor, setNuevoAccesoColor] = useState("#1B87C8");
  const [nuevoAccesoRoles, setNuevoAccesoRoles] = useState<("superadmin" | "admin" | "vendedor")[]>([
    "superadmin",
    "admin",
    "vendedor",
  ]);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from("configuracion")
          .select("*")
          .eq("id", 1)
          .single();

        if (!error && data) {
          setDescuento(data.descuento_porcentaje ?? CONFIG_DEFAULTS.descuento_porcentaje);
          setCostoEnvio(data.costo_envio ?? CONFIG_DEFAULTS.costo_envio);
          setFormasPago(Array.isArray(data.formas_pago) ? data.formas_pago : CONFIG_DEFAULTS.formas_pago);
          setTelefono(data.telefono || CONFIG_DEFAULTS.telefono);
          setWhatsappContacto(data.whatsapp_contacto || CONFIG_DEFAULTS.whatsapp_contacto);
          setEmailContacto(data.email_contacto || CONFIG_DEFAULTS.email_contacto);
          setDireccion(data.direccion || CONFIG_DEFAULTS.direccion);
          setHorarios(data.horarios && typeof data.horarios === "object" ? { ...CONFIG_DEFAULTS.horarios, ...data.horarios } : CONFIG_DEFAULTS.horarios);
          setRedesSociales(Array.isArray(data.redes_sociales) && data.redes_sociales.length > 0 ? data.redes_sociales : CONFIG_DEFAULTS.redes_sociales);
          setAccesosRapidos(Array.isArray(data.accesos_rapidos) && data.accesos_rapidos.length > 0 ? data.accesos_rapidos : CONFIG_DEFAULTS.accesos_rapidos);
        }
      } catch (err) {
        console.error("Error al cargar configuración:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  // Handlers para formas de pago
  const agregarFormaPago = () => {
    if (nuevaFormaPago.trim() && !formasPago.includes(nuevaFormaPago.trim())) {
      setFormasPago([...formasPago, nuevaFormaPago.trim()]);
      setNuevaFormaPago("");
    }
  };

  const eliminarFormaPago = (index: number) => {
    setFormasPago(formasPago.filter((_, i) => i !== index));
  };

  // Handlers para redes sociales
  const agregarRedSocial = () => {
    if (!nuevaRedNombre.trim() || !nuevaRedUrl.trim()) return;
    if (!nuevaRedUrl.startsWith("https://")) {
      setMensaje({ tipo: "error", texto: "La URL de la red social debe comenzar con https://" });
      return;
    }
    const nueva: RedSocialConfig = {
      id: `red-${Date.now()}`,
      red: nuevaRedNombre.trim(),
      url: nuevaRedUrl.trim(),
      icono: nuevaRedIcono.trim() || nuevaRedNombre.slice(0, 2).toLowerCase(),
      activo: true,
    };
    setRedesSociales([...redesSociales, nueva]);
    setNuevaRedNombre("");
    setNuevaRedUrl("");
    setNuevaRedIcono("");
  };

  const toggleRedSocial = (id: string) => {
    setRedesSociales(
      redesSociales.map((r) => (r.id === id ? { ...r, activo: !r.activo } : r))
    );
  };

  const eliminarRedSocial = (id: string) => {
    setRedesSociales(redesSociales.filter((r) => r.id !== id));
  };

  // Handlers para accesos rápidos
  const agregarAccesoRapido = () => {
    const errorUrl = mensajeErrorUrl(nuevoAccesoUrl);
    if (errorUrl) {
      setMensaje({ tipo: "error", texto: errorUrl });
      return;
    }
    if (!nuevoAccesoEtiqueta.trim()) {
      setMensaje({ tipo: "error", texto: "Ingresá una etiqueta para el acceso rápido." });
      return;
    }

    const nuevo: AccesoRapidoConfig = {
      id: `acc-${Date.now()}`,
      etiqueta: nuevoAccesoEtiqueta.trim(),
      icono: nuevoAccesoIcono || "📌",
      url: nuevoAccesoUrl.trim(),
      color: nuevoAccesoColor,
      rolesPermitidos: nuevoAccesoRoles.length > 0 ? nuevoAccesoRoles : ["superadmin"],
    };

    setAccesosRapidos([...accesosRapidos, nuevo]);
    setNuevoAccesoEtiqueta("");
    setNuevoAccesoUrl("");
    setNuevoAccesoIcono("📌");
  };

  const moverAcceso = (index: number, direccionMov: "arriba" | "abajo") => {
    const nuevoIndex = direccionMov === "arriba" ? index - 1 : index + 1;
    if (nuevoIndex < 0 || nuevoIndex >= accesosRapidos.length) return;
    const clon = [...accesosRapidos];
    const temp = clon[index];
    clon[index] = clon[nuevoIndex];
    clon[nuevoIndex] = temp;
    setAccesosRapidos(clon);
  };

  const eliminarAcceso = (id: string) => {
    setAccesosRapidos(accesosRapidos.filter((a) => a.id !== id));
  };

  const toggleRolAcceso = (
    accesoId: string,
    rol: "superadmin" | "admin" | "vendedor"
  ) => {
    setAccesosRapidos(
      accesosRapidos.map((a) => {
        if (a.id !== accesoId) return a;
        const yaTiene = a.rolesPermitidos?.includes(rol);
        const rolesActualizados = yaTiene
          ? a.rolesPermitidos.filter((r) => r !== rol)
          : [...(a.rolesPermitidos || []), rol];
        return {
          ...a,
          rolesPermitidos: rolesActualizados.length > 0 ? rolesActualizados : ["superadmin"],
        };
      })
    );
  };

  // Guardar en Supabase
  async function guardar() {
    setGuardando(true);
    setMensaje(null);

    // Validar URLs de accesos rápidos
    for (const a of accesosRapidos) {
      if (!esUrlSegura(a.url)) {
        setMensaje({
          tipo: "error",
          texto: `La URL del acceso '${a.etiqueta}' (${a.url}) no es segura. Debe iniciar con / o con https://`,
        });
        setGuardando(false);
        return;
      }
    }

    // Validar URLs de redes sociales
    for (const r of redesSociales) {
      if (r.activo && (!r.url || !r.url.startsWith("https://"))) {
        setMensaje({
          tipo: "error",
          texto: `La URL de la red social '${r.red}' debe comenzar con https://`,
        });
        setGuardando(false);
        return;
      }
    }

    const payload: any = {
      descuento_porcentaje: Number(descuento) || 0,
    };

    if (user?.rol === "superadmin") {
      payload.costo_envio = Number(costoEnvio) || 0;
      payload.formas_pago = formasPago;
      payload.telefono = telefono.trim();
      payload.whatsapp_contacto = whatsappContacto.trim();
      payload.email_contacto = emailContacto.trim();
      payload.direccion = direccion.trim();
      payload.horarios = horarios;
      payload.redes_sociales = redesSociales;
      payload.accesos_rapidos = accesosRapidos;
    }

    const { error } = await supabase
      .from("configuracion")
      .update(payload)
      .eq("id", 1);

    if (error) {
      console.error("Error al guardar configuración:", error);
      setMensaje({ tipo: "error", texto: `Error en la base de datos: ${error.message}` });
    } else {
      setMensaje({ tipo: "ok", texto: "¡Configuración actualizada y sincronizada en toda la web correctamente!" });
      await refreshConfig();
    }

    setGuardando(false);
    setTimeout(() => setMensaje(null), 5000);
  }

  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "8px",
    border: "1.5px solid rgba(0,0,0,0.12)",
    outline: "none",
    background: "#fafafa",
  };

  const labelStyle = "block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl animate-pulse">⚙️</div>
          <p className="text-sm">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1
            className="font-black uppercase text-3xl sm:text-4xl leading-none text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Configuración del <span style={{ color: "#1B87C8" }}>Sitio</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Personalizá los parámetros de la tienda, datos de contacto, horarios y accesos directos
          </p>
        </div>

        <button
          onClick={guardar}
          disabled={guardando}
          className="self-start sm:self-auto px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-md hover:brightness-105 disabled:opacity-50 flex items-center gap-2"
          style={{ background: "#1B87C8" }}
        >
          <span>{guardando ? "⏳" : "💾"}</span>
          <span>{guardando ? "Guardando cambios..." : "Guardar cambios"}</span>
        </button>
      </div>

      {mensaje && (
        <div
          className={`rounded-xl px-5 py-3.5 mb-6 text-sm font-semibold flex items-center gap-2 transition-all animate-fade-in ${
            mensaje.tipo === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{mensaje.tipo === "error" ? "❌" : "✅"}</span>
          <span>{mensaje.texto}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* COLUMNA 1: TIENDA, VENTAS Y CONTACTO */}
        <div className="flex flex-col gap-8">
          {/* SECCIÓN 1: PARÁMETROS DE VENTA */}
          <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-black/8 pb-3">
              <span className="text-xl">🏷️</span>
              <h3 className="font-black text-lg uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                Descuento y Pagos
              </h3>
            </div>

            <div>
              <label className={labelStyle}>Porcentaje de descuento en Banner Principal</label>
              <p className="text-xs text-gray-400 mb-2">Se muestra en "HASTA X% DE DESCUENTO" en la portada.</p>
              <div className="flex items-center gap-2 w-36">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={descuento}
                  onChange={(e) => setDescuento(Number(e.target.value))}
                  style={inputStyle}
                  className="font-bold text-center"
                />
                <span className="font-bold text-gray-700">%</span>
              </div>
            </div>

            {user?.rol === "superadmin" && (
              <>
                <div className="border-t border-black/5 pt-4">
                  <label className={labelStyle}>Costo fijo de envío a domicilio ($)</label>
                  <p className="text-xs text-gray-400 mb-2">Se sumará automáticamente en el checkout para entrega a domicilio.</p>
                  <div className="w-48">
                    <input
                      type="number"
                      min={0}
                      value={costoEnvio}
                      onChange={(e) => setCostoEnvio(Number(e.target.value))}
                      style={inputStyle}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="border-t border-black/5 pt-4">
                  <label className={labelStyle}>Formas de pago aceptadas</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Ej. Cheque a 30 días"
                      value={nuevaFormaPago}
                      onChange={(e) => setNuevaFormaPago(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          agregarFormaPago();
                        }
                      }}
                      style={inputStyle}
                    />
                    <button
                      type="button"
                      onClick={agregarFormaPago}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B87C8] hover:bg-[#1569A0] transition-colors"
                    >
                      Agregar
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-2">
                    {formasPago.map((fp, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200"
                      >
                        {fp}
                        <button
                          type="button"
                          onClick={() => eliminarFormaPago(i)}
                          className="text-gray-400 hover:text-red-500 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* SECCIÓN 2: DATOS DE CONTACTO (SOLO SUPERADMIN) */}
          {user?.rol === "superadmin" && (
            <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-black/8 pb-3">
                <span className="text-xl">📍</span>
                <h3 className="font-black text-lg uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Datos de Contacto Institucionales
                </h3>
              </div>

              <div>
                <label className={labelStyle}>Dirección física</label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  style={inputStyle}
                  placeholder="Ignacio Crespo 1136, Recreo — Santa Fe"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelStyle}>Teléfono institucional</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    style={inputStyle}
                    placeholder="(0342) 5128458"
                  />
                </div>
                <div>
                  <label className={labelStyle}>WhatsApp de atención (sin 0 ni 15)</label>
                  <input
                    type="text"
                    value={whatsappContacto}
                    onChange={(e) => setWhatsappContacto(e.target.value)}
                    style={inputStyle}
                    placeholder="3425128458"
                  />
                </div>
              </div>

              <div>
                <label className={labelStyle}>Email de contacto oficial</label>
                <input
                  type="email"
                  value={emailContacto}
                  onChange={(e) => setEmailContacto(e.target.value)}
                  style={inputStyle}
                  placeholder="electricidadnestorrecreo@gmail.com"
                />
              </div>
            </div>
          )}

          {/* SECCIÓN 3: HORARIOS DE ATENCIÓN (SOLO SUPERADMIN) */}
          {user?.rol === "superadmin" && (
            <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-black/8 pb-3">
                <span className="text-xl">🕐</span>
                <h3 className="font-black text-lg uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Horarios de Atención
                </h3>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className={labelStyle}>Lunes a Viernes</label>
                  <input
                    type="text"
                    value={horarios.dias_semana}
                    onChange={(e) => setHorarios({ ...horarios, dias_semana: e.target.value })}
                    style={inputStyle}
                    placeholder="Lun–Vie 8:00–18:00"
                  />
                </div>

                <div>
                  <label className={labelStyle}>Sábados</label>
                  <input
                    type="text"
                    value={horarios.sabados}
                    onChange={(e) => setHorarios({ ...horarios, sabados: e.target.value })}
                    style={inputStyle}
                    placeholder="Sáb 8:00–13:00"
                  />
                </div>

                <div>
                  <label className={labelStyle}>Domingos / Feriados</label>
                  <input
                    type="text"
                    value={horarios.domingos}
                    onChange={(e) => setHorarios({ ...horarios, domingos: e.target.value })}
                    style={inputStyle}
                    placeholder="Cerrado"
                  />
                </div>
              </div>

              {/* VISTA PREVIA HORARIOS */}
              <div className="mt-3 p-3.5 rounded-xl bg-gray-900 text-white text-xs">
                <span className="text-[10px] font-bold uppercase text-gray-400 block mb-1">
                  Vista previa en Barra Superior:
                </span>
                <span className="font-mono text-gray-200">
                  🕐 {horarios.dias_semana || "Lun–Vie 8:00–18:00"} | {horarios.sabados || "Sáb 8:00–13:00"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA 2: ACCESOS RÁPIDOS Y REDES SOCIALES */}
        <div className="flex flex-col gap-8">
          {/* SECCIÓN 4: ACCESOS RÁPIDOS DEL DASHBOARD (SOLO SUPERADMIN) */}
          {user?.rol === "superadmin" && (
            <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚡</span>
                  <h3 className="font-black text-lg uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                    Accesos Rápidos del Dashboard ({accesosRapidos.length})
                  </h3>
                </div>
              </div>

              {/* Lista actual con reordenamiento y casillas de roles */}
              <div className="flex flex-col gap-3">
                {accesosRapidos.map((acc, idx) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl border border-black/8 bg-gray-50 flex flex-col gap-3 transition-all hover:bg-white hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-xs"
                          style={{ background: `${acc.color}20`, border: `1px solid ${acc.color}40` }}
                        >
                          {acc.icono}
                        </span>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{acc.etiqueta}</div>
                          <div className="text-xs text-gray-400 font-mono truncate max-w-[220px]">
                            {acc.url}
                          </div>
                        </div>
                      </div>

                      {/* Botones de orden y borrado */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => moverAcceso(idx, "arriba")}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg border border-black/10 text-xs font-bold hover:bg-gray-100 disabled:opacity-30"
                          title="Subir posición"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          onClick={() => moverAcceso(idx, "abajo")}
                          disabled={idx === accesosRapidos.length - 1}
                          className="p-1.5 rounded-lg border border-black/10 text-xs font-bold hover:bg-gray-100 disabled:opacity-30"
                          title="Bajar posición"
                        >
                          ▼
                        </button>
                        <button
                          type="button"
                          onClick={() => eliminarAcceso(acc.id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 text-xs font-bold ml-1"
                          title="Eliminar acceso"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Casillas de Roles Permitidos */}
                    <div className="pt-2 border-t border-black/5 flex flex-wrap items-center gap-4 text-xs">
                      <span className="font-bold text-gray-500 text-[11px] uppercase">Visible para:</span>
                      <label className="flex items-center gap-1.5 text-purple-700 font-bold cursor-default">
                        <input type="checkbox" checked disabled className="accent-purple-600 rounded" />
                        Superadmin
                      </label>
                      <label className="flex items-center gap-1.5 text-blue-700 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acc.rolesPermitidos?.includes("admin")}
                          onChange={() => toggleRolAcceso(acc.id, "admin")}
                          className="accent-[#1B87C8] rounded cursor-pointer"
                        />
                        Administrador
                      </label>
                      <label className="flex items-center gap-1.5 text-emerald-700 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={acc.rolesPermitidos?.includes("vendedor")}
                          onChange={() => toggleRolAcceso(acc.id, "vendedor")}
                          className="accent-emerald-600 rounded cursor-pointer"
                        />
                        Vendedor
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Formulario para agregar nuevo acceso */}
              <div className="p-4 rounded-xl border border-dashed border-[#1B87C8]/40 bg-[#F0F7FD] flex flex-col gap-3">
                <span className="text-xs font-bold uppercase text-[#1B87C8]">Agregar nuevo acceso rápido</span>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Etiqueta (ej: Nuevo Pedido)"
                      value={nuevoAccesoEtiqueta}
                      onChange={(e) => setNuevoAccesoEtiqueta(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <select
                      value={nuevoAccesoIcono}
                      onChange={(e) => setNuevoAccesoIcono(e.target.value)}
                      style={inputStyle}
                    >
                      {EMOJIS_SUGERIDOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="URL (ej: /admin/productos o https://...)"
                      value={nuevoAccesoUrl}
                      onChange={(e) => setNuevoAccesoUrl(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <select
                      value={nuevoAccesoColor}
                      onChange={(e) => setNuevoAccesoColor(e.target.value)}
                      style={inputStyle}
                    >
                      {COLORES_DISPONIBLES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevoAccesoRoles.includes("admin")}
                        onChange={(e) => {
                          if (e.target.checked) setNuevoAccesoRoles([...nuevoAccesoRoles, "admin"]);
                          else setNuevoAccesoRoles(nuevoAccesoRoles.filter((r) => r !== "admin"));
                        }}
                      />
                      Admin
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevoAccesoRoles.includes("vendedor")}
                        onChange={(e) => {
                          if (e.target.checked) setNuevoAccesoRoles([...nuevoAccesoRoles, "vendedor"]);
                          else setNuevoAccesoRoles(nuevoAccesoRoles.filter((r) => r !== "vendedor"));
                        }}
                      />
                      Vendedor
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={agregarAccesoRapido}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B87C8] hover:bg-[#1569A0] transition-colors ml-auto"
                  >
                    + Agregar acceso
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECCIÓN 5: REDES SOCIALES (SOLO SUPERADMIN) */}
          {user?.rol === "superadmin" && (
            <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-col gap-5">
              <div className="flex items-center gap-2 border-b border-black/8 pb-3">
                <span className="text-xl">🌐</span>
                <h3 className="font-black text-lg uppercase text-gray-900" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                  Redes Sociales y Enlaces Externos
                </h3>
              </div>

              {/* Lista de redes */}
              <div className="flex flex-col gap-2.5">
                {redesSociales.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl border border-black/8 bg-gray-50 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-gray-800 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {r.icono || r.red.slice(0, 2).toLowerCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="font-bold text-gray-900">{r.red}</div>
                        <div className="text-[11px] text-gray-400 truncate max-w-[200px]">{r.url}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleRedSocial(r.id)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          r.activo ? "bg-emerald-100 text-emerald-800" : "bg-gray-200 text-gray-500"
                        }`}
                      >
                        {r.activo ? "Activo" : "Inactivo"}
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminarRedSocial(r.id)}
                        className="text-red-500 hover:text-red-700 font-bold p-1"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Agregar nueva red */}
              <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 flex flex-col gap-2.5">
                <span className="text-xs font-bold uppercase text-gray-600">Nueva red social</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Nombre (ej. Facebook)"
                      value={nuevaRedNombre}
                      onChange={(e) => setNuevaRedNombre(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="URL (debe empezar con https://)"
                      value={nuevaRedUrl}
                      onChange={(e) => setNuevaRedUrl(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Ícono / Letra corta (ej. fb, ig, in)"
                    value={nuevaRedIcono}
                    onChange={(e) => setNuevaRedIcono(e.target.value)}
                    style={inputStyle}
                    className="max-w-[200px]"
                  />
                  <button
                    type="button"
                    onClick={agregarRedSocial}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1B87C8] hover:bg-[#1569A0] transition-colors"
                  >
                    + Agregar red
                  </button>
                </div>
              </div>

              {/* VISTA PREVIA PIE DE PÁGINA */}
              <div className="p-4 rounded-xl bg-[#1A1A1A] text-white flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase text-gray-400 block">
                  Vista previa de botones en el Footer:
                </span>
                <div className="flex gap-2">
                  {redesSociales.filter((r) => r.activo).map((r) => (
                    <div
                      key={r.id}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "rgba(255,255,255,0.12)", color: "white" }}
                      title={r.red}
                    >
                      {r.icono || r.red.slice(0, 2).toLowerCase()}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}