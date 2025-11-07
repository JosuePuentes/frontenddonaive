import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface Sucursal {
  id: string;
  nombre: string;
}

interface Cajero {
  _id: string;
  ID?: string;
  NOMBRE: string;
  FARMACIAS?: Record<string, string>;
}

interface Lote {
  lote: string;
  fecha_vencimiento?: string;
  cantidad?: number;
}

interface StockPorSucursal {
  sucursal_id: string;
  sucursal_nombre: string;
  cantidad: number;
  stock?: number; // Alias para compatibilidad
}

interface Producto {
  id: string;
  nombre: string;
  codigo?: string;
  precio: number;
  precio_usd?: number;
  stock?: number;
  cantidad?: number; // Stock total en la sucursal actual (suma de lotes)
  lotes?: Lote[]; // Array de lotes con fechas de vencimiento
  sucursal?: string;
  stock_por_sucursal?: StockPorSucursal[]; // Stock en todas las sucursales
}

interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precio_unitario: number; // Precio en Bs (con descuento aplicado si hay cliente)
  precio_unitario_usd: number; // Precio en USD (con descuento aplicado si hay cliente)
  precio_unitario_original: number; // Precio original en Bs (sin descuento)
  precio_unitario_original_usd: number; // Precio original en USD (sin descuento)
  subtotal: number; // Subtotal en Bs (con descuento)
  subtotal_usd: number; // Subtotal en USD (con descuento)
  descuento_aplicado?: number; // Porcentaje de descuento aplicado
}

interface MetodoPago {
  tipo: "efectivo" | "tarjeta" | "transferencia" | "zelle";
  monto: number;
  divisa: "Bs" | "USD";
}

interface Cliente {
  _id?: string;
  id?: string;
  cedula: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
  porcentaje_descuento?: number;
}

