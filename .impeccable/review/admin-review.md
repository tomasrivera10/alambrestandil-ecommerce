# Revisión del panel

Revisión independiente de Impeccable: `disposition: ship` para la corrección final de vista original de Excel y Word. Se resolvió la única observación material; se mantuvieron navegación de cinco destinos, fotos de referencia identificadas, confirmaciones y rótulos/colores de precios.

Verificación: build final correcto, TypeScript y ESLint correctos, 78 pruebas en 19 archivos. Pruebas reales de extracción PDF digital y escaneado, vista original Excel/Word, permisos y cambios desactualizados. Flujo UI en base aislada: alta en borrador con URL automática, medida con SKU automático, PDF→revisión→costo aprobado→margen80%→precio102,50 confirmado, ingreso de12 unidades. Los importes y movimientos de las capturas son datos sintéticos de prueba.

Migración aditiva 20261013010000_pricing_references aplicada a la base configurada. Los flujos de prueba se ejecutaron únicamente en la base local admin-redesign.

Capturas: admin-prices-desktop.png / admin-prices-mobile.png; admin-preview-desktop.png / admin-preview-mobile.png; admin-final.png. Anchos de documento comprobados: 1440 y390 sin desborde. El desplazamiento horizontal de la tabla de Excel queda dentro de su componente.

Conexiones externas pendientes de credenciales: Mercado Libre, dominios comerciales habilitados y CRON_SECRET de despliegue. No se presentan fuentes o precios reales hasta su conexión y confirmación de coincidencias.
