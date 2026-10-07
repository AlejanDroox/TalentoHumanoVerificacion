/* ============================================================
   VALIDADOR TEMPORAL DE VALORACIONES
   app.js — Lógica completa en memoria. Sin persistencia.
   Sin fetch, sin XMLHttpRequest, sin localStorage, sin cookies.
   ============================================================ */

"use strict";

/* ============================================================
   1. REGLAS DE NEGOCIO (Configuración central)
   ============================================================ */
const REGLAS_VALORACION = {
  bloqueado: {
    permitido: false,
    minimo: null,
    maximo: null,
    mensajeError: "Trabajador bloqueado: no elegible para evaluación.",
    etiqueta: "Bloqueado",
    rangoTexto: "No evaluable"
  },
  reposo: {
    permitido: true,
    minimo: 100,
    maximo: 300,
    mensajeError: "Trabajador en reposo: la valoración debe estar entre 100 y 300.",
    etiqueta: "En reposo",
    rangoTexto: "100 a 300"
  },
  asignacion_especial: {
    permitido: true,
    minimo: 100,
    maximo: 500,
    mensajeError: "Asignación especial: la valoración debe estar entre 100 y 500.",
    etiqueta: "Asignación especial",
    rangoTexto: "100 a 500"
  },
  normal: {
    permitido: true,
    minimo: 100,
    maximo: 500,
    mensajeError: "Trabajador normal: la valoración debe estar entre 100 y 500.",
    etiqueta: "Normal",
    rangoTexto: "100 a 500"
  }
};

const PRIORIDAD_CONDICIONES = ["bloqueado", "reposo", "asignacion_especial", "normal"];

/* ============================================================
   2. ESTADO DE LA SESIÓN (Solo en memoria)
   ============================================================ */
let trabajadores     = [];
let indiceActual     = 0;
let evaluadorActual  = "";
let sesionActiva     = false;

/* ============================================================
   3. REFERENCIAS A ELEMENTOS DEL DOM
   ============================================================ */
const $ = id => document.getElementById(id);

// Pantallas e indicadores
const pantalla1         = $("pantalla-1");
const pantalla2         = $("pantalla-2");
const pantalla3         = $("pantalla-3");
const indPaso1          = $("ind-paso-1");
const indPaso2          = $("ind-paso-2");
const indPaso3          = $("ind-paso-3");

// Paso 1
const areaTrabajadores  = $("area-trabajadores");
const areaBloqueados    = $("area-bloqueados");
const areaReposo        = $("area-reposo");
const areaEspecial      = $("area-especial");
const contadorFilas     = $("contador-filas");
const contadorBloq      = $("contador-bloqueados");
const contadorRep       = $("contador-reposo");
const contadorEsp       = $("contador-especial");
const btnValidar        = $("btn-validar-lista");
const btnLimpiar        = $("btn-limpiar-lista");
const zonaAlertasPaso1  = $("zona-alertas-paso1");
const zonaDuplicados    = $("zona-duplicados");
const textoDuplicados   = $("texto-duplicados");
const listaDuplicados   = $("lista-duplicados");
const btnCorregirLista  = $("btn-corregir-lista");
const btnContinuarVal   = $("btn-continuar-validos");
const zonaResumen       = $("zona-resumen-validacion");
const zonaIniciar       = $("zona-iniciar");
const btnIniciar        = $("btn-iniciar-evaluacion");
const btnOrdenarAZ      = $("btn-ordenar-az");
const btnOrdenarZA      = $("btn-ordenar-za");
const btnOrdenarOrig    = $("btn-ordenar-orig");
const alertaOrdenamiento= $("alerta-ordenamiento");
const textoOrdenamiento = $("texto-ordenamiento");
const zonaOrdenamiento  = $("zona-ordenamiento");
const panelCondiciones  = $("panel-condiciones");
const btnToggleCond     = $("btn-toggle-condiciones");
const cuerpoCond        = $("cuerpo-condiciones");

// Paso 2
const textoProgresoEval = $("texto-progreso-eval");
const barraProgreso     = $("barra-progreso");
const barraCont         = $("barra-progreso-contenedor");
const textoPorcentaje   = $("texto-porcentaje");
const panelBloqueado    = $("panel-bloqueado");
const campoNombreCont   = $("campo-nombre-container");
const nombreDisplay     = $("nombre-display");
const cedulaDisplay     = $("cedula-trabajador-display");
const condicionDisplay  = $("condicion-display");
const rangoDisplay      = $("rango-display");
const numEvalDisplay    = $("num-evaluacion-display");
const zonaAlertasPaso2  = $("zona-alertas-paso2");
const formEval          = $("form-evaluacion");
const inputValoracion   = $("input-valoracion");
const inputEvaluador    = $("input-evaluador");
const errorValoracion   = $("error-valoracion");
const errorEvaluador    = $("error-evaluador");
const hintValoracion    = $("hint-valoracion");
const btnAnterior       = $("btn-anterior");
const btnGuardarSig     = $("btn-guardar-siguiente");
const btnOmitir         = $("btn-omitir");
const btnFinalizar      = $("btn-finalizar-evaluacion");
const btnDescartarEval  = $("btn-descartar-sesion-eval");

// Paso 3
const verificAlin       = $("verificacion-alineacion");
const verificTitulo     = $("verificacion-titulo");
const verificDetalle    = $("verificacion-detalle");
const salidaCedulas     = $("salida-cedulas");
const salidaValoraciones= $("salida-valoraciones");
const salidaEvaluadores = $("salida-evaluadores");
const btnCopiarCedulas  = $("btn-copiar-cedulas");
const btnCopiarVals     = $("btn-copiar-valoraciones");
const btnCopiarEvals    = $("btn-copiar-evaluadores");
const btnCopiarReporte  = $("btn-copiar-reporte");
const msgCedulas        = $("msg-cedulas-copiado");
const msgValores        = $("msg-valores-copiado");
const msgEvaluadores    = $("msg-evaluadores-copiado");
const msgReporte        = $("msg-reporte-copiado");
const cuerpoTablaRep    = $("cuerpo-tabla-reporte");
const reporteVacio      = $("reporte-vacio");
const btnVolverEval     = $("btn-volver-evaluar");
const btnNuevaSesion    = $("btn-nueva-sesion");
const btnDescartarFinal = $("btn-descartar-sesion-final");

