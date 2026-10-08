# Puertas y portones — 8 de octubre de 2026

Se regeneraron con `image_gen` integrado usando como referencia de materiales la fotografía local `public/images/tandil/portones.webp`, procedente del sitio de Alambres Tandil (https://alambrestandil.com.ar/).

Archivos finales en `public/images/productos-transparentes/portones/`:

- `porton-dos-hojas.png` y `.webp`: 1774 × 887 px.
- `puerta-peatonal.png` y `.webp`: 1024 × 1536 px.
- `generacion.json`: prompts completos, herramienta y procedencia.

A pesar del nombre de la carpeta compartida, estos dos archivos tienen fondo blanco opaco. El primer intento con alfa dejó residuos azules en los huecos de la malla y se descartó. La versión sobre blanco permite integrar el producto en las fichas blancas sin esos artefactos. No son fotografías exactas del inventario: herrajes, proporciones y medidas requieren cotejo con los productos reales. Se asignaron como imágenes orientativas a ambas fichas; se conservan las fotografías anteriores en la galería. La categoría usa el nuevo portón.

Aplicación: `node --import tsx scripts/apply-product-images.ts`, también integrada al seed. La marca `gate-images-generated-2026-10-08-v1` evita duplicados y conserva posteriores cambios administrativos.

Verificación: inspección visual de ambas imágenes y de la ficha del portón en localhost. Actualización local ejecutada correctamente dos veces para comprobar idempotencia. TypeScript y ESLint de los archivos modificados.
