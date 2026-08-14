# Assets oficiales de POLISUR

Coloca aquí las fotografías y logos **reales** de la institución.
Las rutas están referenciadas desde `src/content/polisur.ts`.
Si un archivo no existe, la UI muestra un marco fotográfico neutro
(sin texto tipo PLACEHOLDER visible al usuario).

## Logos institucionales (obligatorios para branding)

```
public/polisur/logo/escudo.png       ← escudo oficial (header / footer / hero)
public/polisur/logo/parche.png       ← parche circular Venezuela renace
public/polisur/logo/k9-emblema.png   ← emblema Unidad de Patrullaje Canino
```

Opcional (institucionales auxiliares):

```
public/polisur/logo/visipol.png
public/polisur/logo/cuadrantes-paz.png
public/polisur/logo/justicia-paz.png
public/polisur/extras/   ← logos aún no asignados a una sección
```

## Home

```
public/polisur/home/hero.jpg
public/polisur/home/about.jpg
public/polisur/home/canina.jpg
public/polisur/home/ciudadania.jpg
```

## Unidad Canina

```
public/polisur/unidad-canina/hero.jpg
public/polisur/unidad-canina/entrenamiento.jpg
public/polisur/unidad-canina/binomio.png
```

`binomio.png` debe ser la fotografía de los **dos funcionarios con el perro**,
preferiblemente con fondo transparente. **No alterar** rostros, uniformes,
insignias, proporciones ni la orientación del canino.

## Reglas

- Solo fotografías y logos oficiales reales.
- No sustituir fondos reales por fondos artificiales.
- Respetar transparencia cuando el archivo la tenga.
- Formato: JPG/WebP para fotos de escena; PNG para escudo y binomio.