// Modal
const modalOverlay      = $("modal-overlay");
const modalTitulo       = $("modal-titulo");
const modalCuerpo       = $("modal-cuerpo");
const modalBtnCancelar  = $("modal-btn-cancelar");
const modalBtnConfirmar = $("modal-btn-confirmar");

/* ============================================================
   4. UTILIDADES PURAS
   ============================================================ */

/**
 * Normaliza una cédula para comparaciones internas.
 * Elimina espacios, puntos, comas, guiones y convierte a mayúsculas.
 */
function normalizarCedula(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .trim()
    .toUpperCase()
    .replace(/[.,\s\-]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Parsea un número tolerando coma o punto como separador decimal.
 */
function parsearNumero(valor) {
  if (valor === null || valor === undefined) return NaN;
  const limpio = String(valor).trim().replace(",", ".");
  return parseFloat(limpio);
}

/**
 * Obtiene la primera columna (separada por TAB, punto y coma o múltiples espacios).
 */
function primerColumna(fila) {
  return fila.split(/\t|;|(?:\s{2,})/)[0].trim();
}

/**
 * Extrae la cédula y el nombre completo de una fila pegada desde Excel.
 *
 * Soporta:
 *   - Cédula al inicio:  12345678   Juan Pérez
 *   - Cédula al final:   Miguel Manuel Rodríguez   12345678
 *   - Nombres con 1 ó 2 nombres y 1 ó 2 apellidos en cualquier orden.
 *   - Separador de columnas: TAB (nativo Excel), 2+ espacios o punto y coma.
 *
 * La detección de cédula requiere al menos 5 dígitos consecutivos en el valor.
 */
function extraerDatosFila(filaCruda) {
  // 1. Separar por TAB (separador nativo de Excel al copiar celdas)
  let cols = filaCruda.split("\t").map(c => c.trim()).filter(c => c.length > 0);

  // 2. Si solo hay una columna, intentar separar por 2+ espacios
  if (cols.length <= 1) {
    const porEspacios = filaCruda.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
    if (porEspacios.length > 1) cols = porEspacios;
  }

  // 3. Si sigue siendo un solo valor, tratar todo como cédula (sin nombre)
  if (cols.length <= 1) {
    return { cedula: filaCruda.trim(), nombre: "" };
  }

  // 4. Función: ¿parece esta cadena una cédula? (al menos 5 dígitos)
  const pareceNumerica = val => {
    const norm = normalizarCedula(val);
    return norm.length >= 5 && /\d{5}/.test(norm);
  };

  // 5. Buscar la columna que contiene la cédula
  //    Prioridad: primera columna → última → búsqueda interior
  let indiceCedula = -1;

  if (pareceNumerica(cols[0])) {
    indiceCedula = 0;
  } else if (pareceNumerica(cols[cols.length - 1])) {
    indiceCedula = cols.length - 1;
  } else {
    for (let i = 1; i < cols.length - 1; i++) {
      if (pareceNumerica(cols[i])) { indiceCedula = i; break; }
    }
  }

  // 6. Si no se identificó ninguna cédula, asumir primera columna
  if (indiceCedula === -1) {
    return { cedula: cols[0], nombre: cols.slice(1).join(" ") };
  }

  const cedula = cols[indiceCedula];

  // 7. El resto de columnas forman el nombre; capitalizar cada palabra
  const nombre = cols
    .filter((_, i) => i !== indiceCedula)
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());

  return { cedula, nombre };
}

/**
 * Valida que una cadena tenga al menos un dígito numérico y no sea vacía.
 * Permite letras (V, E) seguidas de dígitos.
 */
function esFormatoValido(cedulaNorm) {
  return cedulaNorm.length > 0 && /\d/.test(cedulaNorm);
}

/**
 * Copia texto al portapapeles con fallback para contextos sin HTTPS.
 */
function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }
  // Fallback via execCommand
  return new Promise((resolve, reject) => {
    const ta = document.createElement("textarea");
    ta.value = texto;
    ta.style.cssText = "position:fixed;top:-9999px;left:-9999px;opacity:0;";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(ta);
      resolve();
    } catch (e) {
      document.body.removeChild(ta);
      reject(e);
    }
  });
}

/** Muestra un mensaje de copiado temporalmente */
function mostrarMsgCopiado(elemento) {
  elemento.classList.add("visible");
  setTimeout(() => elemento.classList.remove("visible"), 3500);
}

/* ============================================================
   5. CONSTRUCCIÓN DE ALERTAS (SIN innerHTML con datos de usuario)
   ============================================================ */
function crearAlerta(tipo, icono, textoMensaje) {
  const div = document.createElement("div");
  div.className = `alerta alerta-${tipo}`;

  const spanIcon = document.createElement("span");
  spanIcon.className = "alerta-icono";
  spanIcon.setAttribute("aria-hidden", "true");
  spanIcon.textContent = icono;

  const spanMsg = document.createElement("div");
  spanMsg.textContent = textoMensaje;

  div.appendChild(spanIcon);
  div.appendChild(spanMsg);
  return div;
}

function limpiarZona(zona) {
  zona.replaceChildren();
}

/* ============================================================
   6. NAVEGACIÓN ENTRE PANTALLAS
   ============================================================ */
