import React, { useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import type { Usuario } from "../types/UsuarioTypes";
import { PERMISOS_DISPONIBLES, FARMACIAS_DISPONIBLES } from "../types/UsuarioTypes";

interface ModalCrearUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  onGuardar: (usuario: Omit<Usuario, '_id'>) => Promise<void>;
  loading?: boolean;
}

export const ModalCrearUsuario: React.FC<ModalCrearUsuarioProps> = ({
  isOpen,
  onClose,
  onGuardar,
  loading = false
}) => {
  const [nuevoUsuario, setNuevoUsuario] = useState<Omit<Usuario, '_id'>>({
    correo: "",
    contraseña: "",
    farmacias: {},
    permisos: []
  });

  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof Omit<Usuario, '_id'>, value: string) => {
    setNuevoUsuario(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handlePermisoChange = (permiso: string) => {
    setNuevoUsuario(prev => ({
      ...prev,
      permisos: prev.permisos.includes(permiso)
        ? prev.permisos.filter(p => p !== permiso)
        : [...prev.permisos, permiso]
    }));
  };

  const handleFarmaciaChange = (farmaciaId: string, nombre: string, checked: boolean) => {
    setNuevoUsuario(prev => {
      const nuevasFarmacias = { ...prev.farmacias };
      if (checked) {
        nuevasFarmacias[farmaciaId] = nombre;
      } else {
        delete nuevasFarmacias[farmaciaId];
      }
      return {
        ...prev,
        farmacias: nuevasFarmacias
      };
    });
  };

  const handleGuardar = async () => {
    if (!nuevoUsuario.correo.trim()) {
      setError("El correo es requerido");
      return;
    }
    
    if (!nuevoUsuario.contraseña.trim()) {
      setError("La contraseña es requerida");
      return;
    }

    if (nuevoUsuario.contraseña.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (Object.keys(nuevoUsuario.farmacias).length === 0) {
      setError("Debe seleccionar al menos una farmacia");
      return;
    }

    if (nuevoUsuario.permisos.length === 0) {
      setError("Debe seleccionar al menos un permiso");
      return;
    }

    try {
      await onGuardar(nuevoUsuario);
      // Resetear formulario después de crear exitosamente
      setNuevoUsuario({
        correo: "",
        contraseña: "",
        farmacias: {},
        permisos: []
      });
      setError(null);
      onClose();
    } catch (err) {
      setError("Error al crear el usuario");
    }
  };

  const handleCancelar = () => {
    setError(null);
    setNuevoUsuario({
      correo: "",
      contraseña: "",
      farmacias: {},
      permisos: []
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-blue-800">
            Crear Nuevo Usuario
          </DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información Básica</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico *
                </label>
                <Input
                  type="email"
                  value={nuevoUsuario.correo}
                  onChange={(e) => handleInputChange("correo", e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña * (mínimo 6 caracteres)
                </label>
                <Input
                  type="password"
                  value={nuevoUsuario.contraseña}
                  onChange={(e) => handleInputChange("contraseña", e.target.value)}
                  placeholder="••••••••"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Farmacias */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Farmacias Asignadas *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {FARMACIAS_DISPONIBLES.map((farmacia) => (
                  <label
                    key={farmacia.id}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={farmacia.id in nuevoUsuario.farmacias}
                      onChange={(e) =>
                        handleFarmaciaChange(
                          farmacia.id,
                          farmacia.nombre,
                          e.target.checked
                        )
                      }
                      className="rounded"
                    />
                    <span className="text-sm">{farmacia.nombre}</span>
                  </label>
                ))}
              </div>
              
              {Object.keys(nuevoUsuario.farmacias).length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Farmacias seleccionadas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(nuevoUsuario.farmacias).map(([id, nombre]) => (
                      <Badge key={id} variant="secondary">
                        {nombre}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Permisos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permisos *</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERMISOS_DISPONIBLES.map((permiso) => (
                  <label
                    key={permiso}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={nuevoUsuario.permisos.includes(permiso)}
                      onChange={() => handlePermisoChange(permiso)}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">
                      {permiso.replace(/_/g, " ")}
                    </span>
                  </label>
                ))}
              </div>
              
              {nuevoUsuario.permisos.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Permisos seleccionados:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {nuevoUsuario.permisos.map((permiso) => (
                      <Badge key={permiso} variant="outline">
                        {permiso.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={handleCancelar}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? "Creando..." : "Crear Usuario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCrearUsuario;
