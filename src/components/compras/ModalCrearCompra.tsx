import React, { useState, useEffect } from "react";
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
  dias_credito?: number;
  descuento_comercial?: number;
  descuento_pronto_pago?: number;
}

interface Lote {
  lote: string;
  fecha_vencimiento?: string;
  cantidad?: number;
}

interface ProductoInventario {
  _id?: string;
  codigo: string;
  descripcion: string;
  marca?: string;
  costo_unitario?: number;
  precio_unitario?: number;
  cantidad?: number;
  lotes?: Lote[];
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
  lotesExistentes?: Lote[]; // Lotes existentes del producto en inventario
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

      // Buscar en todos los inventarios usando el endpoint de items
      // Primero obtener todos los inventarios
      const resInventarios = await fetch(`${API_BASE_URL}/inventarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!resInventarios.ok) {
        throw new Error("Error al obtener inventarios");
      }

      const inventarios = await resInventarios.json();
      const inventariosArray = Array.isArray(inventarios) ? inventarios : [];

      // Buscar en todos los inventarios
      const todosLosProductos: ProductoInventario[] = [];
      const busquedaLower = busquedaProducto.toLowerCase().trim();

      for (const inventario of inventariosArray) {
        try {
          const resItems = await fetch(
            `${API_BASE_URL}/inventarios/${inventario._id}/items`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (resItems.ok) {
            const items = await resItems.json();
            const itemsArray = Array.isArray(items) ? items : [];

            // Filtrar items que coincidan con la búsqueda
            const itemsFiltrados = itemsArray.filter((item: any) => {
              const codigo = (item.codigo || "").toLowerCase();
              const descripcion = (item.descripcion || "").toLowerCase();
              const marca = (item.marca || "").toLowerCase();
              return (
                codigo.includes(busquedaLower) ||
                descripcion.includes(busquedaLower) ||
                marca.includes(busquedaLower)
              );
            });

            // Agregar a la lista (evitar duplicados por código)
            itemsFiltrados.forEach((item: any) => {
              const existe = todosLosProductos.some(
                (p) => p.codigo === item.codigo
              );
              if (!existe) {
                todosLosProductos.push({
                  _id: item._id,
                  codigo: item.codigo,
                  descripcion: item.descripcion,
                  marca: item.marca,
                  costo_unitario: item.costo_unitario || item.costo,
                  precio_unitario: item.precio_unitario || item.precio,
                  cantidad: item.cantidad || item.existencia,
                  lotes: item.lotes || [],
                });
              }
            });
          }
        } catch (err) {
          console.error(`Error al obtener items del inventario ${inventario._id}:`, err);
        }
      }

      setProductosEncontrados(todosLosProductos);
    } catch (err) {
      console.error("Error al buscar productos:", err);
      setProductosEncontrados([]);
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
    // Verificar si el producto ya está en la compra
    const yaExiste = itemsCompra.find(item => item.codigo === producto.codigo);
    if (yaExiste) {
      setError("Este producto ya está en la compra. Puedes editar la cantidad directamente.");
      return;
    }

    const costo = producto.costo_unitario || 0;
    const costoAjustado = pagarEnDolarNegro && diferenciaPorcentaje > 0
      ? costo * (1 + diferenciaPorcentaje / 100)
      : costo;
    const utilidad = (producto.precio_unitario || 0) - costo;
    const precioVenta = costoAjustado + utilidad;

    // Mantener los lotes existentes del producto
    const lotesExistentes = producto.lotes || [];

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
      lotesExistentes: lotesExistentes,
    };

    setItemsCompra([...itemsCompra, nuevoItem]);
    setBusquedaProducto("");
    setProductosEncontrados([]);
    setError(null);
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

  // Actualizar costo de item
  const actualizarCosto = (id: string, costo: number) => {
    setItemsCompra(itemsCompra.map(item => {
      if (item.id === id) {
        const costoAjustado = pagarEnDolarNegro && diferenciaPorcentaje > 0
          ? costo * (1 + diferenciaPorcentaje / 100)
          : costo;
        const precioVenta = costoAjustado + item.utilidad;
        return {
          ...item,
          costo: costo,
          costoAjustado: costoAjustado,
          precioVenta: precioVenta,
        };
      }
      return item;
    }));
  };

  // Actualizar utilidad de item
  const actualizarUtilidad = (id: string, utilidad: number) => {
    setItemsCompra(itemsCompra.map(item => {
      if (item.id === id) {
        const precioVenta = item.costoAjustado + utilidad;
        return {
          ...item,
          utilidad: utilidad,
          precioVenta: precioVenta,
        };
      }
      return item;
    }));
  };

  // Actualizar lote de item
  const actualizarLote = (id: string, lote: string) => {
    setItemsCompra(itemsCompra.map(item =>
      item.id === id ? { ...item, lote: lote } : item
    ));
  };

  // Actualizar fecha de vencimiento de item
  const actualizarFechaVencimiento = (id: string, fecha: string) => {
    setItemsCompra(itemsCompra.map(item =>
      item.id === id ? { ...item, fechaVencimiento: fecha } : item
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
            lotes_existentes: item.lotesExistentes || [],
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

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white w-full h-full flex flex-col overflow-hidden"
        style={{
          maxWidth: '100vw',
          maxHeight: '100vh',
        }}
      >
        {/* Header */}
        <div className="flex-shrink-0 pb-3 border-b px-4 pt-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-slate-800">
                Crear Compra - {proveedor.nombre}
              </h2>
              <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                <div>
                  <span className="text-slate-600 font-medium">RIF:</span>{" "}
                  <span className="text-slate-800">{proveedor.rif || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Teléfono:</span>{" "}
                  <span className="text-slate-800">{proveedor.telefono || "-"}</span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Días de Crédito:</span>{" "}
                  <span className="text-slate-800">
                    {proveedor.dias_credito !== undefined && proveedor.dias_credito !== null 
                      ? proveedor.dias_credito 
                      : 0}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Desc. Comercial:</span>{" "}
                  <span className="text-slate-800">
                    {proveedor.descuento_comercial !== undefined && proveedor.descuento_comercial !== null 
                      ? `${proveedor.descuento_comercial}%` 
                      : "0%"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 font-medium">Desc. Pronto Pago:</span>{" "}
                  <span className="text-slate-800">
                    {proveedor.descuento_pronto_pago !== undefined && proveedor.descuento_pronto_pago !== null 
                      ? `${proveedor.descuento_pronto_pago}%` 
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-slate-500 hover:text-slate-700 transition-colors"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm flex-shrink-0 mx-6 mt-4">
            {error}
          </div>
        )}

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden min-h-0 px-4 pb-4">
          {/* Panel izquierdo - Búsqueda y formulario */}
          <div className="lg:col-span-1 space-y-3 overflow-y-auto">
            <Card className="p-3">
              <h3 className="font-medium text-sm text-slate-800 mb-3">Buscar Producto</h3>
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
                        key={producto._id || producto.codigo}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-l-4 border-l-blue-500 transition-all"
                        onClick={() => agregarProductoExistente(producto)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-slate-800">{producto.codigo}</p>
                            <p className="text-xs text-slate-600 mt-1">{producto.descripcion}</p>
                            {producto.marca && (
                              <p className="text-xs text-slate-500 mt-1">Marca: {producto.marca}</p>
                            )}
                            <div className="mt-2 flex gap-3 text-xs">
                              <span className="text-slate-600">
                                <strong>Costo:</strong> ${(producto.costo_unitario || 0).toFixed(2)}
                              </span>
                              <span className="text-slate-600">
                                <strong>Existencia:</strong> {producto.cantidad || 0}
                              </span>
                            </div>
                            {producto.lotes && producto.lotes.length > 0 && (
                              <div className="mt-2 text-xs text-blue-600">
                                <strong>Lotes:</strong> {producto.lotes.length} lote(s) existente(s)
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                {!buscandoProductos && busquedaProducto.trim() && productosEncontrados.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">
                    No se encontraron productos. Puedes crear uno nuevo.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-3">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium text-sm text-slate-800">Nuevo Producto</h3>
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
              <Card className="p-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={pagarEnDolarNegro}
                    onCheckedChange={(checked) => setPagarEnDolarNegro(!!checked)}
                  />
                  <label className="text-xs font-medium text-slate-700">
                    Pagar en Dólar Negro
                  </label>
                </div>
                {pagarEnDolarNegro && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Se sumará {diferenciaPorcentaje.toFixed(2)}% al costo de cada producto
                  </p>
                )}
              </Card>
            )}
          </div>

          {/* Panel derecho - Lista de items y totales */}
          <div className="lg:col-span-3 space-y-3 overflow-hidden flex flex-col">
            <Card className="p-3 flex-1 flex flex-col min-h-0">
              <h3 className="font-medium text-sm text-slate-800 mb-3">Productos en la Compra</h3>
              {itemsCompra.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">No hay productos agregados</p>
              ) : (
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead className="bg-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="border border-slate-300 px-2 py-2 text-left font-medium text-slate-700">Código</th>
                        <th className="border border-slate-300 px-2 py-2 text-left font-medium text-slate-700">Descripción</th>
                        <th className="border border-slate-300 px-2 py-2 text-left font-medium text-slate-700">Marca</th>
                        <th className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-700">Costo</th>
                        {pagarEnDolarNegro && (
                          <th className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-700">Costo Ajust.</th>
                        )}
                        <th className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-700">Utilidad</th>
                        <th className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-700">P. Venta</th>
                        <th className="border border-slate-300 px-2 py-2 text-right font-medium text-slate-700">Cant.</th>
                        <th className="border border-slate-300 px-2 py-2 text-left font-medium text-slate-700">Lote</th>
                        <th className="border border-slate-300 px-2 py-2 text-left font-medium text-slate-700">Venc.</th>
                        <th className="border border-slate-300 px-2 py-2 text-center font-medium text-slate-700">Acc.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsCompra.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 px-2 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-xs">{item.codigo}</span>
                              {item.esNuevo && (
                                <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  Nuevo
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-xs">{item.descripcion}</td>
                          <td className="border border-slate-300 px-2 py-2 text-xs">{item.marca || "-"}</td>
                          <td className="border border-slate-300 px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.costo}
                              onChange={(e) => actualizarCosto(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right text-xs h-7"
                            />
                          </td>
                          {pagarEnDolarNegro && (
                            <td className="border border-slate-300 px-2 py-2 text-right text-xs font-medium text-orange-600">
                              ${item.costoAjustado.toFixed(2)}
                            </td>
                          )}
                          <td className="border border-slate-300 px-2 py-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.utilidad}
                              onChange={(e) => actualizarUtilidad(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 text-right text-xs h-7"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-right text-xs font-medium text-green-600">
                            ${item.precioVenta.toFixed(2)}
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidad(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 text-center text-xs h-7"
                            />
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <div className="space-y-1">
                              {item.lotesExistentes && item.lotesExistentes.length > 0 && (
                                <div className="text-[10px] text-slate-600 mb-1">
                                  <div className="font-medium mb-0.5">Existentes:</div>
                                  {item.lotesExistentes.map((lote, idx) => (
                                    <div key={idx} className="text-slate-500">
                                      {lote.lote} ({lote.cantidad || 0})
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Input
                                placeholder="Nuevo lote"
                                value={item.lote}
                                onChange={(e) => actualizarLote(item.id, e.target.value)}
                                className="w-full text-[10px] h-7"
                              />
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2">
                            <div className="space-y-1">
                              {item.lotesExistentes && item.lotesExistentes.length > 0 && (
                                <div className="text-[10px] text-slate-600 mb-1">
                                  {item.lotesExistentes.map((lote, idx) => (
                                    <div key={idx} className="text-slate-500">
                                      {lote.fecha_vencimiento 
                                        ? new Date(lote.fecha_vencimiento).toLocaleDateString('es-VE')
                                        : "-"
                                      }
                                    </div>
                                  ))}
                                </div>
                              )}
                              <Input
                                type="date"
                                value={item.fechaVencimiento}
                                onChange={(e) => actualizarFechaVencimiento(item.id, e.target.value)}
                                className="w-full text-[10px] h-7"
                              />
                            </div>
                          </td>
                          <td className="border border-slate-300 px-2 py-2 text-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => eliminarItem(item.id)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
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
            <Card className="p-3 bg-slate-50 flex-shrink-0">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-600 text-xs">Total Costo:</span>
                  <p className="text-base font-semibold">${totalCosto.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-600 text-xs">Total Utilidad:</span>
                  <p className="text-base font-semibold text-green-600">${totalUtilidad.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-slate-800 text-xs font-semibold">Total Precio Venta:</span>
                  <p className="text-lg font-bold text-green-600">${totalPrecioVenta.toFixed(2)}</p>
                </div>
              </div>
            </Card>

            {/* Botones de acción */}
            <div className="flex justify-end gap-2 flex-shrink-0 pt-2 border-t px-4 pb-3">
              <Button variant="outline" onClick={onClose} disabled={loading} size="sm">
                <X className="h-3 w-3 mr-1.5" />
                Cancelar
              </Button>
              <Button onClick={guardarCompra} disabled={loading || itemsCompra.length === 0} size="sm">
                {loading ? "Guardando..." : "Guardar Compra"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalCrearCompra;

