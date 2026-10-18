# Actividades interactivas

Cada actividad vive en su propia carpeta `js/actividades/<id>/` y es dueña de todo lo suyo:

| Archivo | Qué contiene | Cuándo se carga |
|---|---|---|
| `meta.js` | Nombre, color, icono, grupo y orden en el editor, configuración por defecto, etiquetas del campo de elementos, guía "Cómo funciona" y ejemplo | Al abrir la página (es JS plano y pequeño) |
| `<id>.jsx` | El código React: `Run` (la actividad en Presentar y en el celular) y, si la tiene, `Editor` (su panel de configuración) | **Solo cuando se usa** (Presentar la precarga en segundo plano) |

Archivos compartidos:

- `nucleo.js`: registro (`Actividades.registrar / definir / cargar`), grupos del editor y cargador bajo demanda.
- `comun.jsx`: piezas que usan varias actividades (`ActHeader`, `FichaRun`, `TimerPanel`, `useCountdown`, `useRemoteAction`, `barajar`, `parsePares`, `SinEquipos`, paletas…) y los cargadores `ActividadRun` / `ActividadEditor`.

Los estilos de las actividades siguen en `styles.css` (clases `act-*`).

## Modificar una actividad

1. Edita `js/actividades/<id>/<id>.jsx` (o su `meta.js`).
2. **Sube la versión** para que los navegadores no usen la copia vieja:
   - Si cambiaste `<id>.jsx`: cambia `version` dentro de su `meta.js` (por ejemplo `'20261017a'` → `'20261020a'`).
   - Si cambiaste `meta.js` (incluida su `version`): cambia también el `?v=` de su `<script>` en `index.html`.

El código de cada `.jsx` corre aislado: sus funciones internas pueden llamarse como quieras sin chocar con otras actividades. Lo que necesites compartir con varias actividades va en `comun.jsx`.

## Agregar una actividad nueva

1. Crea la carpeta `js/actividades/<id>/` (el `<id>` es el que se guarda en las presentaciones: no lo cambies después).
2. Crea `meta.js` copiando uno parecido. Campos:
   - `id`, `version`, `nombre`, `desc`, `color`, `icon` (un nombre de `Icon` en `ui.jsx`)
   - `grupo` (`'cognitivos'`, `'evaluadoras'` o `'equipos'`) y `orden` (menor = más arriba)
   - `config(base)`: ajusta la configuración al añadirla (`base` ya trae `titulo`, `instrucciones`, `duracion: 120`, `tiempoActivo: false` e `items: []`)
   - `campos: { label, hint }`: textos del campo genérico de elementos (una línea por elemento)
   - `editorPropio: true`: si tu `.jsx` exporta un `Editor` que reemplaza ese campo
   - `guia: { que, comoVe, formato, ejemplo }`: la tarjeta "Cómo funciona" y "Usar este ejemplo"
   - Opcionales: `pronto: true` (sale como "Próximamente"), `sinCodigo: true` (no tiene `.jsx` y usa la ficha genérica), `tiempoSiempre`, `timerPropio`
3. Crea `<id>.jsx` y termínalo con el registro:

   ```jsx
   function MiActividadRun({ config, tool, remoteSignal, equiposApi }) {
     useRemoteAction(remoteSignal, { primary: () => {/* botón "Acción principal" del celular */} });
     return (
       <div className="act-stage">
         <ActHeader tool={tool} titulo={config.titulo} instrucciones={config.instrucciones} />
         {/* … */}
       </div>
     );
   }

   // Opcional (con editorPropio: true en meta.js):
   function MiActividadEditor({ current, curIdx, updateSlide, setItems, esEquipos, numEquipos }) { /* … */ }

   Actividades.definir('<id>', { Run: MiActividadRun, Editor: MiActividadEditor });
   ```

4. Agrega su `meta.js` en `index.html`, junto a los demás (después de `nucleo.js` y antes de `db.js`).

## Props que recibe `Run`

- `config`: la configuración guardada de la diapositiva.
- `tool`: el meta de la actividad (`tool.color`, `tool.nombre`, `tool.icon`, `tool.id`…).
- `remoteSignal`: comandos del celular del docente; úsalo con `useRemoteAction`.
- `equiposApi`: solo en Modo Equipos: `{ equipos, sumar(id, pts), color(id), asignarMiembros(...) }`.
- Solo para algunas: `onQuiz` y `qiControlado` (Elige la respuesta), `gruposGuardados` y `onGrupos` (Formar grupos).
