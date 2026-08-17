-- 012 · Categorías por oficio, no por rubro de directorio comercial
--
-- Para qué: las categorías de 001 ("Alimentación y bebidas", "Servicios
-- generales"...) son de directorio comercial genérico. Alguien que busca
-- "quién me arregla la lavadora" no encuentra nada útil ahí. Se reemplazan
-- por oficios reales de Manrique.
--
-- No se borran las categorías viejas ni se tocan los `portafolios` que ya
-- las usan — `categoria_id` es `not null references categorias(id)`, y
-- borrar la fila rompería esa fila. En cambio: `activa = false` (mismo patrón
-- que 003 usa para `definiciones_campo`), así desaparecen del formulario de
-- registro pero un registro viejo se sigue viendo bien en el admin y en la
-- vitrina hasta que alguien lo recategorice a mano. Recategorizar en masa acá
-- sería adivinar: "Alimentación y bebidas" puede ser lo mismo que "Comidas y
-- almuerzos", "Panadería y repostería" o "Tienda y víveres", y solo el dueño
-- del negocio sabe cuál.
--
-- 'otros' no se toca: ya existe, ya es el "Otro (abre input)" que pide la
-- sección 3.2 del formulario.

update categorias
  set activa = false
  where id in (
    'alimentacion', 'belleza', 'moda', 'hogar',
    'tecnologia', 'educacion', 'salud', 'servicios'
  );

insert into categorias (id, nombre, icono, orden) values
  ('comidas',               'Comidas y almuerzos',              'utensils',          1),
  ('panaderia',              'Panadería y repostería',           'cookie',            2),
  ('tienda_viveres',         'Tienda y víveres',                 'shopping-basket',   3),
  ('ropa_calzado',           'Ropa y calzado',                   'shirt',             4),
  ('belleza_peluqueria',     'Belleza y peluquería',              'scissors',          5),
  ('barberia',               'Barbería',                          'scissors',          6),
  ('modisteria',             'Modistería y arreglos',            'needle',            7),
  ('reparacion_linea_blanca','Reparación de electrodomésticos',  'wrench',            8),
  ('construccion',           'Plomería, electricidad y construcción', 'hammer',       9),
  ('mecanica_motos',         'Mecánica y motos',                 'bike',              10),
  ('tecnologia_celulares',   'Tecnología y celulares',            'smartphone',        11),
  ('papeleria',              'Papelería y misceláneas',          'notebook-pen',      12),
  ('salud_bienestar',        'Salud y bienestar',                'heart-pulse',       13),
  ('mascotas',               'Mascotas',                          'dog',               14),
  ('transporte_domicilios',  'Transporte y domicilios',           'truck',             15)
on conflict (id) do nothing;

update categorias set orden = 99 where id = 'otros';