function mostrarPantalla(num) {
  [pantalla1, pantalla2, pantalla3].forEach(p => p.classList.remove("activa"));
  [indPaso1, indPaso2, indPaso3].forEach(i => {
    i.classList.remove("activo", "completado");
  });

  if (num === 1) {
    pantalla1.classList.add("activa");
    indPaso1.classList.add("activo");
  } else if (num === 2) {
    pantalla2.classList.add("activa");
    indPaso1.classList.add("completado");
    indPaso2.classList.add("activo");
  } else {
    pantalla3.classList.add("activa");
    indPaso1.classList.add("completado");
    indPaso2.classList.add("completado");
    indPaso3.classList.add("activo");
  }
}

/* ============================================================
   7. PANEL COLAPSABLE DE CONDICIONES
   ============================================================ */
btnToggleCond.addEventListener("click", () => {
  const abierto = panelCondiciones.classList.toggle("abierto");
  btnToggleCond.setAttribute("aria-expanded", abierto ? "true" : "false");
  cuerpoCond.style.display = abierto ? "block" : "none";
});

// Contadores en tiempo real de las listas de condiciones
function actualizarContadorCondicion(area, contadorEl) {
  const filas = leerCedulasDeArea(area);
  contadorEl.textContent = `${filas.length} cédula${filas.length !== 1 ? "s" : ""}`;
}

function leerCedulasDeArea(area) {
  return area.value.split("\n")
    .map(l => primerColumna(l))
    .filter(v => v.trim().length > 0);
}

areaBloqueados.addEventListener("input", () => actualizarContadorCondicion(areaBloqueados, contadorBloq));
areaReposo.addEventListener("input",    () => actualizarContadorCondicion(areaReposo, contadorRep));
areaEspecial.addEventListener("input",  () => actualizarContadorCondicion(areaEspecial, contadorEsp));

/* ============================================================
   8. CONTADOR DE FILAS — PASO 1
   ============================================================ */
areaTrabajadores.addEventListener("input", () => {
  const filas = areaTrabajadores.value.split("\n").filter(l => l.trim().length > 0);
  contadorFilas.textContent = `${filas.length} fila${filas.length !== 1 ? "s" : ""} detectada${filas.length !== 1 ? "s" : ""}`;
});

/* ============================================================
   9. VALIDACIÓN INICIAL — PASO 1
   ============================================================ */
let duplicadosDetectados = [];

btnValidar.addEventListener("click", validarListaInicial);

