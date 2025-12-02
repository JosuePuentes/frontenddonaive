# Instrucciones Backend: Poblar Pagos en GET /compras

## ⚠️ PROBLEMA ACTUAL

El frontend está recibiendo compras con `monto_abonado: 0` y `pagos: []` incluso después de registrar pagos. Esto hace que:

1. Los montos abonados no se muestren en la tabla
2. El estado no cambie de "Sin Pago" a "Abonado" o "Pagada"
3. Los montos restantes no se actualicen

## ✅ SOLUCIÓN REQUERIDA

### Endpoint: `GET /compras`

El backend debe **poblar** (populate) el array `pagos` y calcular `monto_abonado` y `monto_restante` para cada compra.

**Respuesta esperada:**
```json
[
  {
    "_id": "692b87bab007a7d0121981ed",
    "proveedor_id": "6929e7d327b70cb1aa01dd55",
    "proveedor": {
      "_id": "6929e7d327b70cb1aa01dd55",
      "nombre": "Prueba",
      "dias_credito": 30,
      "descuento_comercial": 5,
      "descuento_pronto_pago": 3
    },
    "total_precio_venta": 44.82,
    "total": 44.82,
    "pagos": [
      {
        "_id": "pago_id_1",
        "monto": 20.00,
        "fecha_pago": "2024-11-30",
        "metodo_pago": "transferencia",
        "banco_id": "banco_id",
        "referencia": "TRF-123",
        "comprobante": "comprobante.jpg"
      }
    ],
    "monto_abonado": 20.00,  // ⭐ CRÍTICO: Suma de todos los pagos
    "monto_restante": 24.82,  // ⭐ CRÍTICO: total_precio_venta - monto_abonado
    "estado": "abonado"  // ⭐ CRÍTICO: "sin_pago" | "abonado" | "pagada"
  }
]
```

## 📋 CÓDIGO PYTHON/FASTAPI

```python
@router.get("/compras")
async def obtener_compras(
    sucursal_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    # Verificar permiso
    if "compras" not in current_user.get("permisos", []):
        raise HTTPException(status_code=403, detail="No tiene permiso para ver compras")
    
    # Construir query
    query = {
        "activo": {"$ne": False}
    }
    
    if sucursal_id:
        query["sucursal_id"] = sucursal_id
    
    # Buscar compras
    compras = await db.compras.find(query).sort("fecha_creacion", -1).to_list(length=10000)
    
    # ⚠️ CRÍTICO: Poblar pagos y calcular montos para cada compra
    compras_con_pagos = []
    for compra in compras:
        compra_dict = dict(compra)
        compra_dict["_id"] = str(compra_dict["_id"])
        
        # Obtener todos los pagos de esta compra
        pagos = await db.pagos_compras.find(
            {"compra_id": compra["_id"]}
        ).sort("fecha_pago", -1).to_list(length=1000)
        
        # Convertir pagos a dict y calcular monto_abonado
        pagos_dict = []
        monto_abonado = 0
        
        for pago in pagos:
            pago_dict = dict(pago)
            pago_dict["_id"] = str(pago_dict["_id"])
            pago_dict["compra_id"] = str(pago_dict["compra_id"])
            pago_dict["banco_id"] = str(pago_dict.get("banco_id", ""))
            
            # Sumar al monto abonado
            monto_pago = pago_dict.get("monto", 0)
            monto_abonado += float(monto_pago)
            
            pagos_dict.append(pago_dict)
        
        # Calcular monto restante
        total_precio_venta = float(compra_dict.get("total_precio_venta", 0) or compra_dict.get("total", 0))
        monto_restante = max(0, total_precio_venta - monto_abonado)
        
        # Calcular estado
        if monto_abonado >= total_precio_venta and total_precio_venta > 0:
            estado = "pagada"
        elif monto_abonado > 0:
            estado = "abonado"
        else:
            estado = "sin_pago"
        
        # Agregar pagos y montos calculados
        compra_dict["pagos"] = pagos_dict
        compra_dict["monto_abonado"] = round(monto_abonado, 2)
        compra_dict["monto_restante"] = round(monto_restante, 2)
        compra_dict["estado"] = estado
        
        # Poblar proveedor (ya implementado)
        if compra_dict.get("proveedor_id"):
            proveedor = await db.proveedores.find_one({"_id": ObjectId(compra_dict["proveedor_id"])})
            if proveedor:
                compra_dict["proveedor"] = {
                    "_id": str(proveedor["_id"]),
                    "nombre": proveedor.get("nombre", ""),
                    "rif": proveedor.get("rif", ""),
                    "telefono": proveedor.get("telefono", ""),
                    "dias_credito": proveedor.get("dias_credito", 0),
                    "descuento_comercial": proveedor.get("descuento_comercial", 0),
                    "descuento_pronto_pago": proveedor.get("descuento_pronto_pago", 0),
                    "estado": proveedor.get("estado", "activo")
                }
        
        compras_con_pagos.append(compra_dict)
    
    return compras_con_pagos
```

## 🔍 VERIFICACIÓN

Después de implementar, verificar que la respuesta incluya:

1. ✅ `pagos` como array con todos los pagos de la compra
2. ✅ `monto_abonado` con la suma de todos los pagos
3. ✅ `monto_restante` con el cálculo correcto (total - abonado)
4. ✅ `estado` con el valor correcto ("sin_pago", "abonado", o "pagada")
5. ✅ Cada pago debe tener `_id`, `monto`, `fecha_pago`, `metodo_pago`, `banco_id`, `referencia`, `comprobante`

## 📝 NOTAS IMPORTANTES

1. **El array `pagos` es OBLIGATORIO** - Incluso si está vacío, debe ser un array `[]`
2. **`monto_abonado` debe ser la suma de todos los pagos** - No debe ser 0 si hay pagos
3. **`monto_restante` debe ser `total_precio_venta - monto_abonado`** - No debe ser igual al total si hay pagos
4. **`estado` debe calcularse automáticamente** - Basado en `monto_abonado` vs `total_precio_venta`
5. **Los ObjectId deben convertirse a string** - Todos los `_id` en la respuesta deben ser strings

## 🎯 RESULTADO ESPERADO

Con esta implementación:
- ✅ El frontend mostrará el monto abonado correctamente
- ✅ El monto restante se actualizará después de cada pago
- ✅ El estado cambiará de "Sin Pago" a "Abonado" o "Pagada"
- ✅ Se mostrará el historial de pagos en el modal de detalles

