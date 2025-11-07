# Instrucciones Backend - Punto de Venta: Stock y Lotes

## Endpoint: GET `/punto-venta/productos/buscar`

El frontend ahora requiere que este endpoint devuelva información de **stock** y **lotes** para cada producto.

### Estructura de Respuesta Requerida

El endpoint debe devolver un **array de productos** (no un objeto con `productos`):

```json
[
  {
    "id": "producto_id_123",
    "nombre": "Paracetamol 500mg",
    "codigo": "PROD001",
    "precio": 2.50,
    "precio_usd": 2.50,
    "cantidad": 150,
    "stock": 150,
    "lotes": [
      {
        "lote": "LOTE-001",
        "fecha_vencimiento": "2025-12-31",
        "cantidad": 50
      },
      {
        "lote": "LOTE-002",
        "fecha_vencimiento": "2026-06-30",
        "cantidad": 100
      }
    ],
    "sucursal": "01"
  }
]
```

### Campos Requeridos

#### Campos Básicos:
- `id` (string, requerido): ID único del producto (puede ser `_id` convertido a string)
- `nombre` (string, requerido): Nombre del producto
- `codigo` (string, opcional): Código de barras o código interno
- `precio` (number, requerido): Precio en USD (usar `precio_unitario` del inventario)
- `precio_usd` (number, opcional): Precio en USD (igual que `precio`)

#### Campos de Stock:
- `cantidad` (number, requerido): **Stock total** del producto en la sucursal (suma de todos los lotes)
- `stock` (number, opcional): Alias de `cantidad` (para compatibilidad)

#### Campos de Lotes:
- `lotes` (array, opcional): Array de objetos `Lote` con la siguiente estructura:
  ```json
  {
    "lote": "LOTE-001",                    // String: número o código del lote
    "fecha_vencimiento": "2025-12-31",     // String: fecha en formato ISO (YYYY-MM-DD)
    "cantidad": 50                         // Number: cantidad de unidades en este lote
  }
  ```

### Ejemplo de Implementación (Python/FastAPI)

```python
@router.get("/punto-venta/productos/buscar")
async def buscar_productos(
    q: str,
    sucursal: str,
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar items del inventario de la sucursal
    inventario = await get_inventario_by_sucursal(sucursal)
    if not inventario:
        return []
    
    # 2. Buscar items que coincidan con la búsqueda (por nombre o código)
    items = await buscar_items_inventario(
        inventario_id=inventario._id,
        query=q,
        sucursal=sucursal
    )
    
    # 3. Formatear respuesta con lotes
    productos = []
    for item in items:
        # Calcular stock total (suma de cantidades de lotes, o usar cantidad del item)
        stock_total = item.cantidad or 0
        if item.lotes:
            stock_total = sum(lote.get('cantidad', 0) for lote in item.lotes)
        
        # Formatear lotes
        lotes_formateados = []
        if item.lotes:
            for lote in item.lotes:
                lotes_formateados.append({
                    "lote": lote.get("lote", ""),
                    "fecha_vencimiento": lote.get("fecha_vencimiento"),  # Formato: "YYYY-MM-DD"
                    "cantidad": lote.get("cantidad", 0)
                })
        
        productos.append({
            "id": str(item._id),
            "nombre": item.descripcion or item.nombre or "",
            "codigo": item.codigo or "",
            "precio": item.precio_unitario or item.precio or 0,
            "precio_usd": item.precio_unitario or item.precio or 0,
            "cantidad": stock_total,
            "stock": stock_total,  # Alias para compatibilidad
            "lotes": lotes_formateados,
            "sucursal": sucursal
        })
    
    return productos
```

### Notas Importantes

1. **Stock Total**: El campo `cantidad` debe reflejar el stock total del producto en esa sucursal. Si el item tiene `lotes`, sumar las cantidades de todos los lotes. Si no tiene lotes, usar el campo `cantidad` del item.

2. **Lotes Opcionales**: Si un producto no tiene lotes registrados, devolver `lotes: []` o simplemente omitir el campo (el frontend manejará ambos casos).

3. **Fecha de Vencimiento**: Debe estar en formato ISO (YYYY-MM-DD). Si un lote no tiene fecha de vencimiento, puede ser `null` o `undefined`.

4. **Filtrado por Sucursal**: Solo devolver productos que pertenezcan al inventario de la sucursal especificada.

5. **Búsqueda**: La búsqueda debe ser case-insensitive y buscar en:
   - `nombre` o `descripcion` del producto
   - `codigo` del producto

### Validaciones

- Si `cantidad` es 0 o `null`, el frontend mostrará el precio en **rojo** (sin stock)
- Si `cantidad` > 0, el frontend mostrará el precio en **verde** (con stock)
- Si hay lotes, el usuario podrá hacer clic en "Stock" para ver el desglose por lote
- Los lotes vencidos se mostrarán en rojo, los que vencen pronto (30 días) en naranja

### Estructura de Base de Datos Esperada

El backend debe tener los items del inventario con esta estructura:

```python
class ItemInventario:
    _id: ObjectId
    codigo: str
    descripcion: str
    marca: Optional[str]
    precio_unitario: float  # Precio en USD
    cantidad: int           # Stock total
    lotes: Optional[List[Lote]]  # Array de lotes
    
class Lote:
    lote: str                    # Número/código del lote
    fecha_vencimiento: Optional[str]  # "YYYY-MM-DD"
    cantidad: Optional[int]      # Cantidad en este lote
```

### Checklist de Implementación

- [ ] El endpoint devuelve un array (no un objeto con `productos`)
- [ ] Cada producto incluye `id`, `nombre`, `codigo`, `precio`, `precio_usd`
- [ ] Cada producto incluye `cantidad` (stock total)
- [ ] Cada producto incluye `lotes` (array, puede estar vacío)
- [ ] Los lotes tienen `lote`, `fecha_vencimiento` (formato YYYY-MM-DD), y `cantidad`
- [ ] El stock total (`cantidad`) es la suma de las cantidades de los lotes (si existen)
- [ ] La búsqueda filtra correctamente por sucursal
- [ ] La búsqueda es case-insensitive y busca en nombre/código

