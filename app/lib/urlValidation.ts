/**
 * Valida que una URL sea segura:
 * - Rutas internas relativas que comiencen con '/' (ej: /admin/pedidos, /productos)
 * - URLs absolutas seguras que comiencen con 'https://'
 *
 * Rechaza tajantemente esquemas peligrosos como javascript:, data:, vbscript:, etc.
 */
export function esUrlSegura(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  const urlLimpia = url.trim();

  // Rechazar esquemas peligrosos en cualquier variante (mayúsculas o minúsculas)
  const esquemaPeligroso = /^(javascript|data|vbscript|file):/i;
  if (esquemaPeligroso.test(urlLimpia)) {
    return false;
  }

  // Aceptar rutas internas que comiencen con /
  if (urlLimpia.startsWith("/")) {
    // Evitar URLs que comiencen con // (protocol-relative) que podrían redirigir externamente
    return !urlLimpia.startsWith("//");
  }

  // Aceptar URLs externas absolutas con HTTPS únicamente
  if (urlLimpia.startsWith("https://")) {
    try {
      const parsed = new URL(urlLimpia);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  }

  return false;
}

export function mensajeErrorUrl(url: string): string | null {
  if (!url || !url.trim()) {
    return "La URL o ruta es obligatoria.";
  }
  if (!esUrlSegura(url)) {
    return "La URL debe ser una ruta interna del sitio (ej: /admin/pedidos) o un enlace externo seguro con https://";
  }
  return null;
}
