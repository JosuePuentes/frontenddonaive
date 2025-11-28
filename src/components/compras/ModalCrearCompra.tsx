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
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Crear Compra - {proveedor.nombre}
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Búsqueda y formulario */}
          <div className="lg:col-span-1 space-y-4">
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
                  <div className="max-h-60 overflow-y-auto space-y-2">
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
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-4">Productos en la Compra</h3>
              {itemsCompra.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay productos agregados</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {itemsCompra.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{item.codigo}</p>
                            {item.esNuevo && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                Nuevo
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">{item.descripcion}</p>
                          {item.marca && (
                            <p className="text-xs text-slate-500">Marca: {item.marca}</p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                            <div>
                              <span className="text-slate-500">Costo:</span>{" "}
                              <span className="font-medium">${item.costo.toFixed(2)}</span>
                            </div>
                            {pagarEnDolarNegro && item.costoAjustado !== item.costo && (
                              <div>
                                <span className="text-slate-500">Costo Ajustado:</span>{" "}
                                <span className="font-medium text-orange-600">
                                  ${item.costoAjustado.toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500">Utilidad:</span>{" "}
                              <span className="font-medium">${item.utilidad.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">Precio Venta:</span>{" "}
                              <span className="font-medium text-green-600">
                                ${item.precioVenta.toFixed(2)}
                              </span>
                            </div>
                            {item.lote && (
                              <div>
                                <span className="text-slate-500">Lote:</span> {item.lote}
                              </div>
                            )}
                            {item.fechaVencimiento && (
                              <div>
                                <span className="text-slate-500">Vencimiento:</span>{" "}
                                {new Date(item.fechaVencimiento).toLocaleDateString('es-VE')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => eliminarItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Totales */}
            <Card className="p-4 bg-slate-50">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Costo:</span>
                  <span className="font-semibold">${totalCosto.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Utilidad:</span>
                  <span className="font-semibold text-green-600">${totalUtilidad.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg border-t pt-2">
                  <span className="font-semibold text-slate-800">Total Precio Venta:</span>
                  <span className="font-bold text-green-600">${totalPrecioVenta.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onClose} disabled={loading}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={guardarCompra} disabled={loading || itemsCompra.length === 0}>
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

