# Validador de Valoraciones de Trabajadores

Herramienta web estática para validar y registrar valoraciones de trabajadores,
diseñada para operar **completamente en el navegador** sin transmitir ningún dato
a servidores externos.

---

## ¿Qué hace esta herramienta?

1. **Carga masiva** de cédulas copiadas desde Excel (soporta cédula sola o acompañada de 1 o varios nombres y apellidos, ej: `miguel manuel felipe 37096753` o `37096753 Miguel Manuel Felipe`).
2. **Ordenamiento alfabético inteligente** (A→Z, Z→A o restablecer orden original) para agilizar la identificación del trabajador.
3. **Clasificación automática** por condición (Normal, Reposo, Asignación Especial, Bloqueado) con reglas de prioridad.
4. **Evaluación individual** con visualización clara de nombre/cédula, validación en tiempo real y evaluador persistente.
5. **Exportación en tres bloques independientes** para pegar en columnas separadas del Excel protegido.

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
1. Ingrese la valoración numérica en el campo correspondiente.
2. Ingrese la cédula del evaluador (se mantiene automáticamente entre trabajadores).
3. Presione **Guardar y siguiente** o use `Enter` para avanzar.

**Atajos de teclado:**

| Atajo | Acción |
|---|---|
| `Enter` | Guardar y avanzar al siguiente |
| `Ctrl+Enter` | Guardar desde el campo de valoración |
| `Alt + →` | Siguiente trabajador |
| `Alt + ←` | Trabajador anterior |
| `Esc` | Limpiar campo de valoración |

### Paso 3 — Exportar
1. Verifique el resumen de alineación.
2. Copie cada bloque por separado y péguelo en la columna correspondiente del Excel protegido.
3. **Pegue siempre comenzando en la misma fila en Excel.**

---

## Privacidad y Seguridad

> ⚠️ Esta herramienta **no transmite ningún dato** a servidores externos.
> Toda la información se procesa únicamente en la memoria RAM de su navegador
> y desaparece al recargar o cerrar la página.

La aplicación **no contiene ni utilizará:**
- Backend, API ni base de datos.
- `fetch`, `XMLHttpRequest`, ni WebSockets.
- `localStorage`, `sessionStorage` ni IndexedDB.
- Cookies de sesión ni analítica.
- Librerías externas cargadas desde CDN.

---

## Despliegue en GitHub Pages

1. Cree un repositorio llamado `validador-valoraciones` en su cuenta de GitHub.
2. Suba los archivos:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
   - `.gitignore`
3. En **Settings → Pages**, configure la fuente como la rama `main` y la carpeta raíz (`/`).
4. Active **HTTPS obligatorio**.
5. La herramienta quedará disponible en:
   ```
   https://USUARIO.github.io/validador-valoraciones/
   ```

### Verificación post-despliegue (F12 → Red/Network)
- Cargue la página y espere a que terminen todas las peticiones iniciales.
- Pegue datos de prueba falsos, valide, evalúe y copie los listados.
- **No debe aparecer ninguna petición adicional** (cero fetch, xhr, POST, WebSocket).
- Recargue la página y confirme que no quedan datos visibles.

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
├── index.html     # Estructura HTML semántica de las 3 pantallas
├── styles.css     # Estilos CSS sin dependencias externas
├── app.js         # Lógica completa en JavaScript puro
├── README.md      # Esta documentación
└── .gitignore     # Archivos excluidos del repositorio
```

---

## Advertencias Importantes

- **No suba** archivos Excel reales, cédulas reales, ni datos sensibles al repositorio.
- **No suba** listas reales de bloqueados, en reposo o asignación especial.
- El repositorio debe contener únicamente el código y documentación no sensible.

---

## Versión

Demo v1.0 — Fase 1 (Procesamiento local, sin persistencia)