function validarListaInicial() {
  limpiarZona(zonaAlertasPaso1);
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");

  const textoRaw = areaTrabajadores.value;

  if (!textoRaw.trim()) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "La lista de trabajadores está vacía. Pegue al menos una cédula para continuar.")
    );
    return;
  }

  // Leer listas de condiciones especiales
  const cedsBloquNorm  = new Set(leerCedulasDeArea(areaBloqueados).map(normalizarCedula).filter(v => v));
  const cedsReposoNorm = new Set(leerCedulasDeArea(areaReposo).map(normalizarCedula).filter(v => v));
  const cedsEspecNorm  = new Set(leerCedulasDeArea(areaEspecial).map(normalizarCedula).filter(v => v));

  // Detectar encabezado probable (primera fila sin dígitos)
  const filasCrudas = textoRaw.split("\n");
  let offsetFila = 0;
  const primeraFila = primerColumna(filasCrudas[0]).trim();
  const primeraFiaNorm = normalizarCedula(primeraFila);
  if (
    primeraFiaNorm.length > 0 &&
    !/\d/.test(primeraFiaNorm) &&
    /cedula|documento|doc|id|trabajador|nombre|worker/i.test(primeraFila)
  ) {
    offsetFila = 1;
    zonaAlertasPaso1.appendChild(
      crearAlerta("aviso", "⚠️", `Se detectó una posible fila de encabezado ("${primeraFila}") y fue ignorada automáticamente.`)
    );
  }

  const filasAUsar = filasCrudas.slice(offsetFila);

  // Procesar filas
  const mapaVistas  = new Map(); // cedulaNorm → [índice de fila]
  const registros   = [];       // todos los registros procesados
  let vaciosInvalidos = 0;

  filasAUsar.forEach((filaCruda, idx) => {
    const numFilaOriginal = idx + 1 + offsetFila;
    const { cedula: colUno, nombre: nombreExtraido } = extraerDatosFila(filaCruda);

    if (colUno.trim() === "") {
      vaciosInvalidos++;
      return; // ignorar vacíos
    }

    const cedulaNorm = normalizarCedula(colUno);

    if (!esFormatoValido(cedulaNorm)) {
      vaciosInvalidos++;
      registros.push({
        numeroFilaOriginal: numFilaOriginal,
        cedulaOriginal: colUno,
        cedulaNormalizada: cedulaNorm,
        nombreCompleto: nombreExtraido,
        condicion: "normal",
        estado: "error",
        errores: ["Cédula con formato inválido (sin dígitos)."],
        advertencias: [],
        valoracionOriginal: "",
        valoracionNumerica: null,
        cedulaEvaluadorOriginal: "",
        cedulaEvaluadorNormalizada: "",
        omitido: false
      });
      return;
    }

    // Registrar para detección de duplicados
    if (!mapaVistas.has(cedulaNorm)) {
      mapaVistas.set(cedulaNorm, []);
    }
    mapaVistas.get(cedulaNorm).push(numFilaOriginal);

    registros.push({
      numeroFilaOriginal: numFilaOriginal,
      cedulaOriginal: colUno,
      cedulaNormalizada: cedulaNorm,
      nombreCompleto: nombreExtraido,
      condicion: null,       // se determina después
      estado: "pendiente",
      errores: [],
      advertencias: [],
      valoracionOriginal: "",
      valoracionNumerica: null,
      cedulaEvaluadorOriginal: "",
      cedulaEvaluadorNormalizada: "",
      omitido: false
    });
  });

  // Detectar duplicados y marcarlos
  duplicadosDetectados = [];
  const seenDuplicadas = new Set();

  for (const [cednorm, filas] of mapaVistas.entries()) {
    if (filas.length > 1) {
      duplicadosDetectados.push({ cedulaNorm: cednorm, filas });
      seenDuplicadas.add(cednorm);
    }
  }

  // Marcar registros duplicados (conservar la primera aparición; las demás quedan fuera)
  const primeraOcurrencia = new Set();
  registros.forEach(r => {
    if (r.estado === "error") return;
    if (seenDuplicadas.has(r.cedulaNormalizada)) {
      if (primeraOcurrencia.has(r.cedulaNormalizada)) {
        r.estado = "duplicado";
        r.errores.push(`Duplicado — también aparece en filas: ${mapaVistas.get(r.cedulaNormalizada).join(", ")}.`);
      } else {
        primeraOcurrencia.add(r.cedulaNormalizada);
        r.advertencias.push(`Cédula duplicada en lista. Se conserva esta primera aparición (fila ${r.numeroFilaOriginal}).`);
      }
    }
  });

  // Asignar condición por prioridad a los registros válidos
  let cntBloq = 0, cntRep = 0, cntEsp = 0, cntNorm = 0;
  registros.forEach(r => {
    if (r.estado === "error" || r.estado === "duplicado") return;
    const cn = r.cedulaNormalizada;
    if (cedsBloquNorm.has(cn)) {
      r.condicion = "bloqueado";
      r.estado = "bloqueado";
      cntBloq++;
    } else if (cedsReposoNorm.has(cn)) {
      r.condicion = "reposo";
      cntRep++;
    } else if (cedsEspecNorm.has(cn)) {
      r.condicion = "asignacion_especial";
      cntEsp++;
    } else {
      r.condicion = "normal";
      cntNorm++;
    }
  });

  // Calcular totales para resumen
  const totalDuplicados = duplicadosDetectados.length;
  const totalInvalidos  = vaciosInvalidos + registros.filter(r => r.estado === "error").length;
  const totalParaEvaluar = registros.filter(r => r.estado === "pendiente" || r.estado === "bloqueado").length;

  // Mostrar resumen
  mostrarResumen(totalParaEvaluar - cntBloq, cntBloq, cntRep, cntEsp, totalDuplicados, totalInvalidos);

  // Mostrar duplicados si hay
  if (duplicadosDetectados.length > 0) {
    mostrarPanelDuplicados(duplicadosDetectados, registros);
  }

  // Guardar registros en estado global (temporalmente, hasta confirmar)
  trabajadores = registros;

  // Mostrar alerta de resumen general
  const totalProcesados = filasAUsar.filter(l => l.trim()).length;
  const msgResumen = `Se procesaron ${totalProcesados} fila${totalProcesados !== 1 ? "s" : ""}. ` +
    `${totalParaEvaluar - cntBloq} para evaluar, ${cntBloq} bloqueado${cntBloq !== 1 ? "s" : ""}, ` +
    `${totalDuplicados} duplicado${totalDuplicados !== 1 ? "s" : ""}, ${totalInvalidos} inválido${totalInvalidos !== 1 ? "s" : ""}.`;

  zonaAlertasPaso1.appendChild(
    crearAlerta(totalParaEvaluar - cntBloq > 0 ? "exito" : "aviso", "📊", msgResumen)
  );

  // Si no hay duplicados y hay válidos, mostrar botón directo
  if (duplicadosDetectados.length === 0 && (totalParaEvaluar - cntBloq) > 0) {
    zonaIniciar.classList.remove("d-none");
    // Mostrar botones de orden solo si al menos un registro tiene nombre
    const hayNombres = registros.some(r => r.nombreCompleto && r.nombreCompleto.trim());
    zonaOrdenamiento.style.display = hayNombres ? "" : "none";
  } else if (duplicadosDetectados.length === 0 && (totalParaEvaluar - cntBloq) === 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "No hay trabajadores válidos para evaluar. Revise la lista.")
    );
  }
}

function mostrarResumen(validos, bloq, rep, esp, dup, inv) {
  $("res-validos").textContent    = validos;
  $("res-bloqueados").textContent = bloq;
  $("res-reposo").textContent     = rep;
  $("res-especial").textContent   = esp;
  $("res-duplicados").textContent = dup;
  $("res-invalidos").textContent  = inv;
  zonaResumen.classList.remove("d-none");
}

function mostrarPanelDuplicados(dups, registros) {
  // Texto resumen
  textoDuplicados.textContent =
    `Se detectaron ${dups.length} cédula${dups.length !== 1 ? "s" : ""} duplicada${dups.length !== 1 ? "s" : ""}. ` +
    `Se conservará la primera aparición de cada una y las demás serán excluidas.`;

  // Lista de duplicados (sin innerHTML con datos del usuario)
  listaDuplicados.replaceChildren();
  dups.forEach(d => {
    const p = document.createElement("p");
    p.style.marginBottom = "4px";

    // Buscar cédula original para mostrar al usuario
    const reg = registros.find(r => r.cedulaNormalizada === d.cedulaNorm);
    const cedMostrar = reg ? reg.cedulaOriginal : d.cedulaNorm;

    const strong = document.createElement("strong");
    strong.textContent = `Cédula duplicada: ${cedMostrar}`;
    const texto = document.createTextNode(` — aparece en las filas: ${d.filas.join(", ")}.`);

    p.appendChild(strong);
    p.appendChild(texto);
    listaDuplicados.appendChild(p);
  });

  zonaDuplicados.classList.remove("d-none");
}

