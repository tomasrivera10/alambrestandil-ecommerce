# Fuentes para el rediseño público

Revisadas el 7 de octubre de 2026. Implementación de la tienda pública completada sobre la dirección aprobada YETI + Milwaukee.

## Alcance confirmado

- Rediseñar la tienda pública; panel administrativo en otra etapa.
- Mantener armado de pedidos y cierre por WhatsApp, sin pago online.
- Conservar el logo de la empresa y usar contenido real; el diseño debe ser completamente distinto del sitio anterior.
- Incorporar un video real del feed de Instagram en el hero, pendiente de selección y archivo de calidad suficiente.

## Herramientas de diseño y componentes solicitadas

Pedido explícito del usuario: aplicar las skills y componentes de estas referencias durante el rediseño.

- Impeccable: https://impeccable.style — skill local `/Users/tomaspc/.codex/skills/impeccable/SKILL.md`, para planificar UX, definir dirección y revisar calidad.
- Taste Skill: https://www.tasteskill.dev — skill local `/Users/tomaspc/.codex/skills/taste-official/SKILL.md`, para una dirección visual propia y composición cuidada.
- React Bits: https://reactbits.dev — evaluar componentes y efectos concretos para movimiento y presentación; revisar documentación y dependencias de cada elección antes de implementar. Respetar movimiento reducido y rendimiento móvil.
- shadcn/ui: https://ui.shadcn.com/docs/components — aprovechar los componentes existentes del proyecto basados en Base UI, adaptando su aspecto al nuevo sistema visual. Verificar compatibilidad antes de incorporar nuevos componentes.

No instalar librerías ni incorporar efectos solo por figurar en esta lista. La selección debe servir al recorrido comercial y a la identidad aprobada.

## Requisitos de experiencia confirmados

El usuario exige un reemplazo completo del diseño público, no una variación sutil del actual. Conservar las funcionalidades comerciales y las URLs; reemplazar composición, jerarquía, presentación y sistema visual. El panel administrativo queda fuera de esta etapa.

### Estructura del nuevo ecommerce

- Header con logo real, navegación clara, búsqueda visible y acceso al pedido. Versión móvil con navegación accesible y sin superponer controles.
- Hero audiovisual con mensaje comercial breve y acceso directo al catálogo. Video real pendiente; imagen de respaldo mientras no haya un archivo validado.
- Categorías visuales que ayuden a reconocer materiales rápidamente.
- Productos destacados seleccionados con datos reales; precios y disponibilidad según las reglas actuales.
- Sección para explorar soluciones por necesidad de cercado, conectada con las páginas existentes.
- Bloque de publicidad Romboidal con identidad de fabricante, imágenes y movimiento cuidado, enlazado a productos realmente asociados a la marca.
- Calculadora e instalaciones integradas como recorridos de asesoramiento.
- Información del local e historia verificable para aportar confianza.
- Footer completo con navegación, contacto, ubicación y redes.

La implementación organiza estos bloques en inicio, catálogo, ficha y páginas de servicio. No inventar promociones, testimonios, descuentos ni condiciones comerciales para llenar secciones.

### Catálogo y filtrado

- Búsqueda y categoría como entradas principales. Filtros técnicos relevantes según categoría, aprovechando `filterKeys` y atributos existentes.
- Escritorio: zona de filtros estable y legible. Celular: panel accesible con selección clara y acción «Ver resultados», evitando navegación accidental por cada toque.
- Mostrar filtros activos, cantidad de resultados y «Limpiar filtros». Permitir quitar un filtro individualmente.
- Mantener selección y orden en la URL para compartir, recargar y volver desde una ficha sin perder contexto.
- Conservar selecciones al cambiar el orden; limpiar o reconciliar atributos incompatibles al cambiar categoría.
- Ofrecer opciones basadas en datos reales, con estados claros para combinaciones sin resultados. No agregar rangos de precio si los datos ocultos o incompletos los vuelven engañosos.
- Carga sin saltos de composición, resultados vacíos con salida útil y errores diferenciados de un catálogo sin productos.
- Evaluar volumen del catálogo y consultas antes de implementar: evitar filtrar todo el catálogo en el cliente o repetir consultas innecesarias; definir paginación y consultas de servidor según el volumen real.

