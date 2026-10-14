# Validador de Valoraciones de Trabajadores

Herramienta web estática para validar y registrar valoraciones de trabajadores,
diseñada para operar **completamente en el navegador** sin transmitir ningún dato
a servidores externos.

---

## ¿Qué hace esta herramienta?

1. **Carga masiva inteligente** de cédulas copiadas desde Excel (soporta cédula sola, `Cédula Nombre` o `Nombre Cédula` con separadores de tabulación o espacios, limpiando automáticamente caracteres especiales de Excel).
2. **Listas independientes de condiciones especiales** (Bloqueados, Reposo, Asignación Especial) con conteo en vivo.
3. **Ordenamiento alfabético** (A→Z, Z→A o restablecer orden original) para agilizar la identificación del trabajador.
4. **Modo dual de evaluación**:
   - **Modo Ficha (1 a 1)**: Visualización enfocada con chips de notas rápidas (`100` a `500`, `Máx`, `Repetir anterior`), evaluadores frecuentes y atajo `Ctrl+Z` para deshacer.
   - **Modo Planilla rápida**: Tabla interactiva tipo hoja de cálculo para digitar valores rápidamente navegando con `Enter` o flechas `↑`/`↓`.
5. **Buscador interactivo**: Localice y salte inmediatamente a cualquier trabajador por cédula o nombre sin avanzar uno por uno.
6. **Tema Claro / Oscuro**: Interruptor en cabecera (☀️ / 🌙) para reducir la fatiga visual en jornadas prolongadas.
7. **Resguardo local seguro (.json)**: Posibilidad de guardar y cargar borradores de sesión en archivos locales sin violar la privacidad ni usar almacenamiento en servidor.
8. **Exportación verificada**:
   - 3 bloques independientes para columnas separadas del Excel protegido.
   - Previsualización sincronizada de 3 columnas (primeras y últimas filas lado a lado).
   - Bloque único consolidado (TSV) para pegar todo de una sola vez si el Excel lo permite.
   - Checklist visual de copiado (`✔ Copiado`).

---

## Uso rápido

### Paso 1 — Cargar trabajadores
1. Copie la lista desde su Excel (cédula sola o con nombres) y péguela en el área principal.
2. (Opcional) Abra el panel **"Listas de condiciones especiales"** y pegue las cédulas
   en las categorías correspondientes:
   - 🔴 **Bloqueados** — No serán evaluados ni exportados.
   - 🟡 **Reposo** — Valoración válida: 100 a 300.
   - 🔵 **Asignación Especial** — Valoración válida: 100 a 500.
3. Presione **Validar lista de trabajadores**.
4. (Opcional) Si la lista incluye nombres, utilice los botones **🔤 A → Z** o **🔤 Z → A** para ordenar antes de evaluar.
5. Presione **Iniciar evaluación**.

### Paso 2 — Evaluar trabajadores
- **En Modo Ficha (1 a 1)**:
  1. Ingrese la valoración numérica o use los chips rápidos: `[100]`, `[200]`, `[300]`, `[400]`, `[500]`, `[Máx]` o `[↩ Repetir]`.
  2. Ingrese la cédula del evaluador (se mantiene automáticamente y se guarda en evaluadores recientes).
  3. Presione **Guardar y siguiente** o use `Enter` para avanzar.
- **En Modo Planilla rápida**:
  1. Escriba la valoración directamente en la celda y pulse `Enter` o `↓` para bajar al siguiente trabajador.
  2. Ingrese el evaluador global y pulse **Guardar todos los válidos de la planilla**.

**Atajos de teclado:**

| Atajo | Acción |
|---|---|
| `Enter` | Guardar y avanzar al siguiente |
| `Ctrl + Z` | Deshacer última valoración guardada |
| `Alt + →` | Siguiente trabajador |
| `Alt + ←` | Trabajador anterior |
| `Esc` | Limpiar campo de valoración |
| `↓` / `↑` (en planilla) | Moverse entre filas de la tabla |

### Paso 3 — Exportar
1. Verifique el resumen de alineación y la previsualización de 3 columnas.
2. Copie cada bloque por separado (`Cédulas`, `Valoraciones`, `Evaluadores`) y péguelo en la columna correspondiente del Excel protegido.
3. **Pegue siempre comenzando en la misma fila inicial en Excel.**
4. Opcionalmente, copie la tabla completa en formato TSV.

---

## Privacidad y Seguridad

> ⚠️ Esta herramienta **no transmite ningún dato** a servidores externos.
> Toda la información se procesa únicamente en la memoria RAM de su navegador
> y no se almacena en bases de datos ni servicios externos.

La aplicación **no contiene ni utilizará:**
- Backend, API ni bases de datos remotas.
- `fetch`, `XMLHttpRequest`, ni WebSockets hacia servidores externos.
- `localStorage`, `sessionStorage` ni cookies de rastreo.
- Librerías externas cargadas desde CDN.

El resguardo de borrador funciona 100% en el cliente mediante la API de archivos locales (`Blob` y `FileReader`).

---

## Reglas de Negocio

| Condición | Rango válido | Prioridad |
|---|---|---|
| Bloqueado | No evaluable | 1 (más alta) |
| Reposo | 100 – 300 | 2 |
| Asignación Especial | 100 – 500 | 3 |
| Normal | 100 – 500 | 4 (más baja) |

Si una cédula aparece en más de una lista de condiciones especiales,
se aplica la condición con mayor prioridad.

---

## Estructura del Proyecto

```
validador-valoraciones/
├── index.html     # Estructura HTML con soporte de temas y vistas
├── styles.css     # Estilos CSS modernos con variables de tema claro/oscuro
├── app.js         # Lógica completa en JavaScript puro (cliente 100%)
├── README.md      # Esta documentación
└── .gitignore     # Archivos excluidos del repositorio
```

---

## Versión

Versión 2.0 — Modo Oscuro, Modo Planilla Rápida, Chips de Entrada Rápida, Resguardo Local y Exportación Verificada.
