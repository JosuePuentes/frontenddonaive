import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, ShoppingCart, DollarSign } from "lucide-react";
import ModalCrearProveedor from "@/components/compras/ModalCrearProveedor";
import ModalCrearCompra from "@/components/compras/ModalCrearCompra";
import { fetchWithAuth } from "@/lib/api";

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

interface Sucursal {
  id: string;
  nombre: string;
}

const ComprasPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [proveedorEditando, setProveedorEditando] = useState<Proveedor | null>(null);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [dolarBcv, setDolarBcv] = useState<number>(0);
  const [dolarNegro, setDolarNegro] = useState<number>(0);
  const [diferenciaBs, setDiferenciaBs] = useState<number>(0);
  const [diferenciaUsd, setDiferenciaUsd] = useState<number>(0);
  const [diferenciaPorcentaje, setDiferenciaPorcentaje] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [showSucursalModal, setShowSucursalModal] = useState(false);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<string>("");

  // Calcular diferencias cuando cambian los dólares
  useEffect(() => {
    if (dolarBcv > 0 && dolarNegro > 0) {
      const diferencia = dolarNegro - dolarBcv;
      setDiferenciaBs(diferencia);
      setDiferenciaUsd(diferencia / dolarBcv);
      setDiferenciaPorcentaje((diferencia / dolarBcv) * 100);
    } else {
      setDiferenciaBs(0);
      setDiferenciaUsd(0);
      setDiferenciaPorcentaje(0);
    }
  }, [dolarBcv, dolarNegro]);

  // Cargar proveedores
  const fetchProveedores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        console.error("No se encontró el token de autenticación");
        setProveedores([]);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/proveedores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Error al obtener proveedores:", res.status, errorText);
        setProveedores([]);
        return;
      }

      const data = await res.json();
      console.log("Respuesta del backend /proveedores:", data);
      
      // Manejar diferentes formatos de respuesta
      let proveedoresData: any[] = [];
      if (Array.isArray(data)) {
        proveedoresData = data;
      } else if (data && Array.isArray(data.proveedores)) {
        proveedoresData = data.proveedores;
      } else if (data && data.proveedor) {
        proveedoresData = [data.proveedor];
      } else if (data && typeof data === 'object') {
        // Si es un objeto con un array dentro
        proveedoresData = Object.values(data).filter(Array.isArray).flat() as any[];
      }
      
      // Asegurar que todos los campos numéricos existan
      const proveedoresNormalizados = proveedoresData.map((p: any) => ({
        ...p,
        dias_credito: p.dias_credito !== undefined && p.dias_credito !== null ? p.dias_credito : 0,
        descuento_comercial: p.descuento_comercial !== undefined && p.descuento_comercial !== null ? p.descuento_comercial : 0,
        descuento_pronto_pago: p.descuento_pronto_pago !== undefined && p.descuento_pronto_pago !== null ? p.descuento_pronto_pago : 0,
      }));
      
      console.log("Proveedores normalizados:", proveedoresNormalizados);
      setProveedores(proveedoresNormalizados);
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
      setProveedores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchSucursales();
  }, []);

  // Cargar sucursales
  const fetchSucursales = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/farmacias`);
      if (res.ok) {
        const data = await res.json();
        const listaSucursales = data.farmacias
          ? Object.entries(data.farmacias).map(([id, nombre]) => ({
              id,
              nombre: String(nombre),
            }))
          : Object.entries(data).map(([id, nombre]) => ({
              id,
              nombre: String(nombre),
            }));
        setSucursales(listaSucursales);
      }
    } catch (err) {
      console.error("Error al cargar sucursales:", err);
    }
  };

  const handleCrearProveedor = () => {
    setProveedorEditando(null);
    setShowModalProveedor(true);
  };

  const handleEditarProveedor = (proveedor: Proveedor) => {
    setProveedorEditando(proveedor);
    setShowModalProveedor(true);
  };

  const handleProveedorCreado = () => {
    setShowModalProveedor(false);
    setProveedorEditando(null);
    // Recargar proveedores después de un pequeño delay para asegurar que el backend haya guardado
    setTimeout(() => {
      fetchProveedores();
    }, 500);
  };

  const handleSeleccionarProveedor = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor);
    setShowSucursalModal(true);
  };

  const handleConfirmarSucursal = () => {
    if (!sucursalSeleccionada) {
      alert("Debe seleccionar una sucursal");
      return;
    }
    setShowSucursalModal(false);
    setShowModalCompra(true);
  };

  const handleCompraCompletada = () => {
    setShowModalCompra(false);
    setProveedorSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Módulo de Compras</h1>
        </div>

        {/* Sección de Dólares */}
        <Card className="p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-slate-600" />
            <h2 className="text-xl font-semibold text-slate-800">Tasas de Cambio</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dólar BCV (Bs)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={dolarBcv || ""}
                onChange={(e) => setDolarBcv(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Dólar Negro (Bs)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={dolarNegro || ""}
                onChange={(e) => setDolarNegro(parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="w-full"
              />
            </div>
            {dolarBcv > 0 && dolarNegro > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Diferencia (Bs)
                  </label>
                  <div className="p-2 bg-slate-100 rounded-md text-lg font-semibold text-slate-800">
                    {diferenciaBs.toFixed(2)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Diferencia (%)
                  </label>
                  <div className="p-2 bg-slate-100 rounded-md text-lg font-semibold text-slate-800">
                    {diferenciaPorcentaje.toFixed(2)}%
                  </div>
                </div>
              </>
            )}
          </div>
          {dolarBcv > 0 && dolarNegro > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-sm text-slate-700">
                <strong>Diferencia en USD:</strong> ${diferenciaUsd.toFixed(4)}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Cuando se active "Pagar en dólar negro", se sumará este porcentaje ({diferenciaPorcentaje.toFixed(2)}%) al costo de los productos.
              </p>
            </div>
          )}
        </Card>

        {/* Sección de Proveedores */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-slate-600" />
              <h2 className="text-xl font-semibold text-slate-800">Proveedores</h2>
            </div>
            <Button onClick={handleCrearProveedor} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Crear Proveedor
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando proveedores...</div>
          ) : proveedores.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No hay proveedores registrados</p>
              <Button onClick={handleCrearProveedor} variant="outline" className="mt-4">
                Crear Primer Proveedor
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {proveedores.map((proveedor) => (
                <Card
                  key={proveedor._id || proveedor.rif}
                  className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleSeleccionarProveedor(proveedor)}
                >
                  <h3 className="font-semibold text-lg text-slate-800 mb-2">
                    {proveedor.nombre}
                  </h3>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong>RIF:</strong> {proveedor.rif || "-"}</p>
                    <p><strong>Teléfono:</strong> {proveedor.telefono || "-"}</p>
                    <p><strong>Días de Crédito:</strong> {proveedor.dias_credito !== undefined && proveedor.dias_credito !== null ? proveedor.dias_credito : 0}</p>
                    <p><strong>Desc. Comercial:</strong> {proveedor.descuento_comercial !== undefined && proveedor.descuento_comercial !== null ? `${proveedor.descuento_comercial}%` : "0%"}</p>
                    <p><strong>Desc. Pronto Pago:</strong> {proveedor.descuento_pronto_pago !== undefined && proveedor.descuento_pronto_pago !== null ? `${proveedor.descuento_pronto_pago}%` : "0%"}</p>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditarProveedor(proveedor);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSeleccionarProveedor(proveedor);
                      }}
                    >
                      Crear Compra
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Modal de Crear/Editar Proveedor */}
        {showModalProveedor && (
          <ModalCrearProveedor
            open={showModalProveedor}
            onClose={() => {
              setShowModalProveedor(false);
              setProveedorEditando(null);
            }}
            onSuccess={handleProveedorCreado}
            proveedor={proveedorEditando}
          />
        )}

        {/* Modal de Selección de Sucursal */}
        {showSucursalModal && proveedorSeleccionado && (
          <Dialog open={showSucursalModal} onOpenChange={(open) => !open && setShowSucursalModal(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Seleccionar Sucursal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Sucursal para la Compra *
                  </label>
                  <select
                    value={sucursalSeleccionada}
                    onChange={(e) => setSucursalSeleccionada(e.target.value)}
                    className="w-full border rounded px-3 py-2"
                  >
                    <option value="">Seleccione una sucursal</option>
                    {sucursales.map((sucursal) => (
                      <option key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => {
                    setShowSucursalModal(false);
                    setProveedorSeleccionado(null);
                  }}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConfirmarSucursal}>
                    Continuar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Modal de Crear Compra */}
        {showModalCompra && proveedorSeleccionado && sucursalSeleccionada && (
          <ModalCrearCompra
            open={showModalCompra}
            onClose={() => {
              setShowModalCompra(false);
              setProveedorSeleccionado(null);
              setSucursalSeleccionada("");
            }}
            proveedor={proveedorSeleccionado}
            sucursalId={sucursalSeleccionada}
            dolarBcv={dolarBcv}
            dolarNegro={dolarNegro}
            diferenciaPorcentaje={diferenciaPorcentaje}
            onSuccess={handleCompraCompletada}
          />
        )}
      </div>
    </div>
  );
};

export default ComprasPage;

