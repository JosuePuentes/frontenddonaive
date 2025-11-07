# Instrucciones Backend - Gestión de Clientes para Punto de Venta

## Endpoints Requeridos

### 1. Crear Cliente
**POST** `/clientes`

**Descripción:** Crea un nuevo cliente en el sistema.

**Headers:**
- `Authorization: Bearer {token}` (requerido)
- `Content-Type: application/json`

**Request Body:**
```json
{
  "cedula": "12345678",
  "nombre": "Juan Pérez",
  "direccion": "Av. Principal #123",
  "telefono": "0412-1234567"
}
```

**Campos:**
- `cedula` (string, requerido): Cédula del cliente
- `nombre` (string, requerido): Nombre completo del cliente
- `direccion` (string, opcional): Dirección del cliente
- `telefono` (string, opcional): Número de teléfono del cliente

**Respuesta Exitosa (201 Created):**
```json
{
  "_id": "690c40be93d9d9d635fbae83",
  "id": "690c40be93d9d9d635fbae83",
  "cedula": "12345678",
  "nombre": "Juan Pérez",
  "direccion": "Av. Principal #123",
  "telefono": "0412-1234567",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Errores posibles:**
- `400 Bad Request`: Si faltan campos requeridos o la cédula ya existe
- `401 Unauthorized`: Si no hay token o es inválido
- `409 Conflict`: Si la cédula ya está registrada

---

### 2. Buscar Clientes
**GET** `/clientes/buscar?q={query}`

**Descripción:** Busca clientes por cédula o nombre (búsqueda en tiempo real).

**Headers:**
- `Authorization: Bearer {token}` (requerido)

**Query Parameters:**
- `q` (string, requerido): Término de búsqueda (mínimo 2 caracteres)

**Respuesta Exitosa (200 OK):**
```json
[
  {
    "_id": "690c40be93d9d9d635fbae83",
    "id": "690c40be93d9d9d635fbae83",
    "cedula": "12345678",
    "nombre": "Juan Pérez",
    "direccion": "Av. Principal #123",
    "telefono": "0412-1234567"
  },
  {
    "_id": "690c40be93d9d9d635fbae84",
    "id": "690c40be93d9d9d635fbae84",
    "cedula": "87654321",
    "nombre": "María González",
    "direccion": "Calle Secundaria #456",
    "telefono": "0414-9876543"
  }
]
```

**Notas:**
- La búsqueda debe ser case-insensitive
- Debe buscar tanto en `cedula` como en `nombre`
- Debe retornar resultados incluso con coincidencias parciales
- Retorna un array vacío `[]` si no hay resultados

---

### 3. Obtener Cliente por ID
**GET** `/clientes/{cliente_id}`

**Descripción:** Obtiene los datos de un cliente específico.

**Headers:**
- `Authorization: Bearer {token}` (requerido)

**Respuesta Exitosa (200 OK):**
```json
{
  "_id": "690c40be93d9d9d635fbae83",
  "id": "690c40be93d9d9d635fbae83",
  "cedula": "12345678",
  "nombre": "Juan Pérez",
  "direccion": "Av. Principal #123",
  "telefono": "0412-1234567",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z"
}
```

**Errores posibles:**
- `404 Not Found`: Si el cliente no existe
- `401 Unauthorized`: Si no hay token o es inválido

---

## Estructura de Base de Datos Sugerida

### Modelo: Cliente

```python
class Cliente(BaseModel):
    _id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    cedula: str  # Requerido, único
    nombre: str  # Requerido
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "cedula": "12345678",
                "nombre": "Juan Pérez",
                "direccion": "Av. Principal #123",
                "telefono": "0412-1234567"
            }
        }
