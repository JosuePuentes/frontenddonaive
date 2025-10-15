import { useState, useCallback } from "react";
import { Usuario } from "../types/UsuarioTypes";

interface UseModificarUsuarioReturn {
  usuarios: Usuario[];
  loading: boolean;
  error: string | null;
  fetchUsuarios: () => Promise<void>;
  actualizarUsuario: (usuario: Usuario) => Promise<void>;
  eliminarUsuario: (usuarioId: string) => Promise<void>;
  setError: (error: string | null) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const useModificarUsuario = (): UseModificarUsuarioReturn => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setUsuarios(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al obtener usuarios";
      setError(errorMessage);
      console.error("Error fetching usuarios:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const actualizarUsuario = useCallback(async (usuario: Usuario) => {
    if (!usuario._id) {
      throw new Error("ID de usuario requerido para actualizar");
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${usuario._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(usuario),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Error ${response.status}: ${response.statusText}`
        );
      }
      
      // Actualizar la lista de usuarios después de la modificación exitosa
      await fetchUsuarios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al actualizar usuario";
      setError(errorMessage);
      console.error("Error updating usuario:", err);
      throw err; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  }, [fetchUsuarios]);

  const eliminarUsuario = useCallback(async (usuarioId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${usuarioId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          `Error ${response.status}: ${response.statusText}`
        );
      }
      
      // Actualizar la lista de usuarios después de la eliminación exitosa
      await fetchUsuarios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error al eliminar usuario";
      setError(errorMessage);
      console.error("Error deleting usuario:", err);
      throw err; // Re-lanzar para que el componente pueda manejarlo
    } finally {
      setLoading(false);
    }
  }, [fetchUsuarios]);

  return {
    usuarios,
    loading,
    error,
    fetchUsuarios,
    actualizarUsuario,
    eliminarUsuario,
    setError,
  };
};

export default useModificarUsuario;
