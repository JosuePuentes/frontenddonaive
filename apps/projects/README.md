# apps/projects — Sistemas operativos por cliente

**No crear instancias de cliente todavía** (ej. Licorería y Bodegón A&D).

Cuando llegue el momento, cada Project tendrá namespace propio:

```
apps/projects/<project-slug>/
  web/          # UI operacional del negocio
  api/          # API operacional (schema/DB del project)
```

- `project-slug` = identificador técnico estable (no el nombre comercial).
- `name` comercial = "Licorería y Bodegón A&D" (mutable, solo display).

Regla fundamental: un Project **nunca** importa código de otro Project.