```

### Índices Recomendados

```python
# Crear índices para mejorar búsquedas
db.clientes.create_index([("cedula", 1)], unique=True)
db.clientes.create_index([("nombre", "text")])
db.clientes.create_index([("cedula", "text")])
```

---

## Ejemplo de Implementación (Python/FastAPI)

### Endpoint: POST /clientes

```python
@router.post("/clientes")
async def crear_cliente(
    cliente_data: ClienteCreate,
    current_user: User = Depends(get_current_user)
):
    # Verificar si la cédula ya existe
    cliente_existente = await db.clientes.find_one({"cedula": cliente_data.cedula})
    if cliente_existente:
        raise HTTPException(
            status_code=409,
            detail="Ya existe un cliente con esta cédula"
        )
    
    # Crear nuevo cliente
    nuevo_cliente = {
        "cedula": cliente_data.cedula,
        "nombre": cliente_data.nombre,
        "direccion": cliente_data.direccion,
        "telefono": cliente_data.telefono,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.clientes.insert_one(nuevo_cliente)
    nuevo_cliente["_id"] = result.inserted_id
    nuevo_cliente["id"] = str(result.inserted_id)
    
    return nuevo_cliente
```

### Endpoint: GET /clientes/buscar

```python
@router.get("/clientes/buscar")
async def buscar_clientes(
    q: str,
    current_user: User = Depends(get_current_user)
):
    if len(q) < 2:
        return []
    
    # Búsqueda case-insensitive en cedula y nombre
    query = {
        "$or": [
            {"cedula": {"$regex": q, "$options": "i"}},
            {"nombre": {"$regex": q, "$options": "i"}}
        ]
    }
    
    clientes = await db.clientes.find(query).limit(10).to_list(length=10)
    
    return [
        {
            "_id": str(cliente["_id"]),
            "id": str(cliente["_id"]),
            "cedula": cliente.get("cedula", ""),
            "nombre": cliente.get("nombre", ""),
            "direccion": cliente.get("direccion"),
            "telefono": cliente.get("telefono")
        }
        for cliente in clientes
    ]
```

### Endpoint: GET /clientes/{cliente_id}

```python
@router.get("/clientes/{cliente_id}")
async def obtener_cliente(
    cliente_id: str,
    current_user: User = Depends(get_current_user)
):
    try:
        cliente = await db.clientes.find_one({"_id": ObjectId(cliente_id)})
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        return {
            "_id": str(cliente["_id"]),
            "id": str(cliente["_id"]),
            "cedula": cliente.get("cedula", ""),
            "nombre": cliente.get("nombre", ""),
            "direccion": cliente.get("direccion"),
            "telefono": cliente.get("telefono"),
            "createdAt": cliente.get("createdAt"),
            "updatedAt": cliente.get("updatedAt")
        }
    except InvalidId:
        raise HTTPException(status_code=400, detail="ID de cliente inválido")
```

---

## Integración con Punto de Venta

El campo `cliente` en el endpoint de ventas (`POST /punto-venta/ventas`) debe aceptar el ID del cliente:

```json
{
  "items": [...],
  "metodos_pago": [...],
  "total_bs": 1000,
  "total_usd": 20,
  "tasa_dia": 50,
  "sucursal": "01",
  "cajero": "cajero@email.com",
  "cliente": "690c40be93d9d9d635fbae83",  // ID del cliente (opcional)
  "notas": ""
}
```

---

## Validaciones

1. **Cédula:**
   - Debe ser única en el sistema
   - No puede estar vacía
   - Formato recomendado: solo números (pero puede aceptar letras si es necesario)

2. **Nombre:**
   - No puede estar vacío
   - Mínimo 2 caracteres recomendado

3. **Teléfono:**
   - Opcional
   - Formato flexible (aceptar con o sin guiones, espacios, etc.)

4. **Dirección:**
   - Opcional
   - Sin restricciones de formato

---

## Checklist de Implementación

- [ ] Endpoint `POST /clientes` implementado
- [ ] Endpoint `GET /clientes/buscar?q={query}` implementado
- [ ] Endpoint `GET /clientes/{cliente_id}` implementado (opcional pero recomendado)
- [ ] Validación de cédula única
- [ ] Búsqueda case-insensitive en cédula y nombre
- [ ] Índices creados en la base de datos para mejorar búsquedas
- [ ] Autenticación requerida en todos los endpoints
- [ ] Manejo de errores apropiado (400, 401, 404, 409)
- [ ] El campo `cliente` en ventas acepta el ID del cliente

---

## Notas Adicionales

1. **Búsqueda en Tiempo Real:** El frontend hace búsquedas con debounce de 300ms, así que el backend debe responder rápidamente.

2. **Límite de Resultados:** Se recomienda limitar los resultados de búsqueda a 10-20 clientes para mejorar el rendimiento.

3. **Cédula Única:** Es importante validar que la cédula sea única para evitar duplicados.

4. **Historial de Compras:** Opcionalmente, puedes agregar un campo para almacenar el historial de compras del cliente en el futuro.

