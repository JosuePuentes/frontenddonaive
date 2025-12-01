import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Filter } from "lucide-react";
import ModalDetalleCuentaPorPagar from "@/components/compras/ModalDetalleCuentaPorPagar";
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

interface Compra {
  _id: string;
  proveedor_id: string;
  proveedor?: Proveedor;
  sucursal_id?: string;
  sucursal?: Sucursal;
  fecha: string;
  pagar_en_dolar_negro: boolean;
  dolar_bcv: number;
  dolar_negro: number;
  total_costo: number;
  total_precio_venta: number;
  items: any[];
  estado?: "sin_pago" | "abonado" | "pagada";
  monto_abonado?: number;
  monto_restante?: number;
  pagos?: any[];
  dias_credito?: number;
  dias_restantes?: number;
  en_mora?: boolean;
  fecha_vencimiento?: Date;
}

type FiltroEstado = "todos" | "sin_pago" | "abonado" | "pagada" | "en_mora";

const CuentasPorPagarPage: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [compraSeleccionada, setCompraSeleccionada] = useState<Compra | null>(null);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [sucursalFiltro, setSucursalFiltro] = useState<string>("todas");

  // Cargar compras
  const fetchCompras = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const res = await fetchWithAuth(`${API_BASE_URL}/compras`);

      if (res.ok) {
        const data = await res.json();
        const comprasData = Array.isArray(data) ? data : (data.compras || data.compra || []);
        const comprasArray = Array.isArray(comprasData) ? comprasData : [];
        
        console.log("Compras recibidas del backend:", comprasArray);
        
        // Calcular estados y montos
        const comprasConEstado = comprasArray.map((compra: any) => {
          // Validar y normalizar valores
          const totalPrecioVenta = Number(compra.total_precio_venta || compra.total || 0);
          const montoAbonado = compra.pagos?.reduce((sum: number, pago: any) => {
            const monto = Number(pago.monto_bs || pago.monto_usd || 0);
            return sum + (isNaN(monto) ? 0 : monto);
          }, 0) || 0;
          const montoRestante = totalPrecioVenta - montoAbonado;
          
          let estado: "sin_pago" | "abonado" | "pagada" = "sin_pago";
          if (montoAbonado >= totalPrecioVenta && totalPrecioVenta > 0) {
            estado = "pagada";
          } else if (montoAbonado > 0) {
            estado = "abonado";
          }

          // Calcular días de crédito con validación
          let diasCredito = 0;
          let diasRestantes = 0;
          let enMora = false;
          let fechaVencimiento: Date | null = null;
          
          try {
            // Obtener días de crédito del proveedor
            diasCredito = Number(compra.proveedor?.dias_credito || compra.dias_credito || 0);
            
            // Validar fecha de compra
            if (compra.fecha) {
              const fechaCompra = new Date(compra.fecha);
              if (!isNaN(fechaCompra.getTime())) {
                fechaVencimiento = new Date(fechaCompra);
                fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
                
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaVencimiento.setHours(0, 0, 0, 0);
                
                const diasTranscurridos = Math.floor((hoy.getTime() - fechaCompra.getTime()) / (1000 * 60 * 60 * 24));
                diasRestantes = diasCredito - diasTranscurridos;
                enMora = diasRestantes < 0 && estado !== "pagada";
              }
            }
          } catch (error) {
            console.error("Error calculando días de crédito:", error);
          }

          // Normalizar proveedor
          let proveedorNormalizado = compra.proveedor;
          if (!proveedorNormalizado && compra.proveedor_id) {
            // Si no viene el proveedor poblado, crear un objeto básico
            proveedorNormalizado = {
              _id: compra.proveedor_id,
              nombre: "Proveedor no encontrado",
              rif: "",
              telefono: "",
              dias_credito: diasCredito
            };
          }

          return {
            ...compra,
            proveedor: proveedorNormalizado,
            estado,
            monto_abonado: montoAbonado,
            monto_restante: isNaN(montoRestante) ? totalPrecioVenta : montoRestante,
            dias_credito: diasCredito,
            dias_restantes: isNaN(diasRestantes) ? 0 : diasRestantes,
            en_mora: enMora,
            fecha_vencimiento: fechaVencimiento,
            total_precio_venta: totalPrecioVenta,
          };
        });

        console.log("Compras procesadas:", comprasConEstado);
        setCompras(comprasConEstado);
      } else {
        const errorData = await res.json().catch(() => null);
        console.error("Error al cargar compras:", errorData);
      }
    } catch (err) {
      console.error("Error al cargar compras:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
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

  // Filtrar compras por estado y sucursal
  const comprasFiltradas = compras.filter(c => {
    // Filtro por estado
    const cumpleEstado = filtroEstado === "todos" 
      ? true
      : filtroEstado === "en_mora"
      ? c.en_mora
      : c.estado === filtroEstado;
    
    // Filtro por sucursal
    const cumpleSucursal = sucursalFiltro === "todas" 
      ? true
      : c.sucursal_id === sucursalFiltro;
    
    return cumpleEstado && cumpleSucursal;
  });

  // Calcular totales con validación
  const totalAdeudado = comprasFiltradas.reduce((sum, c) => sum + (c.monto_restante || 0), 0);
  const totalAbonado = comprasFiltradas.reduce((sum, c) => sum + (c.monto_abonado || 0), 0);
  const totalFactura = comprasFiltradas.reduce((sum, c) => sum + (c.total_precio_venta || 0), 0);

  const handleVerDetalle = (compra: Compra) => {
    setCompraSeleccionada(compra);
    setShowModalDetalle(true);
  };

  const handlePagoCompletado = () => {
    fetchCompras();
    setShowModalDetalle(false);
    setCompraSeleccionada(null);
  };

  const getEstadoBadge = (compra: Compra) => {
    if (compra.estado === "pagada") {
      return <Badge className="bg-green-500">Pagada</Badge>;
    }
    if (compra.en_mora) {
      return <Badge className="bg-red-600">En Mora</Badge>;
    }
    if (compra.estado === "abonado") {
      return <Badge className="bg-yellow-500">Abonado</Badge>;
    }
    return <Badge className="bg-red-500">Sin Pago</Badge>;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Cuentas por Pagar</h1>
        </div>

        {/* Totales */}
        <Card className="p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600 mb-1">Total Adeudado</div>
              <div className="text-2xl font-bold text-red-600">${(totalAdeudado || 0).toFixed(2)}</div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600 mb-1">Total Abonado</div>
              <div className="text-2xl font-bold text-yellow-600">${(totalAbonado || 0).toFixed(2)}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-slate-600 mb-1">Total Factura</div>
              <div className="text-2xl font-bold text-blue-600">${(totalFactura || 0).toFixed(2)}</div>
            </div>
          </div>
        </Card>

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-800">Filtros</h2>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Sucursal</label>
            <select
              value={sucursalFiltro}
              onChange={(e) => setSucursalFiltro(e.target.value)}
              className="w-full md:w-auto border rounded px-3 py-2"
            >
              <option value="todas">Todas las Sucursales</option>
              {sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filtroEstado === "todos" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("todos")}
            >
              Todos ({compras.length})
            </Button>
            <Button
              variant={filtroEstado === "sin_pago" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("sin_pago")}
            >
              Sin Pago ({compras.filter(c => c.estado === "sin_pago").length})
            </Button>
            <Button
              variant={filtroEstado === "abonado" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("abonado")}
            >
              Abonado ({compras.filter(c => c.estado === "abonado").length})
            </Button>
            <Button
              variant={filtroEstado === "pagada" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("pagada")}
            >
              Pagada ({compras.filter(c => c.estado === "pagada").length})
            </Button>
            <Button
              variant={filtroEstado === "en_mora" ? "default" : "outline"}
              size="sm"
              onClick={() => setFiltroEstado("en_mora")}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              En Mora ({compras.filter(c => c.en_mora).length})
            </Button>
          </div>
        </Card>

        {/* Lista de Compras */}
        <Card className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Cargando compras...</div>
          ) : comprasFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-500 mb-4">
                No hay compras {filtroEstado !== "todos" ? `con estado ${filtroEstado}` : ""}
              </p>
              <Button onClick={fetchCompras} variant="outline">
                Recargar Compras
              </Button>
              <p className="text-xs text-slate-400 mt-2">
                Total de compras en sistema: {compras.length}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">N° Compra</th>
                    <th className="text-left p-3 font-semibold">Sucursal</th>
                    <th className="text-left p-3 font-semibold">Proveedor</th>
                    <th className="text-center p-3 font-semibold">Días Crédito</th>
                    <th className="text-center p-3 font-semibold">Días Restantes</th>
                    <th className="text-right p-3 font-semibold">Items</th>
                    <th className="text-right p-3 font-semibold">Total Factura</th>
                    <th className="text-right p-3 font-semibold">Abonado</th>
                    <th className="text-right p-3 font-semibold">Restante</th>
                    <th className="text-center p-3 font-semibold">Estado</th>
                    <th className="text-center p-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comprasFiltradas.map((compra) => (
                    <tr key={compra._id} className="border-b hover:bg-slate-50">
                      <td className="p-3">{compra._id.slice(-8)}</td>
                      <td className="p-3">
                        {compra.sucursal?.nombre || compra.sucursal_id || "N/A"}
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{compra.proveedor?.nombre || "N/A"}</div>
                          {compra.proveedor?.descuento_comercial && (
                            <div className="text-xs text-slate-500">
                              Desc. Comercial: {compra.proveedor.descuento_comercial}%
                            </div>
                          )}
                          {compra.proveedor?.descuento_pronto_pago && (
                            <div className="text-xs text-slate-500">
                              Desc. Pronto Pago: {compra.proveedor.descuento_pronto_pago}%
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        {compra.dias_credito || 0} días
                      </td>
                      <td className="p-3 text-center">
                        {compra.estado === "pagada" ? (
                          <span className="text-green-600 font-semibold">Pagada</span>
                        ) : compra.dias_restantes !== undefined && !isNaN(compra.dias_restantes) ? (
                          <span className={compra.dias_restantes < 0 ? "text-red-600 font-semibold" : compra.dias_restantes <= 5 ? "text-yellow-600 font-semibold" : "text-slate-600"}>
                            {compra.dias_restantes} días
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-3 text-right">{compra.items?.length || 0}</td>
                      <td className="p-3 text-right font-semibold">${(compra.total_precio_venta || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-yellow-600">${(compra.monto_abonado || 0).toFixed(2)}</td>
                      <td className="p-3 text-right text-red-600 font-semibold">${((compra.monto_restante !== undefined && compra.monto_restante !== null) ? compra.monto_restante : (compra.total_precio_venta || 0)).toFixed(2)}</td>
                      <td className="p-3 text-center">{getEstadoBadge(compra)}</td>
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalle(compra)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Modal de Detalle */}
        {showModalDetalle && compraSeleccionada && (
          <ModalDetalleCuentaPorPagar
            open={showModalDetalle}
            onClose={() => {
              setShowModalDetalle(false);
              setCompraSeleccionada(null);
            }}
            compra={compraSeleccionada}
            onPagoCompletado={handlePagoCompletado}
          />
        )}
      </div>
    </div>
  );
};

export default CuentasPorPagarPage;

