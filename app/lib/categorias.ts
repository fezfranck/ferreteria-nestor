import { supabase } from "./supabase";

export interface Categoria {
  id: number;
  nombre: string;
  emoji?: string;
  created_at?: string;
}

export const CATEGORIAS_DEFAULT: Categoria[] = [
  { id: 1, nombre: "Electricidad", emoji: "⚡" },
  { id: 2, nombre: "Herramientas", emoji: "🔨" },
  { id: 3, nombre: "Iluminación", emoji: "💡" },
  { id: 4, nombre: "Cables", emoji: "🔌" },
  { id: 5, nombre: "Tableros", emoji: "📋" },
  { id: 6, nombre: "Seguridad", emoji: "🦺" },
];

const LOCAL_STORAGE_KEY = "nestor_categorias_cache";

function normalizarTexto(txt: string): string {
  return txt
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function leerCacheLocal(): Categoria[] {
  if (typeof window === "undefined") return CATEGORIAS_DEFAULT;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return CATEGORIAS_DEFAULT;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Si falla el parseo, usar valores por defecto
  }
  return CATEGORIAS_DEFAULT;
}

function guardarCacheLocal(categorias: Categoria[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(categorias));
  } catch {
    // Manejo silencioso de cuota o error de almacenamiento local
  }
}

/**
 * Obtiene todas las categorías desde Supabase, con respaldo en localStorage y valores base.
 */
export async function obtenerCategorias(): Promise<Categoria[]> {
  try {
    const { data, error } = await supabase
      .from("categorias")
      .select("*")
      .order("id", { ascending: true });

    if (!error && data && data.length > 0) {
      guardarCacheLocal(data as Categoria[]);
      return data as Categoria[];
    }
  } catch (err) {
    console.warn("Aviso al consultar tabla 'categorias' en Supabase:", err);
  }

  // Si la tabla aún no existe o falló la conexión remota, recurrimos a cache local
  return leerCacheLocal();
}

/**
 * Crea una nueva categoría en Supabase y actualiza la caché local.
 */
export async function crearCategoria(
  nombre: string,
  emoji: string = "📦"
): Promise<{ success: boolean; categoria?: Categoria; error?: string }> {
  const nombreLimpio = nombre.trim();
  if (!nombreLimpio) {
    return { success: false, error: "El nombre de la categoría no puede estar vacío" };
  }

  const emojiLimpio = emoji.trim() || "📦";

  // Consultar categorías actuales para calcular próximo ID si se requiere
  const actuales = await obtenerCategorias();
  const yaExiste = actuales.some(
    (c) => normalizarTexto(c.nombre) === normalizarTexto(nombreLimpio)
  );

  if (yaExiste) {
    return { success: false, error: "Ya existe una categoría con ese nombre" };
  }

  const maxId = actuales.reduce((max, c) => Math.max(max, Number(c.id) || 0), 0);
  const nuevoId = maxId + 1;

  try {
    const { data, error } = await supabase
      .from("categorias")
      .insert({
        id: nuevoId,
        nombre: nombreLimpio,
        emoji: emojiLimpio,
      })
      .select()
      .single();

    if (!error && data) {
      const nueva = data as Categoria;
      const actualizadas = [...actuales, nueva].sort((a, b) => a.id - b.id);
      guardarCacheLocal(actualizadas);
      return { success: true, categoria: nueva };
    }

    if (error) {
      console.warn("Error al insertar en Supabase (posible falta de tabla):", error.message);
    }
  } catch (err) {
    console.warn("Excepción al insertar en Supabase:", err);
  }

  // Respaldo en localStorage si la tabla no está creada aún en Supabase
  const nuevaFallback: Categoria = {
    id: nuevoId,
    nombre: nombreLimpio,
    emoji: emojiLimpio,
  };
  const actualizadas = [...actuales, nuevaFallback].sort((a, b) => a.id - b.id);
  guardarCacheLocal(actualizadas);

  return {
    success: true,
    categoria: nuevaFallback,
  };
}

/**
 * Elimina una categoría si no tiene productos asociados
 */
export async function eliminarCategoria(
  id: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar si existen productos con esta categoría
    const { count, error: errCount } = await supabase
      .from("productos")
      .select("id", { count: "exact", head: true })
      .eq("categoria_id", id);

    if (!errCount && count && count > 0) {
      return {
        success: false,
        error: `No se puede eliminar la categoría porque tiene ${count} producto(s) asignado(s).`,
      };
    }

    const { error } = await supabase.from("categorias").delete().eq("id", id);
    if (error) {
      console.warn("Aviso al eliminar categoría de Supabase:", error.message);
    }
  } catch (err) {
    console.warn("Excepción al eliminar categoría de Supabase:", err);
  }

  const actuales = await obtenerCategorias();
  const filtradas = actuales.filter((c) => c.id !== id);
  guardarCacheLocal(filtradas);
  return { success: true };
}

/**
 * Genera diccionarios para validación y resolución rápida de categorías
 */
export function obtenerDiccionariosCategorias(categorias: Categoria[]) {
  const mapaPorId: Record<number, string> = {};
  const mapaPorNombre: Record<string, number> = {};

  categorias.forEach((c) => {
    mapaPorId[c.id] = c.nombre;
    const sinAcento = normalizarTexto(c.nombre);
    const conAcento = c.nombre.toLowerCase().trim();
    mapaPorNombre[sinAcento] = c.id;
    mapaPorNombre[conAcento] = c.id;
  });

  return { mapaPorId, mapaPorNombre };
}
