# Imágenes del catálogo: aplicación completada

## Resultado

31 familias activas, 86 variantes activas, 34 referencias asignadas y cero productos activos sin imagen. Se prepararon 29 archivos WebP conservando la resolución nativa: lado mayor entre 1254 y 1774 px. El manifiesto también cubre la familia olímpica separada del catálogo local (32 familias previstas).

Las imágenes están publicadas en el almacenamiento Vercel Blob de la tienda y asignadas en la base configurada. Se comprobaron por HTTP cuatro fichas públicas y cuatro del panel. Las rutas publicadas son las del manifiesto `src/content/catalog-studio.json`.

## Archivos y referencias

- `public/images/catalogo-estudio/`: originales, versiones WebP y referencias de geometría.
- `public/images/catalogo-estudio/generacion.json`: registro de las generaciones y validación. Los diez nuevos archivos `*.generation.json` conservan los prompts completos. Los prompts previos permanecen en esta conversación.
- Fuentes de forma: Romboidal, Gerdau, Acerbrag, Gramtor, Metalúrgica Los Arroyos y los catálogos de Metales Tratados indicados por el usuario. Las asociaciones por proveedor que no existían en la base no se inventaron.
- Los PDF MT siguen en Descargas y en Proveedores. No se publicaron sus páginas ni precios. El catálogo Quebracho es de madera y no se usó para representar postes de hormigón.

## Aplicación

`node scripts/prepare-catalog-studio.mjs` prepara WebP sin ampliar los originales. `scripts/publish-catalog-studio.mjs` usa una sesión administrativa temporal para subirlos al upload de la tienda y verificar SHA-256. `node --import tsx scripts/apply-catalog-studio.ts` aplica las referencias dentro de una transacción. También se integró al seed.

Se conservaron la fotografía real de la puerta y los archivos originales. Las referencias anteriores reemplazadas quedan respaldadas en SiteSetting bajo `catalog-studio-2026-10-15-v1`. La aplicación se registra por familia: repetirla no duplica imágenes ni sobrescribe posteriores cambios administrativos. Se actualizaron únicamente ProductImage y ese registro de respaldo.

Concertina simple y cruzada tienen imágenes independientes asociadas por SKU. Rectos y olímpicos se seleccionan por la forma de la variante. Las familias de clavos del mismo tipo visual comparten una referencia; los nombres de marca confirmados se conservan en el catálogo.

El código de inicio/categorías usa las versiones de estudio. Las miniaturas antiguas de carritos persistidos se actualizan al mostrarse, sin cambiar cantidades ni precios. Las imágenes se muestran completas y las visualizaciones conservan `isReference: true`. Sus medidas, terminaciones y procedencia comercial exactas requieren contraste con el inventario: no son fotografías del stock.

## Comprobaciones

Se verificaron automáticamente formato WebP, fondo opaco, resolución nativa, hash de cada archivo publicado, cobertura de familias y variantes, conservación de la foto real e idempotencia. TypeScript, ESLint y las pruebas específicas del catálogo y selección de variantes se ejecutaron sobre los cambios. Por indicación del usuario no se hizo una revisión manual en navegador; la revisión visual final corresponde al usuario.

La asignación de imágenes en la base y su disponibilidad pública ya están aplicadas. Los ajustes de componentes del inicio, categorías, rótulos y carrito quedan en el árbol de trabajo y requieren el despliegue habitual del código para aparecer en producción. No se desplegaron los otros cambios ajenos que ya estaban pendientes en este repositorio.
