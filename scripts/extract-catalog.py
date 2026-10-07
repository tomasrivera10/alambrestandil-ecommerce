"""Read only product names and units. Never extract prices, stock or other sheets."""
import json, re, sys
from pathlib import Path
import openpyxl

root = Path(__file__).resolve().parents[1]
w = openpyxl.load_workbook(sys.argv[1], read_only=True, data_only=True)
families = [
    (3,12,'tejido-romboidal','Tejido romboidal galvanizado','tejido-romboidal-galvanizado'),
    (14,15,'accesorios-de-colocacion','Torniquete zincado','torniquete-zincado'),
    (16,16,'accesorios-de-colocacion','Torniquete doble','torniquete-doble'),
    (18,21,'accesorios-de-colocacion','Planchuela zincada','planchuela-zincada'),
    (23,23,'alambre-galvanizado','Alambre de fardo Nº 16','alambre-de-fardo'),
    (24,27,'alambre-galvanizado','Alambre galvanizado','alambre-galvanizado'),
    (28,28,'alambre-galvanizado','Alambre de alta resistencia 17/15','alambre-alta-resistencia'),
    (29,29,'alambre-galvanizado','Alambre boyero 1,80 mm','alambre-boyero'),
    (31,31,'concertinas','Soporte para concertina en Y','soporte-concertina-y'),
    (32,32,'concertinas','Pinche para medianera eco, 5 puntas','pinche-medianera'),
    (33,34,'concertinas','Concertina de seguridad','concertina-de-seguridad'),
    (36,40,'alambre-de-puas','Alambre de púas','alambre-de-puas'),
    (41,46,'clavos','Clavo con cabeza de plomo dentado','clavo-cabeza-plomo'),
    (48,51,'puertas-y-portones','Puerta para cerco','puerta-para-cerco'),
    (52,55,'puertas-y-portones','Portón para cerco','porton-para-cerco'),
    (57,60,'postes-de-hormigon','Poste esquinero','poste-esquinero'),
    (61,64,'postes-de-hormigon','Poste intermedio','poste-intermedio'),
    (66,68,'postes-de-hormigon','Puntal','puntal'),
    (76,77,'clavos','Clavo punta París','clavo-punta-paris'),
    (78,78,'clavos','Clavo punta París Acerbrag','clavo-punta-paris-acerbrag'),
    (79,79,'clavos','Clavo punta París Acindar','clavo-punta-paris-acindar'),
    (80,84,'clavos','Clavo punta París, medidas grandes','clavo-punta-paris-grande'),
    (85,91,'clavos','Clavo espiralado','clavo-espiralado'),
    (92,93,'clavos','Clavo cajonero','clavo-cajonero'),
    (94,95,'clavos','Clavo cabeza chata','clavo-cabeza-chata'),
    (96,96,'clavos','Clavo cabeza chata Gerdau','clavo-cabeza-chata-gerdau'),
    (97,98,'clavos','Clavo cabeza chata, otras medidas','clavo-cabeza-chata-otras'),
    (99,108,'clavos','Clavo cabeza perdida','clavo-cabeza-perdida'),
    (110,110,'accesorios-de-colocacion','Palomita J','palomita-j'),
    (111,111,'accesorios-de-colocacion','Gancho J 5/16 × 8 pulgadas','gancho-j'),
    (112,112,'accesorios-de-colocacion','Palomita Z','palomita-z'),
]
rows = list(w['Stock'].iter_rows(min_col=1, max_col=2, values_only=True))
products = []
for start,end,category,name,slug in families:
    variants = []
    for row in range(start,end+1):
        original, unit = rows[row-1]
        original = str(original).strip()
        attrs = {}
        note = ''
        active = True
        if row in (60,64):
            note = 'Medida ambigua en el Excel. Confirmar antes de publicar esta variante.'
            active = False
        if 41 <= row <= 46:
            note = f'Repetido en Stock!A{row+29}: figura Unidad y Kg. Confirmar unidad de venta; se conserva una sola referencia.'
            active = False
        if row == 11:
            note = 'Confirmar interpretación de 150-60-14; se conserva la denominación original.'
        if row <= 12:
            m = re.search(r'(\d+(?:\.\d+)?)M X (\d+(?:\.\d+)?)M C/(\d+)', original)
            if m:
                attrs.update(largo=m[1]+' m', altura=m[2]+' m', calibre=m[3])
                a = re.search(r'Rombo\s+([^\s]+)"', original)
                if a: attrs['abertura'] = a[1]+' pulgadas'
        if 24 <= row <= 27:
            m = re.search(r'Nº\s*(\d+).*\(([^)]+)\)', original)
            if m: attrs.update(calibre=m[1], diametro=m[2])
        if 36 <= row <= 40:
            attrs['presentacion'] = re.search(r'(\d+)M',original)[1]+' m'
        if 18 <= row <= 21:
            attrs.update(seccion='3/4 × 3/16 pulgadas', largo=re.search(r'(\d+\.\d+)M',original)[1]+' m', terminacion='Zincada')
        if row in (33,34): attrs.update(diametro='300 mm' if row==33 else '450 mm', largo='10 m', tipo='Simple' if row==33 else 'Cruzada')
        if 48 <= row <= 55: attrs['medida'] = original.split(' ',1)[1]
        if row >= 76: attrs['medida'] = re.sub(r'^.*?(?=\d)', '', original)
        variants.append(dict(sku=f'AT-XLS-{row:03}',name=' '.join(original.split()),salesUnit={'Rollo':'ROLLO','Kg':'KG','Unidad':'UNIDAD'}[unit],attributes=attrs,sourceReference=f'Alambres Tandil.xlsx · Stock!A{row}:B{row}',reviewNote=note or None,active=active))
    brand = 'Acerbrag' if start==78 else 'Acindar' if start==79 else 'Gerdau' if start==96 else None
    products.append(dict(name=name,slug=slug,category=category,brand=brand,salesUnit=variants[0]['salesUnit'],shortDescription=f'{name}. Elegí la medida o presentación para armar tu pedido.',technicalDescription=f'{name}. Las medidas y presentaciones disponibles se detallan en cada variante. Consultá precio y disponibilidad con el local.',featured=start in (3,14,36,52,57,76),variants=variants))
out=dict(source='Alambres Tandil.xlsx',sheet='Stock',ignoredColumns=['Precio Lista','Precio con descuento','Precio Final','Stock Actual','Totales'],duplicates=[dict(keptRow=i,duplicateRow=i+29) for i in range(41,47)],products=products)
(root/'prisma/catalog.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print(f'{len(products)} familias, {sum(len(p["variants"]) for p in products)} referencias únicas; 6 duplicados consolidados.')
