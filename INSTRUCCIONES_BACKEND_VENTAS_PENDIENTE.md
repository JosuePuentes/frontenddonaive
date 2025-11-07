# INSTRUCCIONES BACKEND: Agregar Ventas al Pendiente de Cuadres

## Resumen
Cuando se confirma una venta desde el punto de venta (`POST /punto-venta/ventas`), el backend debe **actualizar o crear un cuadre con estado "wait"** para la sucursal correspondiente, agregando el total de la venta al campo "Pendiente" que se muestra en el resumen de farmacias.

---

## Contexto

El "Pendiente" en el resumen de farmacias se calcula sumando los montos de todos los cuadres con estado `"wait"` (pendiente de verificación) para cada sucursal.

La fórmula del pendiente es:
```javascript
totalPendiente = sumaUsd + (sumaBs / tasa)
```

Donde:
- `sumaUsd` = `efectivoUsd + zelleUsd`
- `sumaBs` = `recargaBs + pagomovilBs + efectivoBs + puntosVenta (puntoDebito + puntoCredito) - devolucionesBs`

---

## Endpoint: `POST /punto-venta/ventas`

### Modificación Requerida

Después de registrar la venta exitosamente, el backend debe:

1. **Obtener o crear el cuadre del día para la sucursal**
2. **Actualizar el cuadre agregando los métodos de pago de la venta**
3. **Asegurar que el cuadre tenga estado "wait" (pendiente)**

---

## Estructura de Datos del Cuadre

El cuadre debe tener la siguiente estructura:

```python
{
    "_id": ObjectId,
    "farmacia": ObjectId,  # ID de la sucursal
    "dia": "2025-01-15",   # Fecha en formato YYYY-MM-DD
    "estado": "wait",      # CRÍTICO: debe ser "wait" para aparecer en Pendiente
    "tasa": 120.00,        # Tasa del día
    "efectivoUsd": 0.0,    # Suma de ventas en efectivo USD
    "zelleUsd": 0.0,       # Suma de ventas en zelle USD
    "efectivoBs": 0.0,     # Suma de ventas en efectivo Bs
    "pagomovilBs": 0.0,    # Suma de ventas en pago móvil Bs
    "recargaBs": 0.0,      # Suma de recargas Bs
    "puntosVenta": [       # Array de puntos de venta
        {
            "puntoDebito": 0.0,   # Suma de ventas en punto débito
            "puntoCredito": 0.0   # Suma de ventas en punto crédito
        }
    ],
    "devolucionesBs": 0.0, # Devoluciones en Bs
    "valesUsd": 0.0        # Vales en USD
}
```

---

## Mapeo de Métodos de Pago a Campos del Cuadre

Cuando se recibe una venta con `metodos_pago`, mapear cada método a los campos correspondientes del cuadre:

| Método de Pago (tipo) | Divisa | Campo del Cuadre |
|----------------------|--------|------------------|
| `efectivo` | `USD` | `efectivoUsd` |
| `efectivo` | `Bs` | `efectivoBs` |
| `zelle` | `USD` | `zelleUsd` |
| `transferencia` | `Bs` | `pagomovilBs` |
| `tarjeta` | `Bs` | `puntosVenta[0].puntoDebito` o `puntosVenta[0].puntoCredito` (según tu lógica) |
| `tarjeta` | `USD` | Convertir a Bs usando tasa y agregar a `puntosVenta` |

**Nota:** Si no tien lógica para distinguir entre débito y crédito, puedes usar solo `puntoDebito` o crear ambos campos.

---

## Implementación en Python/FastAPI

```python
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient

async def actualizar_cuadre_con_venta(
    db: AsyncIOMotorClient,
    sucursal_id: str,
    metodos_pago: list,
    total_usd: float,
    total_bs: float,
    tasa_dia: float
):
    """
    Actualiza o crea un cuadre con estado 'wait' agregando los métodos de pago de la venta.
    """
    # Obtener la fecha actual en formato YYYY-MM-DD
    fecha_actual = datetime.now().strftime("%Y-%m-%d")
    sucursal_object_id = ObjectId(sucursal_id)
    
    # Buscar cuadre existente del día para esta sucursal
    cuadre_existente = await db.cuadres.find_one({
        "farmacia": sucursal_object_id,
        "dia": fecha_actual
    })
    
    # Inicializar contadores
    efectivo_usd = 0.0
    zelle_usd = 0.0
    efectivo_bs = 0.0
    pagomovil_bs = 0.0
    punto_debito = 0.0
    punto_credito = 0.0
    
    # Procesar cada método de pago
    for metodo in metodos_pago:
        tipo = metodo.get("tipo", "").lower()
        divisa = metodo.get("divisa", "").upper()
        monto = float(metodo.get("monto", 0))
        
        if tipo == "efectivo":
            if divisa == "USD":
                efectivo_usd += monto
            elif divisa == "BS":
                efectivo_bs += monto
        elif tipo == "zelle":
            if divisa == "USD":
                zelle_usd += monto
        elif tipo == "transferencia":
            if divisa == "BS":
                pagomovil_bs += monto
        elif tipo == "tarjeta":
            # Asumir que las tarjetas en USD se convierten a Bs
            if divisa == "USD":
                monto_bs = monto * tasa_dia
                punto_debito += monto_bs  # O punto_credito según tu lógica
            elif divisa == "BS":
                punto_debito += monto  # O punto_credito según tu lógica
    
    # Preparar datos del cuadre
    datos_cuadre = {
        "farmacia": sucursal_object_id,
        "dia": fecha_actual,
        "estado": "wait",  # CRÍTICO: debe ser "wait" para aparecer en Pendiente
        "tasa": tasa_dia,
        "efectivoUsd": efectivo_usd,
        "zelleUsd": zelle_usd,
        "efectivoBs": efectivo_bs,
        "pagomovilBs": pagomovil_bs,
        "recargaBs": 0.0,  # Si no hay recargas en esta venta
        "puntosVenta": [{
            "puntoDebito": punto_debito,
            "puntoCredito": punto_credito
        }],
        "devolucionesBs": 0.0,
        "valesUsd": 0.0
    }
    
    if cuadre_existente:
        # Actualizar cuadre existente: SUMAR los montos
        await db.cuadres.update_one(
            {
                "_id": cuadre_existente["_id"]
            },
            {
                "$inc": {
                    "efectivoUsd": efectivo_usd,
                    "zelleUsd": zelle_usd,
                    "efectivoBs": efectivo_bs,
                    "pagomovilBs": pagomovil_bs,
                    "puntosVenta.0.puntoDebito": punto_debito,
                    "puntosVenta.0.puntoCredito": punto_credito
                },
                "$set": {
                    "estado": "wait",  # Asegurar que esté en "wait"
                    "tasa": tasa_dia  # Actualizar tasa si cambió
                }
            }
        )
    else:
        # Crear nuevo cuadre
        await db.cuadres.insert_one(datos_cuadre)
```

