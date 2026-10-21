# Verificación y Corrección de Datos de Empleados

Herramienta web estática para verificar, detectar discrepancias y corregir datos de empleados antes de la exportación final a Excel. Diseñada para operar **completamente en el navegador** sin transmitir datos a servidores externos.

---

## ¿Qué hace esta herramienta?

1. **Flujo estructurado en 3 pasos**:
   - **Paso 1 · Entrada de datos**: Carga masiva inteligente desde Excel (formatos de solo cédula, cédula con nombre, o formato completo tabulado de 9 columnas con puntuaciones y evaluadores), con listas independientes de condiciones especiales (Bloqueados, Reposo, Asignación Especial).
   - **Paso 2 · Verificación y corrección**: Diagnóstico automático de inconsistencias, avisos personalizados por empleado y propuestas de solución inmediata con 1 clic.
   - **Paso 3 · Exportación**: Previsualización sincronizada y copiado independiente o consolidado (TSV) de columnas para el Excel protegido.

2. **Modo listado interactivo exclusivo**:
   - Se eliminó el modo ficha individual; la aplicación opera mediante una tabla ágil donde cada fila muestra estado, puntuación editable, evaluador, diagnóstico y acciones directas.
   - **Resaltado en rojo** para cualquier empleado que presente discrepancias o errores de condición/rango.
   - **Resaltado en verde** para registros limpios y validados.

3. **Filtros rápidos de visualización**:
   - 📋 **Todos**: Visualiza la nómina completa y contadores globales en tiempo real.
   - ✅ **Correctos**: Filtra únicamente los registros conformes y listos para exportar.
   - ⚠️ **Con discrepancias**: Muestra exclusivamente los registros que requieren atención o decisión del usuario.

4. **Soluciones interactivas por estado de empleado**:
   - **Duplicados**: Detección de filas donde aparece la cédula repetida. Opciones para **Fusionar datos** en un solo registro limpio, **Conservar** una aparición específica o **Eliminar** el duplicado.
   - **Bloqueados**: Detección de empleados bloqueados (con o sin nota indebida). Opciones para **Conservar sin puntuación** o **Eliminar empleado**.
   - **En reposo**: Validación estricta del rango (100–300). Opciones para **Ajustar puntuación a 300** automáticamente, editar la celda o **Eliminar empleado**.
   - **Asignación especial**: Detección de puntuaciones indebidas en empleados no evaluables. Opciones para **Conservar sin puntuación** (limpieza automática) o **Eliminar empleado**.

5. **Acciones masivas de saneamiento**:
   - Botones rápidos en cabecera para auto-desduplicar masivamente, corregir en lote todos los reposos fuera de rango, limpiar notas en asignaciones especiales o depurar bloqueados con confirmación previa.

6. **Privacidad absoluta**:
   - Procesamiento 100% en memoria RAM local del navegador. Sin backend, sin almacenamiento en servidor, sin cookies ni APIs externas. Resguardo opcional mediante borrador `.json` local.

---

## Reglas de Negocio

| Condición | Rango válido | Regla / Estado |
|---|---|---|
| **Bloqueado** | No evaluable | No debe tener puntuación ni procesarse como normal. |
| **Reposo** | 100 – 300 | Puntuación obligatoria dentro del rango 100 a 300. |
| **Asignación Especial** | No evaluable | No debe tener puntuación asignada. |
| **Normal** | 100 – 500 | Puntuación estándar entre 100 y 500. |

---

## Estructura del Proyecto

```
test1/
├── index.html     # Estructura HTML con flujo de 3 pasos y modales de resolución
├── styles.css     # Estilos CSS corporativos con temas Claro/Oscuro y alertas visuales
├── app.js         # Lógica de detección, filtros, resolución y exportación
└── README.md      # Documentación del sistema
```

---

## Versión

**Versión 3.0** — Enfoque integral de Verificación y Corrección de Datos, Modo Listado Exclusivo, Resaltado Visual de Discrepancias, Filtros por Estado y Soluciones Interactivas (Conservar, Fusionar, Corregir, Eliminar).
