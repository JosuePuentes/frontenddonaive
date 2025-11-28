import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Plus, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Proveedor {
  _id?: string;
  nombre: string;
  rif: string;
  telefono: string;
  dias_credito: number;
  descuento_comercial: number;
  descuento_pronto_pago: number;
}

interface ProductoInventario {
  _id?: string;
  codigo: string;
  descripcion: string;
  marca?: string;
  costo_unitario?: number;
  precio_unitario?: number;
  cantidad?: number;
}

interface ItemCompra {
  id: string;
  codigo: string;
  descripcion: string;
  marca: string;
  costo: number;
  costoAjustado: number; // Costo con ajuste de dólar negro si aplica
  utilidad: number;
  precioVenta: number;
  cantidad: number;
  fechaVencimiento: string;
  lote: string;
  esNuevo: boolean; // Si es un producto nuevo o existente
  productoId?: string; // ID del producto si existe en inventario
}

interface ModalCrearCompraProps {
  open: boolean;
  onClose: () => void;
  proveedor: Proveedor;
  dolarBcv: number;
  dolarNegro: number;
  diferenciaPorcentaje: number;
  onSuccess: () => void;
}

const ModalCrearCompra: React.FC<ModalCrearCompraProps> = ({
  open,
  onClose,
  proveedor,
  dolarBcv,
  dolarNegro,
  diferenciaPorcentaje,
  onSuccess,
}) => {
  const [itemsCompra, setItemsCompra] = useState<ItemCompra[]>([]);
  const [pagarEnDolarNegro, setPagarEnDolarNegro] = useState(false);
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [productosEncontrados, setProductosEncontrados] = useState<ProductoInventario[]>([]);
  const [buscandoProductos, setBuscandoProductos] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  
  // Formulario para nuevo producto
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [descripcionNuevo, setDescripcionNuevo] = useState("");
  const [marcaNuevo, setMarcaNuevo] = useState("");
  const [costoNuevo, setCostoNuevo] = useState("");
  const [utilidadNuevo, setUtilidadNuevo] = useState("");
  const [cantidadNuevo, setCantidadNuevo] = useState("");
  const [fechaVencimientoNuevo, setFechaVencimientoNuevo] = useState("");
  const [loteNuevo, setLoteNuevo] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Si se activa dólar negro, activar automáticamente
  useEffect(() => {
    if (dolarNegro > 0 && dolarBcv > 0 && diferenciaPorcentaje > 0) {
      setPagarEnDolarNegro(true);
    }
  }, [dolarNegro, dolarBcv, diferenciaPorcentaje]);

  // Buscar productos en inventario
  const buscarProductos = async () => {
    if (!busquedaProducto.trim()) {
      setProductosEncontrados([]);
      return;
    }

    setBuscandoProductos(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      // Buscar productos sin filtro de sucursal para compras
      const res = await fetch(
        `${API_BASE_URL}/productos?search=${encodeURIComponent(busquedaProducto)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setProductosEncontrados(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al buscar productos:", err);
    } finally {
      setBuscandoProductos(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      buscarProductos();
    }, 300);

    return () => clearTimeout(timer);
  }, [busquedaProducto]);

  // Agregar producto existente
  const agregarProductoExistente = (producto: ProductoInventario) => {
    const costo = producto.costo_unitario || 0;
    const costoAjustado = pagarEnDolarNegro && diferenciaPorcentaje > 0
      ? costo * (1 + diferenciaPorcentaje / 100)
      : costo;
    const utilidad = (producto.precio_unitario || 0) - costo;
    const precioVenta = costoAjustado + utilidad;

    const nuevoItem: ItemCompra = {
      id: `item-${Date.now()}-${Math.random()}`,
      codigo: producto.codigo,
      descripcion: producto.descripcion,
      marca: producto.marca || "",
      costo: costo,
      costoAjustado: costoAjustado,
      utilidad: utilidad,
      precioVenta: precioVenta,
      cantidad: 1,
      fechaVencimiento: "",
      lote: "",
      esNuevo: false,
      productoId: producto._id,
    };

    setItemsCompra([...itemsCompra, nuevoItem]);
    setBusquedaProducto("");
    setProductosEncontrados([]);
  };

  // Agregar nuevo producto
  const agregarNuevoProducto = () => {
    if (!codigoNuevo.trim() || !descripcionNuevo.trim() || !costoNuevo || !utilidadNuevo || !cantidadNuevo) {
      setError("Código, descripción, costo, utilidad y cantidad son obligatorios");
      return;
    }

    const costo = parseFloat(costoNuevo);
    const utilidad = parseFloat(utilidadNuevo);
    const costoAjustado = pagarEnDolarNegro && diferenciaPorcentaje > 0
      ? costo * (1 + diferenciaPorcentaje / 100)
      : costo;
    const precioVenta = costoAjustado + utilidad;

    const nuevoItem: ItemCompra = {
      id: `item-${Date.now()}-${Math.random()}`,
      codigo: codigoNuevo.trim(),
      descripcion: descripcionNuevo.trim(),
      marca: marcaNuevo.trim(),
      costo: costo,
      costoAjustado: costoAjustado,
      utilidad: utilidad,
      precioVenta: precioVenta,
      cantidad: parseInt(cantidadNuevo),
      fechaVencimiento: fechaVencimientoNuevo,
      lote: loteNuevo.trim(),
      esNuevo: true,
    };

    setItemsCompra([...itemsCompra, nuevoItem]);
    
    // Limpiar formulario
    setCodigoNuevo("");
    setDescripcionNuevo("");
    setMarcaNuevo("");
    setCostoNuevo("");
    setUtilidadNuevo("");
    setCantidadNuevo("");
    setFechaVencimientoNuevo("");
    setLoteNuevo("");
    setMostrarFormularioNuevo(false);
    setError(null);
  };

  // Actualizar items cuando cambia el checkbox de dólar negro
  useEffect(() => {
    setItemsCompra(itemsCompra.map(item => {
      const costoAjustado = pagarEnDolarNegro && diferenciaPorcentaje > 0
        ? item.costo * (1 + diferenciaPorcentaje / 100)
        : item.costo;
      const precioVenta = costoAjustado + item.utilidad;
      return {
        ...item,
        costoAjustado,
        precioVenta,
      };
    }));
  }, [pagarEnDolarNegro, diferenciaPorcentaje]);

  // Eliminar item
  const eliminarItem = (id: string) => {
    setItemsCompra(itemsCompra.filter(item => item.id !== id));
  };

  // Actualizar cantidad de item
  const actualizarCantidad = (id: string, cantidad: number) => {
    setItemsCompra(itemsCompra.map(item =>
      item.id === id ? { ...item, cantidad: Math.max(1, cantidad) } : item
    ));
  };

  // Calcular totales
  const totalCosto = itemsCompra.reduce((sum, item) => sum + (item.costoAjustado * item.cantidad), 0);
  const totalUtilidad = itemsCompra.reduce((sum, item) => sum + (item.utilidad * item.cantidad), 0);
  const totalPrecioVenta = itemsCompra.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);

  // Guardar compra
  const guardarCompra = async () => {
    if (itemsCompra.length === 0) {
      setError("Debe agregar al menos un producto");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(`${API_BASE_URL}/compras`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proveedor_id: proveedor._id,
          pagar_en_dolar_negro: pagarEnDolarNegro,
          dolar_bcv: dolarBcv,
          dolar_negro: dolarNegro,
          items: itemsCompra.map(item => ({
            codigo: item.codigo,
            descripcion: item.descripcion,
            marca: item.marca,
            costo: item.costo,
            costo_ajustado: item.costoAjustado,
            utilidad: item.utilidad,
            precio_venta: item.precioVenta,
            cantidad: item.cantidad,
            fecha_vencimiento: item.fechaVencimiento || null,
            lote: item.lote || null,
            es_nuevo: item.esNuevo,
            producto_id: item.productoId || null,
          })),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || "Error al guardar compra");
      }

      // Limpiar todo
      setItemsCompra([]);
      setPagarEnDolarNegro(false);
      setBusquedaProducto("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al guardar compra");
      console.error("Error al guardar compra:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[100vw] w-screen h-screen max-h-screen m-0 rounded-none translate-x-0 translate-y-0 top-0 left-0 flex flex-col p-6">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Crear Compra - {proveedor.nombre}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm flex-shrink-0">
            {error}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden min-h-0">
          {/* Panel izquierdo - Búsqueda y formulario */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Buscar Producto</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Buscar por código o descripción..."
                  value={busquedaProducto}
                  onChange={(e) => setBusquedaProducto(e.target.value)}
                  className="w-full"
                />
                {buscandoProductos && (
                  <p className="text-sm text-slate-500">Buscando...</p>
                )}
                {productosEncontrados.length > 0 && (
                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {productosEncontrados.map((producto) => (
                      <Card
                        key={producto._id}
                        className="p-2 hover:bg-slate-50 cursor-pointer"
                        onClick={() => agregarProductoExistente(producto)}
                      >
                        <p className="font-medium text-sm">{producto.codigo}</p>
                        <p className="text-xs text-slate-600">{producto.descripcion}</p>
                        {producto.marca && (
                          <p className="text-xs text-slate-500">Marca: {producto.marca}</p>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-slate-800">Nuevo Producto</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMostrarFormularioNuevo(!mostrarFormularioNuevo)}
                >
                  {mostrarFormularioNuevo ? "Ocultar" : "Mostrar"}
                </Button>
              </div>
              {mostrarFormularioNuevo && (
                <div className="space-y-3">
                  <Input
                    placeholder="Código *"
                    value={codigoNuevo}
                    onChange={(e) => setCodigoNuevo(e.target.value)}
                  />
                  <Input
                    placeholder="Descripción *"
                    value={descripcionNuevo}
                    onChange={(e) => setDescripcionNuevo(e.target.value)}
                  />
                  <Input
                    placeholder="Marca"
                    value={marcaNuevo}
                    onChange={(e) => setMarcaNuevo(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Costo *"
                    value={costoNuevo}
                    onChange={(e) => setCostoNuevo(e.target.value)}
                  />
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Utilidad *"
                    value={utilidadNuevo}
                    onChange={(e) => setUtilidadNuevo(e.target.value)}
                  />
                  <Input
                    type="number"
                    placeholder="Cantidad *"
                    value={cantidadNuevo}
                    onChange={(e) => setCantidadNuevo(e.target.value)}
                  />
                  <Input
                    type="date"
                    placeholder="Fecha Vencimiento"
                    value={fechaVencimientoNuevo}
                    onChange={(e) => setFechaVencimientoNuevo(e.target.value)}
                  />
                  <Input
                    placeholder="Lote"
                    value={loteNuevo}
                    onChange={(e) => setLoteNuevo(e.target.value)}
                  />
                  <Button
                    onClick={agregarNuevoProducto}
                    className="w-full"
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Producto
                  </Button>
                </div>
              )}
            </Card>

            {/* Checkbox para pagar en dólar negro */}
            {dolarNegro > 0 && dolarBcv > 0 && diferenciaPorcentaje > 0 && (
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={pagarEnDolarNegro}
                    onCheckedChange={(checked) => setPagarEnDolarNegro(!!checked)}
                  />
                  <label className="text-sm font-medium text-slate-700">
                    Pagar en Dólar Negro
                  </label>
                </div>
                {pagarEnDolarNegro && (
                  <p className="text-xs text-slate-500 mt-2">
                    Se sumará {diferenciaPorcentaje.toFixed(2)}% al costo de cada producto
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Panel derecho - Lista de items y totales */}
          <div className="lg:col-span-3 space-y-4 overflow-hidden flex flex-col">
            <Card className="p-4 flex-1 flex flex-col min-h-0">
              <h3 className="font-semibold text-slate-800 mb-4 text-lg">Productos en la Compra</h3>
              {itemsCompra.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay productos agregados</p>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Código</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Descripción</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Marca</th>
                        <th className="border border-slate-300 px-4 py-3 text-right font-semibold text-slate-700">Costo</th>
                        {pagarEnDolarNegro && (
                          <th className="border border-slate-300 px-4 py-3 text-right font-semibold text-slate-700">Costo Ajustado</th>
                        )}
                        <th className="border border-slate-300 px-4 py-3 text-right font-semibold text-slate-700">Utilidad</th>
                        <th className="border border-slate-300 px-4 py-3 text-right font-semibold text-slate-700">Precio Venta</th>
                        <th className="border border-slate-300 px-4 py-3 text-right font-semibold text-slate-700">Cantidad</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Lote</th>
                        <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700">Vencimiento</th>
                        <th className="border border-slate-300 px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCompra.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{item.codigo}</span>
                              {item.esNuevo && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Nuevo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border border-slate-300 px-4 py-3">{item.descripcion}</td>
                          <td className="border border-slate-300 px-4 py-3">{item.marca || "-"}</td>
                          <td className="border border-slate-300 px-4 py-3 text-right font-medium">
                            ${item.costo.toFixed(2)}
                          </td>
                          {pagarEnDolarNegro && (
                            <td className="border border-slate-300 px-4 py-3 text-right font-medium text-orange-600">
                              ${item.costoAjustado.toFixed(2)}
                            </td>
                          )}
                          <td className="border border-slate-300 px-4 py-3 text-right font-medium">
                            ${item.utilidad.toFixed(2)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-right font-semibold text-green-600">
                            ${item.precioVenta.toFixed(2)}
                          </td>
                          <td className="border border-slate-300 px-4 py-3">
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                              className="w-24 text-center"
                            />
                          </td>
                          <td className="border border-slate-300 px-4 py-3">{item.lote || "-"}</td>
                          <td className="border border-slate-300 px-4 py-3">
                            {item.fechaVencimiento 
                              ? new Date(item.fechaVencimiento).toLocaleDateString('es-VE')
                              : "-"
                            }
                          </td>
                          <td className="border border-slate-300 px-4 py-3 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Totales */}
            <Card className="p-4 bg-slate-50 flex-shrink-0">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-slate-600 text-sm">Total Costo:</span>
                  <p className="text-xl font-semibold">${totalCosto.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-600 text-sm">Total Utilidad:</span>
                  <p className="text-xl font-semibold text-green-600">${totalUtilidad.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-800 text-sm font-semibold">Total Precio Venta:</span>
                  <p className="text-2xl font-bold text-green-600">${totalPrecioVenta.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3 flex-shrink-0 pt-2 border-t">
              <Button variant="outline" onClick={onClose} disabled={loading} size="lg">
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={guardarCompra} disabled={loading || itemsCompra.length === 0} size="lg">
                {loading ? "Guardando..." : "Guardar Compra"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCrearCompra;

