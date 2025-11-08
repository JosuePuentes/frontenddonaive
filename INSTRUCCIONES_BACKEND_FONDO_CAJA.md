# INSTRUCCIONES BACKEND: Fondo de Caja y Reinicio al Cerrar

## ⚠️ IMPORTANTE
El frontend ahora envía información sobre el fondo de caja al crear un cuadre desde el punto de venta. El backend debe manejar este fondo correctamente y reiniciar la sesión del cajero cuando se cierra la caja.

---

## 📋 CAMPO NUEVO: `fondoCaja` en Cuadres

### Estructura del Campo

```json
{
  "fondoCaja": {
    "efectivoBs": 100000.00,
    "efectivoUsd": 100.00,
    "metodoPagoBs": "banco_id_1",  // Opcional: ID del banco usado para el fondo en Bs
    "metodoPagoUsd": "banco_id_2"   // Opcional: ID del banco usado para el fondo en USD
  }
}
```

### Cuándo se Envía

- Solo se envía cuando el cuadre se crea desde el punto de venta (`desde_punto_venta: true`)
- El fondo se registra al abrir la caja (seleccionar sucursal → cajero → fondo)
- El fondo se envía al cerrar la caja (crear el cuadre)

---

## ✅ IMPLEMENTACIÓN EN BACKEND

### 1. Actualizar Modelo de Cuadre

```python
# En tu modelo de cuadre, agregar:
fondoCaja: Optional[Dict] = None  # Opcional, solo para cuadres desde punto de venta
```

### 2. Modificar Endpoint POST /agg/cuadre/{farmacia}

```python
@router.post("/agg/cuadre/{farmacia}")
async def crear_cuadre(
    farmacia: str,
    cuadre_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    # ... código existente ...
    
    # Si viene desde punto de venta y tiene fondo de caja
    if cuadre_data.get("desde_punto_venta") and cuadre_data.get("fondoCaja"):
        fondoCaja = cuadre_data["fondoCaja"]
        
        # Guardar el fondo en el cuadre
        cuadre["fondoCaja"] = {
            "efectivoBs": float(fondoCaja.get("efectivoBs", 0)),
            "efectivoUsd": float(fondoCaja.get("efectivoUsd", 0)),
            "metodoPagoBs": fondoCaja.get("metodoPagoBs"),
            "metodoPagoUsd": fondoCaja.get("metodoPagoUsd")
        }
        
        # IMPORTANTE: El fondo NO debe afectar los totales de ventas
        # El frontend ya resta el fondo del totalGeneralUsd antes de enviarlo
        # El backend solo debe guardarlo para referencia
        
        # Si hay métodos de pago (bancos) para el fondo, actualizar sus saldos
        if fondoCaja.get("metodoPagoBs"):
            banco_id = fondoCaja["metodoPagoBs"]
            # Restar el fondo del saldo del banco (porque se sacó para el fondo)
            await db.bancos.update_one(
                {"_id": ObjectId(banco_id)},
                {"$inc": {"saldo": -float(fondoCaja.get("efectivoBs", 0))}}
            )
            # Registrar movimiento
            await db.bancos_movimientos.insert_one({
                "banco_id": ObjectId(banco_id),
                "tipo": "retiro",
                "monto": float(fondoCaja.get("efectivoBs", 0)),
                "divisa": "BS",
                "descripcion": f"Fondo de caja - {cuadre_data.get('cajero', 'N/A')}",
                "fecha": datetime.now()
            })
        
        if fondoCaja.get("metodoPagoUsd"):
            banco_id = fondoCaja["metodoPagoUsd"]
            # Restar el fondo del saldo del banco
            await db.bancos.update_one(
                {"_id": ObjectId(banco_id)},
                {"$inc": {"saldo": -float(fondoCaja.get("efectivoUsd", 0))}}
            )
            # Registrar movimiento
            await db.bancos_movimientos.insert_one({
                "banco_id": ObjectId(banco_id),
                "tipo": "retiro",
                "monto": float(fondoCaja.get("efectivoUsd", 0)),
                "divisa": "USD",
                "descripcion": f"Fondo de caja - {cuadre_data.get('cajero', 'N/A')}",
                "fecha": datetime.now()
            })
    
    # ... resto del código para guardar el cuadre ...
```

---

## 🔄 REINICIO AL CERRAR CAJA

### Comportamiento Esperado

