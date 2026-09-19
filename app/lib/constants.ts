export const ESTADOS_PEDIDO = {
  PENDIENTE_REVISION: "Pendiente de revisión",
  APROBADO: "Aprobado",
  CONTACTADO: "Contactado",
  RECHAZADO: "Rechazado",
} as const;

export type EstadoPedido = (typeof ESTADOS_PEDIDO)[keyof typeof ESTADOS_PEDIDO];

export interface EstadoConfig {
  value: string;
  label: string;
  color: string;
  bg: string;
  icon: string;
  descripcion?: string;
}

export const ESTADOS_CONFIG: Record<string, EstadoConfig> = {
  [ESTADOS_PEDIDO.PENDIENTE_REVISION]: {
    value: ESTADOS_PEDIDO.PENDIENTE_REVISION,
    label: "Pendiente de revisión",
    color: "#F5A623",
    bg: "rgba(245,166,35,0.12)",
    icon: "⏳",
    descripcion: "Revisando stock y disponibilidad",
  },
  [ESTADOS_PEDIDO.APROBADO]: {
    value: ESTADOS_PEDIDO.APROBADO,
    label: "Aprobado",
    color: "#16A34A",
    bg: "rgba(22,163,74,0.12)",
    icon: "✅",
    descripcion: "Stock confirmado y reservado",
  },
  [ESTADOS_PEDIDO.CONTACTADO]: {
    value: ESTADOS_PEDIDO.CONTACTADO,
    label: "Contactado",
    color: "#1B87C8",
    bg: "rgba(27,135,200,0.12)",
    icon: "📞",
    descripcion: "Cliente contactado para coordinar pago y entrega",
  },
  [ESTADOS_PEDIDO.RECHAZADO]: {
    value: ESTADOS_PEDIDO.RECHAZADO,
    label: "Rechazado",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.12)",
    icon: "❌",
    descripcion: "Solicitud rechazada",
  },
  // Soporte para pedidos históricos anteriores
  Pendiente: {
    value: "Pendiente",
    label: "Pendiente (Histórico)",
    color: "#F5A623",
    bg: "rgba(245,166,35,0.12)",
    icon: "⏳",
  },
  Preparando: {
    value: "Preparando",
    label: "Preparando",
    color: "#1B87C8",
    bg: "rgba(27,135,200,0.12)",
    icon: "📦",
  },
  Enviado: {
    value: "Enviado",
    label: "Enviado",
    color: "#805AD5",
    bg: "rgba(128,90,213,0.12)",
    icon: "🚚",
  },
  Completado: {
    value: "Completado",
    label: "Completado",
    color: "#38A169",
    bg: "rgba(56,161,105,0.12)",
    icon: "✅",
  },
  Cancelado: {
    value: "Cancelado",
    label: "Cancelado",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.12)",
    icon: "❌",
  },
};

export const LISTA_ESTADOS_ADMIN = [
  ESTADOS_CONFIG[ESTADOS_PEDIDO.PENDIENTE_REVISION],
  ESTADOS_CONFIG[ESTADOS_PEDIDO.APROBADO],
  ESTADOS_CONFIG[ESTADOS_PEDIDO.CONTACTADO],
  ESTADOS_CONFIG[ESTADOS_PEDIDO.RECHAZADO],
];
