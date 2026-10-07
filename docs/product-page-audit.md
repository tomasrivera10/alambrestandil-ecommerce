# Auditoría de fichas de producto — 7 de octubre de 2026

## Alcance

Plantilla compartida del catálogo. Se comprobaron por HTTP las 31 rutas de `prisma/catalog.json`: todas responden y muestran la sección de descripción. Treinta presentan variantes; Clavo con cabeza de plomo dentado no tiene variantes activas en la base local y muestra la consulta de disponibilidad prevista.

## Cambios aplicados

- Galería de altura acotada, imagen completa sin recorte, ampliación accesible, miniaturas cuando existen y etiquetas/fuentes de referencias conservadas.
- Título antes de la imagen en móvil; imagen e información alineadas en escritorio.
- Medidas como radios para hasta seis opciones; Select de Base UI para catálogos de medidas más extensos, con opciones multilínea y teclado.
- Orden natural de medidas; SKU, disponibilidad y atributos vinculados a la variante.
- Cantidad editable con −/+, nombre accesible, validación y acción de pedido con confirmación.
- Descripción técnica visible, usos/documentación condicionales, retiro, consulta y guía del pedido sin cobro online.
- FadeContent adaptado de React Bits reutilizado para la entrada del bloque principal; movimiento reducido respetado. Licencia y fuente en `docs/third-party-react-bits.md`.

## Validación

TypeScript y ESLint de los componentes modificados sin errores. Suite existente: 11 archivos, 45 pruebas aprobadas. Revisión en navegador a 1440px y 390px, sin desborde horizontal en móvil. Se comprobaron selección por radios, incremento, rechazo de cantidad fraccionaria en rollos, diálogo de imagen y cambio de medida en el Select de tejido romboidal.

El detector Impeccable señala discrepancias entre la escala tipográfica documentada y estilos existentes y un borde decorativo fuera de la ficha. El sidecar de diseño estaba desactualizado antes de esta tarea; la guía de la ficha queda registrada en DESIGN.md. No se modificaron superficies ajenas para resolver esos avisos.

## Contenido por completar

Las descripciones de la importación son genéricas. Para fichas completas hace falta validar con el local: descripción específica, usos, material/acabado cuando corresponda, recomendaciones y limitaciones de instalación, documentación disponible y fotografías exactas. Precio y disponibilidad dependen de los datos cargados y de confirmación del local. No se inventaron especificaciones ni se modificó la base de datos.
