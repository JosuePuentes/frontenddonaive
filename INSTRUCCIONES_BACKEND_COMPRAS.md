# Instrucciones para el Backend - Módulo de Compras

## Descripción

El frontend ahora incluye un módulo completo de compras que permite gestionar proveedores y crear compras con productos del inventario o nuevos productos.

## Endpoints Necesarios

### 1. GET /proveedores

**Descripción:** Obtiene la lista de todos los proveedores.

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

**Permiso:** Requiere permiso `acceso_admin`

**Response (200 OK):**
```json
[
  {
    "_id": "proveedor_id",
    "nombre": "Distribuidora ABC",
    "rif": "J-12345678-9",
    "telefono": "0412-1234567",
    "dias_credito": 30,
    "descuento_comercial": 5.0,
    "descuento_pronto_pago": 2.0,
    "fecha_creacion": "2025-01-15T10:30:00Z",
    "fecha_actualizacion": "2025-01-15T10:30:00Z"
  }
]
```

### 2. POST /proveedores

**Descripción:** Crea un nuevo proveedor.

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

**Permiso:** Requiere permiso `acceso_admin`

**Request Body:**
```json
{
  "nombre": "Distribuidora ABC",
  "rif": "J-12345678-9",
  "telefono": "0412-1234567",
  "dias_credito": 30,
  "descuento_comercial": 5.0,
  "descuento_pronto_pago": 2.0
}
```

**Campos del Request:**
- `nombre` (string, requerido): Nombre del proveedor
- `rif` (string, requerido): RIF del proveedor
- `telefono` (string, requerido): Teléfono del proveedor
- `dias_credito` (number, opcional): Días de crédito (default: 0)
- `descuento_comercial` (number, opcional): Descuento comercial en porcentaje (default: 0)
- `descuento_pronto_pago` (number, opcional): Descuento por pronto pago en porcentaje (default: 0)

**Response (200 OK):**
```json
{
  "message": "Proveedor creado exitosamente",
  "proveedor": {
    "_id": "proveedor_id",
    "nombre": "Distribuidora ABC",
    "rif": "J-12345678-9",
    "telefono": "0412-1234567",
    "dias_credito": 30,
    "descuento_comercial": 5.0,
    "descuento_pronto_pago": 2.0,
    "fecha_creacion": "2025-01-15T10:30:00Z",
    "fecha_actualizacion": "2025-01-15T10:30:00Z"
  }
}
```

### 3. POST /compras

**Descripción:** Crea una nueva compra.

**Autenticación:** Requiere token JWT en el header `Authorization: Bearer <token>`

**Permiso:** Requiere permiso `acceso_admin`

**Request Body:**
```json
{
  "proveedor_id": "proveedor_id",
  "pagar_en_dolar_negro": true,
  "dolar_bcv": 240.0,
  "dolar_negro": 372.0,
  "items": [
    {
      "codigo": "PROD001",
      "descripcion": "Aspirina 500mg",
      "marca": "Bayer",
      "costo": 1.0,
      "costo_ajustado": 1.55,
      "utilidad": 0.5,
      "precio_venta": 2.05,
      "cantidad": 100,
      "fecha_vencimiento": "2025-12-31",
      "lote": "LOTE001",
      "es_nuevo": false,
      "producto_id": "producto_id_existente"
    },
    {
      "codigo": "PROD002",
      "descripcion": "Paracetamol 500mg",
      "marca": "Genérico",
      "costo": 0.8,
      "costo_ajustado": 1.24,
      "utilidad": 0.4,
      "precio_venta": 1.64,
      "cantidad": 50,
      "fecha_vencimiento": "2026-01-15",
      "lote": "LOTE002",
      "es_nuevo": true,
      "producto_id": null
    }
  ]
}
```

**Campos del Request:**
- `proveedor_id` (string, requerido): ID del proveedor
- `pagar_en_dolar_negro` (boolean, requerido): Indica si la compra se paga en dólar negro
- `dolar_bcv` (number, requerido): Precio del dólar BCV al momento de la compra
- `dolar_negro` (number, requerido): Precio del dólar negro al momento de la compra
- `items` (array, requerido): Array de items de la compra
  - `codigo` (string, requerido): Código del producto
  - `descripcion` (string, requerido): Descripción del producto
  - `marca` (string, opcional): Marca del producto
  - `costo` (number, requerido): Costo original del producto
  - `costo_ajustado` (number, requerido): Costo con ajuste de dólar negro si aplica
  - `utilidad` (number, requerido): Utilidad del producto
  - `precio_venta` (number, requerido): Precio de venta (costo_ajustado + utilidad)
  - `cantidad` (number, requerido): Cantidad comprada
  - `fecha_vencimiento` (string, opcional): Fecha de vencimiento (formato: YYYY-MM-DD)
  - `lote` (string, opcional): Número de lote
  - `es_nuevo` (boolean, requerido): Indica si es un producto nuevo o existente
  - `producto_id` (string, opcional): ID del producto si existe en inventario

