import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import ModalEditarUsuario from "../components/ModalEditarUsuario";
import { useModificarUsuario } from "../hooks/useModificarUsuario";
import { Search, Edit, Trash2, EyeOff, RefreshCw } from "lucide-react";
import type { Usuario } from "../types/UsuarioTypes";

const ModificarUsuarioPage: React.FC = () => {
  const {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    actualizarUsuario,
    eliminarUsuario,
    setError
  } = useModificarUsuario();

  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<Usuario | null>(null);
  const [loadingDelete, setLoadingDelete] = useState(false);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  const handleEditarUsuario = (usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setIsModalOpen(true);
  };

  const handleGuardarUsuario = async (usuarioEditado: Usuario) => {
    try {
      await actualizarUsuario(usuarioEditado);
      setIsModalOpen(false);
      setUsuarioSeleccionado(null);
    } catch (err) {
      // El error ya se maneja en el hook
    }
  };

  const handleEliminarUsuario = (usuario: Usuario) => {
    setUsuarioAEliminar(usuario);
    setShowConfirmDelete(true);
  };

  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar?._id) return;
    
    setLoadingDelete(true);
    try {
      await eliminarUsuario(usuarioAEliminar._id);
      setShowConfirmDelete(false);
      setUsuarioAEliminar(null);
    } catch (err) {
      // El error ya se maneja en el hook
    } finally {
      setLoadingDelete(false);
    }
  };

  const filtrarUsuarios = usuarios.filter(usuario =>
    usuario.correo.toLowerCase().includes(busqueda.toLowerCase()) ||
    Object.values(usuario.farmacias).some(farmacia =>
      farmacia.toLowerCase().includes(busqueda.toLowerCase())
    ) ||
    usuario.permisos.some(permiso =>
      permiso.toLowerCase().includes(busqueda.toLowerCase())
    )
  );

  const obtenerColorPermiso = (permiso: string) => {
    if (permiso.includes("admin")) return "bg-red-100 text-red-800";
    if (permiso.includes("verificar")) return "bg-orange-100 text-orange-800";
    if (permiso.includes("agregar")) return "bg-green-100 text-green-800";
    if (permiso.includes("ver")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600">
          Administra usuarios, permisos y accesos a farmacias
        </p>
      </div>

      {/* Barra de búsqueda y controles */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Buscar por correo, farmacia o permiso..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={fetchUsuarios}
                disabled={loading}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-700">
              <strong>Error:</strong> {error}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex items-center space-x-2">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Cargando usuarios...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtrarUsuarios.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  {busqueda ? "No se encontraron usuarios con ese criterio de búsqueda" : "No hay usuarios registrados"}
                </div>
              </CardContent>
            </Card>
          ) : (
            filtrarUsuarios.map((usuario) => (
              <Card key={usuario._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-blue-800">
                      {usuario.correo}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEditarUsuario(usuario)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        onClick={() => handleEliminarUsuario(usuario)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Farmacias */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Farmacias Asignadas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(usuario.farmacias).map(([id, nombre]) => (
                          <Badge key={id} variant="secondary">
                            {nombre}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Permisos */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Permisos:</h4>
                      <div className="flex flex-wrap gap-2">
                        {usuario.permisos.map((permiso) => (
                          <Badge
                            key={permiso}
                            className={obtenerColorPermiso(permiso)}
                          >
                            {permiso.replace(/_/g, " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-700">
              ¿Estás seguro de que deseas eliminar el usuario{" "}
              <strong>{usuarioAEliminar?.correo}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
              disabled={loadingDelete}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarEliminacion}
              disabled={loadingDelete}
            >
              {loadingDelete ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de edición */}
      <ModalEditarUsuario
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setUsuarioSeleccionado(null);
        }}
        usuario={usuarioSeleccionado}
        onGuardar={handleGuardarUsuario}
        loading={loading}
      />
    </div>
  );
};

export default ModificarUsuarioPage;
