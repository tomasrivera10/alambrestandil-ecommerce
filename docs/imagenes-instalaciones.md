# Fotografías de Instalaciones

Selección actualizada el 8 de octubre de 2026 a pedido del usuario: recuperar la foto anterior y mostrar cercos romboidales grandes y prolijos, priorizando el cartel de Alambres Tandil.

1. `/images/tandil/tejido.webp`: fotografía anterior del sitio oficial, 1440 × 1080 px. Vista amplia del cerco y portón. Sin nuevas ediciones. Procedencia: archivo lateral `.json` y https://alambrestandil.com.ar/.
2. `/images/hero/alambrado-tandil-editado.webp`: fotografía aportada previamente por el dueño y editada previamente para el hero; muestra el cerco en profundidad y cartel visible. Archivo web 2560 × 1441; salida generativa previa 1672 × 941, ampliada para web, no detalle nativo 4K. Sin nuevas ediciones. Origen y prompt exacto en `public/images/hero/provenance.json`.

Se retiraron del carrusel y de sus archivos las tres fotos de la selección anterior. No se presentan imágenes rurales ni detalles de madera como muestra de cercos romboidales. La foto anterior no tiene cartel de la empresa; se conserva por indicación expresa del usuario. La segunda sí lo tiene.

Marco de altura acotada 260–320 px en escritorio y 4:3 en móvil, imágenes completas con `object-fit: contain`, navegación manual, táctil y por teclado, enlaces de origen con etiqueta específica por archivo. Conserva la identidad existente; sin cambios a DESIGN.md ni tokens globales.

Verificación: TypeScript y lint correctos. Revisión visual de escritorio y celular y navegación entre las dos vistas.

## Composición de la sección
Encabezado compacto a ancho completo, seguido de galería y formulario alineados. El título conserva el texto original, con escala máxima de 48 px. Formulario en dos columnas y campos largos a ancho completo. Primera imagen precargada. Estilos exclusivos de Instalaciones, sin alterar las demás páginas de servicio. Verificación visual a 1512×780 y 390×844.

## Encuadre actualizado
Por pedido expreso del usuario, las fotografías ahora llenan todo el marco con `object-fit: cover`, sin márgenes blancos. Se admite el recorte proporcional necesario; se conserva el centro del cerco y el cartel de la segunda foto.
