"use client";
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface HorariosConfig {
  dias_semana: string;
  sabados: string;
  domingos: string;
}

export interface RedSocialConfig {
  id: string;
  red: string;
  url: string;
  icono?: string;
  activo: boolean;
}

export interface AccesoRapidoConfig {
  id: string;
  etiqueta: string;
  icono: string;
  url: string;
  color: string;
  rolesPermitidos: ("superadmin" | "admin" | "vendedor")[];
}

export interface SiteConfig {
  descuento_porcentaje: number;
  costo_envio: number;
  formas_pago: string[];
  telefono: string;
  whatsapp_contacto: string;
  email_contacto: string;
  direccion: string;
  horarios: HorariosConfig;
  redes_sociales: RedSocialConfig[];
  accesos_rapidos: AccesoRapidoConfig[];
}

export const CONFIG_DEFAULTS: SiteConfig = {
  descuento_porcentaje: 30,
  costo_envio: 0,
  formas_pago: ["Efectivo", "Transferencia bancaria"],
  telefono: "(0342) 5128458",
  whatsapp_contacto: "3425128458",
  email_contacto: "electricidadnestorrecreo@gmail.com",
  direccion: "Ignacio Crespo 1136, Recreo — Santa Fe",
  horarios: {
    dias_semana: "Lun–Vie 8:00–18:00",
    sabados: "Sáb 8:00–13:00",
    domingos: "Cerrado",
  },
  redes_sociales: [
    { id: "fb", red: "Facebook", url: "https://facebook.com", icono: "f", activo: true },
    { id: "ig", red: "Instagram", url: "https://instagram.com", icono: "ig", activo: true },
    { id: "wa", red: "WhatsApp", url: "https://wa.me/5493425128458", icono: "wa", activo: true },
  ],
  accesos_rapidos: [
    {
      id: "def-1",
      etiqueta: "Revisar ventas",
      icono: "⏳",
      url: "/admin/pedidos?filtro=pendiente",
      color: "#F5A623",
      rolesPermitidos: ["superadmin", "admin", "vendedor"],
    },
    {
      id: "def-2",
      etiqueta: "Todos los pedidos",
      icono: "🛒",
      url: "/admin/pedidos?filtro=all",
      color: "#38A169",
      rolesPermitidos: ["superadmin", "admin", "vendedor"],
    },
    {
      id: "def-3",
      etiqueta: "Nuevo producto",
      icono: "📦",
      url: "/admin/productos",
      color: "#1B87C8",
      rolesPermitidos: ["superadmin", "admin", "vendedor"],
    },
    {
      id: "def-4",
      etiqueta: "Ver tienda",
      icono: "🌐",
      url: "/",
      color: "#D69E2E",
      rolesPermitidos: ["superadmin", "admin", "vendedor"],
    },
  ],
};

interface ConfigContextType {
  config: SiteConfig;
  loading: boolean;
  refreshConfig: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

export function ConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<SiteConfig>(CONFIG_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("configuracion")
        .select("*")
        .eq("id", 1)
        .single();

      if (!error && data) {
        setConfig({
          descuento_porcentaje: typeof data.descuento_porcentaje === "number" ? data.descuento_porcentaje : CONFIG_DEFAULTS.descuento_porcentaje,
          costo_envio: typeof data.costo_envio === "number" ? data.costo_envio : CONFIG_DEFAULTS.costo_envio,
          formas_pago: Array.isArray(data.formas_pago) && data.formas_pago.length > 0 ? data.formas_pago : CONFIG_DEFAULTS.formas_pago,
          telefono: data.telefono || CONFIG_DEFAULTS.telefono,
          whatsapp_contacto: data.whatsapp_contacto || CONFIG_DEFAULTS.whatsapp_contacto,
          email_contacto: data.email_contacto || CONFIG_DEFAULTS.email_contacto,
          direccion: data.direccion || CONFIG_DEFAULTS.direccion,
          horarios: data.horarios && typeof data.horarios === "object" ? { ...CONFIG_DEFAULTS.horarios, ...data.horarios } : CONFIG_DEFAULTS.horarios,
          redes_sociales: Array.isArray(data.redes_sociales) && data.redes_sociales.length > 0 ? data.redes_sociales : CONFIG_DEFAULTS.redes_sociales,
          accesos_rapidos: Array.isArray(data.accesos_rapidos) && data.accesos_rapidos.length > 0 ? data.accesos_rapidos : CONFIG_DEFAULTS.accesos_rapidos,
        });
      }
    } catch (err) {
      console.warn("Aviso al cargar configuración centralizada, usando valores por defecto:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return (
    <ConfigContext.Provider value={{ config, loading, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) {
    throw new Error("useConfig debe usarse dentro de un ConfigProvider");
  }
  return ctx;
}
