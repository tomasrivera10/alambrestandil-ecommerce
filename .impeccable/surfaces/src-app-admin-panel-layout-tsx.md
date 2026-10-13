---
version: 1
slug: "src-app-admin-panel-layout-tsx"
primary_target: "src/app/admin/(panel)/layout.tsx"
related_targets: ["src/app/admin", "src/components/admin"]
---

# Panel de Alambres Tandil

Modo Operate. Usuario: dueño, ventas y depósito, con poca tolerancia a navegación extensa o términos técnicos. Implementación directa en código a partir del plan confirmado: Tiendanube para catálogo, Shopify para stock y Lightspeed para revisar documentos de proveedores; identidad propia roja, carbón y fotografía de materiales.

## Direction contract

THESIS: reconocer el producto por su foto y presentación, realizar la tarea desde su ficha y entender cada precio de inmediato.
OWN-WORLD: superficie clara, navegación carbón con cinco destinos, acento rojo. Archivo para títulos, Figtree para operaciones y cifras tabulares. Controles delimitados de 46 px, radios de 6–10 px para estructura del panel, espaciado funcional 8/12/16/20/24/32/40 px. Costo #87501b, mercado #2159a0, sugerido #1f6848 y venta #a91a22, siempre con rótulos.
STORY: producto → medida → stock; proveedor → documento → fila → costo literal → margen confirmado → comparación → precio confirmado.
FIRST VIEWPORT: navegación breve y la tarea de la sección; catálogo con fotos y disponibilidad, proveedores con carga de lista y pasos concretos.
FORM: edición progresiva, vista previa de documento, fotos reales o de referencia claramente identificadas, errores recuperables y confirmación antes de stock/precio. Las cifras y los inputs no se animan. FadeContent adaptado de React Bits solo para resultado de una carga.
FINISH: escritorio y móvil, controles de permisos, PDF digital/OCR, historial y precios sin fuentes suficientes revisados. Datos numéricos de las capturas de prueba son sintéticos y pertenecen a una base local aislada. Conexiones de mercado deben configurarse antes de obtener datos reales.