### Movimiento y material visual

- Animaciones coordinadas y breves en navegación, filtros, productos y carrito; respuesta inmediata a las acciones del cliente.
- Publicidad animada con mensaje legible y acceso estable; evitar carruseles rápidos o cambios que desplacen controles. Dar pausa cuando corresponda.
- Respetar movimiento reducido, teclado, foco, contraste y controles táctiles. Mantener contenido accesible si el video o los efectos no cargan.
- Seleccionar React Bits según compatibilidad y rendimiento, con efectos aislados; no cargar efectos pesados en todo el catálogo.
- Usar fotos y videos reales con resolución y encuadre apropiados, atribuyendo correctamente las imágenes del fabricante.

### Criterios para evaluar el reemplazo

- Inicio, catálogo y ficha deben mostrar una composición y jerarquía nuevas en escritorio y celular; cambiar colores o radios por sí solo no cumple el pedido.
- La identidad proviene del logo real de Alambres Tandil; el bloque Romboidal conserva su marca sin dominar la tienda.
- Se puede buscar, filtrar, elegir variantes, armar y revisar el pedido y continuar por WhatsApp.
- La calculadora, instalaciones y consultas conservan su funcionamiento.
- Header, footer y secciones son reconocibles; el movimiento no retrasa la compra ni oculta información esencial.
- Validar visualmente en escritorio y móvil y comprobar recorridos y accesibilidad al implementar. Validaciones ejecutadas: TypeScript, ESLint, 13 tests existentes y compilación de producción con Webpack. En navegador: marca + stock, filtro técnico por altura, variantes, carrito y paso de datos/entrega. No se generaron pedidos de prueba en la base de datos.

## Marca recuperada

- `public/brand/alambres-tandil-marca.png`: marca en color, 4168 × 4168, desde https://alambrestandil.com.ar/img/at-logo.png
- `public/brand/alambres-tandil-logo.webp`: variante blanca, 4168 × 4168, desde https://alambrestandil.com.ar/img/Logos/Alambres%20Tandil%20-%20Logotipo%20Final%20Positivo%20(1).webp
- Inspección visual: isotipo geométrico AT y alambre; nombre Alambres Tandil; bajada La Casa del Alambrado; variante en color con rojo y carbón. El verde de DESIGN.md no coincide con esta evidencia de marca. Definir los nuevos tokens en la etapa de diseño, sin tratar aquel documento como autoridad cromática.
- Los originales tienen mucho espacio alrededor; preparar versiones de presentación optimizadas al implementar, conservando los originales.

## Información comprobada en el sitio

Fuente: https://alambrestandil.com.ar/

- Dirección: Ijurco 1480, esquina colectora Macaya, Ruta 226, Tandil.
- Contacto: 249 4214973; Alambrestandil@gmail.com.
- WhatsApp enlazado por el sitio y el perfil: https://wa.me/message/GADFWAJGSDYNA1 (no inferir otro número de destino).
- Materiales e instalación de cercos perimetrales.
- Familias publicadas: tejido romboidal, revestido tipo ligustrina, PVC, concertinas, alambre de púas, malla electrosoldada, postes y placas de hormigón, puertas y portones, clavos.
- Historia publicada: Mauro Broggia inició el proyecto en 2018; relación familiar con Alambrados Neri SH. No atribuir la trayectoria de Neri íntegramente a Alambres Tandil.
- Hay fotografías utilizables como candidatas en la galería del sitio, por ejemplo `/img/gallery/cercos.webp`, `/img/gallery/rollos.webp`, `/img/gallery/portones.webp` y `/img/gallery/materiales.webp`. Pendiente evaluar resolución y encuadre antes de seleccionar.
- No se verificaron horarios, precios, plazos de entrega ni certificaciones independientes; no inventarlos ni convertir afirmaciones del sitio en acreditaciones propias.

## Instagram y video del hero

Fuente: https://www.instagram.com/alambrestandil/?hl=es

El perfil público muestra enlaces a reels, pero abrir una publicación exige registro o inicio de sesión en el navegador disponible. No se inspeccionó el contenido, la resolución ni la duración de esos videos. No hay todavía un video elegido o descargado.

