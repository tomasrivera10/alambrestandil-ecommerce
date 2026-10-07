---
name: Alambres Tandil
description: Comercio industrial local, fotografía de obra y pedido asistido por WhatsApp.
colors:
  primary: "#d30000"
  primary-hover: "#ac0000"
  white: "#fff"
  ink: "#171b1f"
  muted: "#f2f3f3"
  header-surface: "#f7f7f7"
  header-divider: "#eceeef"
  charcoal-hover: "#343a40"
  muted-foreground: "#5a6268"
  border: "#dce0e1"
  field-border: "#cbd0d3"
  field-border-strong: "#b9bfc3"
  light-hover: "#e7ebed"
  stock-available: "#326042"
typography:
  display:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(3.5rem, 6.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Archivo, sans-serif"
    fontSize: "clamp(2rem, 3.5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  product-title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.65
  button-label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
  category-label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "10px"
    letterSpacing: "0.06em"
  price:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
rounded:
  square: "0px"
  control: "2px"
  indicator: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  grid: "20px"
  lg: "24px"
  heading: "32px"
  gutter: "40px"
  section-mobile: "52px"
  section: "80px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.white}"
    typography: "{typography.button-label}"
    rounded: "{rounded.square}"
    padding: "14px 24px"
    height: "50px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-light:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    typography: "{typography.button-label}"
    padding: "14px 24px"
    height: "50px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.button-label}"
    padding: "14px 24px"
    height: "50px"
  search-input:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    padding: "0 16px"
    height: "44px"
  navigation:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    height: "44px"
  active-filter:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.ink}"
    padding: "7px 10px"
    height: "34px"
  product-card:
    textColor: "{colors.ink}"
    rounded: "{rounded.square}"
---

# Design System: Alambres Tandil

## Overview

**Creative North Star: “La casa del alambrado, a escala de obra.”** Nombre descriptivo de la dirección aprobada: estructura comercial de YETI, carácter industrial de Milwaukee y movimiento inspirado en React Bits. La identidad propia la aportan el logo real, el rojo, el carbón y las fotografías del negocio y de sus materiales.

La tienda pública combina campañas amplias con información de producto precisa. El recorrido lleva de reconocer el negocio a encontrar material, elegir medida y armar un pedido trazable. La geometría firme, las superficies claras y los títulos Archivo sostienen una experiencia concreta, legible desde el celular.

Este documento registra la implementación de `src/app/(store)/storefront.css` y `src/components/store`, con fuentes de `src/app/layout.tsx` y valores compartidos de `src/app/globals.css`. Reemplaza la antigua dirección verde para el storefront por autorización explícita del usuario. El administrador conserva su estructura compacta de tablas y formularios; no recibió este rediseño de superficies. Sus tokens globales actuales también son rojos, con texto `#222222`, fondo `#ffffff` y bordes `#d6d6d6`; no describirlo como una interfaz verde. Los valores del frontmatter corresponden a la tienda pública.

**Key Characteristics:**
- Fotografía real rectangular y campañas de ancho completo.
- Rojo de marca para acciones; carbón para estructura y contraste.
- Archivo para jerarquía, Figtree para lectura y controles.
- Catálogo, filtros y pedido con información visible y geometría sobria.
- Movimiento breve, con pausa donde corresponde y respeto por movimiento reducido.

## Colors

La paleta es blanco, carbón y rojo, con grises fríos funcionales. El verde de disponibilidad es semántico y no constituye un segundo acento de marca.

### Primary
- **Rojo de marca** (`primary`): acciones, navegación de catálogo, selección y foco. El hover del botón usa `primary-hover`.

### Neutral
- **Blanco** (`white`): fondo de tienda y campos; texto sobre acciones y campañas oscuras.
- **Carbón** (`ink`): títulos, texto principal, botón de pedido, campaña y pie.
- **Gris de superficie** (`muted`): búsqueda, medios de producto, resumen de pedido y formularios.
- **Gris de lectura secundaria** (`muted-foreground`): descripciones, unidades y metadatos.
- **Grises de borde** (`border`, `field-border`, `field-border-strong`): separación y delimitación de controles.
- **Gris de interacción clara** (`light-hover`): hover de botones blancos.

**Regla de identidad.** Mantener el rojo del logo real; Romboidal es un fabricante comercializado, no la identidad de la tienda.

## Typography

**Display Font:** Archivo, sans-serif; pesos cargados 500, 600 y 700, títulos principales en 700.
**Body Font:** Figtree, ui-sans-serif, system-ui, sans-serif.
**Label/Mono Font:** JetBrains Mono está disponible mediante `--font-jetbrains` / `font-mono`; usarlo sólo donde la implementación lo requiere. Los precios públicos actuales usan Figtree, no mono.

