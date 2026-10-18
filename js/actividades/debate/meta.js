/* Debate: dos posturas — datos de la actividad (código en debate.jsx). */
Actividades.registrar({
  id: 'debate',
  version: '20261017a',
  nombre: 'Debate: dos posturas',
  desc: 'Divide el aula y argumenta',
  color: '#11F555',
  icon: 'debate',
  grupo: 'evaluadoras', orden: 150,

  config(base) {
    base.items = ['¿Escribe aquí la pregunta del debate?', 'A favor', 'En contra'];
    base.instrucciones = 'Cada postura tiene su propio tiempo para argumentar.';
    base.duracion = 120;
  },

  campos: {
    label: 'Línea 1: pregunta · Línea 2: postura A · Línea 3: postura B',
    hint: 'Tres líneas: la pregunta, el nombre de la postura A y el de la postura B. El tiempo por postura se fija en "Tiempo (segundos)".',
  },

  guia: {
    que: 'Divide al grupo en dos posturas y da a cada una su propio tiempo para argumentar, con la pregunta del debate visible.',
    comoVe: 'La pregunta en grande y dos cronómetros independientes, uno por postura.',
    formato: 'Tres líneas: 1) la pregunta del debate, 2) nombre de la postura A, 3) nombre de la postura B. El tiempo por postura está en "Tiempo (segundos)".',
    ejemplo: {
      titulo: 'Debate en clase',
      instrucciones: 'Cada postura usa su tiempo para defender su posición.',
      items: ['¿Deberían los celulares usarse en clase?', 'A favor', 'En contra'],
    },
  },
});
