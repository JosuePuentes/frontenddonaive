import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface ModalCrearProveedorProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ModalCrearProveedor: React.FC<ModalCrearProveedorProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [nombre, setNombre] = useState("");
  const [rif, setRif] = useState("");
  const [telefono, setTelefono] = useState("");
  const [diasCredito, setDiasCredito] = useState("");
  const [descuentoComercial, setDescuentoComercial] = useState("");
  const [descuentoProntoPago, setDescuentoProntoPago] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nombre.trim() || !rif.trim() || !telefono.trim()) {
      setError("Nombre, RIF y Teléfono son obligatorios");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(`${API_BASE_URL}/proveedores`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombre: nombre.trim(),
          rif: rif.trim(),
          telefono: telefono.trim(),
          dias_credito: parseInt(diasCredito) || 0,
          descuento_comercial: parseFloat(descuentoComercial) || 0,
          descuento_pronto_pago: parseFloat(descuentoProntoPago) || 0,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || "Error al crear proveedor");
      }

      // Limpiar formulario
      setNombre("");
      setRif("");
      setTelefono("");
      setDiasCredito("");
      setDescuentoComercial("");
      setDescuentoProntoPago("");
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Error al crear proveedor");
      console.error("Error al crear proveedor:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">
            Crear Nuevo Proveedor
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre del Proveedor *
              </label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Distribuidora ABC"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                RIF *
              </label>
              <Input
                value={rif}
                onChange={(e) => setRif(e.target.value)}
                placeholder="Ej: J-12345678-9"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Teléfono *
              </label>
              <Input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 0412-1234567"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Días de Crédito
              </label>
              <Input
                type="number"
                min="0"
                value={diasCredito}
                onChange={(e) => setDiasCredito(e.target.value)}
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descuento Comercial (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={descuentoComercial}
                onChange={(e) => setDescuentoComercial(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Descuento por Pronto Pago (%)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={descuentoProntoPago}
                onChange={(e) => setDescuentoProntoPago(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Proveedor"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCrearProveedor;