const PuntoVentaPage: React.FC = () => {
  // Estados de configuración inicial
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [showSucursalModal, setShowSucursalModal] = useState(true);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState<Sucursal | null>(null);
  const [cajeros, setCajeros] = useState<Cajero[]>([]);
  const [cajeroSeleccionado, setCajeroSeleccionado] = useState<Cajero | null>(null);
  const [showCajeroModal, setShowCajeroModal] = useState(false);
  const [loadingCajeros, setLoadingCajeros] = useState(false);

  // Estados del POS
  const [tasaDelDia, setTasaDelDia] = useState<number>(0);
  const [tasaInput, setTasaInput] = useState<string>("");
  const [busquedaItem, setBusquedaItem] = useState("");
  const [productosEncontrados, setProductosEncontrados] = useState<Producto[]>([]);
  const [showCantidadModal, setShowCantidadModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadInput, setCantidadInput] = useState("1");
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [showPagoModal, setShowPagoModal] = useState(false);
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([]);
  const [metodoPagoActual, setMetodoPagoActual] = useState<{ tipo: string; divisa: string }>({ 
    tipo: "efectivo", 
    divisa: "USD" 
  });
  const [montoPago, setMontoPago] = useState("");
  const [productoConStockAbierto, setProductoConStockAbierto] = useState<string | null>(null);
  
  // Estados de clientes
  const [showClienteModal, setShowClienteModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [creandoCliente, setCreandoCliente] = useState(false);
  
  // Formulario de cliente
  const [cedulaCliente, setCedulaCliente] = useState("");
  const [nombreCliente, setNombreCliente] = useState("");
  const [direccionCliente, setDireccionCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [porcentajeDescuentoCliente, setPorcentajeDescuentoCliente] = useState("");

  // Obtener usuario actual
  const getUsuarioActual = () => {
    try {
      const usuarioRaw = localStorage.getItem("usuario");
      if (usuarioRaw) {
        return JSON.parse(usuarioRaw);
      }
    } catch (error) {
      console.error("Error al obtener usuario:", error);
    }
    return null;
  };

  // Cargar sucursales y tasa del día
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers: HeadersInit = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        // Cargar sucursales (farmacias)
        const resSucursales = await fetch(`${API_BASE_URL}/farmacias`, { headers });
        if (resSucursales.ok) {
          const dataSucursales = await resSucursales.json();
          const listaSucursales = dataSucursales.farmacias
            ? Object.entries(dataSucursales.farmacias).map(([id, nombre]) => ({
                id,
                nombre: String(nombre),
              }))
            : Object.entries(dataSucursales).map(([id, nombre]) => ({
                id,
                nombre: String(nombre),
              }));
          setSucursales(listaSucursales);
        }

        // Cargar tasa del día
        const hoy = new Date().toISOString().split('T')[0];
        const resTasa = await fetch(`${API_BASE_URL}/punto-venta/tasa-del-dia?fecha=${hoy}`, { headers });
        if (resTasa.ok) {
          const dataTasa = await resTasa.json();
          setTasaDelDia(dataTasa.tasa || 0);
          setTasaInput(dataTasa.tasa?.toString() || "");
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      }
    };
    fetchData();
  }, []);

  // Búsqueda de productos en tiempo real con debounce
  useEffect(() => {
    if (busquedaItem.length >= 2 && sucursalSeleccionada) {
      const timeoutId = setTimeout(async () => {
        try {
          const token = localStorage.getItem("token");
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          const res = await fetch(
            `${API_BASE_URL}/punto-venta/productos/buscar?q=${encodeURIComponent(busquedaItem)}&sucursal=${sucursalSeleccionada.id}`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            setProductosEncontrados(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Error al buscar productos:", error);
          setProductosEncontrados([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setProductosEncontrados([]);
    }
  }, [busquedaItem, sucursalSeleccionada]);

  // Cerrar dropdown de stock al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.stock-dropdown-container')) {
        setProductoConStockAbierto(null);
      }
    };

    if (productoConStockAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [productoConStockAbierto]);

  // Búsqueda de clientes en tiempo real con debounce
  useEffect(() => {
    if (busquedaCliente.length >= 2) {
      const timeoutId = setTimeout(async () => {
        try {
          const token = localStorage.getItem("token");
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          const res = await fetch(
            `${API_BASE_URL}/clientes/buscar?q=${encodeURIComponent(busquedaCliente)}`,
            { headers }
          );
          if (res.ok) {
            const data = await res.json();
            setClientesEncontrados(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Error al buscar clientes:", error);
          setClientesEncontrados([]);
        }
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setClientesEncontrados([]);
    }
  }, [busquedaCliente]);

  // Cargar cajeros cuando se selecciona una sucursal
  useEffect(() => {
    if (sucursalSeleccionada && !showSucursalModal) {
      const fetchCajeros = async () => {
        setLoadingCajeros(true);
        try {
          const token = localStorage.getItem("token");
          const headers: HeadersInit = {};
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          
          const res = await fetch(`${API_BASE_URL}/cajeros`, { headers });
          if (res.ok) {
            const data = await res.json();
            // Transformar los datos al formato esperado
            const cajerosTransformados: Cajero[] = Array.isArray(data)
              ? data.map((cajero: any) => ({
                  _id: cajero._id || cajero.id,
                  ID: cajero.ID || cajero.id,
                  NOMBRE: cajero.NOMBRE || cajero.nombre,
                  FARMACIAS: cajero.FARMACIAS || cajero.farmacias || {},
                }))
              : [];
            setCajeros(cajerosTransformados);
            setShowCajeroModal(true);
          }
        } catch (error) {
          console.error("Error al cargar cajeros:", error);
          setCajeros([]);
        } finally {
          setLoadingCajeros(false);
        }
      };
      fetchCajeros();
    }
  }, [sucursalSeleccionada, showSucursalModal]);

  const handleSeleccionarSucursal = (sucursal: Sucursal) => {
    setSucursalSeleccionada(sucursal);
    setShowSucursalModal(false);
  };

  const handleSeleccionarCajero = (cajero: Cajero) => {
    setCajeroSeleccionado(cajero);
    setShowCajeroModal(false);
  };

  const handleSeleccionarProducto = (producto: Producto) => {
    setProductoSeleccionado(producto);
    setCantidadInput("1");
    setShowCantidadModal(true);
    setBusquedaItem("");
    setProductosEncontrados([]);
  };

  // Función para calcular precio con descuento
  const calcularPrecioConDescuento = (precioOriginal: number, porcentajeDescuento?: number): number => {
    if (!porcentajeDescuento || porcentajeDescuento <= 0) {
      return precioOriginal;
    }
    const descuento = precioOriginal * (porcentajeDescuento / 100);
    return precioOriginal - descuento;
  };

  const handleAgregarAlCarrito = () => {
    if (!productoSeleccionado || !cantidadInput || parseFloat(cantidadInput) <= 0) {
      return;
    }

    const cantidad = parseFloat(cantidadInput);
    // El precio del producto viene en USD, calcular precio en Bs
    const precioUnitarioOriginalUSD = productoSeleccionado.precio_usd || productoSeleccionado.precio;
    const precioUnitarioOriginalBs = precioUnitarioOriginalUSD * tasaDelDia;
    
    // Aplicar descuento del cliente si existe
    const porcentajeDescuento = clienteSeleccionado?.porcentaje_descuento || 0;
    const precioUnitarioUSD = calcularPrecioConDescuento(precioUnitarioOriginalUSD, porcentajeDescuento);
    const precioUnitarioBs = calcularPrecioConDescuento(precioUnitarioOriginalBs, porcentajeDescuento);
    
    const subtotalUSD = precioUnitarioUSD * cantidad;
    const subtotalBs = precioUnitarioBs * cantidad;

    const nuevoItem: ItemCarrito = {
      producto: productoSeleccionado,
      cantidad,
      precio_unitario: precioUnitarioBs,
      precio_unitario_usd: precioUnitarioUSD,
      precio_unitario_original: precioUnitarioOriginalBs,
      precio_unitario_original_usd: precioUnitarioOriginalUSD,
      subtotal: subtotalBs,
      subtotal_usd: subtotalUSD,
      descuento_aplicado: porcentajeDescuento > 0 ? porcentajeDescuento : undefined,
    };

    // Verificar si el producto ya está en el carrito
    const itemExistente = carrito.find(
      (item) => item.producto.id === productoSeleccionado.id
    );

    if (itemExistente) {
      setCarrito(
        carrito.map((item) =>
          item.producto.id === productoSeleccionado.id
            ? {
                ...item,
                cantidad: item.cantidad + cantidad,
                precio_unitario: precioUnitarioBs,
                precio_unitario_usd: precioUnitarioUSD,
                precio_unitario_original: precioUnitarioOriginalBs,
                precio_unitario_original_usd: precioUnitarioOriginalUSD,
                subtotal: (item.cantidad + cantidad) * precioUnitarioBs,
                subtotal_usd: (item.cantidad + cantidad) * precioUnitarioUSD,
                descuento_aplicado: porcentajeDescuento > 0 ? porcentajeDescuento : undefined,
              }
            : item
        )
      );
    } else {
      setCarrito([...carrito, nuevoItem]);
    }

    setShowCantidadModal(false);
    setProductoSeleccionado(null);
    setCantidadInput("1");
  };

  const handleEliminarItem = (index: number) => {
    setCarrito(carrito.filter((_, i) => i !== index));
  };

  const handleActualizarCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      handleEliminarItem(index);
      return;
    }
    setCarrito(
      carrito.map((it, i) =>
        i === index
          ? {
              ...it,
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * it.precio_unitario,
              subtotal_usd: nuevaCantidad * it.precio_unitario_usd,
            }
          : it
      )
    );
  };

  // Recalcular precios del carrito cuando se selecciona o cambia un cliente
  useEffect(() => {
    if (carrito.length === 0) return;
    
    const porcentajeDescuento = clienteSeleccionado?.porcentaje_descuento || 0;
    
    setCarrito(
      carrito.map((item) => {
        const precioOriginalUSD = item.precio_unitario_original_usd || item.precio_unitario_usd;
        const precioOriginalBs = item.precio_unitario_original || (precioOriginalUSD * tasaDelDia);
        
        const precioConDescuentoUSD = calcularPrecioConDescuento(precioOriginalUSD, porcentajeDescuento);
        const precioConDescuentoBs = calcularPrecioConDescuento(precioOriginalBs, porcentajeDescuento);
        
        return {
          ...item,
          precio_unitario: precioConDescuentoBs,
          precio_unitario_usd: precioConDescuentoUSD,
          precio_unitario_original: precioOriginalBs,
          precio_unitario_original_usd: precioOriginalUSD,
          subtotal: item.cantidad * precioConDescuentoBs,
          subtotal_usd: item.cantidad * precioConDescuentoUSD,
          descuento_aplicado: porcentajeDescuento > 0 ? porcentajeDescuento : undefined,
        };
      })
    );
  }, [clienteSeleccionado?.porcentaje_descuento]);

  const calcularTotalBs = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal, 0);
  };

  const calcularTotalUsd = () => {
    return carrito.reduce((sum, item) => sum + item.subtotal_usd, 0);
  };

  const handleTotalizar = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    setMetodosPago([]);
    setMetodoPagoActual({ tipo: "efectivo", divisa: "USD" });
    setMontoPago("");
    setShowPagoModal(true);
  };

  const handleAgregarMetodoPago = () => {
    const monto = parseFloat(montoPago);
    if (isNaN(monto) || monto <= 0) {
      alert("Ingrese un monto válido");
      return;
    }

    const nuevoMetodo: MetodoPago = {
      tipo: metodoPagoActual.tipo as any,
      monto,
      divisa: metodoPagoActual.divisa as "Bs" | "USD",
    };

    setMetodosPago([...metodosPago, nuevoMetodo]);
    setMontoPago("");
  };

  // Calcular total pagado en USD (convertir Bs a USD si es necesario)
  const calcularTotalPagadoUsd = () => {
    return metodosPago.reduce((sum, metodo) => {
      if (metodo.divisa === "USD") {
        return sum + metodo.monto;
      } else {
        // Convertir Bs a USD
        return sum + metodo.monto / tasaDelDia;
      }
    }, 0);
  };

  // Calcular total pagado en Bs
  const calcularTotalPagadoBs = () => {
    return metodosPago.reduce((sum, metodo) => {
      if (metodo.divisa === "Bs") {
        return sum + metodo.monto;
      } else {
        // Convertir USD a Bs
        return sum + metodo.monto * tasaDelDia;
      }
    }, 0);
  };

  const calcularVuelto = () => {
    const totalUsd = calcularTotalUsd();
    const pagadoUsd = calcularTotalPagadoUsd();
    return Math.max(0, pagadoUsd - totalUsd);
  };

  const puedeConfirmar = () => {
    const totalUsd = calcularTotalUsd();
    const pagadoUsd = calcularTotalPagadoUsd();
    // Tolerancia de 0.01 según el backend
    return pagadoUsd >= totalUsd - 0.01;
  };

  const handleActualizarTasa = () => {
    const nuevaTasa = parseFloat(tasaInput);
    if (nuevaTasa > 0) {
      setTasaDelDia(nuevaTasa);
      const porcentajeDescuento = clienteSeleccionado?.porcentaje_descuento || 0;
      
      // Recalcular subtotales en Bs con descuento aplicado
      setCarrito(
        carrito.map((item) => {
          const precioOriginalUSD = item.precio_unitario_original_usd || item.precio_unitario_usd;
          const precioOriginalBs = precioOriginalUSD * nuevaTasa;
          const precioConDescuentoUSD = calcularPrecioConDescuento(precioOriginalUSD, porcentajeDescuento);
          const precioConDescuentoBs = calcularPrecioConDescuento(precioOriginalBs, porcentajeDescuento);
          
          return {
            ...item,
            precio_unitario: precioConDescuentoBs,
            precio_unitario_usd: precioConDescuentoUSD,
            precio_unitario_original: precioOriginalBs,
            precio_unitario_original_usd: precioOriginalUSD,
            subtotal: item.cantidad * precioConDescuentoBs,
            subtotal_usd: item.cantidad * precioConDescuentoUSD,
            descuento_aplicado: porcentajeDescuento > 0 ? porcentajeDescuento : undefined,
          };
        })
      );
    } else {
      alert("Ingrese una tasa válida mayor a 0");
    }
  };

  const handleCrearCliente = async () => {
    if (!cedulaCliente.trim() || !nombreCliente.trim()) {
      alert("La cédula y el nombre son requeridos");
      return;
    }

    setCreandoCliente(true);
    try {
      const token = localStorage.getItem("token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const clienteData = {
        cedula: cedulaCliente.trim(),
        nombre: nombreCliente.trim(),
        direccion: direccionCliente.trim() || undefined,
        telefono: telefonoCliente.trim() || undefined,
      };

      const res = await fetch(`${API_BASE_URL}/clientes`, {
        method: "POST",
        headers,
        body: JSON.stringify(clienteData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Error al crear cliente" }));
        throw new Error(errorData.detail || "Error al crear cliente");
      }

      const nuevoCliente = await res.json();
      setClienteSeleccionado(nuevoCliente);
      setShowClienteModal(false);
      setCedulaCliente("");
      setNombreCliente("");
      setDireccionCliente("");
      setTelefonoCliente("");
      setPorcentajeDescuentoCliente("");
      alert("Cliente creado exitosamente");
    } catch (error: any) {
      console.error("Error al crear cliente:", error);
      alert(error.message || "Error al crear cliente. Por favor, intente nuevamente.");
    } finally {
      setCreandoCliente(false);
    }
  };

  const handleSeleccionarCliente = (cliente: Cliente) => {
    setClienteSeleccionado(cliente);
    setBusquedaCliente("");
    setClientesEncontrados([]);
  };

  const handleLimpiarCliente = () => {
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setClientesEncontrados([]);
  };

  const handleConfirmarVenta = async () => {
    if (!puedeConfirmar()) {
      alert("El monto pagado debe ser igual o mayor al total");
      return;
    }

    if (!sucursalSeleccionada || !cajeroSeleccionado) {
      alert("Debe seleccionar una sucursal y un cajero");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const usuario = getUsuarioActual();
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const totalUsd = calcularTotalUsd();
      const totalBs = calcularTotalBs();

      // Formatear items según el backend
      const items = carrito.map((item) => ({
        producto_id: item.producto.id,
        nombre: item.producto.nombre,
        codigo: item.producto.codigo || "",
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_unitario_usd: item.precio_unitario_usd,
        precio_unitario_original: item.precio_unitario_original || item.precio_unitario,
        precio_unitario_original_usd: item.precio_unitario_original_usd || item.precio_unitario_usd,
        subtotal: item.subtotal,
        subtotal_usd: item.subtotal_usd,
        descuento_aplicado: item.descuento_aplicado || 0,
      }));

      // Formatear métodos de pago según el backend
      const metodosPagoFormateados = metodosPago.map((metodo) => ({
        tipo: metodo.tipo,
        monto: metodo.monto,
        divisa: metodo.divisa,
      }));

      const ventaData = {
        items,
        metodos_pago: metodosPagoFormateados,
        total_bs: totalBs,
        total_usd: totalUsd,
        tasa_dia: tasaDelDia,
        sucursal: sucursalSeleccionada.id,
        cajero: usuario?.correo || cajeroSeleccionado.NOMBRE,
        cliente: clienteSeleccionado?._id || clienteSeleccionado?.id || "",
        porcentaje_descuento: clienteSeleccionado?.porcentaje_descuento || 0,
        notas: "",
      };

      const res = await fetch(`${API_BASE_URL}/punto-venta/ventas`, {
        method: "POST",
        headers,
        body: JSON.stringify(ventaData),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: "Error al registrar la venta" }));
        throw new Error(errorData.detail || "Error al registrar la venta");
      }

      const data = await res.json();
      alert(`Venta registrada exitosamente. Número de factura: ${data.numero_factura || data._id}`);
      
      // Limpiar carrito y reiniciar
      setCarrito([]);
      setMetodosPago([]);
      setShowPagoModal(false);
      
      // Imprimir factura
      if (data.numero_factura) {
        window.print();
      }
    } catch (error: any) {
      console.error("Error al confirmar venta:", error);
      alert(error.message || "Error al registrar la venta. Por favor, intente nuevamente.");
    }
  };

  // Si no hay sucursal o cajero seleccionado, mostrar modales
  if (!sucursalSeleccionada || !cajeroSeleccionado) {
    return (
      <>
        {/* Modal de selección de sucursal */}
        <Dialog 
          open={showSucursalModal} 
          onOpenChange={(open) => {
            // No permitir cerrar el modal sin seleccionar una sucursal
            if (!open && !sucursalSeleccionada) {
              return;
            }
            setShowSucursalModal(open);
          }}
        >
          <DialogContent 
            onInteractOutside={(e) => {
              // Prevenir cerrar al hacer clic fuera
              e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              // Prevenir cerrar con ESC
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Seleccionar Sucursal</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {sucursales.map((sucursal) => (
                <button
                  key={sucursal.id}
                  onClick={() => handleSeleccionarSucursal(sucursal)}
                  className="w-full text-left p-4 rounded-lg border hover:bg-blue-50 transition-colors"
                >
                  <div className="font-semibold">{sucursal.nombre}</div>
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Modal de selección de cajero */}
        <Dialog 
          open={showCajeroModal} 
          onOpenChange={(open) => {
            // No permitir cerrar el modal sin seleccionar un cajero
            if (!open && !cajeroSeleccionado) {
              return;
            }
            setShowCajeroModal(open);
          }}
        >
          <DialogContent
            onInteractOutside={(e) => {
              // Prevenir cerrar al hacer clic fuera
              e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
              // Prevenir cerrar con ESC
              e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Seleccionar Cajero</DialogTitle>
            </DialogHeader>
            {loadingCajeros ? (
              <div className="flex justify-center items-center py-8">
                <div className="text-gray-600">Cargando cajeros...</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {cajeros.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    No hay cajeros disponibles
                  </div>
                ) : (
                  cajeros.map((cajero) => (
                    <button
                      key={cajero._id}
                      onClick={() => handleSeleccionarCajero(cajero)}
                      className="w-full text-left p-4 rounded-lg border hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-semibold">{cajero.NOMBRE}</div>
                      {cajero.ID && (
                        <div className="text-sm text-gray-500">ID: {cajero.ID}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowCajeroModal(false);
                  setShowSucursalModal(true);
                  setSucursalSeleccionada(null);
                  setCajeroSeleccionado(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Volver
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Punto de Venta</h1>
            <div className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">Sucursal:</span> {sucursalSeleccionada.nombre}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">Cajero:</span> {cajeroSeleccionado.NOMBRE}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Tasa del día:</span>{" "}
              {tasaDelDia.toLocaleString("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/USD
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Tasa Bs/USD"
                value={tasaInput}
                onChange={(e) => setTasaInput(e.target.value)}
                className="w-32"
                step="0.01"
                min="0"
              />
              <Button onClick={handleActualizarTasa} size="sm">
                Actualizar
              </Button>
            </div>
          </div>
        </div>
        
        {/* Sección de Cliente - Parte superior central */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-4 justify-center">
            <Button
              onClick={() => setShowClienteModal(true)}
              className="flex items-center gap-2"
            >
              <span>+</span> Crear Cliente
            </Button>
            
            <div className="flex-1 max-w-md relative">
              <Input
                type="text"
                placeholder="Buscar cliente por cédula o nombre..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
                className="w-full"
              />
              {clientesEncontrados.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {clientesEncontrados.map((cliente) => (
                    <button
                      key={cliente._id || cliente.id}
                      onClick={() => handleSeleccionarCliente(cliente)}
                      className="w-full text-left p-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-semibold">{cliente.nombre}</div>
                      <div className="text-sm text-gray-600">
                        Cédula: {cliente.cedula}
                        {cliente.telefono && ` | Tel: ${cliente.telefono}`}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {clienteSeleccionado && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-blue-900">{clienteSeleccionado.nombre}</div>
                  <div className="text-xs text-blue-700">Cédula: {clienteSeleccionado.cedula}</div>
                  {clienteSeleccionado.porcentaje_descuento && clienteSeleccionado.porcentaje_descuento > 0 && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                        Descuento: {clienteSeleccionado.porcentaje_descuento}% ACTIVO
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleLimpiarCliente}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  ×
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Panel izquierdo: Búsqueda y carrito */}
        <div className="lg:col-span-2 space-y-4">
          {/* Búsqueda de productos */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Buscar Producto</h2>
            <Input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={busquedaItem}
              onChange={(e) => setBusquedaItem(e.target.value)}
              className="w-full"
            />
            {productosEncontrados.length > 0 && (
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {productosEncontrados.map((producto) => {
                  const stock = producto.cantidad ?? producto.stock ?? 0;
                  const precio = producto.precio_usd || producto.precio;
                  const tieneStock = stock > 0;
                  const mostrarStock = productoConStockAbierto === producto.id;
                  
                  // Obtener el primer lote para mostrar al lado de la descripción
                  const primerLote = producto.lotes && producto.lotes.length > 0 ? producto.lotes[0] : null;
                  const fechaVencPrimerLote = primerLote?.fecha_vencimiento 
                    ? new Date(primerLote.fecha_vencimiento).toLocaleDateString('es-VE')
                    : null;
                  const hoy = new Date();
                  const fechaVencDate = primerLote?.fecha_vencimiento 
                    ? new Date(primerLote.fecha_vencimiento)
                    : null;
                  const estaVencido = fechaVencDate && fechaVencDate < hoy;
                  const estaPorVencer = fechaVencDate && fechaVencDate >= hoy && fechaVencDate <= new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);
                  
                  return (
                    <div
                      key={producto.id}
                      className="w-full p-3 rounded-lg border hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <button
                          onClick={() => handleSeleccionarProducto(producto)}
                          className="flex-1 text-left"
                        >
                          <div className="font-semibold">{producto.nombre}</div>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            {producto.codigo && (
                              <div className="text-xs text-gray-500">Código: {producto.codigo}</div>
                            )}
                            {primerLote && (
                              <>
                                <div className="text-xs text-gray-600">
                                  Lote: <span className="font-medium">{primerLote.lote || '-'}</span>
                                </div>
                                {fechaVencPrimerLote && (
                                  <div className={`text-xs font-medium ${
                                    estaVencido 
                                      ? 'text-red-600' 
                                      : estaPorVencer 
                                      ? 'text-orange-600' 
                                      : 'text-gray-600'
                                  }`}>
                                    Vence: {fechaVencPrimerLote}
                                    {estaVencido && ' (VENCIDO)'}
                                    {estaPorVencer && !estaVencido && ' (Por vencer)'}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          {/* Precio */}
                          <div className={`text-right font-semibold ${tieneStock ? 'text-green-600' : 'text-red-600'}`}>
                            ${precio.toFixed(2)}
                          </div>
                          {/* Stock con dropdown */}
                          <div className="relative stock-dropdown-container">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setProductoConStockAbierto(
                                  productoConStockAbierto === producto.id ? null : producto.id
                                );
                              }}
                              className={`px-2 py-1 rounded text-sm font-medium ${
                                tieneStock 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                            >
                              Stock: {stock}
                            </button>
                            {/* Dropdown de stock por sucursal */}
                            {mostrarStock && (
                              <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                                <div className="p-3">
                                  <div className="text-sm font-semibold text-gray-700 mb-3">
                                    Stock por Sucursal:
                                  </div>
                                  {producto.stock_por_sucursal && producto.stock_por_sucursal.length > 0 ? (
                                    <div className="space-y-2">
                                      {producto.stock_por_sucursal.map((stockSucursal, index) => {
                                        const stockSuc = stockSucursal.cantidad ?? stockSucursal.stock ?? 0;
                                        const esSucursalActual = stockSucursal.sucursal_id === sucursalSeleccionada?.id;
                                        
                                        return (
                                          <div
                                            key={index}
                                            className={`p-2 rounded text-sm border ${
                                              esSucursalActual
                                                ? 'bg-blue-50 border-blue-200'
                                                : stockSuc > 0
                                                ? 'bg-green-50 border-green-200'
                                                : 'bg-red-50 border-red-200'
                                            }`}
                                          >
                                            <div className="flex justify-between items-center">
                                              <div className="font-medium text-gray-800">
                                                {stockSucursal.sucursal_nombre}
                                                {esSucursalActual && (
                                                  <span className="ml-2 text-xs text-blue-600 font-semibold">
                                                    (Actual)
                                                  </span>
                                                )}
                                              </div>
                                              <div className={`font-semibold ${
                                                stockSuc > 0 ? 'text-green-700' : 'text-red-700'
                                              }`}>
                                                {stockSuc}
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="text-sm text-gray-500 py-2">
                                      No hay información de stock en otras sucursales
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Carrito */}
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Carrito de Compras</h2>
            {carrito.length === 0 ? (
              <div className="text-center text-gray-500 py-8">El carrito está vacío</div>
            ) : (
              <div className="space-y-2">
                {carrito.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-semibold">{item.producto.nombre}</div>
                      <div className="text-sm text-gray-600">
                        {item.descuento_aplicado ? (
                          <>
                            <span className="line-through text-gray-400">
                              ${item.precio_unitario_original_usd?.toFixed(2) || item.precio_unitario_usd.toFixed(2)} USD
                            </span>
                            {" "}
                            <span className="text-green-600 font-semibold">
                              ${item.precio_unitario_usd.toFixed(2)} USD
                            </span>
                            {" "}
                            <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                              -{item.descuento_aplicado}%
                            </span>
                          </>
                        ) : (
                          <>${item.precio_unitario_usd.toFixed(2)} USD</>
                        )}
                        {" x "}{item.cantidad}
                        {tasaDelDia > 0 && (
                          <>
                            {" = "}
                            {item.descuento_aplicado ? (
                              <>
                                <span className="line-through text-gray-400">
                                  {item.precio_unitario_original?.toLocaleString("es-VE", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} Bs
                                </span>
                                {" "}
                                <span className="text-green-600 font-semibold">
                                  {item.precio_unitario.toLocaleString("es-VE", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })} Bs
                                </span>
                              </>
                            ) : (
                              <>
                                {item.precio_unitario.toLocaleString("es-VE", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })} Bs
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          handleActualizarCantidad(index, parseFloat(e.target.value) || 1)
                        }
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <div className="text-right min-w-[140px]">
                        <div className="font-semibold">${item.subtotal_usd.toFixed(2)} USD</div>
                        {tasaDelDia > 0 && (
                          <div className="text-sm text-gray-600">
                            {item.subtotal.toLocaleString("es-VE", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            Bs
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleEliminarItem(index)}
                        variant="destructive"
                        size="sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Panel derecho: Resumen y totalizar */}
        <div className="lg:col-span-1">
          <Card className="p-4 sticky top-4">
            <h2 className="text-lg font-semibold mb-4">Resumen</h2>
            {clienteSeleccionado?.porcentaje_descuento && clienteSeleccionado.porcentaje_descuento > 0 && (
              <div className="bg-green-50 border border-green-200 rounded p-2 mb-3">
                <div className="text-sm text-green-700 font-semibold">
                  Descuento aplicado: {clienteSeleccionado.porcentaje_descuento}%
                </div>
                <div className="text-xs text-green-600">
                  Cliente: {clienteSeleccionado.nombre}
                </div>
              </div>
            )}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Total (USD):</span>
                <span className="font-semibold">${calcularTotalUsd().toFixed(2)}</span>
              </div>
              {tasaDelDia > 0 && (
                <div className="flex justify-between">
                  <span>Total (Bs):</span>
                  <span className="font-semibold">
                    {calcularTotalBs().toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Bs
                  </span>
                </div>
              )}
            </div>
            <Button onClick={handleTotalizar} className="w-full" size="lg" disabled={carrito.length === 0}>
              Totalizar
            </Button>
          </Card>
        </div>
      </div>

      {/* Modal de cantidad */}
      <Dialog open={showCantidadModal} onOpenChange={setShowCantidadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ingresar Cantidad</DialogTitle>
          </DialogHeader>
          {productoSeleccionado && (
            <div className="space-y-4">
              <div>
                <div className="font-semibold">{productoSeleccionado.nombre}</div>
                <div className="text-sm text-gray-600">
                  Precio: ${(productoSeleccionado.precio_usd || productoSeleccionado.precio).toFixed(2)} USD
                  {tasaDelDia > 0 && (
                    <> = {((productoSeleccionado.precio_usd || productoSeleccionado.precio) * tasaDelDia).toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} Bs</>
                  )}
                </div>
                {productoSeleccionado.stock !== undefined && (
                  <div className="text-sm text-gray-500">Stock disponible: {productoSeleccionado.stock}</div>
                )}
              </div>
              <Input
                type="number"
                min="1"
                value={cantidadInput}
                onChange={(e) => setCantidadInput(e.target.value)}
                placeholder="Cantidad"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAgregarAlCarrito();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button onClick={handleAgregarAlCarrito} className="flex-1">
                  Agregar
                </Button>
                <Button onClick={() => setShowCantidadModal(false)} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de pago */}
      <Dialog open={showPagoModal} onOpenChange={setShowPagoModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Métodos de Pago</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Total a pagar (USD):</span>
                <span className="font-bold text-lg">${calcularTotalUsd().toFixed(2)}</span>
              </div>
              {tasaDelDia > 0 && (
                <div className="flex justify-between">
                  <span>Total a pagar (Bs):</span>
                  <span className="font-bold">
                    {calcularTotalBs().toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Bs
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Método de Pago</label>
                <select
                  value={metodoPagoActual.tipo}
                  onChange={(e) =>
                    setMetodoPagoActual({ ...metodoPagoActual, tipo: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="zelle">Zelle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Divisa</label>
                <select
                  value={metodoPagoActual.divisa}
                  onChange={(e) =>
                    setMetodoPagoActual({ ...metodoPagoActual, divisa: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="USD">USD</option>
                  <option value="Bs">Bs</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Monto</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={montoPago}
                onChange={(e) => setMontoPago(e.target.value)}
                placeholder="Ingrese el monto"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAgregarMetodoPago();
                  }
                }}
              />
            </div>

            <Button onClick={handleAgregarMetodoPago} className="w-full">
              Agregar Método de Pago
            </Button>

            {metodosPago.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Métodos de Pago Agregados:</h3>
                <div className="space-y-2">
                  {metodosPago.map((metodo, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span>
                        {metodo.tipo} ({metodo.divisa}): {metodo.monto.toFixed(2)} {metodo.divisa}
                      </span>
                      <Button
                        onClick={() =>
                          setMetodosPago(metodosPago.filter((_, i) => i !== index))
                        }
                        variant="destructive"
                        size="sm"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Total pagado (USD):</span>
                <span className="font-semibold">${calcularTotalPagadoUsd().toFixed(2)}</span>
              </div>
              {tasaDelDia > 0 && (
                <div className="flex justify-between mb-2">
                  <span>Total pagado (Bs):</span>
                  <span className="font-semibold">
                    {calcularTotalPagadoBs().toLocaleString("es-VE", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    Bs
                  </span>
                </div>
              )}
              {calcularVuelto() > 0 && (
                <div className="flex justify-between text-green-600 mt-2">
                  <span>Vuelto (USD):</span>
                  <span className="font-bold">${calcularVuelto().toFixed(2)}</span>
                </div>
              )}
              {calcularTotalPagadoUsd() < calcularTotalUsd() && (
                <div className="flex justify-between text-red-600 mt-2">
                  <span>Falta por pagar (USD):</span>
                  <span className="font-bold">
                    ${(calcularTotalUsd() - calcularTotalPagadoUsd()).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleConfirmarVenta}
                className="flex-1"
                disabled={!puedeConfirmar()}
              >
                Confirmar e Imprimir Factura
              </Button>
              <Button
                onClick={() => setShowPagoModal(false)}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Crear Cliente */}
      <Dialog open={showClienteModal} onOpenChange={setShowClienteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cédula *</label>
              <Input
                type="text"
                value={cedulaCliente}
                onChange={(e) => setCedulaCliente(e.target.value)}
                placeholder="Ingrese la cédula"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <Input
                type="text"
                value={nombreCliente}
                onChange={(e) => setNombreCliente(e.target.value)}
                placeholder="Ingrese el nombre completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <Input
                type="text"
                value={direccionCliente}
                onChange={(e) => setDireccionCliente(e.target.value)}
                placeholder="Ingrese la dirección"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número de Teléfono</label>
              <Input
                type="text"
                value={telefonoCliente}
                onChange={(e) => setTelefonoCliente(e.target.value)}
                placeholder="Ingrese el número de teléfono"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Porcentaje de Descuento (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={porcentajeDescuentoCliente}
                onChange={(e) => setPorcentajeDescuentoCliente(e.target.value)}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500 mt-1">
                Ingrese el porcentaje de descuento que aplicará a este cliente (0-100)
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCrearCliente}
                className="flex-1"
                disabled={creandoCliente || !cedulaCliente.trim() || !nombreCliente.trim()}
              >
                {creandoCliente ? "Creando..." : "Crear Cliente"}
              </Button>
              <Button
                onClick={() => {
                  setShowClienteModal(false);
                  setCedulaCliente("");
                  setNombreCliente("");
                  setDireccionCliente("");
                  setTelefonoCliente("");
                  setPorcentajeDescuentoCliente("");
                }}
                variant="outline"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PuntoVentaPage;
