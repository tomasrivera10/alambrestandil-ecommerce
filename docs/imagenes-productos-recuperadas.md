# Imágenes recuperadas — 8 de octubre de 2026

Originales de las nueve categorías de Romboidal: `public/images/romboidal/`. Son miniaturas de 280 × 280 px; los cuatro esquemas de medidas están en `mallas-medidas/`.

Referencias externas en `public/images/referencias-productos/`:

| Archivo | Resolución | Observación |
| --- | --- | --- |
| tejido-galvanizado.jpeg | 1080 × 1080 | Fondo blanco, rollo parcialmente desplegado |
| tejido-pvc-verde.png | 2000 × 2000 | Tiene canal alfa; fondo verde y restos blancos entre alambres, requiere limpieza |
| torniquete-n7.jpg | 800 × 800 | Original de Hiza, fondo blanco |
| torniquete-cambren.webp | 1024 × 1024 | Transparencia en contorno y agujero, bordes requieren revisión |

Fuentes por archivo: `fuentes.json`. Metadatos verificados: `resoluciones.json`. Son referencias de terceros: no se verificó equivalencia exacta con las variantes del catálogo ni permiso de publicación.

La concertina de Mimeta devolvió HTTP 403; se conservó la miniatura oficial de Romboidal. Falta una foto de alta resolución del alambre Cactus exacto de 500 metros.

Se guardaron dos intentos de extracción con image_gen en `public/images/productos-transparentes/`. Tienen alfa real pero muestran artefactos azules y residuos dentro de los rombos: son borradores, no imágenes finales. Prompts completos y herramienta en `generacion.json`.

Aplicadas al catálogo local: tejido romboidal galvanizado, torniquete zincado (Cambren con transparencia), alambre de púas, concertina y portón para cerco. Se conservaron las fotos anteriores como imágenes secundarias y se identifican todas las nuevas como referencias. También se actualizaron las imágenes de las categorías destacadas de tejidos y accesorios.

La actualización se ejecuta con `node --import tsx scripts/apply-product-images.ts` y está integrada al seed. Se registra una sola vez en SiteSetting para no duplicar fotos ni sobrescribir posteriores ediciones del panel. PVC, esquemas de malla y borradores generados permanecen sin asignar: no hay una ficha activa correspondiente o no alcanzan la calidad necesaria.

Verificación: las cinco fichas devolvieron HTTP 200 con su nueva imagen; todos los archivos existen y una segunda ejecución no duplicó registros. TypeScript y ESLint comprobados. Se verificó visualmente la ficha móvil del torniquete.