---

## Integración en el Endpoint de Ventas

Modificar el endpoint `POST /punto-venta/ventas` para llamar a esta función después de registrar la venta:

```python
@router.post("/punto-venta/ventas")
async def crear_venta(
    venta_data: VentaData,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    try:
        # ... código existente para descontar stock y registrar venta ...
        
        # Después de registrar la venta exitosamente:
        resultado = await db.ventas.insert_one(venta_doc)
        
        # ✅ NUEVO: Actualizar cuadre con los métodos de pago de la venta
        await actualizar_cuadre_con_venta(
            db=db,
            sucursal_id=venta_data.sucursal,
            metodos_pago=venta_data.metodos_pago,
            total_usd=venta_data.total_usd,
            total_bs=venta_data.total_bs,
            tasa_dia=venta_data.tasa_dia
        )
        
        return {
            "_id": str(resultado.inserted_id),
            "numero_factura": venta_doc["numero_factura"],
            "mensaje": "Venta registrada exitosamente"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la venta: {str(e)}"
        )
```

---

## Consideraciones Importantes

### 1. Estado del Cuadre
- **CRÍTICO:** El cuadre DEBE tener `estado: "wait"` para que aparezca en el cálculo de "Pendiente"
- Si el cuadre ya existe y tiene otro estado, puedes decidir:
  - Opción A: Solo actualizar si el estado es "wait"
  - Opción B: Cambiar el estado a "wait" si se agrega una nueva venta

### 2. Suma de Montos
- Usar `$inc` (incrementar) en MongoDB para SUMAR los montos, no reemplazarlos
- Esto permite que múltiples ventas del mismo día se acumulen correctamente

### 3. Estructura de `puntosVenta`
- Si tu estructura actual de cuadres tiene `puntosVenta` como un array, asegúrate de actualizar el primer elemento `[0]`
- Si no existe el array, créalo con un objeto inicial

### 4. Conversión de Divisas
- Las tarjetas en USD deben convertirse a Bs usando la tasa del día antes de agregarse a `puntosVenta`
- O puedes decidir mantenerlas en USD si tu sistema lo permite

### 5. Validación
- Verificar que la sucursal existe antes de crear/actualizar el cuadre
- Manejar errores si el cuadre no se puede actualizar (no debe fallar la venta)

---

## Ejemplo de Flujo

1. **Venta 1:** $10 USD en efectivo
   - Cuadre creado: `efectivoUsd: 10.0`, `estado: "wait"`
   - Pendiente: $10 USD

2. **Venta 2:** $5 USD en zelle + 600 Bs en tarjeta (tasa: 120)
   - Cuadre actualizado: `efectivoUsd: 10.0`, `zelleUsd: 5.0`, `puntosVenta[0].puntoDebito: 600.0`
   - Pendiente: $15 USD + (600/120) = $20 USD

3. **Venta 3:** 1200 Bs en efectivo (tasa: 120)
   - Cuadre actualizado: `efectivoUsd: 10.0`, `zelleUsd: 5.0`, `efectivoBs: 1200.0`, `puntosVenta[0].puntoDebito: 600.0`
   - Pendiente: $15 USD + (1200/120) + (600/120) = $25 USD

---

## Checklist de Implementación

- [ ] Función `actualizar_cuadre_con_venta()` implementada
- [ ] Mapeo correcto de métodos de pago a campos del cuadre
- [ ] Uso de `$inc` para sumar montos (no reemplazar)
- [ ] Cuadre creado/actualizado con `estado: "wait"`
- [ ] Manejo de cuadres existentes (sumar) vs nuevos (crear)
- [ ] Conversión correcta de USD a Bs para tarjetas (si aplica)
- [ ] Validación de que la sucursal existe
- [ ] Manejo de errores sin afectar el registro de la venta
- [ ] Pruebas con múltiples ventas del mismo día
- [ ] Verificación de que el "Pendiente" se actualiza correctamente en el frontend

---

## Notas Adicionales

- Si tu sistema tiene una lógica diferente para manejar cuadres, adapta esta implementación a tu estructura
- Considera agregar logs para debugging: "Cuadre actualizado para sucursal X con venta de $Y"
- Si hay ventas que deben excluirse del pendiente (ej: ventas canceladas), agrega esa lógica

