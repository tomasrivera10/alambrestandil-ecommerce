---
version: 1
slug: "src-app-store-instalaciones-page-tsx"
primary_target: "src/app/(store)/instalaciones/page.tsx"
related_targets: []
---

# Instalaciones · carrusel de trabajos
Modo: Persuade. Visitantes que buscan presupuestar un cerco. Selección corregida por el usuario: recuperar la fotografía anterior y priorizar cercos romboidales grandes, prolijos y con cartel. Primera foto: tejido.webp del sitio oficial; segunda: fotografía del dueño editada previamente para el hero, con procedencia en images/hero/provenance.json.

## Direction contract
THESIS: Mostrar el resultado real junto al formulario de presupuesto, con un carrusel que permite mirar cada detalle.
OWN-WORLD: Heredar Archivo, Figtree, rojo, carbón, blanco y geometría rectangular del sitio existente.
STORY: Ver cercos romboidales amplios, portón y cartel de la empresa; consultar la publicación original o solicitar presupuesto.
FIRST VIEWPORT: Mantener título e introducción a la izquierda y formulario a la derecha. Reemplazar únicamente la foto de Instalaciones por una galería de proporción 4:3, con fotos completas y controles debajo.
FORM: Extensión de superficie existente; sin sorteo ni nueva identidad. Dos vistas amplias de alta resolución, navegación manual, teclado y gesto táctil.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Ajuste de primera vista · 2026-10-08
El usuario adjuntó captura de Safari con título desproporcionado y fotografía debajo del pliegue. Encabezado compacto a ancho completo, luego galería y presupuesto alineados en escritorio. Galería con altura acotada 260–320 px y contain, sin recortar fotografías; móvil conserva 4:3. Formulario en dos columnas, dirección/portón/notas a ancho completo. Verificar 1512×780 (captura del usuario) y 390×844. Sin modificaciones de otros servicios.

## Preferencia de encuadre final
El usuario solicita que la imagen ocupe todo el espacio. Usar cover centrado en el marco existente, permitiendo recorte proporcional y eliminando márgenes blancos. Esta preferencia sustituye el contain anterior.
