import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, RefreshCw } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ItemInventario {
  _id?: string;
  id?: string;
  codigo: string;
  descripcion: string;
  marca?: string;
  costo: number;
  existencia: number;
  precio: number;
  porcentaje_ganancia?: number;
  utilidad_contable?: number;
  sucursal?: string;
  inventario_id?: string;
}

interface VerItemsInventarioModalProps {
  open: boolean;
  onClose: () => void;
  inventarioId: string;
  inventarioNombre?: string;
  refreshTrigger?: number; // Para forzar refresh cuando cambie
}

const VerItemsInventarioModal: React.FC<VerItemsInventarioModalProps> = ({
  open,
  onClose,
  inventarioId,
  inventarioNombre,
  refreshTrigger,
}) => {
  const [items, setItems] = useState<ItemInventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      // Intentar obtener items del inventario
      // El endpoint puede ser: GET /inventarios/{inventario_id}/items
      // O: GET /productos?inventario_id={inventario_id}
      const res = await fetch(`${API_BASE_URL}/inventarios/${inventarioId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Si el endpoint no existe, intentar obtener productos filtrados por inventario
        if (res.status === 404) {
          // Intentar con endpoint alternativo
          const resAlt = await fetch(`${API_BASE_URL}/productos?inventario_id=${inventarioId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (resAlt.ok) {
            const data = await resAlt.json();
            setItems(Array.isArray(data) ? data : []);
            return;
          }
        }
        
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || "Error al obtener items del inventario");
      }

      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Error al cargar los items del inventario");
      console.error("Error al obtener items:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && inventarioId) {
      fetchItems();
    } else if (!open) {
      setItems([]);
      setError(null);
    }
  }, [open, inventarioId, refreshTrigger]);

  const handleCerrar = () => {
    setItems([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCerrar()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="ver-items-description">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Items del Inventario {inventarioNombre && `- ${inventarioNombre}`}
          </DialogTitle>
          <p id="ver-items-description" className="sr-only">
            Lista de items/productos del inventario seleccionado.
          </p>
        </DialogHeader>

        <div className="flex justify-between items-center mb-4">
          <p className="text-sm text-slate-600">
            Total de items: <span className="font-semibold">{items.length}</span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchItems}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            Cargando items...
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>No hay items en este inventario</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Código</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Descripción</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Marca</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Costo</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Precio</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Existencia</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Utilidad</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">% Ganancia</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {items.map((item, index) => {
                    const utilidad = item.utilidad_contable ?? (item.precio - item.costo);
                    const porcentajeGanancia = item.porcentaje_ganancia ?? ((item.precio - item.costo) / item.costo) * 100;
                    
                    return (
                      <tr key={item._id || item.id || index} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{item.codigo || "-"}</td>
                        <td className="px-4 py-3 text-slate-700">{item.descripcion || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{item.marca || "-"}</td>
                        <td className="px-4 py-3 text-right text-slate-700">
                          {item.costo?.toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"} Bs
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {item.precio?.toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }) || "0.00"} Bs
                        </td>
                        <td className="px-4 py-3 text-right text-slate-700">{item.existencia || 0}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">
                          {utilidad.toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} Bs
                        </td>
                        <td className="px-4 py-3 text-right text-blue-600 font-medium">
                          {porcentajeGanancia.toFixed(2)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-semibold text-slate-900">
                      Totales
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {items.reduce((sum, item) => sum + (item.costo || 0) * (item.existencia || 0), 0).toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} Bs
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {items.reduce((sum, item) => sum + (item.precio || 0) * (item.existencia || 0), 0).toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} Bs
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {items.reduce((sum, item) => sum + (item.existencia || 0), 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-green-600">
                      {items.reduce((sum, item) => {
                        const utilidad = item.utilidad_contable ?? (item.precio - item.costo);
                        return sum + utilidad * (item.existencia || 0);
                      }, 0).toLocaleString("es-VE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })} Bs
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={handleCerrar}>
            <X className="h-4 w-4 mr-2" />
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VerItemsInventarioModal;

