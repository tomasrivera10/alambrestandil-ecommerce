# Revisión de listas por lote

La pantalla principal es una tabla editable. Permite corregir descripciones, costos, moneda y variantes sin abrir un formulario por artículo. Las propuestas no modifican costos hasta la aprobación explícita del lote.

## Uso

1. **Con vínculo o propuesta:** muestra los artículos asociados o sugeridos. Seleccionar el grupo, comparar las medidas y alertas visibles y confirmar toda la selección en una operación.
2. **Sin vínculo:** asociar desde la misma tabla o seleccionar el grupo y omitirlo. Omitir es reversible desde el filtro Omitidos.
3. **Ver original:** abre el recorte de la fila; el documento completo sigue disponible.
4. **Aprobar costos del lote:** se habilita después de confirmar u omitir todos los pendientes. No modifica inventario ni precios de venta.

Las dimensiones invertidas de puertas y portones se proponen para confirmar, nunca se aceptan automáticamente. Se conservan medidas, accesorios y presentación; no se interpreta O como cero. Los vínculos aprobados del mismo proveedor se reutilizan cuando la identidad y la unidad siguen coincidiendo. Cambiar un código real requiere revisión; los códigos sintéticos MT-/AUTO- pueden reutilizarse entre nombres equivalentes.

## Lectura de catálogos diagramados

El extractor de Metales Tratados usa las posiciones de precios como anclas, renderiza las filas y aplica OCR local con Tesseract. Así evita importar texto oculto debajo del diseño. Contrasta las descripciones y los precios visibles contra el texto digital. Las discrepancias o lecturas de baja confianza se marcan para confirmación. Las columnas de precios se separan por presentación cuando pueden leerse sus encabezados. Una celda visualmente vacía no se convierte en un precio por tener texto oculto.

Los precios USD se conservan como USD y no pueden aprobarse como ARS sin una conversión manual explícita. No se infieren IVA, descuentos ni tipos de cambio. Las páginas escaneadas y formatos sin posiciones suficientes conservan la lectura OCR con advertencias.

## Controles

- Cada mutación exige requireArea("suppliers") en el servidor.
- Los cambios por lote validan todos los artículos antes de escribir, dentro de una transacción Serializable. Rechazan variantes inexistentes o inactivas, unidades incompatibles, precios inválidos y vínculos duplicados.
- La revisión incluye una huella del borrador: una pestaña desactualizada no sobrescribe una edición posterior. La aprobación también comprueba esa huella.
- Las variaciones mayores al 25% se señalan; el umbral se define en COST_CHANGE_LIMIT.
- Las ediciones locales se seleccionan automáticamente y no pueden descartarse al guardar otro grupo sin aviso.
- La relectura deja un respaldo reversible. Conserva las decisiones humanas únicamente cuando página, descripción, costo, moneda y presentación coinciden sin ambigüedad. Las decisiones sin correspondencia se mantienen señaladas para revisar.
- Las nuevas aprobaciones guardan el estado anterior y el timestamp aplicado de cada artículo. La reversión se bloquea si hubo modificaciones posteriores. Las aprobaciones históricas sin respaldo no ofrecen reversión.
- Los recortes requieren permiso de proveedores, verifican la versión de la lectura y se sirven con Cache-Control privado sin almacenamiento.

Las dos listas pendientes de Metales Tratados fueron releídas durante la implementación, con respaldo de sus filas anteriores. Los artículos y costos del proveedor permanecieron sin cambios.