Enlaces observados en el feed, solo para revisión posterior:

- https://www.instagram.com/alambrestandil/reel/DdW-olTou60/
- https://www.instagram.com/alambrestandil/reel/DdMH0k_Isxt/
- https://www.instagram.com/alambrestandil/reel/DXu_T6bDb0O/

Propuesta de producción, pendiente de validar el material: segmento de 8–15 segundos, silencioso, bucle discreto, imagen de respaldo, control para pausar y alternativa estática con movimiento reducido. Evaluar encuadres específicos de escritorio y celular; evitar ampliar indiscriminadamente un reel vertical. Preferir el archivo original para preservar calidad y servir una versión optimizada estable desde el sitio. No prometer alta definición sin examinar el archivo.

## Promoción de Romboidal

Pedido explícito del usuario: incorporar publicidad de Romboidal, cuyos productos comercializa Alambres Tandil.

- Fuente oficial revisada: https://www.romboidal.com.ar/
- Logo recuperado del encabezado: `public/brand/romboidal-logo.png`, origen https://www.romboidal.com.ar/img/logo.png
- La web oficial presenta tejidos galvanizados, PVC, revestidos, mallas y accesorios, entre otras familias. Esa oferta no demuestra por sí sola qué referencias están disponibles en Alambres Tandil.
- Propuesta para el nuevo inicio: bloque promocional después de categorías o productos destacados, con logo, fotografía relevante, texto «Trabajamos con productos Romboidal» y acceso al catálogo de la marca disponible en la tienda.
- Identificar la marca en fichas y filtros donde el dato real del producto corresponda; no asignar Romboidal a todo el catálogo automáticamente.
- Mantener Alambres Tandil como marca principal. Los pedidos se dirigen a su carrito y WhatsApp; el enlace al fabricante es secundario.
- No afirmar distribuidor oficial, exclusividad ni certificaciones sin documentación específica.

### Imágenes del fabricante

El usuario autoriza tomar imágenes de Romboidal para complementar el rediseño. Se recuperaron e inspeccionaron estas imágenes oficiales, todas de 280 × 280 píxeles:

| Archivo local | Origen |
| --- | --- |
| `public/images/romboidal/tejido-romboidal.webp` | https://www.romboidal.com.ar/img/productos/tejido-romboidal.webp |
| `public/images/romboidal/tejido-pvc.webp` | https://www.romboidal.com.ar/img/productos/tejido-pvc.webp |
| `public/images/romboidal/tejido-ligustrina.webp` | https://www.romboidal.com.ar/img/productos/tejido-ligustrina.webp |
| `public/images/romboidal/mallas.webp` | https://www.romboidal.com.ar/img/productos/mallas.webp |

Son candidatas para miniaturas y referencias de categorías. Su resolución limita el tamaño de presentación; no usarlas ampliadas como hero o grandes banners. Las miniaturas de obras observadas en el sitio tienen 400 × 283 píxeles y tampoco aseguran calidad para una portada amplia. Al presentar imágenes del fabricante, no atribuir esas obras a Alambres Tandil. Una ficha comercial debe mostrar el producto concreto, no asumir que toda foto genérica representa exactamente una variante disponible.

## Implementación y límites

FadeContent de React Bits adaptado a Web Animations; licencia en third-party-react-bits.md. Controles Sheet, Button, Input y Textarea de shadcn/Base UI existentes. No se añadieron dependencias.

El video se conecta con NEXT_PUBLIC_HERO_VIDEO_URL (MP4/WebM propio). Instagram exigió inicio de sesión para recuperar el reel; el hero muestra fotografía real mientras no haya archivo. Tiene pausa, reproducción silenciosa, fallback y respeto por movimiento reducido.

Catálogo paginado en servidor (12 productos), filtros combinados sobre una misma variante activa, stock neto de reservas, filtros activos removibles y búsqueda con ranking existente. La búsqueda textual aún evalúa candidatos en servidor; para catálogos masivos conviene migrar a búsqueda indexada.

Fotos de categoría utilizadas como respaldo se rotulan Imagen de referencia. Productos sin foto propia ni referencia apropiada muestran Foto próximamente. No se modificaron productos, precios, stock ni pedidos para completar el diseño.