// Botón: Corregir lista
btnCorregirLista.addEventListener("click", () => {
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  limpiarZona(zonaAlertasPaso1);
  areaTrabajadores.focus();
});

// Botón: Continuar solo con válidos (excluir duplicados)
btnContinuarVal.addEventListener("click", () => {
  const excluidos = trabajadores.filter(r => r.estado === "duplicado").length;
  trabajadores = trabajadores.filter(r => r.estado !== "duplicado" && r.estado !== "error");

  zonaDuplicados.classList.add("d-none");
  limpiarZona(zonaAlertasPaso1);

  if (excluidos > 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("aviso", "⚠️", `Se excluyeron ${excluidos} registro${excluidos !== 1 ? "s" : ""} duplicado${excluidos !== 1 ? "s" : ""}. Se continuará con ${trabajadores.filter(r => r.estado === "pendiente").length} trabajador${trabajadores.filter(r => r.estado === "pendiente").length !== 1 ? "es" : ""} válido${trabajadores.filter(r => r.estado === "pendiente").length !== 1 ? "s" : ""}.`)
    );
  }

  zonaIniciar.classList.remove("d-none");
  const hayNombresV = trabajadores.some(r => r.nombreCompleto && r.nombreCompleto.trim());
  zonaOrdenamiento.style.display = hayNombresV ? "" : "none";
});

// Botón: Limpiar lista
btnLimpiar.addEventListener("click", () => {
  areaTrabajadores.value = "";
  areaBloqueados.value   = "";
  areaReposo.value       = "";
  areaEspecial.value     = "";
  contadorFilas.textContent    = "0 filas detectadas";
  contadorBloq.textContent     = "0 cédulas";
  contadorRep.textContent      = "0 cédulas";
  contadorEsp.textContent      = "0 cédulas";
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");
  zonaOrdenamiento.style.display = "none";
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.style.fontWeight = "";
  btnOrdenarZA.style.fontWeight = "";
  limpiarZona(zonaAlertasPaso1);
  trabajadores = [];
});

/* ============================================================
   9b. ORDENAMIENTO DE LA LISTA (antes de evaluar)
   ============================================================ */
btnOrdenarAZ.addEventListener("click", () => {
  trabajadores.sort((a, b) => {
    const na = (a.nombreCompleto || a.cedulaOriginal || "").toLowerCase();
    const nb = (b.nombreCompleto || b.cedulaOriginal || "").toLowerCase();
    return na.localeCompare(nb, "es", { sensitivity: "base" });
  });
  alertaOrdenamiento.style.display = "";
  textoOrdenamiento.textContent = "Lista ordenada A → Z por nombre. El evaluador verá los trabajadores en este orden.";
  btnOrdenarOrig.disabled = false;
  btnOrdenarAZ.style.fontWeight = "700";
  btnOrdenarZA.style.fontWeight = "";
});

btnOrdenarZA.addEventListener("click", () => {
  trabajadores.sort((a, b) => {
    const na = (a.nombreCompleto || a.cedulaOriginal || "").toLowerCase();
    const nb = (b.nombreCompleto || b.cedulaOriginal || "").toLowerCase();
    return nb.localeCompare(na, "es", { sensitivity: "base" });
  });
  alertaOrdenamiento.style.display = "";
  textoOrdenamiento.textContent = "Lista ordenada Z → A por nombre. El evaluador verá los trabajadores en este orden.";
  btnOrdenarOrig.disabled = false;
  btnOrdenarZA.style.fontWeight = "700";
  btnOrdenarAZ.style.fontWeight = "";
});

btnOrdenarOrig.addEventListener("click", () => {
  trabajadores.sort((a, b) => (a.numeroFilaOriginal || 0) - (b.numeroFilaOriginal || 0));
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.style.fontWeight = "";
  btnOrdenarZA.style.fontWeight = "";
});

/* ============================================================
   10. INICIAR EVALUACIÓN
   ============================================================ */
btnIniciar.addEventListener("click", () => {
  // Filtrar: solo pendientes y bloqueados entran a la cola
  trabajadores = trabajadores.filter(r => r.estado === "pendiente" || r.estado === "bloqueado");

  if (trabajadores.length === 0) {
    limpiarZona(zonaAlertasPaso1);
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "No hay trabajadores para evaluar.")
    );
    return;
  }

  indiceActual    = 0;
  evaluadorActual = "";
  sesionActiva    = true;

  mostrarPantalla(2);
  cargarTrabajador(indiceActual);
  inputValoracion.focus();
});

/* ============================================================
   11. EVALUACIÓN INDIVIDUAL — PASO 2
   ============================================================ */
