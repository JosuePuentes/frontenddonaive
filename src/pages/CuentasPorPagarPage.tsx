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
  fecha_vencimiento?: Date | null;
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
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);

  // Cargar compras
  const fetchCompras = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/compras`);

      if (res.ok) {
        const data = await res.json();
        console.log("🔍 [COMPRAS] Respuesta completa del backend:", JSON.stringify(data, null, 2));
        console.log("🔍 [COMPRAS] Tipo de dato:", typeof data);
        console.log("🔍 [COMPRAS] Es array?", Array.isArray(data));
        
        const comprasData = Array.isArray(data) ? data : (data.compras || data.compra || []);
        const comprasArray = Array.isArray(comprasData) ? comprasData : [];
        
        console.log("✅ [COMPRAS] Compras extraídas:", comprasArray);
        console.log("✅ [COMPRAS] Cantidad de compras:", comprasArray.length);
        
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

          // Normalizar proveedor primero (necesitamos sus días de crédito)
          let proveedorNormalizado = compra.proveedor;
          if (!proveedorNormalizado && compra.proveedor_id) {
            // Buscar el proveedor en la lista cargada
            const proveedorEncontrado = proveedores.find(
              (p: Proveedor) => p._id === compra.proveedor_id || p._id?.toString() === compra.proveedor_id?.toString()
            );
            
            if (proveedorEncontrado) {
              proveedorNormalizado = proveedorEncontrado;
              console.log("✅ [COMPRAS] Proveedor encontrado en lista:", proveedorEncontrado.nombre);
            } else {
              // Si no se encuentra, crear un objeto básico
              proveedorNormalizado = {
                _id: compra.proveedor_id,
                nombre: "Proveedor no encontrado",
                rif: "",
                telefono: "",
                dias_credito: 0
              };
              console.warn("⚠️ [COMPRAS] Proveedor no encontrado para compra:", compra.proveedor_id);
            }
          }

          // Calcular días de crédito con validación
          let diasCredito = 0;
          let diasRestantes = 0;
          let enMora = false;
          let fechaVencimiento: Date | null = null;
          
          try {
            // Obtener días de crédito del proveedor (ya normalizado)
            diasCredito = Number(proveedorNormalizado?.dias_credito || compra.dias_credito || 0);
            
            // Validar fecha de compra
            if (compra.fecha && diasCredito > 0) {
              const fechaCompra = new Date(compra.fecha);
              if (!isNaN(fechaCompra.getTime())) {
                // Calcular fecha de vencimiento
                fechaVencimiento = new Date(fechaCompra);
                fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
                
                // Calcular días restantes desde hoy hasta la fecha de vencimiento
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaVencimiento.setHours(0, 0, 0, 0);
                
                // Días restantes = (fecha_vencimiento - hoy) / días
                const diferenciaMs = fechaVencimiento.getTime() - hoy.getTime();
                diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
                
                // Si los días restantes son negativos, está en mora
                enMora = diasRestantes < 0 && estado !== "pagada";
                
                console.log(`📅 [COMPRAS] Compra ${compra._id}: Fecha compra: ${fechaCompra.toISOString()}, Días crédito: ${diasCredito}, Fecha vencimiento: ${fechaVencimiento.toISOString()}, Días restantes: ${diasRestantes}, En mora: ${enMora}`);
              } else {
                console.warn("⚠️ [COMPRAS] Fecha de compra inválida:", compra.fecha);
              }
            } else {
              console.log(`ℹ️ [COMPRAS] Compra ${compra._id}: Sin fecha o sin días de crédito`);
            }
          } catch (error) {
            console.error("❌ [COMPRAS] Error calculando días de crédito:", error);
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

  // Cargar proveedores
  const fetchProveedores = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/proveedores`);
      if (res.ok) {
        const data = await res.json();
        console.log("🔍 [PROVEEDORES] Respuesta completa del backend:", JSON.stringify(data, null, 2));
        
        // Manejar diferentes formatos de respuesta
        let proveedoresData: any[] = [];
        if (Array.isArray(data)) {
          proveedoresData = data;
        } else if (data && Array.isArray(data.proveedores)) {
          proveedoresData = data.proveedores;
        } else if (data && data.proveedor) {
          proveedoresData = Array.isArray(data.proveedor) ? data.proveedor : [data.proveedor];
        } else if (data && typeof data === 'object') {
          const valores = Object.values(data);
          const arrays = valores.filter(Array.isArray);
          if (arrays.length > 0) {
            proveedoresData = arrays.flat() as any[];
          } else {
            proveedoresData = [data];
          }
        }
        
        // Normalizar proveedores
        const proveedoresNormalizados = proveedoresData.map((p: any) => ({
          ...p,
          _id: p._id || p.id,
          nombre: p.nombre || "Sin nombre",
          rif: p.rif || "",
          telefono: p.telefono || "",
          dias_credito: p.dias_credito !== undefined && p.dias_credito !== null ? Number(p.dias_credito) : 0,
          descuento_comercial: p.descuento_comercial !== undefined && p.descuento_comercial !== null ? Number(p.descuento_comercial) : 0,
          descuento_pronto_pago: p.descuento_pronto_pago !== undefined && p.descuento_pronto_pago !== null ? Number(p.descuento_pronto_pago) : 0,
        }));
        
        console.log("✅ [PROVEEDORES] Proveedores cargados:", proveedoresNormalizados.length);
        setProveedores(proveedoresNormalizados);
      }
    } catch (err) {
      console.error("Error al cargar proveedores:", err);
    }
  };

  useEffect(() => {
    fetchProveedores();
    fetchCompras();
    fetchSucursales();
  }, []);

  // Recargar compras cuando cambien los proveedores (para hacer el match)
  useEffect(() => {
    if (proveedores.length > 0 && compras.length > 0) {
      console.log("🔄 [COMPRAS] Actualizando compras con proveedores cargados");
      console.log("📦 [COMPRAS] Proveedores disponibles:", proveedores.map(p => ({ id: p._id, nombre: p.nombre })));
      
      // Actualizar compras con proveedores encontrados
      const comprasActualizadas = compras.map((compra) => {
        if (!compra.proveedor || compra.proveedor.nombre === "Proveedor no encontrado") {
          console.log(`🔍 [COMPRAS] Buscando proveedor para compra ${compra._id}, proveedor_id: ${compra.proveedor_id}`);
          
          const proveedorEncontrado = proveedores.find(
            (p: Proveedor) => {
              const match1 = p._id === compra.proveedor_id;
              const match2 = p._id?.toString() === compra.proveedor_id?.toString();
              const match3 = compra.proveedor_id && p._id && String(p._id) === String(compra.proveedor_id);
              return match1 || match2 || match3;
            }
          );
          
          if (proveedorEncontrado) {
            console.log(`✅ [COMPRAS] Proveedor encontrado: ${proveedorEncontrado.nombre}`);
            
            // Recalcular días restantes con el proveedor correcto
            let diasRestantes = 0;
            let enMora = false;
            let fechaVencimiento: Date | null = null;
            const diasCredito = Number(proveedorEncontrado.dias_credito || 0);
            
            if (compra.fecha && diasCredito > 0) {
              const fechaCompra = new Date(compra.fecha);
              if (!isNaN(fechaCompra.getTime())) {
                fechaVencimiento = new Date(fechaCompra);
                fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
                
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                fechaVencimiento.setHours(0, 0, 0, 0);
                
                const diferenciaMs = fechaVencimiento.getTime() - hoy.getTime();
                diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));
                enMora = diasRestantes < 0 && compra.estado !== "pagada";
              } else {
                console.warn(`⚠️ [COMPRAS] Fecha inválida para compra ${compra._id}: ${compra.fecha}`);
              }
            }
            
            return {
              ...compra,
              proveedor: proveedorEncontrado,
              dias_credito: diasCredito,
              dias_restantes: diasRestantes,
              en_mora: enMora,
              fecha_vencimiento: fechaVencimiento || undefined,
            };
          } else {
            console.warn(`⚠️ [COMPRAS] Proveedor NO encontrado para compra ${compra._id}, proveedor_id: ${compra.proveedor_id}`);
            console.warn(`📋 [COMPRAS] IDs de proveedores disponibles:`, proveedores.map(p => p._id));
          }
        }
        return compra;
      });
      
      setCompras(comprasActualizadas);
    }
  }, [proveedores]);

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

