import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileText, Download, Printer } from "lucide-react";
import UpFilePagosCPP from "@/components/upfile/UpFilePagosCPP";
import ImageDisplay from "@/components/upfile/ImageDisplay";
import { fetchWithAuth } from "@/lib/api";
import * as XLSX from "xlsx";

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

interface Compra {
  _id: string;
  proveedor_id: string;
  proveedor?: Proveedor;
  fecha: string;
  pagar_en_dolar_negro: boolean;
  dolar_bcv: number;
  dolar_negro: number;
  total_costo: number;
  total_precio_venta: number;
  total?: number; // Total de la compra (puede venir del backend)
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

interface Banco {
  _id?: string;
  id?: string;
  nombre_banco: string;
  divisa: "USD" | "BS";
  tipo_metodo?: string;
  activo?: boolean;
  saldo?: number;
}

interface ModalDetalleCuentaPorPagarProps {
  open: boolean;
  onClose: () => void;
  compra: Compra;
  onPagoCompletado: () => void;
}

const ModalDetalleCuentaPorPagar: React.FC<ModalDetalleCuentaPorPagarProps> = ({
  open,
  onClose,
  compra,
  onPagoCompletado,
}) => {
  const [mostrarPago, setMostrarPago] = useState(false);
  const [mostrarPreliminar, setMostrarPreliminar] = useState(false);
  const [tasaBcv, setTasaBcv] = useState<number>(compra.dolar_bcv || 0);
  const [montoBs, setMontoBs] = useState<number>(0);
  const [montoPagar, setMontoPagar] = useState<string>("");
  const [divisaPago, setDivisaPago] = useState<"USD" | "Bs">("USD");
  const [bancoSeleccionado, setBancoSeleccionado] = useState<string>("");
  const [metodoPago, setMetodoPago] = useState<string>("");
  const [referencia, setReferencia] = useState<string>("");
  const [notas, setNotas] = useState<string>("");
  const [comprobanteArchivo, setComprobanteArchivo] = useState<string | null>(null);
  const [bancos, setBancos] = useState<Banco[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcular monto en Bs según tasa BCV
  useEffect(() => {
    if (!compra.pagar_en_dolar_negro && tasaBcv > 0) {
      const montoCalculado = compra.total_precio_venta * tasaBcv;
      setMontoBs(montoCalculado);
    } else {
      setMontoBs(0);
    }
  }, [tasaBcv, compra.total_precio_venta, compra.pagar_en_dolar_negro]);

  // Cargar bancos
  useEffect(() => {
    if (open) {
      const fetchBancos = async () => {
        try {
          const res = await fetchWithAuth(`${API_BASE_URL}/bancos`);
          if (res.ok) {
            const data = await res.json();
            const bancosActivos = (data.bancos || data || []).filter((b: Banco) => b.activo !== false);
            setBancos(bancosActivos);
          }
        } catch (err) {
          console.error("Error al cargar bancos:", err);
        }
      };
      fetchBancos();
    }
  }, [open]);

  // Obtener tasa del día
  useEffect(() => {
    if (open && !compra.pagar_en_dolar_negro) {
      const obtenerTasa = async () => {
        try {
          const hoy = new Date().toISOString().split('T')[0];
          const res = await fetchWithAuth(`${API_BASE_URL}/punto-venta/tasa-del-dia?fecha=${hoy}`);
          if (res.ok) {
            const data = await res.json();
            setTasaBcv(data.tasa || compra.dolar_bcv || 0);
          }
        } catch (err) {
          console.error("Error al obtener tasa:", err);
        }
      };
      obtenerTasa();
    }
  }, [open, compra.pagar_en_dolar_negro, compra.dolar_bcv]);

  const handlePagar = () => {
    setMostrarPago(true);
  };

  const handleConfirmarPago = async () => {
    if (!montoPagar || parseFloat(montoPagar) <= 0) {
      setError("Debe ingresar un monto válido");
      return;
    }

    if (!bancoSeleccionado) {
      setError("Debe seleccionar un banco");
      return;
    }

    if (!metodoPago) {
      setError("Debe seleccionar un método de pago");
      return;
    }

    setError(null);
    setMostrarPreliminar(true);
  };

  const handleGuardarPago = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) throw new Error("No se encontró el token de autenticación");

      const montoPagarNum = parseFloat(montoPagar);
      
      // Formatear fecha como YYYY-MM-DD
      const fechaPago = new Date().toISOString().split('T')[0];

      const pagoData = {
        monto: montoPagarNum,
        fecha_pago: fechaPago,
        metodo_pago: metodoPago,
        banco_id: bancoSeleccionado,
        referencia: referencia || "",
        notas: notas || "",
      };

      const res = await fetchWithAuth(`${API_BASE_URL}/compras/${compra._id}/pagos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(pagoData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.detail || errorData?.message || "Error al guardar pago");
      }

      setMostrarPreliminar(false);
      setMostrarPago(false);
      setMontoPagar("");
      setReferencia("");
      setNotas("");
      setComprobanteArchivo(null);
      setBancoSeleccionado("");
      setMetodoPago("");
      onPagoCompletado();
    } catch (err: any) {
      setError(err.message || "Error al guardar pago");
      console.error("Error al guardar pago:", err);
    } finally {
      setLoading(false);
    }
  };

  const imprimirCompra = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = generarHTMLImpresion();
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const exportarPDF = () => {
    imprimirCompra(); // Por ahora usamos la misma función de impresión
  };

  const exportarExcel = () => {
    const datos = [
      ["COMPRA DE MERCADERÍA"],
      ["Fecha:", new Date(compra.fecha).toLocaleDateString('es-VE')],
      [""],
      ["DATOS DEL PROVEEDOR"],
      ["Nombre:", compra.proveedor?.nombre || ""],
      ["RIF:", compra.proveedor?.rif || ""],
      ["Teléfono:", compra.proveedor?.telefono || ""],
      ["Días de Crédito:", compra.proveedor?.dias_credito || 0],
      [""],
      ["ITEMS"],
      ["Código", "Descripción", "Marca", "Cantidad", "Costo", "Utilidad %", "Precio Venta", "Subtotal"],
      ...compra.items.map((item: any) => [
        item.codigo,
        item.descripcion,
        item.marca || "",
        item.cantidad,
        item.costo,
        item.utilidad,
        item.precio_venta,
        item.precio_venta * item.cantidad,
      ]),
      [""],
      ["Total Costo:", compra.total_costo],
      ["Total Precio Venta:", compra.total_precio_venta],
    ];

    const ws = XLSX.utils.aoa_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compra");
    XLSX.writeFile(wb, `Compra_${compra._id.slice(-8)}.xlsx`);
  };

  const generarHTMLImpresion = () => {
    const fecha = new Date(compra.fecha).toLocaleDateString('es-VE');
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Compra - ${compra.proveedor?.nombre}</title>
  <style>
    @media print {
      @page { margin: 1cm; }
      body { margin: 0; padding: 0; }
    }
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .info-section { margin-bottom: 20px; }
    .info-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th { background-color: #f2f2f2; font-weight: bold; }
    .totals {
      margin-top: 20px;
      border-top: 2px solid #000;
      padding-top: 10px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .total-final {
      font-size: 18px;
      font-weight: bold;
      margin-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>COMPRA DE MERCADERÍA</h1>
    <p>Fecha: ${fecha}</p>
  </div>
  <div class="info-section">
    <h2>Datos del Proveedor</h2>
    <div class="info-row">
      <span><strong>Nombre:</strong></span>
      <span>${compra.proveedor?.nombre || ""}</span>
    </div>
    <div class="info-row">
      <span><strong>RIF:</strong></span>
      <span>${compra.proveedor?.rif || ""}</span>
    </div>
    <div class="info-row">
      <span><strong>Teléfono:</strong></span>
      <span>${compra.proveedor?.telefono || ""}</span>
    </div>
    <div class="info-row">
      <span><strong>Días de Crédito:</strong></span>
      <span>${compra.proveedor?.dias_credito || 0}</span>
    </div>
  </div>
  <h2>Items de la Compra</h2>
  <table>
    <thead>
      <tr>
        <th>Código</th>
        <th>Descripción</th>
        <th>Cantidad</th>
        <th>Precio Venta</th>
        <th>Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${compra.items.map((item: any) => `
        <tr>
          <td>${item.codigo}</td>
          <td>${item.descripcion || "-"}</td>
          <td>${item.cantidad || 0}</td>
          <td>$${((item.precio_venta || item.precio_unitario || 0)).toFixed(2)}</td>
          <td>$${(((item.precio_venta || item.precio_unitario || 0) * (item.cantidad || 0))).toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="totals">
    <div class="total-row">
      <span>Total:</span>
      <span>$${(compra.total_precio_venta || compra.total || 0).toFixed(2)}</span>
    </div>
  </div>
</body>
</html>
    `;
  };

  const getEstadoBadge = () => {
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

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Detalle de Cuenta por Pagar
            </DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Información de la Compra */}
          <Card className="p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-slate-600">N° Compra</div>
                <div className="font-semibold">{compra._id.slice(-8)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Estado</div>
                <div>{getEstadoBadge()}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Proveedor</div>
                <div className="font-semibold">{compra.proveedor?.nombre || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Fecha</div>
                <div>{new Date(compra.fecha).toLocaleDateString('es-VE')}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Días de Crédito</div>
                <div>{compra.proveedor?.dias_credito || 0} días</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Días Restantes</div>
                <div className={compra.dias_restantes !== undefined && compra.dias_restantes < 0 ? "text-red-600 font-semibold" : ""}>
                  {compra.dias_restantes !== undefined ? `${compra.dias_restantes} días` : "-"}
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Total Factura</div>
                <div className="text-lg font-bold text-green-600">${(compra.total_precio_venta || compra.total || 0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-slate-600">Monto Restante</div>
                <div className="text-lg font-bold text-red-600">${((compra.monto_restante !== undefined && compra.monto_restante !== null) ? compra.monto_restante : (compra.total_precio_venta || compra.total || 0)).toFixed(2)}</div>
              </div>
            </div>

            {/* Condiciones del Proveedor */}
            {compra.proveedor && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-semibold mb-2">Condiciones del Proveedor</div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Desc. Comercial:</span>{" "}
                    <span>{compra.proveedor.descuento_comercial || 0}%</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Desc. Pronto Pago:</span>{" "}
                    <span>{compra.proveedor.descuento_pronto_pago || 0}%</span>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Items de la Compra */}
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-3">Items de la Compra</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Código</th>
                    <th className="text-left p-2">Descripción</th>
                    <th className="text-right p-2">Cantidad</th>
                    <th className="text-right p-2">Precio Venta</th>
                    <th className="text-right p-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {compra.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{item.codigo}</td>
                      <td className="p-2">{item.descripcion}</td>
                      <td className="p-2 text-right">{item.cantidad}</td>
                      <td className="p-2 text-right">${((item.precio_venta || item.precio_unitario || 0)).toFixed(2)}</td>
                      <td className="p-2 text-right font-semibold">
                        ${(((item.precio_venta || item.precio_unitario || 0) * (item.cantidad || 0))).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" onClick={exportarPDF}>
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" onClick={imprimirCompra}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            {compra.estado !== "pagada" && (
              <Button onClick={handlePagar}>
                <DollarSign className="h-4 w-4 mr-2" />
                Pagar/Abonar
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Pago/Abono */}
      {mostrarPago && (
        <Dialog open={mostrarPago} onOpenChange={(open) => !open && setMostrarPago(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pagar/Abonar Compra</DialogTitle>
            </DialogHeader>

            {!compra.pagar_en_dolar_negro && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Tasa del Día BCV (Bs)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={tasaBcv}
                  onChange={(e) => setTasaBcv(parseFloat(e.target.value) || 0)}
                />
                {tasaBcv > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    Monto en Bs: {montoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Divisa de Pago *
              </label>
              <select
                value={divisaPago}
                onChange={(e) => setDivisaPago(e.target.value as "USD" | "Bs")}
                className="w-full border rounded px-3 py-2"
              >
                <option value="USD">USD ($)</option>
                <option value="Bs">Bs</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Monto a Pagar ({divisaPago}) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={montoPagar}
                onChange={(e) => setMontoPagar(e.target.value)}
                placeholder={divisaPago === "USD" 
                  ? `Máximo: $${((compra.monto_restante !== undefined && compra.monto_restante !== null) ? compra.monto_restante : (compra.total_precio_venta || compra.total || 0)).toFixed(2)}`
                  : `Máximo: ${((compra.monto_restante !== undefined && compra.monto_restante !== null) ? compra.monto_restante : (compra.total_precio_venta || compra.total || 0)) * (tasaBcv || 0)} Bs`
                }
              />
              {divisaPago === "Bs" && tasaBcv > 0 && (
                <div className="mt-1 text-xs text-slate-500">
                  Equivale a: ${(parseFloat(montoPagar) || 0) / tasaBcv} USD
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Banco *
              </label>
              <select
                value={bancoSeleccionado}
                onChange={(e) => {
                  setBancoSeleccionado(e.target.value);
                  const banco = bancos.find(b => (b._id || b.id) === e.target.value);
                  if (banco) {
                    setMetodoPago(banco.tipo_metodo || "");
                  }
                }}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Seleccione un banco</option>
                {bancos.map((banco) => {
                  const saldo = banco.saldo !== undefined ? banco.saldo : 0;
                  const saldoFormateado = saldo.toFixed(2);
                  const simboloDivisa = banco.divisa === "USD" ? "$" : "Bs";
                  return (
                    <option key={banco._id || banco.id} value={banco._id || banco.id}>
                      {banco.nombre_banco} - Saldo: {simboloDivisa} {saldoFormateado} ({banco.divisa})
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Método de Pago *
              </label>
              <Input
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                placeholder="Ej: Transferencia, Pago Móvil, etc."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Referencia
              </label>
              <Input
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                placeholder="Ej: TRF-123456, REF-789012"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Notas
              </label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: Pago parcial, Pago completo, etc."
                className="w-full border rounded px-3 py-2 min-h-[80px]"
                rows={3}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Comprobante (Foto/Archivo)
              </label>
              <UpFilePagosCPP
                onUploadSuccess={(objectName) => setComprobanteArchivo(objectName)}
                label="Subir comprobante"
                maxSizeMB={5}
                initialFileUrl={comprobanteArchivo || undefined}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMostrarPago(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmarPago} disabled={loading}>
                Continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Preliminar */}
      {mostrarPreliminar && (
        <Dialog open={mostrarPreliminar} onOpenChange={(open) => !open && setMostrarPreliminar(false)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Preliminar de Pago</DialogTitle>
            </DialogHeader>

            <Card className="p-4 mb-4">
              <h3 className="font-semibold mb-3">Resumen del Pago</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Monto a Pagar:</span>
                  <span className="font-semibold">
                    {divisaPago === "USD" ? "$" : ""}{parseFloat(montoPagar || "0").toFixed(2)} {divisaPago}
                  </span>
                </div>
                {divisaPago === "Bs" && tasaBcv > 0 && (
                  <div className="flex justify-between">
                    <span>Equivalente en USD:</span>
                    <span className="font-semibold">
                      ${((parseFloat(montoPagar || "0")) / tasaBcv).toFixed(2)} USD
                    </span>
                  </div>
                )}
                {divisaPago === "USD" && tasaBcv > 0 && (
                  <div className="flex justify-between">
                    <span>Equivalente en Bs:</span>
                    <span className="font-semibold">
                      {((parseFloat(montoPagar || "0")) * tasaBcv).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Banco:</span>
                  <span>{bancos.find(b => (b._id || b.id) === bancoSeleccionado)?.nombre_banco || ""}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método de Pago:</span>
                  <span>{metodoPago}</span>
                </div>
                {comprobanteArchivo && (
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Comprobante:</div>
                    <div className="border rounded p-2">
                      <ImageDisplay
                        imageName={comprobanteArchivo}
                        alt="Comprobante de pago"
                        style={{ maxWidth: 300, maxHeight: 300, borderRadius: 8 }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMostrarPreliminar(false)}>
                Volver
              </Button>
              <Button onClick={handleGuardarPago} disabled={loading}>
                {loading ? "Guardando..." : "Confirmar y Guardar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ModalDetalleCuentaPorPagar;