function cargarTrabajador(idx) {
  if (idx < 0 || idx >= trabajadores.length) return;

  const t = trabajadores[idx];
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
  const total = trabajadores.length;
  const totalEvaluables = trabajadores.filter(w => w.condicion !== "bloqueado").length;

  // Progreso
  const evaluados = trabajadores.filter(w => w.estado === "valido" || w.estado === "omitido").length;
  const pct = total > 0 ? Math.round((evaluados / total) * 100) : 0;

  textoProgresoEval.textContent = `Evaluación ${idx + 1} de ${total}${totalEvaluables !== total ? ` (${totalEvaluables} evaluables)` : ""}`;
  barraProgreso.style.width = `${pct}%`;
  barraProgreso.classList.toggle("completa", pct === 100);
  barraCont.setAttribute("aria-valuenow", pct);
  textoPorcentaje.textContent = `${evaluados} de ${total} procesados (${pct}%)`;

  // Información del trabajador
  cedulaDisplay.textContent  = t.cedulaOriginal;
  numEvalDisplay.textContent = `${idx + 1} de ${total}`;

  // Nombre del trabajador (visible solo si se proporcionó)
  if (t.nombreCompleto && t.nombreCompleto.trim()) {
    campoNombreCont.style.display = "";
    nombreDisplay.textContent = t.nombreCompleto;
  } else {
    campoNombreCont.style.display = "none";
    nombreDisplay.textContent = "";
  }

  // Badge de condición
  condicionDisplay.replaceChildren();
  const badge = document.createElement("span");
  const mapaBadge = {
    normal: "badge-normal",
    reposo: "badge-reposo",
    asignacion_especial: "badge-especial",
    bloqueado: "badge-bloqueado"
  };
  badge.className = `badge ${mapaBadge[t.condicion] || "badge-normal"}`;
  badge.textContent = regla.etiqueta;
  condicionDisplay.appendChild(badge);

  rangoDisplay.textContent = regla.rangoTexto;

  // Mostrar/ocultar formulario según si está bloqueado
  if (t.condicion === "bloqueado") {
    panelBloqueado.classList.remove("d-none");
    formEval.style.display = "none";
    btnGuardarSig.disabled = true;
  } else {
    panelBloqueado.classList.add("d-none");
    formEval.style.display = "block";
    btnGuardarSig.disabled = false;

    // Precargar valores guardados o el evaluador persistente
    inputValoracion.value = t.valoracionOriginal || "";
    inputEvaluador.value  = t.cedulaEvaluadorOriginal || evaluadorActual;

    hintValoracion.textContent = `Rango permitido: ${regla.rangoTexto}`;

    limpiarErrores();
    inputValoracion.focus();
  }

  // Alertas del trabajador
  limpiarZona(zonaAlertasPaso2);
  t.advertencias.forEach(adv => {
    zonaAlertasPaso2.appendChild(crearAlerta("aviso", "⚠️", adv));
  });

  // Botón anterior
  btnAnterior.disabled = idx === 0;
}

function limpiarErrores() {
  errorValoracion.classList.remove("visible");
  errorEvaluador.classList.remove("visible");
  inputValoracion.classList.remove("input-error", "input-ok");
  inputEvaluador.classList.remove("input-error", "input-ok");
}

/* --- Validación en Tiempo Real ---------------------------- */
inputValoracion.addEventListener("input", () => validarCampoValoracion(false));
inputEvaluador.addEventListener("input",  () => validarCampoEvaluador(false));

function validarCampoValoracion(mostrarError = true) {
  const t = trabajadores[indiceActual];
  if (!t) return false;
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;

  const val = inputValoracion.value.trim();

  if (!val) {
    if (mostrarError) mostrarError_(errorValoracion, "La valoración es obligatoria.");
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarError);
    return false;
  }

  const num = parsearNumero(val);
  if (isNaN(num)) {
    if (mostrarError) mostrarError_(errorValoracion, "La valoración debe ser un número válido (use punto o coma decimal).");
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarError);
    return false;
  }

  if (num < regla.minimo || num > regla.maximo) {
    if (mostrarError) mostrarError_(errorValoracion, `La valoración debe estar entre ${regla.minimo} y ${regla.maximo}.`);
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarError);
    return false;
  }

  errorValoracion.classList.remove("visible");
  inputValoracion.classList.remove("input-error");
  inputValoracion.classList.add("input-ok");
  return true;
}

function validarCampoEvaluador(mostrarError = true) {
  const val = normalizarCedula(inputEvaluador.value);

  if (!val) {
    if (mostrarError) mostrarError_(errorEvaluador, "Debe indicar la cédula del evaluador antes de guardar.");
    inputEvaluador.classList.remove("input-ok");
    inputEvaluador.classList.toggle("input-error", mostrarError);
    return false;
  }

  if (!esFormatoValido(val)) {
    if (mostrarError) mostrarError_(errorEvaluador, "La cédula del evaluador no tiene un formato válido.");
    inputEvaluador.classList.remove("input-ok");
    inputEvaluador.classList.toggle("input-error", mostrarError);
    return false;
  }

  errorEvaluador.classList.remove("visible");
  inputEvaluador.classList.remove("input-error");
  inputEvaluador.classList.add("input-ok");
  return true;
}

function mostrarError_(el, msg) {
  el.textContent = msg;
  el.classList.add("visible");
}

/* --- Guardar evaluación ----------------------------------- */
function guardarYSiguiente() {
  const t = trabajadores[indiceActual];
  if (!t) return;

  // Si está bloqueado, avanzar directamente
  if (t.condicion === "bloqueado") {
    avanzarSiguiente();
    return;
  }

  const valOk  = validarCampoValoracion(true);
  const evalOk = validarCampoEvaluador(true);

  if (!valOk || !evalOk) return;

  // Guardar en memoria
  const num = parsearNumero(inputValoracion.value.trim());
  t.valoracionOriginal          = inputValoracion.value.trim().replace(",", ".");
  t.valoracionNumerica          = num;
  t.cedulaEvaluadorOriginal     = inputEvaluador.value.trim();
  t.cedulaEvaluadorNormalizada  = normalizarCedula(inputEvaluador.value);
  t.estado                      = "valido";
  t.errores                     = [];

  // Actualizar evaluador persistente
  evaluadorActual = t.cedulaEvaluadorOriginal;

  avanzarSiguiente();
}

function avanzarSiguiente() {
  const siguiente = indiceActual + 1;
  if (siguiente >= trabajadores.length) {
    // Verificar si hay pendientes
    const pendientes = trabajadores.filter(w => w.estado === "pendiente").length;
    if (pendientes > 0) {
      limpiarZona(zonaAlertasPaso2);
      zonaAlertasPaso2.appendChild(
        crearAlerta("aviso", "⚠️", `Quedan ${pendientes} trabajador${pendientes !== 1 ? "es" : ""} sin evaluar. Puede finalizar o volver atrás para completarlos.`)
      );
    } else {
      abrirPantallaExportacion();
    }
    return;
  }
  indiceActual = siguiente;
  cargarTrabajador(indiceActual);
  inputValoracion.focus();
}

