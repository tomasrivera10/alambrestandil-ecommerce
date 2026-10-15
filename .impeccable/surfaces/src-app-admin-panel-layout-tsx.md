---
version: 1
slug: "src-app-admin-panel-layout-tsx"
primary_target: "src/app/admin/(panel)/layout.tsx"
related_targets: ["src/app/admin", "src/components/admin"]
---

# Panel de Alambres Tandil

Modo Operate. Usuario: dueño, ventas y depósito, con poca tolerancia a navegación extensa o términos técnicos. Implementación directa en código a partir del plan confirmado: dirección aprobada «mostrador y materiales»; catálogo y stock tienen prioridad en la primera etapa. Inicio, navegación y ficha acompañan el recorrido. Proveedores, métricas y configuración conservan sus capacidades para una etapa posterior.

## Direction contract

THESIS: reconocer el producto por su foto y presentación, realizar la tarea desde su ficha y entender cada precio de inmediato.
OWN-WORLD: fondo #f4f4f0, tinta #252824, navegación #242925, superficie blanca, texto secundario #5d665f, bordes #d9ddd7, campos #b9c1b9 y acento #b51f24 (hover #94181d). Inicio, Catálogo, Stock, Pedidos, Clientes y Proveedores según rol; Gestión agrupa Resultados y Configuración. Archivo para títulos, Figtree para operaciones y cifras tabulares. Campos de 46 px, acciones de 44 px, radios de 3–4 px y escala fija de 11/12/13/14/15/16/18/20/25/30 px. Costo #87501b, mercado #2159a0, sugerido #1f6848 y venta #a91a22, siempre con rótulos.
STORY: producto → medida → stock; proveedor → documento → fila → costo literal → margen confirmado → comparación → precio confirmado.
FIRST VIEWPORT: inicio con tareas accionables por rol; catálogo compacto con búsqueda, fotografía y disponibilidad; stock con búsqueda global sin selección previa de categoría. Filtros y secciones secundarias progresivos. Tablas de catálogo y stock apiladas en móvil.
FORM: ficha por tareas enlazables mediante fragmentos, con formularios montados al navegar; edición progresiva, vista previa de documento, fotos reales o de referencia claramente identificadas, errores recuperables y confirmación antes de stock/precio. Las cifras y los inputs no se animan. FadeContent adaptado de React Bits solo para resultado de una carga.
FINISH: escritorio y móvil, controles de permisos, PDF digital/OCR, historial y precios sin fuentes suficientes revisados. Datos numéricos de las capturas de prueba son sintéticos y pertenecen a una base local aislada. Conexiones de mercado deben configurarse antes de obtener datos reales.
