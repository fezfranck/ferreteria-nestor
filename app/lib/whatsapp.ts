import { ESTADOS_PEDIDO } from "./constants";

/**
 * Valida un teléfono ingresado en el checkout argentino:
 * - Obligatorio
 * - Exactamente 10 dígitos numéricos (código de área sin 0 + número sin 15)
 * - No debe empezar con 0 ni contener el prefijo local 15
 */
export function validarTelefonoArgentino(tel: string): {
  valido: boolean;
  error?: string;
  limpio?: string;
} {
  if (!tel || !tel.trim()) {
    return { valido: false, error: "El teléfono o celular es obligatorio para coordinar tu pedido." };
  }

  // Eliminar espacios, guiones, paréntesis y signos +
  const limpio = tel.replace(/[\s\-\(\)\+]/g, "").trim();

  // Si empieza con código de país 54
  let sinPais = limpio;
  if (sinPais.startsWith("54")) {
    sinPais = sinPais.slice(2);
  }
  if (sinPais.startsWith("9")) {
    sinPais = sinPais.slice(1);
  }

  if (sinPais.startsWith("0")) {
    return {
      valido: false,
      error: "Ingresá el código de área sin el 0 inicial (ej: 342 en vez de 0342).",
    };
  }

  // Detectar intento común de ingresar 15 (longitud 12 o coincidencia)
  if (sinPais.length > 10 && sinPais.includes("15")) {
    return {
      valido: false,
      error: "Ingresá tu número directo sin el 15 después del código de área.",
    };
  }

  if (!/^[1-9][0-9]{9}$/.test(sinPais)) {
    return {
      valido: false,
      error: `El teléfono debe tener 10 dígitos (código de área + número, ej: 3425128458). Actualmente tiene ${sinPais.length} dígitos.`,
    };
  }

  return { valido: true, limpio: sinPais };
}

/**
 * Normaliza cualquier formato de teléfono argentino a formato internacional de WhatsApp:
 * 54 + 9 + 10 dígitos = 5493425128458 (13 dígitos)
 */
export function normalizarTelefonoArgentino(tel?: string | null): string | null {
  if (!tel) return null;

  // Dejar únicamente dígitos
  let digitos = tel.replace(/\D/g, "");
  if (!digitos) return null;

  // Si ya tiene formato internacional completo 549XXXXXXXXXX (13 dígitos)
  if (digitos.startsWith("549") && digitos.length === 13) {
    return digitos;
  }

  // Si tiene 540342... (código 54 con 0 sobrante)
  if (digitos.startsWith("540")) {
    digitos = "54" + digitos.slice(3);
  }

  // Si empieza con 54 y tiene 12 dígitos (54 + 10 dígitos locales)
  if (digitos.startsWith("54") && digitos.length === 12) {
    return "549" + digitos.slice(2);
  }

  // Si empieza con 0 (ej: 03425128458 -> 11 dígitos)
  if (digitos.startsWith("0")) {
    digitos = digitos.slice(1);
  }

  // Si el usuario incluyó '15' (ej: 342 15 5128458 -> 12 dígitos)
  // Remover el 15 si está entre las posiciones 2-4 y 4-6
  if (digitos.length === 12) {
    // Intentar características habituales de 2 a 4 dígitos
    for (const lenCod of [2, 3, 4]) {
      const parteCod = digitos.slice(0, lenCod);
      const posible15 = digitos.slice(lenCod, lenCod + 2);
      const resto = digitos.slice(lenCod + 2);
      if (posible15 === "15" && (parteCod + resto).length === 10) {
        digitos = parteCod + resto;
        break;
      }
    }
  }

  // Si tenemos exactamente 10 dígitos válidos (sin 0 y sin 15)
  if (digitos.length === 10 && /^[1-9]/.test(digitos)) {
    return `549${digitos}`;
  }

  return null;
}

/**
 * Genera el mensaje prellenado de WhatsApp adaptado según el estado del pedido
 */
export function generarMensajeWhatsApp(pedido: {
  id: number;
  cliente_nombre?: string;
  estado?: string;
}): string {
  const nombre = (pedido.cliente_nombre || "Estimado/a").trim();
  const estado = pedido.estado;

  let cuerpo = "";
  if (estado === ESTADOS_PEDIDO.PENDIENTE_REVISION) {
    cuerpo = `Hola ${nombre}! Te escribimos de Electricidad Néstor respecto a tu solicitud de pedido #${pedido.id}. Ya verificamos el stock de tus productos y nos comunicamos para coordinar los detalles de pago y entrega.`;
  } else if (estado === ESTADOS_PEDIDO.APROBADO) {
    cuerpo = `Hola ${nombre}! Te escribimos de Electricidad Néstor para avisarte que tu pedido #${pedido.id} ha sido Aprobado. Te contactamos para coordinar los detalles finales de pago y despacho.`;
  } else if (estado === ESTADOS_PEDIDO.CONTACTADO) {
    cuerpo = `Hola ${nombre}! Nos comunicamos nuevamente de Electricidad Néstor para darte seguimiento a tu pedido #${pedido.id}.`;
  } else if (estado === ESTADOS_PEDIDO.RECHAZADO) {
    cuerpo = `Hola ${nombre}! Te escribimos de Electricidad Néstor en relación a tu solicitud de pedido #${pedido.id}.`;
  } else {
    cuerpo = `Hola ${nombre}! Te contactamos de Electricidad Néstor en relación a tu pedido #${pedido.id}.`;
  }

  return encodeURIComponent(cuerpo);
}

/**
 * Retorna la URL final wa.me o null si el teléfono no es válido
 */
export function obtenerEnlaceWhatsApp(
  telefono?: string | null,
  pedido?: { id: number; cliente_nombre?: string; estado?: string }
): string | null {
  const telNormalizado = normalizarTelefonoArgentino(telefono);
  if (!telNormalizado) return null;

  const texto = pedido ? generarMensajeWhatsApp(pedido) : "";
  return `https://wa.me/${telNormalizado}?text=${texto}`;
}