function avanzarAnterior() {
  if (indiceActual > 0) {
    indiceActual--;
    cargarTrabajador(indiceActual);
    inputValoracion.focus();
  }
}

/* --- Botones Paso 2 --------------------------------------- */
btnGuardarSig.addEventListener("click", guardarYSiguiente);
btnAnterior.addEventListener("click",   avanzarAnterior);

btnOmitir.addEventListener("click", () => {
  const t = trabajadores[indiceActual];
  if (t) {
    t.estado   = "omitido";
    t.omitido  = true;
    t.errores  = ["Omitido por la usuaria en esta sesión."];
  }
  avanzarSiguiente();
});

btnFinalizar.addEventListener("click", () => {
  const pendientes = trabajadores.filter(w => w.estado === "pendiente").length;
  if (pendientes > 0) {
    abrirModal(
      "¿Finalizar con registros pendientes?",
      `Hay ${pendientes} trabajador${pendientes !== 1 ? "es" : ""} sin evaluar. Estos aparecerán en el reporte de incidencias y NO serán exportados. ¿Desea continuar?`,
      abrirPantallaExportacion
    );
  } else {
    abrirPantallaExportacion();
  }
});

btnDescartarEval.addEventListener("click", () => {
  abrirModal(
    "Descartar sesión",
    "Se eliminarán todos los datos de la sesión actual. Esta acción no se puede deshacer. ¿Continuar?",
    descartarSesion
  );
});

/* ============================================================
   12. ATAJOS DE TECLADO — PASO 2
   ============================================================ */
document.addEventListener("keydown", e => {
  // Solo activos en pantalla 2
  if (!pantalla2.classList.contains("activa")) return;

  if (e.key === "Escape") {
    e.preventDefault();
    inputValoracion.value = "";
    limpiarErrores();
    inputValoracion.focus();
    return;
  }

  if (e.altKey && e.key === "ArrowRight") {
    e.preventDefault();
    avanzarSiguiente();
    return;
  }

  if (e.altKey && e.key === "ArrowLeft") {
    e.preventDefault();
    avanzarAnterior();
    return;
  }

  // Enter desde el campo evaluador o Ctrl+Enter desde valoración
  const desdeValoracion = document.activeElement === inputValoracion;
  const desdeEvaluador  = document.activeElement === inputEvaluador;

  if ((e.key === "Enter" && desdeEvaluador) ||
      (e.key === "Enter" && e.ctrlKey && desdeValoracion) ||
      (e.key === "Enter" && desdeValoracion && trabajadores[indiceActual]?.condicion !== "bloqueado")) {
    e.preventDefault();
    guardarYSiguiente();
  }
});

/* ============================================================
   13. EXPORTACIÓN — PASO 3
   ============================================================ */
function abrirPantallaExportacion() {
  mostrarPantalla(3);
  generarExportacion();
}