Archivo aporta firmeza industrial; Figtree mantiene la lectura de descripciones, medidas y formularios. Los títulos usan balance de líneas.

### Hierarchy
- **Display:** token `display`, mayúsculas en hero; ancho máximo 850px. A 800px baja a `clamp(3rem, 9vw, 4.6rem)`; a 380px, 2.8rem.
- **Headline:** token `headline`, encabezados de sección. El h1 general usa `clamp(2.6rem, 5vw, 4.5rem)` y altura 1.04; catálogo y servicios tienen escalas propias.
- **Product title:** token `product-title`; 16px en catálogo móvil.
- **Body:** token `body` para introducciones y descripciones principales. Texto de servicio 16–18px; metadatos 10–12px. Evitar elevar todo el texto a tamaño de campaña.
- **Label:** categorías en mayúsculas con token `category-label`; botones con `button-label`.
- **Price:** token `price`; ficha de variante 25px, peso 600.

**Regla de tracking.** Los títulos usan el espaciado observado por contexto: normalmente -0.035em, servicios -0.04em, producto -0.02em. No comprimir por debajo de -0.04em.

## Layout

Contenedor de ancho `min(100% - 80px, 1360px)`, centrado. A 800px los márgenes son 20px; a 380px, 14px. Secciones con 80px verticales, 52px en móvil. La escala del frontmatter recoge medidas observadas, no exige convertir cada separación a una única cadencia.

Inicio: categorías y destacados en cuatro columnas, dos en móvil. Catálogo: sidebar de 220px y contenido con gap 46px; a 1100px sidebar 200px, gap 28px y productos en dos columnas. A 800px filtros en panel lateral y catálogo en dos columnas. Servicios pasan de dos columnas a una a 760px. La ficha de producto usa dos columnas y galería sticky en escritorio; a 800px se apila y elimina sticky.

Header de escritorio sticky de 84px, una sola fila con logo de 160px, navegación, búsqueda y acciones. A 1050px la navegación pasa al menú lateral y la altura baja a 76px. A 600px la búsqueda ocupa una segunda fila de 44px y el header conserva su posición sticky; logo de 124px y pedido con icono y contador. Los paneles de menú/filtros usan `min(90vw, 380px)`; pedido `min(100vw, 470px)`.

## Elevation & Depth

La tienda es plana: separadores de 1px y cambios de superficie construyen jerarquía. Las tarjetas públicas no usan sombras decorativas. El hero emplea gradientes oscuros sobre fotografía para legibilidad; los paneles laterales usan la infraestructura Sheet existente de shadcn/Base UI. El token global `--shadow-soft: 0 1px 0 rgb(18 18 18 / 0.06)` existe, pero no define la tarjeta de producto.

## Shapes

Imágenes rectangulares y campos de esquina recta. El radio global de controles shadcn es 2px; filtros y resumen del carrito lo conservan cuando se declara. Formularios de servicio y botones de campaña usan radio 0. El círculo queda reservado al contador y a indicadores de stock/filtro. Las tarjetas son contenido abierto, no cajas redondeadas elevadas.

## Components

La cabecera usa `src/components/store/site-header.module.css`, importado directamente por `SiteHeader`, para mantener sus estilos ligados al componente y aislados del CSS global de la tienda.

### Buttons

Acciones firmes y legibles: rojo/blanco, altura mínima 50px, padding 14px 24px, texto 13px/700. Hover rojo profundo en 200ms; active escala 0.98. Variante clara: blanco/carbón y hover gris claro. Variante outline: borde carbón; hover carbón/blanco. Foco visible rojo de 2px con offset 4px. Los botones de formularios y carrito tienen medidas propias documentadas en CSS.

### Chips

Filtros activos rectangulares, superficie gris, borde de 1px, texto 11px, padding 7px 10px y altura mínima 34px. Hover refuerza el borde carbón; la acción de quitar mantiene nombre accesible. La categoría seleccionada usa rojo y peso 700.

### Cards / Containers

Tarjetas de producto sin sombra ni marco exterior. Imagen recortada, copia debajo con 18px de separación, nombre Archivo, descripción breve y precio separado por borde superior. Hover de imagen escala 1.035 en 600ms; flecha cuadrada cambia a rojo/blanco. Categorías usan fotografía vertical y zoom 1.045 en 700ms. Si falta una imagen, mostrar el estado honesto de consulta; una referencia visual se rotula como tal.

### Inputs / Fields

Búsqueda de cabecera gris con borde visible, altura 44px, padding horizontal 14px y botón rojo de 44px con lupa. Foco del contenedor con outline rojo de 2px y offset de 2px. Filtros con borde gris, altura mínima 44px; formulario de servicio con borde fuerte y altura mínima 46px. Foco rojo visible; búsqueda de catálogo usa `focus-within` con outline 2px y offset 2px. No ocultar el foco del contenedor cuando el input interno elimina su outline.

