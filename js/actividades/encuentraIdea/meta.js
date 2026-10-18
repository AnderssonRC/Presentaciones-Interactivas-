/* Encuentra la idea — datos de la actividad (código en encuentraIdea.jsx). */
Actividades.registrar({
  id: 'encuentraIdea',
  version: '20261017a',
  nombre: 'Encuentra la idea',
  desc: 'Toca la oración que es la idea principal',
  color: '#F5C211',
  icon: 'bulb',
  grupo: 'cognitivos', orden: 70,

  // Cada línea es un párrafo; la oración marcada con [corchetes] es la idea
  // principal. El resto del párrafo se parte en oraciones que funcionan como
  // opciones "incorrectas".
  config(base) {
    base.items = [
      'Los perros son animales domésticos que existen desde hace miles de años. [Son considerados los mejores amigos del hombre por su lealtad y compañía.] Muchas familias tienen uno como mascota. Existen cientos de razas distintas.',
      'Los océanos regulan el clima del planeta y producen buena parte del oxígeno que respiramos. [El agua es esencial para la vida porque todos los seres vivos la necesitan para sobrevivir.] Por eso debemos cuidarla y no desperdiciarla.',
    ];
    base.instrucciones = 'Toca la oración que creas que es la idea principal del párrafo.';
  },

  campos: {
    label: 'Párrafos para encontrar la idea principal (uno por línea)',
    hint: 'Escribe el párrafo completo y marca con [corchetes] la ORACIÓN que es la idea principal (incluye su punto final dentro de los corchetes). Ej: Los perros son animales domésticos. [Son los mejores amigos del hombre por su lealtad.] Viven en muchos hogares.',
  },

  guia: {
    que: 'El grupo lee un párrafo y toca la oración que creen que es la idea principal. Si se equivocan, ven "Incorrecto, es idea secundaria" y pueden seguir intentando (sin que se revele cuál es la correcta) hasta acertar.',
    comoVe: 'El párrafo se muestra completo y compacto, como un texto normal. Al tocar una oración equivocada se resalta en naranja con el aviso; al tocar la correcta, se resalta en verde.',
    formato: 'Escribe el párrafo completo y marca con [corchetes] la oración que es la idea principal (incluye su punto final dentro de los corchetes). Un párrafo por línea.',
    ejemplo: {
      titulo: '¿Cuál es la idea principal?',
      instrucciones: 'Toca la oración que creas que es la idea principal del párrafo.',
      items: [
        'Los perros son animales domésticos que existen desde hace miles de años. [Son considerados los mejores amigos del hombre por su lealtad y compañía.] Muchas familias tienen uno como mascota. Existen cientos de razas distintas.',
        'Los océanos regulan el clima del planeta y producen buena parte del oxígeno que respiramos. [El agua es esencial para la vida porque todos los seres vivos la necesitan para sobrevivir.] Por eso debemos cuidarla y no desperdiciarla.',
      ],
    },
  },
});
