import React, { useEffect, useState } from "react";
import UploadInventarioExcel from "../components/UploadInventarioExcel";
import ModificarItemInventarioModal from "../components/ModificarItemInventarioModal";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Download, FileSpreadsheet } from "lucide-react";

interface Inventario {
  _id: string;
  fecha: string;
  farmacia: string;
  costo: number;
  usuarioCorreo: string;
}

interface FarmaciaChip {
  id: string;
  nombre: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const VisualizarInventariosPage: React.FC = () => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [farmacias, setFarmacias] = useState<FarmaciaChip[]>([]);
  const [selectedFarmacia, setSelectedFarmacia] = useState<string>("");
  const [usuarioFiltro, setUsuarioFiltro] = useState<string>("");
  const [fechaInicio, setFechaInicio] = useState<string>("");
  const [fechaFin, setFechaFin] = useState<string>("");
  const [showModificarModal, setShowModificarModal] = useState(false);
  const [inventarioSeleccionado, setInventarioSeleccionado] = useState<{ id: string; sucursalId: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inventarioAEliminar, setInventarioAEliminar] = useState<{ id: string; fecha: string; farmacia: string } | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const fetchInventarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");
      const res = await fetch(`${API_BASE_URL}/inventarios`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error al obtener inventarios");
      const data = await res.json();
      console.log("Inventarios obtenidos:", data);
      setInventarios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Error al obtener inventarios");
      console.error("Error al obtener inventarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventarios();
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/farmacias`)
      .then(res => res.json())
      .then(data => {
        const lista = data.farmacias
          ? Object.entries(data.farmacias).map(([id, nombre]) => ({ id, nombre: String(nombre) }))
          : Object.entries(data).map(([id, nombre]) => ({ id, nombre: String(nombre) }));
        setFarmacias(lista);
        if (lista.length === 1) setSelectedFarmacia(lista[0].id);
      });
  }, []);


  const handleModificarItems = (inventarioId: string, sucursalId: string) => {
    // Obtener el ID de sucursal desde el nombre de farmacia
    const farmacia = farmacias.find(f => f.nombre === sucursalId || f.id === sucursalId);
    setInventarioSeleccionado({
      id: inventarioId,
      sucursalId: farmacia?.id || sucursalId,
    });
    setShowModificarModal(true);
  };

  const handleCerrarModal = () => {
    setShowModificarModal(false);
    setInventarioSeleccionado(null);
    fetchInventarios(); // Refrescar lista después de modificar
  };

  const handleEliminarClick = (inventario: Inventario) => {
    setInventarioAEliminar({
      id: inventario._id,
      fecha: inventario.fecha?.slice(0, 10) || "",
      farmacia: inventario.farmacia,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmarEliminar = async () => {
    if (!inventarioAEliminar) return;

    setEliminando(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(`${API_BASE_URL}/inventarios/${inventarioAEliminar.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.message || "Error al eliminar el inventario");
      }

      setShowDeleteModal(false);
      setInventarioAEliminar(null);
      fetchInventarios(); // Refrescar lista
    } catch (err: any) {
      setError(err.message || "Error al eliminar el inventario");
    } finally {
      setEliminando(false);
    }
  };

  const handleCancelarEliminar = () => {
    setShowDeleteModal(false);
    setInventarioAEliminar(null);
  };

  const handleExportarInventario = async (inventarioId: string, fecha: string, farmacia: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      // Obtener items del inventario desde el backend
      const res = await fetch(`${API_BASE_URL}/inventarios/${inventarioId}/items`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        // Si el endpoint no existe, intentar con el endpoint general de productos filtrado por inventario
        throw new Error("No se pudo obtener los items del inventario");
      }

      const items = await res.json();
      
      // Importar xlsx dinámicamente
      const XLSXModule = await import("xlsx");
      const XLSX = (XLSXModule.default || XLSXModule) as any;

      // Preparar datos para Excel
      const data = [
        ["CODIGO", "DESCRIPCION", "MARCA", "COSTO", "PRECIO", "EXISTENCIA"],
        ...(Array.isArray(items) ? items : items.items || []).map((item: any) => [
          item.codigo || "",
          item.descripcion || item.nombre || "",
          item.marca || "",
          item.costo || 0,
          item.precio || 0,
          item.existencia || item.stock || 0,
        ]),
      ];

      // Crear workbook
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventario");

      // Generar nombre de archivo
      const fechaFormateada = fecha.replace(/-/g, "");
      const nombreArchivo = `Inventario_${farmacia}_${fechaFormateada}.xlsx`;

      // Descargar
      XLSX.writeFile(wb, nombreArchivo);
      } catch (err: any) {
        // Si falla, intentar exportar solo la información básica del inventario
        try {
          const XLSXModule2 = await import("xlsx");
          const XLSX2 = (XLSXModule2.default || XLSXModule2) as any;

        const inventario = inventarios.find(i => i._id === inventarioId);
        if (!inventario) throw new Error("Inventario no encontrado");

        const data = [
          ["INFORMACIÓN DEL INVENTARIO"],
          ["Fecha de Cargo", inventario.fecha?.slice(0, 10) || ""],
          ["Sucursal", inventario.farmacia || ""],
          ["Costo Total", inventario.costo || 0],
          ["Usuario", inventario.usuarioCorreo || ""],
          [],
          ["NOTA: Los items detallados del inventario no están disponibles."],
          ["Contacte al administrador para obtener el detalle completo."],
        ];
        
        const ws = XLSX2.utils.aoa_to_sheet(data);
        const wb = XLSX2.utils.book_new();
        XLSX2.utils.book_append_sheet(wb, ws, "Inventario");

        const fechaFormateada = fecha.replace(/-/g, "");
        const nombreArchivo = `Inventario_${farmacia}_${fechaFormateada}.xlsx`;
        XLSX2.writeFile(wb, nombreArchivo);
      } catch (exportErr: any) {
        setError(`Error al exportar: ${err.message}. ${exportErr.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportarTodos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Importar xlsx dinámicamente
      const XLSXModule = await import("xlsx");
      const XLSX = (XLSXModule.default || XLSXModule) as any;

      // Preparar datos para Excel
      const data = [
        ["Fecha de Cargo", "Sucursal", "Costo Inventario", "Usuario"],
        ...inventariosFiltrados.map(i => [
          i.fecha?.slice(0, 10) || "",
          i.farmacia || "",
          i.costo || 0,
          i.usuarioCorreo || "",
        ]),
      ];

      // Crear workbook
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Inventarios");

      // Generar nombre de archivo
      const fecha = new Date().toISOString().split("T")[0].replace(/-/g, "");
      const nombreArchivo = `Inventarios_${fecha}.xlsx`;

      // Descargar
      XLSX.writeFile(wb, nombreArchivo);
    } catch (err: any) {
      setError(`Error al exportar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const inventariosFiltrados = inventarios
    .filter(i => {
      if (!selectedFarmacia) return true;
      // Buscar la farmacia seleccionada por ID o nombre
      const farmaciaSeleccionada = farmacias.find(f => f.id === selectedFarmacia);
      if (!farmaciaSeleccionada) return true;
      // Comparar tanto por ID como por nombre para asegurar que funcione
      return i.farmacia === farmaciaSeleccionada.nombre || i.farmacia === farmaciaSeleccionada.id;
    })
    .filter(i => !usuarioFiltro || i.usuarioCorreo.toLowerCase().includes(usuarioFiltro.toLowerCase()))
    .filter(i => {
      if (!fechaInicio && !fechaFin) return true;
      const fecha = i.fecha?.slice(0, 10);
      if (fechaInicio && fecha < fechaInicio) return false;
      if (fechaFin && fecha > fechaFin) return false;
      return true;
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Inventarios Registrados</h1>
          {inventariosFiltrados.length > 0 && (
            <Button
              onClick={handleExportarTodos}
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar Todos a Excel
            </Button>
          )}
        </div>
        
        {/* Componente para subir inventario desde Excel */}
        <UploadInventarioExcel
          sucursales={farmacias}
          onSuccess={fetchInventarios}
        />
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow" role="alert">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}
        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h2 className="text-xl font-semibold text-slate-700 mb-4">Filtros</h2>
          {farmacias.length > 1 && (
            <div className="mb-6">
              <span className="font-medium text-slate-700 mr-3">Farmacias:</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {farmacias.map(f => (
                  <button
                    key={f.id}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out
                                ${selectedFarmacia === f.id 
                                  ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-300' 
                                  : 'bg-slate-100 text-slate-700 hover:bg-indigo-100 hover:text-indigo-700 border border-slate-300'}`}
                    onClick={() => setSelectedFarmacia(f.id === selectedFarmacia ? "" : f.id)}
                  >
                    {f.nombre}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label htmlFor="usuarioFiltro" className="block text-sm font-medium text-slate-600 mb-1">Usuario</label>
              <input 
                type="text" 
                id="usuarioFiltro"
                value={usuarioFiltro} 
                onChange={e => setUsuarioFiltro(e.target.value)} 
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3 text-sm" 
                placeholder="Buscar por correo..." />
            </div>
            <div>
              <label htmlFor="fechaInicio" className="block text-sm font-medium text-slate-600 mb-1">Fecha desde</label>
              <input 
                type="date" 
                id="fechaInicio"
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3 text-sm" />
            </div>
            <div>
              <label htmlFor="fechaFin" className="block text-sm font-medium text-slate-600 mb-1">Fecha hasta</label>
              <input 
                type="date" 
                id="fechaFin"
                value={fechaFin} 
                onChange={e => setFechaFin(e.target.value)} 
                className="w-full border-slate-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 py-2 px-3 text-sm" />
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-10 text-slate-500 text-lg">
            <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando inventarios...
          </div>
        ) : inventariosFiltrados.length === 0 ? (
          <div className="text-center text-slate-500 py-10 bg-white p-6 rounded-lg shadow-lg">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-slate-800">No hay inventarios registrados</h3>
            <p className="mt-1 text-sm text-slate-500">No se encontraron inventarios que coincidan con los filtros aplicados.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    {['Fecha de Cargo', 'Sucursal', 'Costo Inventario', 'Usuario', 'Acciones'].map(header => (
                      <th key={header} scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {inventariosFiltrados.map(i => (
                    <tr key={i._id} className="hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">{i.fecha?.slice(0,10)}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">{i.farmacia}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700 text-right">{i.costo.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-500">{i.usuarioCorreo}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleModificarItems(i._id, i.farmacia)}
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <Edit className="h-4 w-4" />
                            Modificar Items
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleExportarInventario(i._id, i.fecha?.slice(0, 10) || "", i.farmacia)}
                            className="flex items-center gap-1 whitespace-nowrap"
                            disabled={loading}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            Exportar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleEliminarClick(i)}
                            className="flex items-center gap-1 whitespace-nowrap"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Modal de modificar items */}
        {showModificarModal && inventarioSeleccionado && (
          <ModificarItemInventarioModal
            open={showModificarModal}
            onClose={handleCerrarModal}
            inventarioId={inventarioSeleccionado.id}
            sucursalId={inventarioSeleccionado.sucursalId}
            onSuccess={handleCerrarModal}
          />
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && inventarioAEliminar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-3 text-slate-800">Confirmar eliminación</h3>
              <p className="mb-5 text-slate-600 text-sm">
                ¿Está seguro que desea eliminar el inventario del{" "}
                <span className="font-bold text-red-600">{inventarioAEliminar.fecha}</span> de la sucursal{" "}
                <span className="font-bold text-red-600">{inventarioAEliminar.farmacia}</span>?
              </p>
              <p className="mb-5 text-red-600 text-sm font-medium">
                ⚠️ Esta acción no se puede deshacer. Se eliminarán todos los items asociados a este inventario.
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelarEliminar}
                  disabled={eliminando}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleConfirmarEliminar}
                  disabled={eliminando}
                >
                  {eliminando ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizarInventariosPage;
