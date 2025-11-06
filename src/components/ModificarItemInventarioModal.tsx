import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X, Save, Percent } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Producto {
  id: string;
  codigo: string;
  nombre?: string;
  descripcion?: string;
  marca?: string;
  precio: number;
  costo: number;
  existencia: number;
  sucursal?: string;
}

interface ModificarItemInventarioModalProps {
  open: boolean;
  onClose: () => void;
  inventarioId: string;
  sucursalId: string;
  onSuccess?: () => void;
}

const ModificarItemInventarioModal: React.FC<ModificarItemInventarioModalProps> = ({
  open,
  onClose,
  inventarioId,
  sucursalId,
  onSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [productos, setProductos] = useState<Producto[]>([]);
  const [productosTodos, setProductosTodos] = useState<Producto[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Campos editables
  const [codigo, setCodigo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [marca, setMarca] = useState("");
  const [costo, setCosto] = useState<number>(0);
  const [existencia, setExistencia] = useState<number>(0);
  const [precio, setPrecio] = useState<number>(0);
  const [porcentajeGanancia, setPorcentajeGanancia] = useState<number>(0);

  // Cargar todos los productos de la sucursal al abrir el modal
  useEffect(() => {
    if (open && sucursalId) {
      cargarTodosLosProductos();
    } else if (!open) {
      // Limpiar cuando se cierra el modal
      setProductosTodos([]);
      setProductos([]);
      setSearchTerm("");
      setProductoSeleccionado(null);
    }
  }, [open, sucursalId]);

  // Filtrar productos localmente cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setProductos(productosTodos);
      return;
    }

    const termino = searchTerm.toLowerCase().trim();
    const productosFiltrados = productosTodos.filter((p) => {
      const codigo = (p.codigo || "").toLowerCase();
      const descripcion = (p.descripcion || p.nombre || "").toLowerCase();
      const marca = (p.marca || "").toLowerCase();
      return codigo.includes(termino) || descripcion.includes(termino) || marca.includes(termino);
    });
    setProductos(productosFiltrados);
  }, [searchTerm, productosTodos]);

  const cargarTodosLosProductos = async () => {
    setCargandoProductos(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      // Intentar múltiples estrategias para obtener todos los productos
      // Estrategia 1: Buscar con caracteres comunes que probablemente devuelvan muchos resultados
      const caracteresBusqueda = ['a', 'e', 'i', 'o', 'u', '1', '2', '3', '4', '5'];
      const todosProductos: Producto[] = [];
      const idsVistos = new Set<string>();
      
      // Buscar con cada carácter y combinar resultados
      for (const char of caracteresBusqueda) {
        try {
          const res = await fetch(
            `${API_BASE_URL}/punto-venta/productos/buscar?q=${encodeURIComponent(char)}&sucursal=${sucursalId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (res.ok) {
            const data = await res.json();
            const productosArray = Array.isArray(data) ? data : [];
            productosArray.forEach((p: Producto) => {
              if (p.id && !idsVistos.has(p.id)) {
                idsVistos.add(p.id);
                todosProductos.push(p);
              }
            });
          }
        } catch (e) {
          // Continuar con el siguiente carácter
          console.warn(`Error al buscar con "${char}":`, e);
        }
      }
      
      // Si no se obtuvieron productos, intentar con términos más específicos
      if (todosProductos.length === 0) {
        const terminos = ['aa', 'ee', '11', '22'];
        for (const termino of terminos) {
          try {
            const res = await fetch(
              `${API_BASE_URL}/punto-venta/productos/buscar?q=${encodeURIComponent(termino)}&sucursal=${sucursalId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            if (res.ok) {
              const data = await res.json();
              const productosArray = Array.isArray(data) ? data : [];
              productosArray.forEach((p: Producto) => {
                if (p.id && !idsVistos.has(p.id)) {
                  idsVistos.add(p.id);
                  todosProductos.push(p);
                }
              });
            }
          } catch (e) {
            // Continuar
          }
        }
      }
      
      setProductosTodos(todosProductos);
      setProductos(todosProductos);
      
      if (todosProductos.length === 0) {
        setError("No se encontraron productos. Verifica que el inventario tenga productos cargados.");
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar productos del inventario");
      setProductosTodos([]);
      setProductos([]);
    } finally {
      setCargandoProductos(false);
    }
  };


  const seleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCodigo(producto.codigo || "");
    setDescripcion(producto.descripcion || producto.nombre || "");
    setMarca(producto.marca || "");
    setCosto(producto.costo || 0);
    setExistencia(producto.existencia || 0);
    setPrecio(producto.precio || 0);
    
    // Calcular porcentaje de ganancia inicial
    if (producto.costo && producto.costo > 0) {
      const ganancia = ((producto.precio - producto.costo) / producto.costo) * 100;
      setPorcentajeGanancia(ganancia || 0);
    } else {
      setPorcentajeGanancia(0);
    }
    
    setSearchTerm("");
    setProductos([]);
  };

  // Calcular precio cuando cambia costo o porcentaje de ganancia
  useEffect(() => {
    if (costo > 0 && porcentajeGanancia >= 0) {
      const nuevoPrecio = costo * (1 + porcentajeGanancia / 100);
      setPrecio(Number(nuevoPrecio.toFixed(2)));
    }
  }, [costo, porcentajeGanancia]);

  const handleGuardar = async () => {
    if (!productoSeleccionado) {
      setError("Debe seleccionar un producto");
      return;
    }

    if (!codigo.trim() || !descripcion.trim()) {
      setError("Código y descripción son obligatorios");
      return;
    }

    if (costo <= 0 || existencia < 0 || precio <= 0) {
      setError("Costo, existencia y precio deben ser valores válidos");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(`${API_BASE_URL}/inventarios/${inventarioId}/items/${productoSeleccionado.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: codigo.trim(),
          descripcion: descripcion.trim(),
          marca: marca.trim(),
          costo: Number(costo),
          existencia: Number(existencia),
          precio: Number(precio),
          porcentaje_ganancia: porcentajeGanancia,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.message || "Error al actualizar el item");
      }

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleCerrar();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Error al guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  const handleCerrar = () => {
    setProductoSeleccionado(null);
    setSearchTerm("");
    setProductos([]);
    setCodigo("");
    setDescripcion("");
    setMarca("");
    setCosto(0);
    setExistencia(0);
    setPrecio(0);
    setPorcentajeGanancia(0);
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCerrar()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Modificar Item de Inventario
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 rounded-md text-sm">
            Item actualizado exitosamente
          </div>
        )}

        {/* Búsqueda y lista de productos */}
        {!productoSeleccionado && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Buscar producto por código, nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {cargandoProductos && (
              <div className="text-center py-4 text-slate-500 text-sm">
                Cargando productos del inventario...
              </div>
            )}

            {productos.length > 0 && (
              <div className="border rounded-lg max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Código</th>
                      <th className="px-3 py-2 text-left">Descripción</th>
                      <th className="px-3 py-2 text-left">Marca</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-right">Existencia</th>
                      <th className="px-3 py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr
                        key={producto.id}
                        className="border-b hover:bg-slate-50 cursor-pointer"
                        onClick={() => seleccionarProducto(producto)}
                      >
                        <td className="px-3 py-2">{producto.codigo}</td>
                        <td className="px-3 py-2">{producto.descripcion || producto.nombre}</td>
                        <td className="px-3 py-2">{producto.marca || "-"}</td>
                        <td className="px-3 py-2 text-right">
                          {producto.precio?.toLocaleString("es-VE", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="px-3 py-2 text-right">{producto.existencia}</td>
                        <td className="px-3 py-2 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              seleccionarProducto(producto);
                            }}
                          >
                            Seleccionar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {!cargandoProductos && productosTodos.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No hay productos en este inventario
              </div>
            )}

            {!cargandoProductos && productosTodos.length > 0 && searchTerm.trim() !== "" && productos.length === 0 && (
              <div className="text-center py-4 text-slate-500 text-sm">
                No se encontraron productos que coincidan con "{searchTerm}"
              </div>
            )}

            {!cargandoProductos && productosTodos.length > 0 && searchTerm.trim() === "" && (
              <div className="text-xs text-slate-500 mb-2">
                Mostrando {productosTodos.length} {productosTodos.length === 1 ? 'producto' : 'productos'} del inventario
              </div>
            )}
          </div>
        )}

        {/* Formulario de edición */}
        {productoSeleccionado && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-700">Editando: {productoSeleccionado.codigo}</h3>
              <Button variant="ghost" size="sm" onClick={() => setProductoSeleccionado(null)}>
                <X className="h-4 w-4 mr-1" />
                Cambiar producto
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Código del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <Input
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Descripción del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <Input
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  placeholder="Marca del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Costo <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costo}
                  onChange={(e) => setCosto(Number(e.target.value))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Existencia <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="1"
                  min="0"
                  value={existencia}
                  onChange={(e) => setExistencia(Number(e.target.value))}
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Porcentaje de Ganancia (%)
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={porcentajeGanancia}
                    onChange={(e) => setPorcentajeGanancia(Number(e.target.value))}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Se sumará al costo para calcular el precio
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Precio (calculado) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={precio}
                  onChange={(e) => {
                    const nuevoPrecio = Number(e.target.value);
                    setPrecio(nuevoPrecio);
                    // Recalcular porcentaje de ganancia si se modifica el precio manualmente
                    if (costo > 0) {
                      const nuevoPorcentaje = ((nuevoPrecio - costo) / costo) * 100;
                      setPorcentajeGanancia(nuevoPorcentaje);
                    }
                  }}
                  placeholder="0.00"
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Precio = Costo × (1 + % Ganancia / 100)
                </p>
              </div>

              <div className="md:col-span-2">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-sm font-medium text-blue-800 mb-1">Utilidad Contable:</p>
                  <p className="text-lg font-bold text-blue-900">
                    {(precio - costo).toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Utilidad = Precio - Costo
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleCerrar} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleGuardar} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ModificarItemInventarioModal;