**Lógica del Backend:**

1. **Para productos existentes (`es_nuevo: false`):**
   - Actualizar el producto en el inventario:
     - Actualizar `costo_unitario` con `costo_ajustado`
     - Actualizar `precio_unitario` con `precio_venta`
     - Sumar `cantidad` a la existencia actual
     - Si hay `fecha_vencimiento` y `lote`, agregar o actualizar el lote en el array `lotes`

2. **Para productos nuevos (`es_nuevo: true`):**
   - Crear un nuevo producto en el inventario con:
     - `codigo`: código del producto
     - `descripcion`: descripción del producto
     - `marca`: marca del producto (si se proporciona)
     - `costo_unitario`: `costo_ajustado`
     - `precio_unitario`: `precio_venta`
     - `cantidad`: cantidad comprada
     - `lotes`: array con el lote si se proporciona `fecha_vencimiento` y `lote`
     - `inventario_id`: ID del inventario actual o crear uno nuevo
     - `sucursal`: ID de la sucursal (debe determinarse según la lógica del sistema)

3. **Registrar la compra:**
   - Guardar un registro de la compra con todos los datos
   - Incluir fecha de compra, proveedor, totales, etc.

**Response (200 OK):**
```json
{
  "message": "Compra creada exitosamente",
  "compra": {
    "_id": "compra_id",
    "proveedor_id": "proveedor_id",
    "fecha": "2025-01-15T10:30:00Z",
    "pagar_en_dolar_negro": true,
    "dolar_bcv": 240.0,
    "dolar_negro": 372.0,
    "total_costo": 155.0,
    "total_precio_venta": 205.0,
    "items": [...],
    "usuario_correo": "usuario@example.com"
  }
}
```

## Estructura de Base de Datos

### Colección/Tabla: proveedores

```javascript
{
  _id: ObjectId,
  nombre: String,
  rif: String,              // Único
  telefono: String,
  dias_credito: Number,      // Default: 0
  descuento_comercial: Number,  // Default: 0
  descuento_pronto_pago: Number, // Default: 0
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

### Colección/Tabla: compras

```javascript
{
  _id: ObjectId,
  proveedor_id: ObjectId,    // FK a proveedores
  fecha: Date,
  pagar_en_dolar_negro: Boolean,
  dolar_bcv: Number,
  dolar_negro: Number,
  total_costo: Number,
  total_precio_venta: Number,
  items: [{
    codigo: String,
    descripcion: String,
    marca: String,
    costo: Number,
    costo_ajustado: Number,
    utilidad: Number,
    precio_venta: Number,
    cantidad: Number,
    fecha_vencimiento: Date,
    lote: String,
    es_nuevo: Boolean,
    producto_id: ObjectId    // FK a productos (si existe)
  }],
  usuario_correo: String,
  fecha_creacion: Date,
  fecha_actualizacion: Date
}
```

## Cálculo de Precio con Dólar Negro

**Fórmula:**
```
diferencia_porcentaje = ((dolar_negro - dolar_bcv) / dolar_bcv) * 100
costo_ajustado = costo * (1 + diferencia_porcentaje / 100)
precio_venta = costo_ajustado + utilidad
```

**Ejemplo:**
- Dólar BCV: 240 Bs
- Dólar Negro: 372 Bs
- Diferencia: 132 Bs
- Diferencia %: 55%
- Costo producto: $1.00
- Costo ajustado: $1.55 (1.00 * 1.55)
- Utilidad: $0.50
- Precio venta: $2.05 (1.55 + 0.50)

## Notas Importantes

1. **Actualización de Inventario:**
   - Los productos existentes deben actualizarse con los nuevos costos y precios
   - La cantidad debe sumarse a la existencia actual
   - Los lotes deben agregarse o actualizarse correctamente

2. **Productos Nuevos:**
   - Deben crearse en el inventario con todos los campos necesarios
   - Debe asignarse a un inventario y sucursal según la lógica del sistema

3. **Validaciones:**
   - Verificar que el proveedor existe
   - Validar que todos los campos requeridos estén presentes
   - Validar que las cantidades sean mayores a 0
   - Validar que los costos y precios sean mayores a 0

4. **Transacciones:**
   - Se recomienda usar transacciones de base de datos para asegurar que la compra y la actualización del inventario se completen ambas o ninguna

