import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileSpreadsheet, X, CheckCircle2 } from "lucide-react";


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Sucursal {
  id: string;
  nombre: string;
}

interface ProductoInventario {
  codigo: string;
  descripcion: string;
  marca: string;
  existencia: number;
  costo: number;
  precio: number;
}

interface UploadInventarioExcelProps {
  sucursales: Sucursal[];
  onSuccess?: () => void;
}

const UploadInventarioExcel: React.FC<UploadInventarioExcelProps> = ({
  sucursales,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>("");
  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [preview, setPreview] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validar extensión
    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (extension !== "xlsx" && extension !== "xls") {
      setError("Por favor, selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setSuccess(false);
    setPreview(false);
    setProductos([]);

    // Leer y parsear el archivo
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Importación dinámica de xlsx para evitar problemas de build
        const XLSXModule = await import("xlsx");
        const XLSX = XLSXModule.default || XLSXModule;
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Validar que tenga al menos una fila de datos
        if (jsonData.length < 2) {
          setError("El archivo Excel debe tener al menos una fila de datos (después del encabezado)");
          return;
        }

        // Obtener encabezados (primera fila)
        const headers = (jsonData[0] as any[]).map((h: any) =>
          String(h || "").toLowerCase().trim()
        );

        // Buscar índices de columnas - TODAS son requeridas
        const codigoIdx = headers.findIndex((h) =>
          ["codigo", "código", "code"].includes(h)
        );
        const descripcionIdx = headers.findIndex((h) =>
          ["descripcion", "descripción", "descrip", "producto", "nombre"].includes(h)
        );
        const marcaIdx = headers.findIndex((h) =>
          ["marca", "brand"].includes(h)
        );
        const costoIdx = headers.findIndex((h) =>
          ["costo", "cost", "precio_costo", "precio costo"].includes(h)
        );
        const precioIdx = headers.findIndex((h) =>
          ["precio", "price", "precio_venta", "precio venta"].includes(h)
        );
        const existenciaIdx = headers.findIndex((h) =>
          ["existencia", "stock", "cantidad", "cant"].includes(h)
        );

        // Validar que existan TODAS las columnas requeridas (ninguna es opcional)
        if (codigoIdx === -1 || descripcionIdx === -1 || marcaIdx === -1 || costoIdx === -1 || precioIdx === -1 || existenciaIdx === -1) {
          const faltantes = [];
          if (codigoIdx === -1) faltantes.push("CODIGO");
          if (descripcionIdx === -1) faltantes.push("DESCRIPCION");
          if (marcaIdx === -1) faltantes.push("MARCA");
          if (costoIdx === -1) faltantes.push("COSTO");
          if (precioIdx === -1) faltantes.push("PRECIO");
          if (existenciaIdx === -1) faltantes.push("EXISTENCIA");
          
          setError(
            `El archivo Excel debe contener TODAS las columnas requeridas. Faltan: ${faltantes.join(", ")}. El formato debe ser: CODIGO, DESCRIPCION, MARCA, COSTO, PRECIO, EXISTENCIA`
          );
          return;
        }

        // Parsear datos
        const productosParsed: ProductoInventario[] = [];
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as any[];
          if (!row || row.length === 0) continue;

          const codigo = String(row[codigoIdx] || "").trim();
          const descripcion = String(row[descripcionIdx] || "").trim();
          const marca = String(row[marcaIdx] || "").trim();
          const costo = parseFloat(String(row[costoIdx] || 0)) || 0;
          const precio = parseFloat(String(row[precioIdx] || 0)) || 0;
          const existencia = parseFloat(String(row[existenciaIdx] || 0)) || 0;

          // Validar que TODOS los campos estén presentes (ninguno es opcional)
          if (!codigo || !descripcion || !marca) {
            // Saltar filas incompletas
            continue;
          }

          // Validar que los números sean válidos
          if (isNaN(costo) || isNaN(precio) || isNaN(existencia)) {
            continue;
          }

          productosParsed.push({
            codigo,
            descripcion,
            marca,
            existencia,
            costo,
            precio,
          });
        }

        if (productosParsed.length === 0) {
          setError("No se encontraron productos válidos en el archivo Excel");
          return;
        }

        setProductos(productosParsed);
        setPreview(true);
      } catch (err: any) {
        setError(`Error al leer el archivo: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setError("Error al leer el archivo");
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !sucursalSeleccionada || productos.length === 0) {
      setError("Por favor, completa todos los campos requeridos");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No se encontró el token de autenticación");
      }

      const response = await fetch(
        `${API_BASE_URL}/inventarios/upload-excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            sucursal: sucursalSeleccionada,
            productos,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || errorData.message || "Error al subir el inventario"
        );
      }

      setSuccess(true);
      setFile(null);
      setProductos([]);
      setSucursalSeleccionada("");
      setPreview(false);

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Error al subir el inventario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Subir Inventario desde Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Seleccionar Sucursal
            </label>
            <select
              value={sucursalSeleccionada}
              onChange={(e) => setSucursalSeleccionada(e.target.value)}
              className="w-full border rounded-md px-3 py-2"
              disabled={loading}
            >
              <option value="">Seleccione una sucursal</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Archivo Excel
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={loading}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              <strong>Formato requerido:</strong> CODIGO, DESCRIPCION, MARCA, COSTO, PRECIO, EXISTENCIA
              <br />
              <span className="text-red-600">Todas las columnas son obligatorias</span>
            </p>
          </div>
        </div>

        {preview && productos.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Vista previa: {productos.length} productos encontrados
            </p>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Código</th>
                    <th className="text-left p-1">Descripción</th>
                    <th className="text-left p-1">Marca</th>
                    <th className="text-right p-1">Costo</th>
                    <th className="text-right p-1">Precio</th>
                    <th className="text-right p-1">Existencia</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.slice(0, 5).map((p, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1">{p.codigo}</td>
                      <td className="p-1">{p.descripcion}</td>
                      <td className="p-1">{p.marca}</td>
                      <td className="text-right p-1">{p.costo.toFixed(2)}</td>
                      <td className="text-right p-1">{p.precio.toFixed(2)}</td>
                      <td className="text-right p-1">{p.existencia}</td>
                    </tr>
                  ))}
                  {productos.length > 5 && (
                    <tr>
                      <td colSpan={6} className="text-center p-1 text-gray-500">
                        ... y {productos.length - 5} más
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Inventario subido exitosamente
          </div>
        )}

        <div className="flex justify-end gap-2">
          {file && (
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setProductos([]);
                setPreview(false);
                setError(null);
                setSuccess(false);
              }}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Limpiar
            </Button>
          )}
          <Button
            onClick={handleUpload}
            disabled={
              !file ||
              !sucursalSeleccionada ||
              productos.length === 0 ||
              loading
            }
          >
            <Upload className="w-4 h-4 mr-2" />
            {loading ? "Subiendo..." : "Subir Inventario"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UploadInventarioExcel;

