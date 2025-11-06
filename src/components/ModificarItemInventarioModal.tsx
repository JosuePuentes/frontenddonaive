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

      console.log("Cargando productos para sucursal:", sucursalId, "inventario:", inventarioId);

      // El endpoint requiere mínimo 2 caracteres, así que usamos términos de 2 caracteres
      // que probablemente devuelvan muchos resultados
      const terminosBusqueda = [
        'aa', 'ab', 'ac', 'ad', 'ae', 'af', 'ag', 'ah', 'ai', 'aj', 'ak', 'al', 'am', 'an', 'ao', 'ap', 'aq', 'ar', 'as', 'at', 'au', 'av', 'aw', 'ax', 'ay', 'az',
        'ba', 'be', 'bi', 'bo', 'bu',
        'ca', 'ce', 'ci', 'co', 'cu',
        'da', 'de', 'di', 'do', 'du',
        'ea', 'ee', 'ei', 'eo', 'eu',
        'fa', 'fe', 'fi', 'fo', 'fu',
        'ga', 'ge', 'gi', 'go', 'gu',
        'ha', 'he', 'hi', 'ho', 'hu',
        'ia', 'ie', 'ii', 'io', 'iu',
        'ja', 'je', 'ji', 'jo', 'ju',
        'ka', 'ke', 'ki', 'ko', 'ku',
        'la', 'le', 'li', 'lo', 'lu',
        'ma', 'me', 'mi', 'mo', 'mu',
        'na', 'ne', 'ni', 'no', 'nu',
        'oa', 'oe', 'oi', 'oo', 'ou',
        'pa', 'pe', 'pi', 'po', 'pu',
        'qa', 'qe', 'qi', 'qo', 'qu',
        'ra', 're', 'ri', 'ro', 'ru',
        'sa', 'se', 'si', 'so', 'su',
        'ta', 'te', 'ti', 'to', 'tu',
        'ua', 'ue', 'ui', 'uo', 'uu',
        'va', 've', 'vi', 'vo', 'vu',
        'wa', 'we', 'wi', 'wo', 'wu',
        'xa', 'xe', 'xi', 'xo', 'xu',
        'ya', 'ye', 'yi', 'yo', 'yu',
        'za', 'ze', 'zi', 'zo', 'zu',
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09',
        '10', '11', '12', '13', '14', '15', '16', '17', '18', '19',
        '20', '21', '22', '23', '24', '25', '26', '27', '28', '29'
      ];

      const todosProductos: Producto[] = [];
      const idsVistos = new Set<string>();
      let productosEncontrados = 0;
      
      // Buscar con cada término y combinar resultados
      // Limitar a los primeros 50 términos para no hacer demasiadas peticiones
      const terminosLimitados = terminosBusqueda.slice(0, 50);
      
      for (const termino of terminosLimitados) {
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
              // Usar _id o id según lo que devuelva el backend
              const productoId = p.id || (p as any)._id || `${p.codigo}-${p.descripcion}`;
              if (productoId && !idsVistos.has(productoId)) {
                idsVistos.add(productoId);
                todosProductos.push({
                  ...p,
                  id: productoId
                });
                productosEncontrados++;
              }
            });
          } else {
            console.warn(`Error al buscar con "${termino}":`, res.status, res.statusText);
          }
        } catch (e) {
          console.warn(`Error al buscar con "${termino}":`, e);
        }
      }
      
      console.log(`Productos encontrados: ${todosProductos.length} (${productosEncontrados} sin duplicados)`);
      
      setProductosTodos(todosProductos);
      setProductos(todosProductos);
      
      if (todosProductos.length === 0) {
        setError(`No se encontraron productos para la sucursal ${sucursalId}. Verifica que el inventario tenga productos cargados.`);
        console.error("No se encontraron productos. Sucursal:", sucursalId, "Inventario:", inventarioId);
      }
    } catch (err: any) {
      console.error("Error al cargar productos:", err);
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
    
    // Calcular porcentaje de ganancia inicial (utilidad contable)
    // Fórmula inversa: % Ganancia = (1 - Costo / Precio) × 100
    // Ejemplo: Costo = $8, Precio = $13.33 → % = (1 - 8/13.33) × 100 = 40%
    if (producto.costo && producto.costo > 0 && producto.precio && producto.precio > producto.costo) {
      const porcentaje = (1 - producto.costo / producto.precio) * 100;
      setPorcentajeGanancia(Number(porcentaje.toFixed(2)));
    } else {
      setPorcentajeGanancia(0);
    }
    
    setSearchTerm("");
    setProductos([]);
  };

  // Calcular precio cuando cambia costo o porcentaje de ganancia (utilidad contable)
  // Utilidad contable: el porcentaje se aplica sobre el precio de venta
  // Fórmula: Precio = Costo / (1 - % Ganancia / 100)
  // Ejemplo: Costo = $8, % Ganancia = 40% → Precio = $8 / (1 - 0.40) = $8 / 0.60 = $13.33
  useEffect(() => {
    if (costo > 0 && porcentajeGanancia >= 0 && porcentajeGanancia < 100) {
      const nuevoPrecio = costo / (1 - porcentajeGanancia / 100);
      setPrecio(Number(nuevoPrecio.toFixed(2)));
    } else if (costo > 0 && porcentajeGanancia >= 100) {
      // Si el porcentaje es 100% o más, no se puede calcular (división por cero o negativa)
      setPrecio(costo);
    } else if (costo > 0) {
      setPrecio(costo);
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

      // IMPORTANTE: El backend espera el código del item, no el ObjectId
      // Usar el código del producto como identificador
      const itemId = codigo.trim() || productoSeleccionado.codigo || productoSeleccionado.id;
      
      console.log("Enviando actualización de item:", {
        inventarioId,
        itemId,
        codigo: codigo.trim(),
        descripcion: descripcion.trim(),
        costo,
        precio,
        porcentaje_ganancia: porcentajeGanancia
      });

      const res = await fetch(`${API_BASE_URL}/inventarios/${inventarioId}/items/${encodeURIComponent(itemId)}`, {
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
                  Porcentaje de Ganancia (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="99.99"
                    value={porcentajeGanancia}
                    onChange={(e) => {
                      const valor = Number(e.target.value);
                      // Limitar a máximo 99.99% para evitar división por cero
                      if (valor >= 100) {
                        setPorcentajeGanancia(99.99);
                      } else if (valor >= 0) {
                        setPorcentajeGanancia(valor);
                      }
                    }}
                    placeholder="0.00"
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Utilidad contable: el porcentaje se aplica sobre el precio de venta
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Fórmula: Precio = Costo ÷ (1 - % Ganancia ÷ 100)
                </p>
                {porcentajeGanancia >= 100 && (
                  <p className="text-xs text-red-500 mt-1">
                    ⚠️ El porcentaje no puede ser 100% o mayor
                  </p>
                )}
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
                    // Recalcular porcentaje de ganancia si se modifica el precio manualmente (utilidad contable)
                    if (costo > 0 && nuevoPrecio > costo) {
                      const nuevoPorcentaje = (1 - costo / nuevoPrecio) * 100;
                      setPorcentajeGanancia(Number(nuevoPorcentaje.toFixed(2)));
                    } else if (costo > 0 && nuevoPrecio <= costo) {
                      setPorcentajeGanancia(0);
                    }
                  }}
                  placeholder="0.00"
                  className="bg-slate-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Precio = Costo ÷ (1 - % Ganancia ÷ 100)
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ejemplo: Costo $8, 40% ganancia → Precio = $8 ÷ 0.60 = $13.33
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

