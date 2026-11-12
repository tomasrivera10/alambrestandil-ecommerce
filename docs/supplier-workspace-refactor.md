# Proveedores: auditoría y migración de interfaz

## Diagnóstico y alcance

La pantalla original combina carga y revisión de documentos con vinculación, costos, márgenes, referencias y publicación por cada artículo. La versión local previa a esta tarea ya compactaba filas y proponía un modal de dos secciones. La implementación incorpora una ficha navegable de artículo y tres pestañas, conservando esa base de trabajo y las acciones comerciales.

## Mapa de responsabilidades y dependencias

| Área                    | Datos y operaciones                                                                                    | Validaciones y efectos                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Proveedores             | Alta, carga PDF/XLSX/DOCX y OCR, revisión contra documento, corrección, exclusión y preparación masiva | Permiso suppliers en acciones y rutas API; tamaño, extensión y hash; documento original y filas conservados                                               |
| Proveedores             | Aprobar lista y guardar costos literales                                                               | Transacción, filas completas sin advertencias ni duplicados, variantes activas de hoja Stock; no publica ni mueve stock                                   |
| Proveedores             | Vincular variante y marcar comprado                                                                    | Confirmación de producto y unidad, variante activa con origen permitido; admite desvincular                                                               |
| Catálogo / precios      | Objetivo de variante o familia, volver a herencia                                                      | Objetivo entre 0 y 99, variante prevalece; guardar no publica                                                                                             |
| Catálogo / precios      | Comparar costo, sugerencia y precio vigente; editar precio final                                       | Costo del proveedor elegido; precio de variante con respaldo del producto; confirmación explícita                                                         |
| Catálogo / precios      | Publicar e historial                                                                                   | Permisos products y suppliers, costo/precio esperado, variante activa y comprada; transacción Serializable registra precio y auditoría; invalida catálogo |
| Referencias comerciales | Buscar, agregar URL, aceptar equivalencia, quitar                                                      | Validación de fuentes, identidad, moneda, disponibilidad; mínimo 3 vendedores, vigencia 36 horas y filtro de extremos; nunca publica automáticamente      |
| Stock                   | Consulta de disponible, reservado, mínimo y enlace a ficha interna                                     | Solo lectura; movimientos y reservas permanecen en su área                                                                                                |

Relaciones: Supplier → SupplierPriceList (archivo y filas de revisión) y SupplierItem (código único por proveedor, unidad, costo y comprado). SupplierItem → ProductVariant → Product y Category. La variante aporta SKU, unidad, inventario, publicaciones de mercado e historial de precios. MarginPolicy se resuelve por variante y luego familia. PriceChange conserva actor, proveedor/costo, margen y mercado.

Fórmulas intactas: margen = (venta − costo) / venta × 100; piso = costo / (1 − objetivo / 100); sugerido = máximo entre piso y mercado confiable. Sin mercado se usa solo el piso. No se infieren descuentos, impuestos o conversiones de unidad.

El precio HIDDEN se etiqueta como valor interno y «En ecommerce: a consultar». No se modifica la consulta pública ni su filtrado de precios. Ninguna operación nueva escribe inventario.

## Arquitectura y wireframe

- Detalle de proveedor: revisión de listas desplegable y filas compactas con acceso a la ficha. La revisión se abre automáticamente si existe una lista REVIEW.
- `/admin/proveedores/[id]/articulos/[itemId]`: página de servidor autorizada; comprueba que el artículo pertenece al proveedor antes de consultar variantes o mostrar datos.
- SupplierItemTabs: pestañas shadcn/Base UI con teclado y paneles montados para conservar la edición.
- Resumen: origen, compra, asociación y consulta de stock.
- Precios: PricingPanel reutilizado en modo focused; diferencia sugerido/vigente y ediciones progresivas independientes; referencias e historial en desplegables.
- Vinculación: VariantSelect y ActionForm existentes; conserva validación y feedback.

```text
Proveedores → Proveedor → Artículo
                         Nombre · Proveedor · Código · Unidad · SKU · Estado
                         Costo | Venta vigente | Margen bruto
                         Resumen / Precios / Vinculación
                         Datos     Objetivo  Origen → presentación interna
                         Stock ↗   Sugerido  Compra y equivalencia
                                   Publicar
                                   Mercado e historial desplegables
```

## Migración sin regresiones

1. Añadir ficha sin migraciones de datos ni sustitución de servicios.
2. Conectar filas a la ficha, conservando filtros y cargando artículos en tandas de 20 al llegar al final. Los enlaces anteriores `?articulo=` redirigen después de comprobar pertenencia.
3. Mantener carga/revisión y acciones de precios existentes. No eliminar archivos de trabajo previos ni modificar integraciones.
4. Verificar TypeScript, ESLint, pruebas de proveedores y precios; revisar visualmente escritorio/móvil cuando haya servidor y sesión disponibles.

No se retiraron operaciones. El historial conserva el límite existente de cinco cambios y la lista conserva las últimas ocho cargas. «Última actualización del artículo» describe updatedAt: también puede cambiar al editar el vínculo y no prueba la fecha de importación del costo.

## Carga incremental de artículos

El listado ya no tiene páginas numeradas ni enlaces Anterior/Siguiente. Carga 20 artículos al inicio y solicita otra tanda al acercarse al final. El cursor usa nombre e ID para mantener un orden estable incluso con nombres repetidos. Cada solicitud verifica el permiso suppliers y conserva el proveedor y la búsqueda. Al cambiar la búsqueda se reinicia el listado. Se informa la carga, el final y los errores, con un botón para reintentar o cargar manualmente. Las pruebas cubren autorización, serialización, cursor, filtrado y fin de resultados.