### Navigation

Navegación integrada en una única fila blanca, Figtree 13px/600. La página o sección activa usa texto rojo y subrayado; Productos ya no lleva un color fijo. El estado sigue rutas anidadas y búsqueda; en inicio sigue el scroll. El menú móvil comparte la selección y la conserva mientras bloquea el desplazamiento. Calculadora y contacto son accesos de icono de 44px con nombre accesible y tooltip nativo. Contacto pasa al menú por debajo de 1200px; toda la navegación pasa al menú por debajo de 1050px. Pedido usa botón carbón de 44px y contador blanco; el texto se oculta en móvil.

### Campañas y movimiento

Hero de fotografía real con título blanco, CTA rojo y gradiente de contraste. El video sólo se activa con un archivo real validado mediante `NEXT_PUBLIC_HERO_VIDEO_URL`; sigue pendiente el original de Instagram detrás de login y se usa fotografía de respaldo. No simular disponibilidad del video.

FadeContent adapta React Bits mediante Web Animations API: 650ms, `cubic-bezier(.16,1,.3,1)`, blur de 3px a 0 y desplazamiento vertical de 18px a 0, una sola vez al entrar en viewport. Campaña Romboidal con ticker de 35s lineal y control de pausa. `prefers-reduced-motion` evita el reveal y detiene transiciones/ticker. Mantener el contenido visible antes de ejecutar JavaScript.

## Do's and Don'ts

### Do:
- **Do** conservar el logo real y fotografías de producto, instalaciones y negocio con procedencia registrada.
- **Do** mantener controles claros, foco rojo y movimiento reducido.
- **Do** escribir en voseo: armá, consultá, pedí; el pedido se guarda y continúa por un botón explícito de WhatsApp en la página de éxito.
- **Do** conservar el administrador como mesa de trabajo compacta, sin trasladarle campañas ni animaciones de portada.

### Don't:
- **Don't** recuperar la antigua identidad verde en la tienda ni confundir fabricante con marca propia.
- **Don't** inventar precios, testimonios, certificaciones o imágenes específicas de una variante.
- **Don't** sustituir el catálogo por un botón flotante de WhatsApp ni presentar cobro online.
- **Don't** añadir sombras decorativas, cápsulas generalizadas o tracking más cerrado que -0.04em.

## Recorrido comercial del inicio

La portada mide entre 400 y 500px (480px en móvil) para acercar el catálogo al primer viewport. Categorías con fotografía 4:3, destacados y acceso al catálogo completo preceden a la orientación por proyecto. La campaña grande de Romboidal ya no interrumpe el inicio; la referencia al fabricante sigue en el pie. Los accesos internos llevan a soluciones, instalación y local con margen para el header sticky. La información del negocio cierra el recorrido.

### Hero de instalación (octubre 2026)

La portada usa la fotografía aportada por el usuario, editada con ImageGen para mejorar luz, color, definición y encuadre horizontal. Asset WebP de 2560 × 1441px, ampliado desde la salida de 1672 × 941px; no es captura nativa 4K. Procedencia y prompt completo en `public/images/hero/provenance.json`. En escritorio el cartel queda a la derecha y la sombra se limita al área de texto. Hasta 800px, la fotografía ocupa un bloque superior de 240–360px y la copia continúa sobre carbón, sin superponerse al cartel.

### Ficha de producto (octubre 2026)

Plantilla compartida con ancho máximo de 1200px y galería contenida de hasta 440px en escritorio y 360px en móvil. La foto conserva la proporción sin recortar; se puede ampliar en un diálogo accesible. En móvil, nombre, descripción breve y unidad preceden a la galería. Las imágenes orientativas mantienen su etiqueta y fuente.

Hasta seis variantes se muestran como radios con superficies de selección de 46px, selección carbón y foco rojo; para más variantes se usa Select de Base UI con navegación por teclado y opciones de al menos 44px. Orden natural de medidas. Los controles de cantidad de 48px reúnen edición directa, decremento e incremento; cantidades enteras para unidades discretas y decimales para metros/kg. Acción roja de 48px, radio local de 4px y confirmación de agregado. Se conserva el mínimo de una unidad del recorrido existente.

Descripción técnica visible bajo la ficha, usos y documentación solo cuando existen, guía de pedido, retiro y aclaración de precio/stock/entrega. FadeContent adaptado de React Bits presenta el bloque principal una vez y respeta movimiento reducido. No sumar efectos decorativos sobre controles o texto técnico. Tipografía local: 12px para información secundaria, 13–15px para lectura/controles, 18px para subtítulos, 24px para sección, 26px para precio y título fluido de 32–44px. Las fichas no garantizan stock ni reemplazan contenido técnico faltante por afirmaciones generadas.
