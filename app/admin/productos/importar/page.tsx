"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { useAuth } from "../../../context/AuthContext";
import { supabase } from "../../../lib/supabase";

const CATEGORIAS: Record<number, string> = {
  1: "Electricidad",
  2: "Herramientas",
  3: "Iluminación",
  4: "Cables",
  5: "Tableros",
  6: "Seguridad",
};

const CATEGORIAS_NORM: Record<string, number> = {
  electricidad: 1,
  herramientas: 2,
  iluminacion: 3,
  iluminación: 3,
  cables: 4,
  tableros: 5,
  seguridad: 6,
};

interface FilaImportada {
  indice: number;
  sku: string;
  nombre: string;
  marca: string;
  precio: number;
  stock: number;
  categoria_id: number;
  categoria_nombre: string;
  badge: string | null;
  imagen_url: string | null;
  imagen_zip_archivo?: string | null;
  esValido: boolean;
  errores: string[];
}

export default function CargaMasivaProductosPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Permisos: solo superadmin, admin y vendedor
  useEffect(() => {
    if (user && !["superadmin", "admin", "vendedor"].includes(user.rol)) {
      router.push("/cuenta/pedidos");
    }
  }, [user, router]);

  // Estados de pasos: 1 = Subir, 2 = Vista Previa, 3 = Progreso / Resumen
  const [paso, setPaso] = useState<1 | 2 | 3>(1);

  // Paso 1: Configuración y archivos
  const [tipoImagen, setTipoImagen] = useState<"url" | "zip">("url");
  const [archivoExcel, setArchivoExcel] = useState<File | null>(null);
  const [archivoZip, setArchivoZip] = useState<File | null>(null);
  const [errorSubida, setErrorSubida] = useState<string>("");
  const [procesandoArchivo, setProcesandoArchivo] = useState(false);

  // Paso 2: Vista previa
  const [filas, setFilas] = useState<FilaImportada[]>([]);
  const [zipArchivosMap, setZipArchivosMap] = useState<Map<string, JSZip.JSZipObject>>(new Map());

  // Paso 3: Importación y resultados
  const [importando, setImportando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0, mensaje: "" });
  const [resumen, setResumen] = useState<{
    creados: number;
    actualizados: number;
    errores: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------
  // DESCARGA DE PLANTILLA EXCEL
  // -------------------------------------------------------------
  function descargarPlantilla() {
    const encabezados = [
      {
        sku: "CBL-25-AZ",
        nombre: "Cable Unipolar 2.5mm Azul x100m",
        marca: "Prysmian",
        precio: 45900,
        stock: 25,
        categoria_id: 4,
        badge: "Destacado",
        imagen_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500",
      },
      {
        sku: "TAL-PERC-750",
        nombre: "Taladro Percutor 750W 13mm",
        marca: "Bosch",
        precio: 115000,
        stock: 10,
        categoria_id: 2,
        badge: "",
        imagen_url: "",
      },
      {
        sku: "LAMP-LED-9W",
        nombre: "Lámpara LED Bulbo 9W Luz Fría",
        marca: "Philips",
        precio: 2400,
        stock: 150,
        categoria_id: 3,
        badge: "Oferta",
        imagen_url: "",
      },
    ];

    const hojaProductos = XLSX.utils.json_to_sheet(encabezados);

    // Hoja de ayuda de categorías
    const categoriasAyuda = [
      { ID_Categoria: 1, Nombre: "Electricidad" },
      { ID_Categoria: 2, Nombre: "Herramientas" },
      { ID_Categoria: 3, Nombre: "Iluminación" },
      { ID_Categoria: 4, Nombre: "Cables" },
      { ID_Categoria: 5, Nombre: "Tableros" },
      { ID_Categoria: 6, Nombre: "Seguridad" },
    ];
    const hojaCategorias = XLSX.utils.json_to_sheet(categoriasAyuda);

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hojaProductos, "Productos");
    XLSX.utils.book_append_sheet(libro, hojaCategorias, "Categorías");

    XLSX.writeFile(libro, "plantilla_productos_nestor.xlsx");
  }

  // -------------------------------------------------------------
  // PASO A -> B: PARSEO Y VALIDACIÓN
  // -------------------------------------------------------------
  async function procesarArchivos() {
    if (!archivoExcel) {
      setErrorSubida("Por favor seleccioná un archivo .xlsx o .csv");
      return;
    }

    if (tipoImagen === "zip" && !archivoZip) {
      setErrorSubida("Seleccionaste la opción de imágenes por ZIP pero no adjuntaste ningún archivo .zip.");
      return;
    }

    setProcesandoArchivo(true);
    setErrorSubida("");

    try {
      // 1. Si hay ZIP, descomprimir en memoria
      const mapZip = new Map<string, JSZip.JSZipObject>();
      if (tipoImagen === "zip" && archivoZip) {
        const zip = await JSZip.loadAsync(archivoZip);
        zip.forEach((rutaRelativa, archivo) => {
          if (!archivo.dir) {
            const nombreSolo = rutaRelativa.split("/").pop() || "";
            // Quitar extensión y normalizar
            const skuClave = nombreSolo.replace(/\.[^/.]+$/, "").toLowerCase().trim();
            if (skuClave) {
              mapZip.set(skuClave, archivo);
            }
          }
        });
        setZipArchivosMap(mapZip);
      }

      // 2. Leer archivo Excel / CSV
      const buffer = await archivoExcel.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const primerHojaNombre = wb.SheetNames[0];
      const hoja = wb.Sheets[primerHojaNombre];
      const datosCrudos: any[] = XLSX.utils.sheet_to_json(hoja, { defval: "" });

      if (datosCrudos.length === 0) {
        setErrorSubida("El archivo está vacío o no contiene filas con datos.");
        setProcesandoArchivo(false);
        return;
      }

      // 3. Validar filas
      const skusEnArchivo = new Set<string>();
      const skusDuplicados = new Set<string>();

      // Primer barrido para identificar duplicados
      datosCrudos.forEach((fila) => {
        const skuVal = String(fila.sku || fila.SKU || "").trim().toUpperCase();
        if (skuVal) {
          if (skusEnArchivo.has(skuVal)) {
            skusDuplicados.add(skuVal);
          } else {
            skusEnArchivo.add(skuVal);
          }
        }
      });

      const filasProcesadas: FilaImportada[] = datosCrudos.map((fila, idx) => {
        const errores: string[] = [];

        // SKU
        const sku = String(fila.sku || fila.SKU || "").trim().toUpperCase();
        if (!sku) {
          errores.push("SKU vacío");
        } else if (skusDuplicados.has(sku)) {
          errores.push("SKU duplicado en el archivo");
        }

        // Nombre
        const nombre = String(fila.nombre || fila.Nombre || "").trim();
        if (!nombre) {
          errores.push("Nombre vacío");
        }

        // Marca
        const marca = String(fila.marca || fila.Marca || "").trim();

        // Precio
        const precioRaw = fila.precio ?? fila.Precio;
        const precio = Number(precioRaw);
        if (isNaN(precio) || precio <= 0) {
          errores.push("Precio inválido (debe ser numérico > 0)");
        }

        // Stock
        const stockRaw = fila.stock ?? fila.Stock ?? 0;
        const stock = Number(stockRaw);
        if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
          errores.push("Stock inválido (debe ser un entero >= 0)");
        }

        // Categoría
        const catRaw = fila.categoria_id ?? fila.categoria ?? fila.Categoria;
        let categoria_id = Number(catRaw);
        if (isNaN(categoria_id) && typeof catRaw === "string") {
          const norm = catRaw.toLowerCase().trim();
          if (CATEGORIAS_NORM[norm]) {
            categoria_id = CATEGORIAS_NORM[norm];
          }
        }

        if (!CATEGORIAS[categoria_id]) {
          errores.push("Categoría inexistente (debe ser entre 1 y 6)");
        }

        // Badge
        const badge = fila.badge || fila.Badge ? String(fila.badge || fila.Badge).trim() : null;

        // Imagen
        let imagen_url = fila.imagen_url || fila.imagen || null;
        if (imagen_url) imagen_url = String(imagen_url).trim();

        let imagen_zip_archivo: string | null = null;
        if (tipoImagen === "zip" && sku) {
          const skuClave = sku.toLowerCase().trim();
          if (mapZip.has(skuClave)) {
            const entry = mapZip.get(skuClave)!;
            imagen_zip_archivo = entry.name.split("/").pop() || null;
          }
        }

        return {
          indice: idx + 1,
          sku,
          nombre,
          marca,
          precio: isNaN(precio) ? 0 : precio,
          stock: isNaN(stock) ? 0 : stock,
          categoria_id: CATEGORIAS[categoria_id] ? categoria_id : 1,
          categoria_nombre: CATEGORIAS[categoria_id] || "Desconocida",
          badge,
          imagen_url: tipoImagen === "url" ? imagen_url : null,
          imagen_zip_archivo,
          esValido: errores.length === 0,
          errores,
        };
      });

      setFilas(filasProcesadas);
      setPaso(2);
    } catch (err: any) {
      console.error("Error al procesar archivo:", err);
      setErrorSubida("Error al leer el archivo: " + (err.message || "Formato no soportado"));
    } finally {
      setProcesandoArchivo(false);
    }
  }

  // -------------------------------------------------------------
  // PASO C: CONFIRMAR E IMPORTAR (UPSERT Y SUBIDA DE IMÁGENES)
  // -------------------------------------------------------------
  async function ejecutarImportacion() {
    const filasValidas = filas.filter((f) => f.esValido);
    if (filasValidas.length === 0) return;

    setImportando(true);
    setPaso(3);
    setProgreso({
      actual: 0,
      total: filasValidas.length,
      mensaje: "Consultando catálogo existente...",
    });

    try {
      // 1. Obtener SKUs existentes en la base de datos para diferenciar creados vs actualizados
      const { data: productosExistentes } = await supabase
        .from("productos")
        .select("id, sku");

      const existingMap = new Map<string, number>();
      if (productosExistentes) {
        productosExistentes.forEach((p) => {
          if (p.sku) existingMap.set(p.sku.toUpperCase().trim(), p.id);
        });
      }

      let contadorCreados = 0;
      let contadorActualizados = 0;
      let contadorErrores = filas.filter((f) => !f.esValido).length;

      const productosParaUpsert: any[] = [];

      // 2. Procesar imágenes una por una con progreso visual
      for (let i = 0; i < filasValidas.length; i++) {
        const item = filasValidas[i];
        setProgreso({
          actual: i + 1,
          total: filasValidas.length,
          mensaje: `Procesando (${i + 1}/${filasValidas.length}): ${item.sku} - ${item.nombre}`,
        });

        let urlFinalImagen: string | null = null;

        // Opción ZIP: extraer blob y subir a Supabase Storage
        if (tipoImagen === "zip") {
          const skuKey = item.sku.toLowerCase().trim();
          if (zipArchivosMap.has(skuKey)) {
            try {
              const zipEntry = zipArchivosMap.get(skuKey)!;
              const blob = await zipEntry.async("blob");
              const ext = zipEntry.name.split(".").pop() || "jpg";
              const cleanSku = item.sku.replace(/[^a-zA-Z0-9_-]/g, "_");
              const nombreArchivo = `${cleanSku}-${Date.now()}.${ext}`;

              const { error: uploadErr } = await supabase.storage
                .from("productos")
                .upload(nombreArchivo, blob, { upsert: true });

              if (!uploadErr) {
                const { data: pubData } = supabase.storage
                  .from("productos")
                  .getPublicUrl(nombreArchivo);
                urlFinalImagen = pubData.publicUrl;
              } else {
                console.error("Error subiendo imagen desde ZIP:", uploadErr);
              }
            } catch (zErr) {
              console.error("Error extrayendo del ZIP:", zErr);
            }
          }
        }

        // Opción URL: llamar a API server-side para evitar CORS
        if (tipoImagen === "url" && item.imagen_url && item.imagen_url.startsWith("http")) {
          try {
            const res = await fetch("/api/admin/productos/upload-url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ url: item.imagen_url, sku: item.sku }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.publicUrl) {
                urlFinalImagen = json.publicUrl;
              }
            } else {
              console.warn(`No se pudo descargar imagen para ${item.sku}`);
            }
          } catch (fetchErr) {
            console.error("Error al descargar imagen externa:", fetchErr);
          }
        }

        // Determinar si es actualización o creación
        const yaExisteId = existingMap.get(item.sku);
        if (yaExisteId) {
          contadorActualizados++;
        } else {
          contadorCreados++;
        }

        const registro: any = {
          sku: item.sku,
          nombre: item.nombre,
          marca: item.marca,
          precio: item.precio,
          stock: item.stock,
          categoria_id: item.categoria_id,
          badge: item.badge,
          activo: true,
          icono: "📦",
        };

        if (urlFinalImagen) {
          registro.imagen_url = urlFinalImagen;
        }

        if (yaExisteId) {
          registro.id = yaExisteId;
        }

        productosParaUpsert.push(registro);
      }

      // 3. Ejecutar Upsert en la base de datos
      setProgreso({
        actual: filasValidas.length,
        total: filasValidas.length,
        mensaje: "Guardando productos en la base de datos...",
      });

      // Upsert en lotes de 50
      const batchSize = 50;
      for (let i = 0; i < productosParaUpsert.length; i += batchSize) {
        const lote = productosParaUpsert.slice(i, i + batchSize);
        const { error: upsertErr } = await supabase
          .from("productos")
          .upsert(lote, { onConflict: "sku" });

        if (upsertErr) {
          console.error("Error en upsert batch:", upsertErr);
          // Si falla el lote completo, sumar a errores
          contadorErrores += lote.length;
          contadorCreados = Math.max(0, contadorCreados - lote.length);
        }
      }

      setResumen({
        creados: contadorCreados,
        actualizados: contadorActualizados,
        errores: contadorErrores,
      });
    } catch (err: any) {
      console.error("Error general en importación:", err);
      setResumen({
        creados: 0,
        actualizados: 0,
        errores: filasValidas.length,
      });
    } finally {
      setImportando(false);
    }
  }

  function reiniciarFlujo() {
    setPaso(1);
    setArchivoExcel(null);
    setArchivoZip(null);
    setFilas([]);
    setZipArchivosMap(new Map());
    setResumen(null);
    setErrorSubida("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (zipInputRef.current) zipInputRef.current.value = "";
  }

  const filasValidasCount = filas.filter((f) => f.esValido).length;
  const filasInvalidasCount = filas.filter((f) => !f.esValido).length;

  return (
    <div className="max-w-6xl mx-auto pb-16">
      {/* NAVEGACIÓN SUPERIOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/admin/productos"
            className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#1B87C8] transition-colors mb-1 inline-flex items-center gap-1"
          >
            ← Volver a Productos
          </Link>
          <h1
            className="font-black uppercase text-3xl sm:text-4xl text-gray-900"
            style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            Carga Masiva de <span style={{ color: "#1B87C8" }}>Productos</span>
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Importá o actualizá productos por lote mediante archivos Excel (.xlsx) o CSV (.csv)
          </p>
        </div>

        <button
          type="button"
          onClick={descargarPlantilla}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm bg-white border border-[#1B87C8] text-[#1B87C8] hover:bg-[#F0F7FD] transition-all shadow-xs self-start sm:self-center"
        >
          <span>📥</span> Descargar plantilla Excel (.xlsx)
        </button>
      </div>

      {/* STEPPER INDICATOR */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
        {[
          { num: 1, label: "Paso A", sub: "Subir archivo" },
          { num: 2, label: "Paso B", sub: "Vista previa y validación" },
          { num: 3, label: "Paso C", sub: "Confirmar e importar" },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-3 sm:p-4 rounded-xl border text-center transition-all ${
              paso === s.num
                ? "bg-[#F0F7FD] border-[#1B87C8] text-[#1B87C8]"
                : paso > s.num
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-white border-black/8 text-gray-400"
            }`}
          >
            <div className="text-xs font-black uppercase tracking-wider">
              {paso > s.num ? "✓ " : ""}
              {s.label}
            </div>
            <div className="text-xs sm:text-sm font-semibold truncate mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ============================================================= */}
      {/* PASO 1: SUBIDA DE ARCHIVOS Y SELECCIÓN DE OPCIÓN DE IMÁGENES */}
      {/* ============================================================= */}
      {paso === 1 && (
        <div className="space-y-6">
          {errorSubida && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <span>❌</span>
              <span>{errorSubida}</span>
            </div>
          )}

          {/* TARJETA 1: ARCHIVO EXCEL/CSV */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/8 shadow-xs">
            <h2
              className="font-black uppercase text-xl text-gray-900 mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              1. Seleccionar Planilla de Productos
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Formatos soportados: <strong>.xlsx</strong>, <strong>.xls</strong> o <strong>.csv</strong>. Si no tenés el formato, podés usar el botón superior para descargar la plantilla de ejemplo.
            </p>

            <div className="border-2 border-dashed border-gray-300 hover:border-[#1B87C8] rounded-xl p-6 sm:p-10 text-center bg-[#FAFCFE] transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setArchivoExcel(e.target.files[0]);
                    setErrorSubida("");
                  }
                }}
                className="hidden"
                id="excelInput"
              />
              <label htmlFor="excelInput" className="cursor-pointer flex flex-col items-center">
                <span className="text-4xl mb-2">📊</span>
                <span className="font-bold text-sm text-[#1B87C8] hover:underline">
                  {archivoExcel ? archivoExcel.name : "Hacé clic acá para seleccionar tu archivo"}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  {archivoExcel
                    ? `${(archivoExcel.size / 1024).toFixed(1)} KB`
                    : "o arrastralo y soltalo directamente"}
                </span>
              </label>
            </div>
          </div>

          {/* TARJETA 2: OPCIÓN DE IMÁGENES */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-black/8 shadow-xs">
            <h2
              className="font-black uppercase text-xl text-gray-900 mb-1"
              style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
            >
              2. Método para Fotos de Productos
            </h2>
            <p className="text-xs text-gray-500 mb-5">
              Elegí cómo vas a suministrar las imágenes para esta importación:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              {/* Opción 1: URLs */}
              <div
                onClick={() => setTipoImagen("url")}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipoImagen === "url"
                    ? "border-[#1B87C8] bg-[#F0F7FD]"
                    : "border-black/8 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    checked={tipoImagen === "url"}
                    onChange={() => setTipoImagen("url")}
                    className="accent-[#1B87C8]"
                  />
                  <span className="font-bold text-sm text-gray-900">
                    Opción 1 — Enlaces en la columna imagen_url
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pl-6">
                  El sistema descargará las imágenes desde los links web incluidos en el Excel y las alojará en Supabase Storage nombrándolas con su SKU.
                </p>
              </div>

              {/* Opción 2: ZIP */}
              <div
                onClick={() => setTipoImagen("zip")}
                className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  tipoImagen === "zip"
                    ? "border-[#1B87C8] bg-[#F0F7FD]"
                    : "border-black/8 bg-white hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="radio"
                    checked={tipoImagen === "zip"}
                    onChange={() => setTipoImagen("zip")}
                    className="accent-[#1B87C8]"
                  />
                  <span className="font-bold text-sm text-gray-900">
                    Opción 2 — Archivo ZIP de imágenes por SKU
                  </span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed pl-6">
                  Subí un archivo .zip donde cada imagen tenga como nombre el SKU del producto (ej: <code>TAL-750.jpg</code>). El navegador las descomprime y asocia automáticamente.
                </p>
              </div>
            </div>

            {/* Input para el archivo ZIP si eligió opción ZIP */}
            {tipoImagen === "zip" && (
              <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200">
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 mb-2">
                  Adjuntar archivo ZIP con fotos *
                </label>
                <input
                  ref={zipInputRef}
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setArchivoZip(e.target.files[0]);
                      setErrorSubida("");
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1B87C8] file:text-white hover:file:brightness-105 cursor-pointer"
                />
                {archivoZip && (
                  <p className="text-xs text-emerald-700 font-semibold mt-2">
                    ✓ Archivo ZIP seleccionado: {archivoZip.name} ({(archivoZip.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* BOTÓN DE CONTINUAR */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={procesarArchivos}
              disabled={procesandoArchivo || !archivoExcel || (tipoImagen === "zip" && !archivoZip)}
              className="px-8 py-3.5 rounded-full font-bold text-sm text-white transition-all shadow-md hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "#1B87C8" }}
            >
              {procesandoArchivo ? "Leyendo y validando datos..." : "Continuar a Vista Previa →"}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 2: VISTA PREVIA Y VALIDACIÓN FILA POR FILA */}
      {/* ============================================================= */}
      {paso === 2 && (
        <div className="space-y-6">
          {/* Tarjeta de Resumen de Validación */}
          <div className="bg-white rounded-2xl p-6 border border-black/8 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-xs font-bold uppercase text-gray-400 block">Total Filas</span>
                <span className="text-2xl font-black text-gray-900">{filas.length}</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <span className="text-xs font-bold uppercase text-emerald-600 block">Válidas para importar</span>
                <span className="text-2xl font-black text-emerald-600">{filasValidasCount}</span>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <span className="text-xs font-bold uppercase text-red-600 block">Con errores</span>
                <span className="text-2xl font-black text-red-600">{filasInvalidasCount}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPaso(1)}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors border border-black/8"
              >
                ← Volver a cargar archivo
              </button>
              <button
                type="button"
                onClick={ejecutarImportacion}
                disabled={filasValidasCount === 0}
                className="px-7 py-2.5 rounded-full font-bold text-sm text-white transition-all shadow-md hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#1B87C8" }}
              >
                Confirmar e importar ({filasValidasCount}) →
              </button>
            </div>
          </div>

          {filasInvalidasCount > 0 && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
              ⚠️ Se detectaron <strong>{filasInvalidasCount} filas con errores</strong> (marcadas en rojo). Si continúas, únicamente se importarán las <strong>{filasValidasCount} filas válidas</strong> y las defectuosas serán omitidas sin alterar la base de datos.
            </div>
          )}

          {/* TABLA DE VISTA PREVIA */}
          <div className="bg-white rounded-2xl overflow-hidden border border-black/8 shadow-xs">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFCFE] text-gray-500 uppercase tracking-wider font-bold border-b border-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 w-14">#</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5">SKU</th>
                    <th className="px-4 py-3.5">Nombre</th>
                    <th className="px-4 py-3.5">Marca</th>
                    <th className="px-4 py-3.5">Precio</th>
                    <th className="px-4 py-3.5">Stock</th>
                    <th className="px-4 py-3.5">Categoría</th>
                    <th className="px-4 py-3.5">Badge</th>
                    <th className="px-4 py-3.5">Imagen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filas.map((f) => (
                    <tr
                      key={f.indice}
                      className={`transition-colors ${
                        f.esValido
                          ? "hover:bg-gray-50/80"
                          : "bg-red-50/70 hover:bg-red-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-gray-400 font-semibold">{f.indice}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {f.esValido ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            ✓ Válido
                          </span>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-200 text-red-900">
                              ✕ Inválido
                            </span>
                            <div className="text-[11px] text-red-700 font-medium">
                              {f.errores.join(" • ")}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-gray-900 whitespace-nowrap">
                        {f.sku || <span className="text-red-500 italic">Vacío</span>}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 max-w-xs truncate" title={f.nombre}>
                        {f.nombre || <span className="text-red-500 italic">Vacío</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{f.marca || "—"}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                        ${f.precio.toLocaleString("es-AR")}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{f.stock}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                          {f.categoria_nombre} ({f.categoria_id})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{f.badge || "—"}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {tipoImagen === "zip" ? (
                          f.imagen_zip_archivo ? (
                            <span className="text-emerald-700 font-medium" title={f.imagen_zip_archivo}>
                              📷 ZIP: {f.imagen_zip_archivo}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Sin foto en ZIP</span>
                          )
                        ) : f.imagen_url ? (
                          <span className="text-[#1B87C8] truncate max-w-[150px] block" title={f.imagen_url}>
                            🔗 {f.imagen_url}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">Sin URL</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* PASO 3: PROGRESO Y PANTALLA DE RESULTADOS */}
      {/* ============================================================= */}
      {paso === 3 && (
        <div className="bg-white rounded-2xl p-8 sm:p-12 border border-black/8 shadow-xs max-w-2xl mx-auto text-center">
          {importando ? (
            <div className="space-y-6">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#F0F7FD] flex items-center justify-center text-4xl animate-bounce">
                ⚙️
              </div>
              <div>
                <h3
                  className="font-black uppercase text-2xl text-gray-900 mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Importando Productos...
                </h3>
                <p className="text-sm text-gray-500">{progreso.mensaje}</p>
              </div>

              {/* BARRA DE PROGRESO */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#1B87C8] h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${progreso.total > 0 ? (progreso.actual / progreso.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="text-xs text-gray-400 font-mono">
                {progreso.actual} de {progreso.total} productos procesados
              </p>
            </div>
          ) : resumen ? (
            <div className="space-y-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-4xl shadow-xs">
                ✅
              </div>

              <div>
                <h3
                  className="font-black uppercase text-3xl text-gray-900 mb-2"
                  style={{ fontFamily: "'Barlow Condensed', sans-serif" }}
                >
                  Importación Completada
                </h3>
                <p className="text-sm text-gray-500">
                  Los registros válidos fueron procesados y guardados en el catálogo.
                </p>
              </div>

              {/* TARJETAS ESTADÍSTICAS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200">
                  <span className="text-xs font-bold uppercase text-emerald-800 block">Nuevos Creados</span>
                  <span className="text-3xl font-black text-emerald-700">{resumen.creados}</span>
                </div>
                <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200">
                  <span className="text-xs font-bold uppercase text-blue-800 block">Actualizados</span>
                  <span className="text-3xl font-black text-[#1B87C8]">{resumen.actualizados}</span>
                </div>
                <div className="p-4 rounded-xl bg-red-50/70 border border-red-200">
                  <span className="text-xs font-bold uppercase text-red-800 block">Omitidos</span>
                  <span className="text-3xl font-black text-red-600">{resumen.errores}</span>
                </div>
              </div>

              {/* ACCIONES FINALES */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={reiniciarFlujo}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  🔄 Cargar otro archivo
                </button>
                <Link
                  href="/admin/productos"
                  className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-bold text-white transition-all shadow-md hover:brightness-105"
                  style={{ background: "#1B87C8" }}
                >
                  📦 Ver catálogo de productos
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
