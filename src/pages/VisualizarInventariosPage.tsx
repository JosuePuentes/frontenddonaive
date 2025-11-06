import React, { useEffect, useState } from "react";
import UploadInventarioExcel from "../components/UploadInventarioExcel";
import ModificarItemInventarioModal from "../components/ModificarItemInventarioModal";
import { Button } from "@/components/ui/button";
import { Download, Trash2, Edit } from "lucide-react";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [inventarioAEliminar, setInventarioAEliminar] = useState<Inventario | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [showModificarModal, setShowModificarModal] = useState(false);
  const [inventarioSeleccionado, setInventarioSeleccionado] = useState<Inventario | null>(null);

  const fetchInventarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No se encontró token de autenticación. Redirigiendo a login...");
        // Redirigir a login si no hay token
        window.location.href = "/login";
        return;
      }
      
      const res = await fetch(`${API_BASE_URL}/inventarios`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (res.status === 401 || res.status === 403) {
        // Token inválido o expirado
        console.warn("Token inválido o expirado. Limpiando y redirigiendo a login...");
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.href = "/login";
        return;
      }
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || `Error al obtener inventarios: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      setInventarios(Array.isArray(data) ? data : []);
    } catch (err: any) {
      // No mostrar error si es una redirección
      if (err.message?.includes("login") || window.location.pathname === "/login") {
        return;
      }
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
      });
  }, []);

  const handleEliminarClick = (inventario: Inventario) => {
    setInventarioAEliminar(inventario);
    setShowDeleteModal(true);
  };

  const handleModificarItems = (inventario: Inventario) => {
    setInventarioSeleccionado(inventario);
    setShowModificarModal(true);
  };

  const handleCerrarModal = () => {
    setShowModificarModal(false);
    setInventarioSeleccionado(null);
    // Refrescar la lista después de modificar
    fetchInventarios();
  };

  const handleCancelarEliminar = () => {
    setShowDeleteModal(false);
    setInventarioAEliminar(null);
  };

  const handleConfirmarEliminar = async () => {
    if (!inventarioAEliminar) return;

    setEliminando(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const response = await fetch(
        `${API_BASE_URL}/inventarios/${inventarioAEliminar._id}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || "Error al eliminar inventario");
      }

      // Refrescar la lista
      await fetchInventarios();
      setShowDeleteModal(false);
      setInventarioAEliminar(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar el inventario");
      console.error("Error al eliminar inventario:", err);
    } finally {
      setEliminando(false);
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

  // Ordenar inventarios por fecha más reciente primero
  const inventariosFiltrados = inventarios
    .sort((a, b) => {
      const fechaA = a.fecha || "";
      const fechaB = b.fecha || "";
      return fechaB.localeCompare(fechaA);
    });

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
            <p className="mt-1 text-sm text-slate-500">Aún no se han cargado inventarios desde Excel.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      Sucursal
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      Fecha de Carga
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      Total Costo Inventario
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider whitespace-nowrap">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {inventariosFiltrados.map(i => {
                    // Obtener el nombre de la farmacia desde el ID
                    const farmaciaNombre = farmacias.find(f => f.id === i.farmacia || f.nombre === i.farmacia)?.nombre || i.farmacia;
                    const fechaCarga = i.fecha ? new Date(i.fecha).toLocaleDateString('es-VE') : 'N/A';
                    const totalCosto = i.costo || 0;
                    
                    return (
                      <tr key={i._id} className="hover:bg-slate-50 transition-colors duration-150 ease-in-out">
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-slate-700">
                          {farmaciaNombre}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700">
                          {fechaCarga}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-slate-700 text-right font-semibold">
                          {totalCosto.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleModificarItems(i)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="w-4 h-4" />
                              Modificar Items
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEliminarClick(i)}
                              className="flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            inventarioId={inventarioSeleccionado._id}
            sucursalId={farmacias.find(f => f.id === inventarioSeleccionado.farmacia || f.nombre === inventarioSeleccionado.farmacia)?.id || inventarioSeleccionado.farmacia}
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
                <span className="font-bold text-red-600">
                  {inventarioAEliminar.fecha ? new Date(inventarioAEliminar.fecha).toLocaleDateString('es-VE') : 'N/A'}
                </span> de la sucursal{" "}
                <span className="font-bold text-red-600">
                  {farmacias.find(f => f.id === inventarioAEliminar.farmacia || f.nombre === inventarioAEliminar.farmacia)?.nombre || inventarioAEliminar.farmacia}
                </span>?
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