Cuando se cierra la caja desde el punto de venta:

1. **El cuadre se guarda** con estado `"wait"` (pendiente de verificación)
2. **El fondo se resta de los bancos** (si se usaron bancos)
3. **La sesión del cajero se reinicia** (el frontend limpia el estado local)
4. **NO se guarda información persistente del cajero** en el backend para la próxima sesión

### Nota Importante

El backend **NO necesita** hacer nada especial para el reinicio. El frontend se encarga de:
- Limpiar el estado del cajero seleccionado
- Limpiar el fondo de caja
- Limpiar el carrito
- Volver a mostrar el modal de selección de sucursal

El backend solo debe:
- Guardar el cuadre con el fondo
- Actualizar los saldos de los bancos si se usaron
- Registrar los movimientos de bancos

---

## 📝 LÓGICA DEL FONDO

### Cálculo del Total

El frontend calcula el total así:

```javascript
// Fondo total en USD
fondoTotalUsd = fondoCaja.efectivoUsd + (fondoCaja.efectivoBs / tasa)

// Total general RESTANDO el fondo
totalGeneralUsd = totalBsEnUsd + efectivoUsd + zelleUsd - fondoTotalUsd
```

**IMPORTANTE:** El backend recibe `totalGeneralUsd` ya con el fondo restado. No debe volver a restarlo.

### Por qué se Resta el Fondo

El fondo de caja es dinero que se saca de los bancos (o se tiene en efectivo) para iniciar la operación del día. Este dinero:
- **NO es una venta** (no viene de clientes)
- **NO debe contar en los totales de ventas**
- **Solo debe estar disponible** para dar vuelto y operaciones del día

Por lo tanto, se resta del total para que solo cuenten las ventas reales.

---

## ✅ CHECKLIST

- [ ] Agregar campo `fondoCaja` al modelo de cuadre (opcional)
- [ ] Modificar `POST /agg/cuadre/{farmacia}` para aceptar `fondoCaja`
- [ ] Guardar `fondoCaja` en el cuadre cuando viene desde punto de venta
- [ ] Si `fondoCaja.metodoPagoBs` existe, restar `efectivoBs` del saldo del banco
- [ ] Si `fondoCaja.metodoPagoUsd` existe, restar `efectivoUsd` del saldo del banco
- [ ] Registrar movimientos en `bancos_movimientos` para cada banco usado
- [ ] **NO restar el fondo del `totalGeneralUsd`** (el frontend ya lo hace)
- [ ] El reinicio del cajero es responsabilidad del frontend (no requiere acción del backend)

---

## 📄 NOTA SOBRE REINICIO

El backend **NO necesita** implementar lógica de reinicio de sesión del cajero. El frontend maneja esto localmente:

1. Cuando se guarda el cuadre exitosamente, el frontend llama a `onCerrarCajaCompleto()`
2. Esta función limpia todos los estados locales (cajero, fondo, carrito, etc.)
3. Vuelve a mostrar el modal de selección de sucursal

El backend solo debe:
- Guardar el cuadre correctamente
- Actualizar los bancos si se usaron para el fondo
- Retornar éxito cuando se guarda el cuadre

---

## 🔍 VALIDACIÓN DEL FONDO

El backend puede validar (opcional):

1. Si `metodoPagoBs` existe, verificar que el banco tenga suficiente saldo
2. Si `metodoPagoUsd` existe, verificar que el banco tenga suficiente saldo
3. Verificar que los bancos existan y estén activos

Ejemplo de validación:

```python
if fondoCaja.get("metodoPagoBs"):
    banco = await db.bancos.find_one({"_id": ObjectId(fondoCaja["metodoPagoBs"])})
    if not banco:
        raise HTTPException(400, "Banco para fondo Bs no encontrado")
    if banco.get("saldo", 0) < float(fondoCaja.get("efectivoBs", 0)):
        raise HTTPException(400, "Saldo insuficiente en banco para fondo Bs")
```

---

## 📋 RESUMEN

1. **Fondo de Caja**: Se envía en `fondoCaja` cuando se crea un cuadre desde punto de venta
2. **Restar de Bancos**: Si se usaron bancos, restar el monto del saldo y registrar movimiento
3. **No Afectar Totales**: El frontend ya resta el fondo, el backend solo lo guarda
4. **Reinicio**: Es responsabilidad del frontend, el backend no necesita hacer nada especial

