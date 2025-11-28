import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, ShoppingCart, DollarSign } from "lucide-react";
import ModalCrearProveedor from "@/components/compras/ModalCrearProveedor";
import ModalCrearCompra from "@/components/compras/ModalCrearCompra";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Proveedor {
  _id?: string;
  nombre: string;
  rif: string;
  telefono: string;
  dias_credito: number;
  descuento_comercial: number;
  descuento_pronto_pago: number;
}

const ComprasPage: React.FC = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalCompra, setShowModalCompra] = useState(false);
  const [dolarBcv, setDolarBcv] = useState<number>(0);
  const [dolarNegro, setDolarNegro] = useState<number>(0);
  const [diferenciaBs, setDiferenciaBs] = useState<number>(0);
  const [diferenciaUsd, setDiferenciaUsd] = useState<number>(0);
  const [diferenciaPorcentaje, setDiferenciaPorcentaje] = useState<number>(0);
  const [loading, setLoading] = useState(false);

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
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetch(`${API_BASE_URL}/proveedores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProveedores(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProveedores();
  }, []);

  const handleCrearProveedor = () => {
    setShowModalProveedor(true);
  };

  const handleProveedorCreado = () => {
    fetchProveedores();
    setShowModalProveedor(false);
  };

  const handleSeleccionarProveedor = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor);
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
                    <p><strong>RIF:</strong> {proveedor.rif}</p>
                    <p><strong>Teléfono:</strong> {proveedor.telefono}</p>
                    <p><strong>Días de Crédito:</strong> {proveedor.dias_credito}</p>
                    <p><strong>Desc. Comercial:</strong> {proveedor.descuento_comercial}%</p>
                    <p><strong>Desc. Pronto Pago:</strong> {proveedor.descuento_pronto_pago}%</p>
                  </div>
                  <Button
                    className="w-full mt-4"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSeleccionarProveedor(proveedor);
                    }}
                  >
                    Crear Compra
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Card>

        {/* Modal de Crear Proveedor */}
        {showModalProveedor && (
          <ModalCrearProveedor
            open={showModalProveedor}
            onClose={() => setShowModalProveedor(false)}
            onSuccess={handleProveedorCreado}
          />
        )}

        {/* Modal de Crear Compra */}
        {showModalCompra && proveedorSeleccionado && (
          <ModalCrearCompra
            open={showModalCompra}
            onClose={() => {
              setShowModalCompra(false);
              setProveedorSeleccionado(null);
            }}
            proveedor={proveedorSeleccionado}
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