function generarExportacion() {
  const validos = trabajadores.filter(t => t.estado === "valido");
  const noValidos = trabajadores.filter(t => t.estado !== "valido");

  // Verificar alineación
  const nCed = validos.length;
  const nVal = validos.length;
  const nEval = validos.length;
  const alineado = nCed === nVal && nVal === nEval;

  // Sección de verificación
  verificAlin.classList.toggle("error-alineacion", !alineado);

  if (alineado) {
    verificTitulo.textContent = `✅ Registros válidos listos para exportar: ${nCed}`;
    verificDetalle.replaceChildren();
    const items = [
      `Cédulas de trabajadores: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      `Valoraciones: ${nVal} fila${nVal !== 1 ? "s" : ""}.`,
      `Cédulas de evaluadores: ${nEval} fila${nEval !== 1 ? "s" : ""}.`,
      `Los tres listados están alineados y listos para pegarse por separado en Excel.`
    ];
    const ul = document.createElement("ul");
    ul.style.cssText = "margin:8px 0 0 18px; font-size:.875rem;";
    items.forEach(txt => {
      const li = document.createElement("li");
      li.textContent = txt;
      ul.appendChild(li);
    });
    verificDetalle.appendChild(ul);
  } else {
    verificTitulo.textContent = "❌ Error de alineación";
    verificDetalle.textContent =
      "Los tres listados no contienen la misma cantidad de registros. Revise los datos antes de copiar.";
  }

  // Generar los tres bloques
  salidaCedulas.value     = validos.map(t => t.cedulaOriginal).join("\n");
  salidaValoraciones.value= validos.map(t => t.valoracionOriginal).join("\n");
  salidaEvaluadores.value = validos.map(t => t.cedulaEvaluadorOriginal).join("\n");

  // Habilitar/deshabilitar botones de copiar según alineación
  btnCopiarCedulas.disabled  = !alineado || nCed === 0;
  btnCopiarVals.disabled     = !alineado || nVal === 0;
  btnCopiarEvals.disabled    = !alineado || nEval === 0;

  // Tabla de incidencias
  generarTablaIncidencias(noValidos);
}

function generarTablaIncidencias(registros) {
  cuerpoTablaRep.replaceChildren();

  if (registros.length === 0) {
    reporteVacio.style.display = "block";
    btnCopiarReporte.disabled = true;
    return;
  }

  reporteVacio.style.display = "none";
  btnCopiarReporte.disabled = false;

  registros.forEach(t => {
    const tr = document.createElement("tr");

    const celdas = [
      t.numeroFilaOriginal ?? "—",
      t.cedulaOriginal || "(vacía)",
      t.nombreCompleto  || "—",
      REGLAS_VALORACION[t.condicion]?.etiqueta || "—",
      t.estado,
      t.errores.join(" / ") || t.advertencias.join(" / ") || "—"
    ];

    const mapaEstadoBadge = {
      pendiente: "badge-pendiente",
      valido:    "badge-valido",
      error:     "badge-error",
      omitido:   "badge-omitido",
      bloqueado: "badge-bloqueado",
      duplicado: "badge-error"
    };

    celdas.forEach((val, i) => {
      const td = document.createElement("td");
      if (i === 4) {  // índice 4 = estado (tras añadir nombre en posición 2)
        const badge = document.createElement("span");
        badge.className = `badge ${mapaEstadoBadge[val] || "badge-pendiente"}`;
        badge.textContent = val;
        td.appendChild(badge);
      } else {
        td.textContent = val;
      }
      tr.appendChild(td);
    });

    cuerpoTablaRep.appendChild(tr);
  });
}

/* --- Botones de Copiar ------------------------------------ */
function copiarBloque(texto, msgEl) {
  if (!texto.trim()) return;
  copiarAlPortapapeles(texto)
    .then(() => mostrarMsgCopiado(msgEl))
    .catch(() => {
      // Si falla el portapapeles, seleccionar el texto para que el usuario copie manualmente
      alert("No se pudo copiar automáticamente. Seleccione el texto y use Ctrl+C.");
    });
}

btnCopiarCedulas.addEventListener("click", () =>
  copiarBloque(salidaCedulas.value, msgCedulas));

btnCopiarVals.addEventListener("click", () =>
  copiarBloque(salidaValoraciones.value, msgValores));

btnCopiarEvals.addEventListener("click", () =>
  copiarBloque(salidaEvaluadores.value, msgEvaluadores));

btnCopiarReporte.addEventListener("click", () => {
  // Generar reporte en texto plano para copiar
  const noValidos = trabajadores.filter(t => t.estado !== "valido");
  const lineas = ["Fila\tCédula\tCondición\tEstado\tDetalle"];
  noValidos.forEach(t => {
    lineas.push([
      t.numeroFilaOriginal ?? "",
      t.cedulaOriginal || "",
      REGLAS_VALORACION[t.condicion]?.etiqueta || "",
      t.estado,
      (t.errores.join(" / ") || t.advertencias.join(" / ") || "")
    ].join("\t"));
  });
  copiarBloque(lineas.join("\n"), msgReporte);
});

/* --- Volver a evaluar pendientes -------------------------- */
btnVolverEval.addEventListener("click", () => {
  // Buscar primer pendiente
  const idx = trabajadores.findIndex(t => t.estado === "pendiente");
  if (idx === -1) {
    alert("No hay trabajadores pendientes por evaluar.");
    return;
  }
  indiceActual = idx;
  mostrarPantalla(2);
  cargarTrabajador(indiceActual);
});

/* --- Nueva sesión y Descartar ----------------------------- */
btnNuevaSesion.addEventListener("click", () => {
  abrirModal(
    "Iniciar nueva sesión",
    "Se eliminarán todos los datos de la sesión actual. ¿Desea continuar?",
    descartarSesion
  );
});

btnDescartarFinal.addEventListener("click", () => {
  abrirModal(
    "Limpiar y descartar sesión",
    "Se eliminarán todos los datos de la sesión actual. Esta acción no se puede deshacer. ¿Continuar?",
    descartarSesion
  );
});

/* ============================================================
   14. DESCARTAR SESIÓN — Limpieza completa
   ============================================================ */
function descartarSesion() {
  // Limpiar estado
  trabajadores    = [];
  indiceActual    = 0;
  evaluadorActual = "";
  sesionActiva    = false;
  duplicadosDetectados = [];

  // Limpiar entradas
  areaTrabajadores.value = "";
  areaBloqueados.value   = "";
  areaReposo.value       = "";
  areaEspecial.value     = "";
  contadorFilas.textContent = "0 filas detectadas";
  contadorBloq.textContent  = "0 cédulas";
  contadorRep.textContent   = "0 cédulas";
  contadorEsp.textContent   = "0 cédulas";

  // Limpiar salidas
  salidaCedulas.value      = "";
  salidaValoraciones.value = "";
  salidaEvaluadores.value  = "";

  // Limpiar zonas
  limpiarZona(zonaAlertasPaso1);
  limpiarZona(zonaAlertasPaso2);
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");
  zonaOrdenamiento.style.display = "none";
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.style.fontWeight = "";
  btnOrdenarZA.style.fontWeight = "";
  cuerpoTablaRep.replaceChildren();

  // Volver al inicio
  mostrarPantalla(1);
  cerrarModal();
}

/* ============================================================
   15. MODAL DE CONFIRMACIÓN
   ============================================================ */
let accionModal = null;

function abrirModal(titulo, cuerpo, accion) {
  modalTitulo.textContent = titulo;
  modalCuerpo.textContent = cuerpo;
  accionModal = accion;
  modalOverlay.classList.add("visible");
  modalBtnConfirmar.focus();
}

function cerrarModal() {
  modalOverlay.classList.remove("visible");
  accionModal = null;
}

modalBtnCancelar.addEventListener("click", cerrarModal);
modalBtnConfirmar.addEventListener("click", () => {
  if (typeof accionModal === "function") accionModal();
  cerrarModal();
});

modalOverlay.addEventListener("click", e => {
  if (e.target === modalOverlay) cerrarModal();
});

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && modalOverlay.classList.contains("visible")) {
    cerrarModal();
  }
});

/* ============================================================
   16. PROTECCIÓN CONTRA CIERRE ACCIDENTAL
   ============================================================ */
window.addEventListener("beforeunload", e => {
  if (sesionActiva && trabajadores.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============================================================
   17. INICIALIZACIÓN
   ============================================================ */
mostrarPantalla(1);
