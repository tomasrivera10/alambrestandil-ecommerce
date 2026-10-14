# Panel: catálogo, proveedores y guía de precios

La navegación principal reúne Inicio, Pedidos, Productos, Clientes y Proveedores. Ventas de mostrador y presupuestos están dentro de Pedidos; existencias y familias dentro de Productos. Las URL anteriores siguen funcionando y los permisos se verifican en el servidor.

## Listas y costos

Subir un archivo no modifica stock ni precio de venta. PDF digital y escaneado (OCR), XLSX y DOCX producen filas de revisión con página de origen. Las filas se corrigen o se omiten antes de aprobar. El costo se toma literalmente, sin aplicar descuentos ni impuestos inferidos. El operador confirma que la unidad y presentación corresponden a la variante. Cuando una nueva lista cambia la identidad del artículo, se retira el vínculo anterior hasta volver a confirmarlo.

La selección masiva propone solo coincidencias únicas de producto y presentación contra las variantes activas originadas en `Alambres Tandil.xlsx`, hoja `Stock`. Las filas OCR, duplicadas, sin costo o sin coincidencia exacta quedan para revisión individual. El operador puede desmarcar propuestas; al preparar la selección, las demás filas se omiten de esa lista. Se pueden volver a incluir y corregir antes de aprobar. La aprobación registra costos únicamente para los artículos seleccionados y comprados por la empresa; no modifica existencias ni precios de venta. El Excel define qué referencias trabaja la empresa, no un precio de venta vigente.

## Márgenes

Margen bruto = (precio de venta − costo) / precio de venta × 100. El objetivo puede confirmarse por familia o por variante; la variante tiene prioridad. La mediana de márgenes observados en la familia solo se propone a partir de variantes con un costo único; no se confirma automáticamente ni se convierte en una regla global. Los cambios de precio se registran con costo, proveedor, referencia de mercado, margen resultante y actor. Una confirmación desactualizada se rechaza si cambió el costo o el precio.

El piso orientativo es costo / (1 − objetivo / 100). Con referencia de mercado, la sugerencia es el mayor entre piso y promedio; si el piso supera el mercado se muestra una alerta. Sin referencia confiable, se presenta expresamente una guía basada solo en costo y objetivo. El precio final siempre lo confirma el operador.

## Fuentes de mercado

Configurar `MERCADOLIBRE_ACCESS_TOKEN` en el servidor para búsqueda y consulta a Mercado Libre, según los permisos vigentes de su API. Para operación diaria configurar también `MERCADOLIBRE_CLIENT_ID`, `MERCADOLIBRE_CLIENT_SECRET` y el `MERCADOLIBRE_REFRESH_TOKEN` inicial con offline_access. Las credenciales renovadas se guardan cifradas con AES-GCM y el secreto de autenticación del proyecto; un bloqueo en PostgreSQL serializa la renovación entre Functions. Un token de acceso aislado expira y requiere renovación manual. Los resultados de búsqueda son candidatos; necesitan confirmación de identidad por el operador. Se excluyen publicaciones con múltiples variaciones, productos usados, publicaciones inactivas y monedas distintas de ARS.

`MARKET_ALLOWED_HOSTS` es una lista separada por comas de dominios HTTPS exactos de comercios autorizados. El lector admite JSON-LD Product con una única Offer en stock y precio ARS; rechaza rangos, ofertas múltiples y redirecciones. No hay precios inventados ni fuentes de ejemplo incorporadas al catálogo.

El promedio requiere al menos tres vendedores diferentes con coincidencias confirmadas, sin error y una consulta de menos de 36 horas. Se toma una publicación por vendedor y se excluyen valores inferiores a la mitad o superiores al doble de la mediana. Un cambio de título, vendedor, atributos de fuente o atributos internos invalida la coincidencia y requiere revisión.

## Actualización y despliegue

Aplicar la migración `20261013010000_pricing_references` mediante `npm run db:deploy`. Crear `CRON_SECRET` aleatorio de al menos 32 caracteres en Vercel. La tarea `/api/cron/market-prices` se ejecuta diariamente a las 09:00 UTC (06:00 Argentina) y valida Authorization con el secreto. Revisa hasta 500 referencias por ejecución, en grupos de 10 y con un presupuesto de 45 segundos; devuelve consultadas, fallidas y pendientes. El precio publicado nunca se modifica por cron. Para volúmenes superiores debe ampliarse el procesamiento en cola antes de prometer cobertura diaria de todas las referencias.

La conexión a las fuentes y los dominios autorizados deben configurarse antes de obtener referencias reales. Un error de fuente excluye el precio del promedio y queda visible en el panel.

## Verificación local

Usar una base local aislada, ejecutar migraciones y el seed del catálogo. `NEXT_DIST_DIR` permite una vista previa o build independiente sin compartir el caché del servidor existente. Las pruebas incluyen margen frente a recargo, familias con distintos objetivos, muestras insuficientes, duplicados, valores extremos, ofertas ambiguas y extracción real de PDF digital y escaneado.
