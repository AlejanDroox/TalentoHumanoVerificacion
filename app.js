/* ============================================================
   VALIDADOR DE VALORACIONES — app.js v2.0
   Modo Oscuro · Modo Planilla · Chips de valoración · Buscador
   Evaluadores frecuentes · Deshacer · Borrador local
   Sin fetch · Sin XMLHttpRequest · Sin localStorage · Sin cookies
   ============================================================ */

"use strict";

/* ============================================================
   1. REGLAS DE NEGOCIO
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

/* ============================================================
   2. ESTADO DE LA SESIÓN (Solo en memoria)
   ============================================================ */
let trabajadores         = [];
let indiceActual         = 0;
let evaluadorActual      = "";
let sesionActiva         = false;
let duplicadosDetectados = [];
let ultimaValoracion     = null; // para el chip "Repetir"
let historialDeshacer    = [];   // pila de snapshots para Ctrl+Z
let evaluadoresFrecuentes = [];  // últimos evaluadores usados (máx 3)
let modoVista            = "ficha"; // "ficha" | "planilla"
let temaActual           = "light"; // "light" | "dark"

/* ============================================================
   3. REFERENCIAS AL DOM
   ============================================================ */
const $ = id => document.getElementById(id);

// Cabecera y tema
const btnToggleTema       = $("btn-toggle-tema");
const temaIcono           = $("tema-icono");
const temaTexto           = $("tema-texto");
const btnGuardarBorrador  = $("btn-guardar-borrador");
const inputCargarBorrador = $("input-cargar-borrador");

// Navegación / pantallas
const pantalla1   = $("pantalla-1");
const pantalla2   = $("pantalla-2");
const pantalla3   = $("pantalla-3");
const indPaso1    = $("ind-paso-1");
const indPaso2    = $("ind-paso-2");
const indPaso3    = $("ind-paso-3");

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
const btnCorregirLista    = $("btn-corregir-lista");
const btnContinuarVal     = $("btn-continuar-validos");
const btnAutocleanPrimera  = $("btn-autoclean-primera");
const btnAutocleanUltima   = $("btn-autoclean-ultima");
const btnToggleVisorFilas  = $("btn-toggle-visor-filas");
const txtToggleVisor       = $("txt-toggle-visor");
const visorFilasContenedor = $("visor-filas-contenedor");
const cuerpoTablaVisor     = $("cuerpo-tabla-visor");
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

// Paso 2 — comunes
const textoProgresoEval = $("texto-progreso-eval");
const barraProgreso     = $("barra-progreso");
const barraCont         = $("barra-progreso-contenedor");
const textoPorcentaje   = $("texto-porcentaje");
const zonaAlertasPaso2  = $("zona-alertas-paso2");
const btnFinalizar      = $("btn-finalizar-evaluacion");
const btnDescartarEval  = $("btn-descartar-sesion-eval");
const inputBuscador     = $("input-buscador");
const buscadorResultados= $("buscador-resultados");
const btnIrPendiente    = $("btn-ir-pendiente");
const btnModoFicha      = $("btn-modo-ficha");
const btnModoPlanilla   = $("btn-modo-planilla");
const vistaFicha        = $("vista-ficha");
const vistaPlanilla     = $("vista-planilla");

// Paso 2 — vista ficha
const panelBloqueado    = $("panel-bloqueado");
const campoNombreCont   = $("campo-nombre-container");
const nombreDisplay     = $("nombre-display");
const cedulaDisplay     = $("cedula-trabajador-display");
const condicionDisplay  = $("condicion-display");
const rangoDisplay      = $("rango-display");
const numEvalDisplay    = $("num-evaluacion-display");
const formEval          = $("form-evaluacion");
const inputValoracion   = $("input-valoracion");
const inputEvaluador    = $("input-evaluador");
const errorValoracion   = $("error-valoracion");
const errorEvaluador    = $("error-evaluador");
const hintValoracion    = $("hint-valoracion");
const btnAnterior       = $("btn-anterior");
const btnGuardarSig     = $("btn-guardar-siguiente");
const btnOmitir         = $("btn-omitir");
const chipMax           = $("chip-max");
const chipRepeat        = $("chip-repeat");
const zonaChipsVal      = $("zona-chips-val");
const zonaEvalFrecuentes= $("zona-evaluadores-frecuentes");
const listaEvalFrecuentes=$("lista-eval-frecuentes");

// Paso 2 — vista planilla
const cuerpoTablaPlanilla = $("cuerpo-tabla-planilla");
const inputEvaluadorPlanilla = $("input-evaluador-planilla");
const errorEvaluadorPlanilla = $("error-evaluador-planilla");
const btnGuardarPlanilla = $("btn-guardar-planilla");

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
const btnCopiarTsv      = $("btn-copiar-tsv");
const msgCedulas        = $("msg-cedulas-copiado");
const msgValores        = $("msg-valores-copiado");
const msgEvaluadores    = $("msg-evaluadores-copiado");
const msgReporte        = $("msg-reporte-copiado");
const msgTsv            = $("msg-tsv-copiado");
const cuerpoTablaRep    = $("cuerpo-tabla-reporte");
const reporteVacio      = $("reporte-vacio");
const cuerpoPreview     = $("cuerpo-preview");
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
   4. MODO OSCURO / CLARO
   ============================================================ */
function aplicarTema(tema) {
  temaActual = tema;
  document.documentElement.setAttribute("data-theme", tema);
  if (tema === "dark") {
    temaIcono.textContent = "☀️";
    temaTexto.textContent = "Modo claro";
  } else {
    temaIcono.textContent = "🌙";
    temaTexto.textContent = "Modo oscuro";
  }
}

// Detectar preferencia del sistema al cargar
(function () {
  const prefOscuro = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  aplicarTema(prefOscuro ? "dark" : "light");
})();

btnToggleTema.addEventListener("click", () => {
  aplicarTema(temaActual === "light" ? "dark" : "light");
});

/* ============================================================
   5. UTILIDADES PURAS
   ============================================================ */

/** Normaliza una cédula: elimina caracteres especiales, convierte a mayúsculas */
function normalizarCedula(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .trim()
    .toUpperCase()
    // Limpiar caracteres de Excel: espacios no rompibles, comillas automáticas
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[.,\s\-]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/** Parsea número tolerando coma o punto decimal */
function parsearNumero(valor) {
  if (valor === null || valor === undefined) return NaN;
  const limpio = String(valor).trim().replace(",", ".");
  return parseFloat(limpio);
}

/** Obtiene la primera columna de una fila */
function primerColumna(fila) {
  return fila.split(/\t|;|(?:\s{2,})/)[0].trim();
}

/**
 * Extrae cedula, nombre, valoracion y evaluador de una fila pegada desde Excel.
 * Soporta formato completo de 9 columnas tabuladas:
 *   [Cedula] [NPersonal] [Nombre] [Grado] [Centro] [Estado] [Puntuacion] [TextoCal] [NEvaluador]
 * y formatos legados de 1-2 columnas.
 */
function extraerDatosFila(filaCruda) {
  // Limpiar caracteres basura de Excel (espacios no rompibles, BOM)
  const filaLimpia = filaCruda
    .replace(/\u00A0/g, ' ')
    .replace(/\uFEFF/g, '')
    .replace(/[\u2018\u2019\u201C\u201D]/g, '');

  // 1. Separar por TAB (separador nativo de Excel)
  let cols = filaLimpia.split('\t').map(c => c.trim()).filter(c => c.length > 0);

  // 2. Si solo 1 col, intentar por 2+ espacios
  if (cols.length <= 1) {
    const por2esp = filaLimpia.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
    if (por2esp.length > 1) cols = por2esp;
  }

  // 3. Si sigue 1 col, espacio simple buscando token numerico
  if (cols.length <= 1) {
    const tokens = filaLimpia.trim().split(/\s+/);
    if (tokens.length > 1) {
      const esCed = t => /\d{5,}/.test(t.replace(/[^0-9]/g, ''));
      const idxCed = tokens.findIndex(t => esCed(t));
      if (idxCed !== -1) {
        const ced = tokens[idxCed];
        const nom = tokens.filter((_, i) => i !== idxCed).join(' ');
        return { cedula: ced, nombre: capitalizarNombre(nom), valoracion: '', evaluador: '' };
      }
    }
    return { cedula: filaLimpia.trim(), nombre: '', valoracion: '', evaluador: '' };
  }

  // -- MODO MULTI-COLUMNA (>= 3 cols con TAB) --
  // Detecta formato Excel: col[0]=Cedula, col[-1]=Evaluador(numerico), col[penultimo]=Puntuacion(100-999)
  if (cols.length >= 3) {
    const limpio = v => v.replace(/\./g, '').replace(',', '.');
    const esPuro = v => /^\d+([.,]\d+)?$/.test(limpio(v));

    const cedula = cols[0];

    // Columna final: evaluador si es puramente numerico
    let evaluador = '';
    let idxEval = -1;
    if (esPuro(cols[cols.length - 1])) {
      evaluador = cols[cols.length - 1];
      idxEval   = cols.length - 1;
    }

    // Buscar puntuacion: numerico 100-999 desde la derecha antes del evaluador
    let valoracion = '';
    let idxVal = -1;
    const limite = idxEval !== -1 ? idxEval : cols.length;
    for (let i = limite - 1; i >= 1; i--) {
      const n = parseFloat(limpio(cols[i]));
      if (!isNaN(n) && n >= 100 && n <= 999 && esPuro(cols[i])) {
        valoracion = String(n);
        idxVal = i;
        break;
      }
    }

    // Nombre: columnas internas excluyendo numeros cortos y etiquetas texto de calificacion
    const excluir = new Set([0, idxVal, idxEval].filter(i => i !== -1));
    const nombreCols = cols.filter((c, i) => {
      if (excluir.has(i)) return false;
      if (/^\d+$/.test(limpio(c)) && limpio(c).length <= 6) return false;
      if (/^(Muy\s*Bueno|Bueno|Regular|Deficiente|Excelente|MB|B|R|D)$/i.test(c)) return false;
      return true;
    });
    let nombre = '';
    if (cols.length >= 7 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(cols[2])) {
      nombre = capitalizarNombre(cols[2]);
    } else {
      nombre = capitalizarNombre(nombreCols.join(' '));
    }

    if (valoracion || evaluador) {
      return { cedula, nombre, valoracion, evaluador };
    }
  }

  // -- MODO LEGACY (1-2 cols) --
  const pareceNumerica = val => {
    const norm = normalizarCedula(val);
    return norm.length >= 5 && /\d{5}/.test(norm);
  };

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

  if (indiceCedula === -1) {
    return { cedula: cols[0], nombre: capitalizarNombre(cols.slice(1).join(' ')), valoracion: '', evaluador: '' };
  }

  const cedula = cols[indiceCedula];
  const nombre = capitalizarNombre(cols.filter((_, i) => i !== indiceCedula).join(' '));

  return { cedula, nombre, valoracion: '', evaluador: '' };
}

function capitalizarNombre(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase());
}

/** Valida que una cadena tenga al menos un dígito */
function esFormatoValido(cedulaNorm) {
  return cedulaNorm.length > 0 && /\d/.test(cedulaNorm);
}

/** Copia texto al portapapeles */
function copiarAlPortapapeles(texto) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(texto);
  }
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

/** Muestra mensaje de copiado temporalmente */
function mostrarMsgCopiado(elemento) {
  elemento.classList.add("visible");
  setTimeout(() => elemento.classList.remove("visible"), 3500);
}

/* ============================================================
   6. CONSTRUCCIÓN DE ALERTAS (sin innerHTML con datos de usuario)
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
   7. NAVEGACIÓN ENTRE PANTALLAS
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
   8. PANEL COLAPSABLE DE CONDICIONES
   ============================================================ */
btnToggleCond.addEventListener("click", () => {
  const abierto = panelCondiciones.classList.toggle("abierto");
  btnToggleCond.setAttribute("aria-expanded", abierto ? "true" : "false");
});

// Contadores en tiempo real
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
   9. CONTADOR DE FILAS — PASO 1
   ============================================================ */
areaTrabajadores.addEventListener("input", () => {
  const filas = areaTrabajadores.value.split("\n").filter(l => l.trim().length > 0);
  contadorFilas.textContent = `${filas.length} fila${filas.length !== 1 ? "s" : ""} detectada${filas.length !== 1 ? "s" : ""}`;
});

/* ============================================================
   10. VALIDACIÓN INICIAL — PASO 1
   ============================================================ */
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

  // Leer listas de condiciones
  const cedsBloquNorm  = new Set(leerCedulasDeArea(areaBloqueados).map(normalizarCedula).filter(v => v));
  const cedsReposoNorm = new Set(leerCedulasDeArea(areaReposo).map(normalizarCedula).filter(v => v));
  const cedsEspecNorm  = new Set(leerCedulasDeArea(areaEspecial).map(normalizarCedula).filter(v => v));

  // Detectar encabezado
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

  const mapaVistas  = new Map();
  const registros   = [];
  let vaciosInvalidos = 0;

  filasAUsar.forEach((filaCruda, idx) => {
    const numFilaOriginal = idx + 1 + offsetFila;
    const { cedula: colUno, nombre: nombreExtraido, valoracion: valPrec, evaluador: evalPrec } = extraerDatosFila(filaCruda);

    if (colUno.trim() === "") {
      vaciosInvalidos++;
      return;
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
        errores: ["Cedula con formato invalido (sin digitos)."],
        advertencias: [],
        valoracionOriginal: "",
        valoracionNumerica: null,
        cedulaEvaluadorOriginal: "",
        cedulaEvaluadorNormalizada: "",
        omitido: false
      });
      return;
    }

    if (!mapaVistas.has(cedulaNorm)) mapaVistas.set(cedulaNorm, []);
    mapaVistas.get(cedulaNorm).push(numFilaOriginal);

    // Procesar valoracion y evaluador precargados (formato multi-columna)
    const numPrec = valPrec ? parsearNumero(valPrec) : null;
    const evalNorm = evalPrec ? normalizarCedula(evalPrec) : "";

    registros.push({
      numeroFilaOriginal: numFilaOriginal,
      cedulaOriginal: colUno,
      cedulaNormalizada: cedulaNorm,
      nombreCompleto: nombreExtraido,
      condicion: null,
      estado: "pendiente",
      errores: [],
      advertencias: [],
      valoracionOriginal: valPrec || "",
      valoracionNumerica: numPrec,
      cedulaEvaluadorOriginal: evalPrec || "",
      cedulaEvaluadorNormalizada: evalNorm,
      omitido: false
    });
  });

  // Detectar duplicados
  duplicadosDetectados = [];
  const seenDuplicadas = new Set();
  for (const [cednorm, filas] of mapaVistas.entries()) {
    if (filas.length > 1) {
      duplicadosDetectados.push({ cedulaNorm: cednorm, filas });
      seenDuplicadas.add(cednorm);
    }
  }

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

  // Asignar condicion por prioridad y validar puntuaciones pre-cargadas
  let cntBloq = 0, cntRep = 0, cntEsp = 0, cntNorm = 0;
  let cntPreValido = 0, cntPreError = 0;
  registros.forEach(r => {
    if (r.estado === "error" || r.estado === "duplicado") return;
    const cn = r.cedulaNormalizada;
    if (cedsBloquNorm.has(cn)) {
      r.condicion = "bloqueado";
      r.estado = "bloqueado";
      cntBloq++;
      // Si trae puntuacion, es un error logico
      if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
        r.errores.push(`Redundancia/Error: trabajador BLOQUEADO pero trae puntuacion (${r.valoracionNumerica}). No debe evaluarse.`);
        r.estado = "error";
        cntBloq--;
        cntPreError++;
      }
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

  // Validar puntuaciones pre-cargadas y auto-marcar como validos si cumplen las reglas
  registros.forEach(r => {
    if (r.estado === "error" || r.estado === "duplicado" || r.estado === "bloqueado") return;
    if (r.valoracionNumerica === null || isNaN(r.valoracionNumerica)) return;  // sin dato precargado

    const regla = REGLAS_VALORACION[r.condicion] || REGLAS_VALORACION.normal;
    const n = r.valoracionNumerica;

    if (r.condicion === "reposo" && (n < 100 || n > 300)) {
      r.errores.push(`Error de rango: trabajador en REPOSO con puntuacion ${n} (permitido 100-300).`);
      r.estado = "error";
      cntPreError++;
    } else if (n < regla.minimo || n > regla.maximo) {
      r.errores.push(`Error de rango: puntuacion ${n} fuera del rango permitido (${regla.rangoTexto}).`);
      r.estado = "error";
      cntPreError++;
    } else if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
      // Datos completos y validos: marcar directamente como valido
      r.estado = "valido";
      cntPreValido++;
    }
  });

  const totalDuplicados  = duplicadosDetectados.length;
  const totalInvalidos   = vaciosInvalidos + registros.filter(r => r.estado === "error").length;
  const totalParaEvaluar = registros.filter(r => r.estado === "pendiente" || r.estado === "bloqueado").length;

  mostrarResumen(totalParaEvaluar - cntBloq, cntBloq, cntRep, cntEsp, totalDuplicados, totalInvalidos);

  if (duplicadosDetectados.length > 0) {
    mostrarPanelDuplicados(duplicadosDetectados, registros);
  }

  trabajadores = registros;

  const totalProcesados = filasAUsar.filter(l => l.trim()).length;

  // Alertas de redundancias/errores de condicion
  if (cntPreError > 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "⚠️",
        `${cntPreError} fila${cntPreError !== 1 ? "s" : ""} con errores de condicion o rango ` +
        `(bloqueado con puntuacion / reposo fuera de rango). Revise el reporte de incidencias.`)
    );
  }
  if (cntPreValido > 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("exito", "✅",
        `${cntPreValido} registro${cntPreValido !== 1 ? "s" : ""} con puntuacion y evaluador validos ` +
        `detectados y marcados automaticamente como validos.`)
    );
  }

  zonaAlertasPaso1.appendChild(
    crearAlerta(
      totalParaEvaluar - cntBloq > 0 || cntPreValido > 0 ? "exito" : "aviso",
      "📊",
      `Se procesaron ${totalProcesados} fila${totalProcesados !== 1 ? "s" : ""}. ` +
      `${totalParaEvaluar - cntBloq} pendientes, ${cntPreValido} pre-validados, ` +
      `${cntBloq} bloqueado${cntBloq !== 1 ? "s" : ""}, ` +
      `${totalDuplicados} duplicado${totalDuplicados !== 1 ? "s" : ""}, ${totalInvalidos} invalido${totalInvalidos !== 1 ? "s" : ""}.`
    )
  );

  const hayPendientes = (totalParaEvaluar - cntBloq) > 0;
  const todoPreValidado = cntPreValido > 0 && (totalParaEvaluar - cntBloq) === 0 && totalDuplicados === 0;

  if (duplicadosDetectados.length === 0 && (hayPendientes || todoPreValidado)) {
    zonaIniciar.classList.remove("d-none");
    const hayNombres = registros.some(r => r.nombreCompleto && r.nombreCompleto.trim());
    zonaOrdenamiento.style.display = hayNombres && hayPendientes ? "" : "none";

    // Boton de acceso directo a exportacion cuando todos ya estan pre-validados
    if (todoPreValidado) {
      const btnIrExportar = document.getElementById("btn-ir-exportar-directo");
      if (btnIrExportar) btnIrExportar.style.display = "";
    }
  } else if (duplicadosDetectados.length === 0 && (totalParaEvaluar - cntBloq) === 0 && cntPreValido === 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "No hay trabajadores validos para evaluar. Revise la lista.")
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
  textoDuplicados.textContent =
    `Se detectaron ${dups.length} cédula${dups.length !== 1 ? "s" : ""} duplicada${dups.length !== 1 ? "s" : ""}. ` +
    `Utilice los botones rápidos para limpiar la lista automáticamente o inspeccione cada caso abajo:`;

  listaDuplicados.replaceChildren();

  dups.forEach(d => {
    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-duplicado-caso";

    const regBase = registros.find(r => r.cedulaNormalizada === d.cedulaNorm);
    const cedMostrar = regBase ? regBase.cedulaOriginal : d.cedulaNorm;

    const header = document.createElement("div");
    header.className = "tarjeta-duplicado-header";
    header.innerHTML = `<span>⚠️ Cédula duplicada: <strong>${cedMostrar}</strong></span><span>(${d.filas.length} apariciones)</span>`;
    tarjeta.appendChild(header);

    // Listar cada ocurrencia con su número de fila y nombre
    const ocurrencias = registros.filter(r => r.cedulaNormalizada === d.cedulaNorm);
    ocurrencias.forEach(r => {
      const item = document.createElement("div");
      item.className = "duplicado-opcion-item";

      const info = document.createElement("div");
      const badgeFila = document.createElement("span");
      badgeFila.className = "badge-num-fila";
      badgeFila.textContent = `Fila #${r.numeroFilaOriginal}`;

      const txtNombre = document.createTextNode(
        ` · ${r.cedulaOriginal}${r.nombreCompleto ? ` (${r.nombreCompleto})` : ""}`
      );

      info.appendChild(badgeFila);
      info.appendChild(txtNombre);

      const btnEliminar = document.createElement("button");
      btnEliminar.className = "btn-eliminar-fila";
      btnEliminar.type = "button";
      btnEliminar.textContent = `🗑️ Eliminar Fila #${r.numeroFilaOriginal}`;
      btnEliminar.addEventListener("click", () => eliminarFilaOriginal(r.numeroFilaOriginal));

      item.appendChild(info);
      item.appendChild(btnEliminar);
      tarjeta.appendChild(item);
    });

    listaDuplicados.appendChild(tarjeta);
  });

  zonaDuplicados.classList.remove("d-none");

  // Si el visor de filas estaba abierto, actualizarlo también
  if (!visorFilasContenedor.classList.contains("d-none")) {
    renderizarVisorFilas(registros);
  }
}

/* --- Desduplicación Automática Masiva --- */
btnAutocleanPrimera.addEventListener("click", () => autodesduplicar("primera"));
btnAutocleanUltima.addEventListener("click", () => autodesduplicar("ultima"));

function autodesduplicar(modo) {
  const filasRaw = areaTrabajadores.value.split("\n");
  const mapaVistas = new Map();

  filasRaw.forEach((f, idx) => {
    const { cedula } = extraerDatosFila(f);
    const cnorm = normalizarCedula(cedula);
    if (cnorm && esFormatoValido(cnorm)) {
      if (!mapaVistas.has(cnorm)) mapaVistas.set(cnorm, []);
      mapaVistas.get(cnorm).push(idx);
    }
  });

  const indicesAEliminar = new Set();
  for (const [, indices] of mapaVistas.entries()) {
    if (indices.length > 1) {
      if (modo === "primera") {
        indices.slice(1).forEach(i => indicesAEliminar.add(i));
      } else {
        indices.slice(0, -1).forEach(i => indicesAEliminar.add(i));
      }
    }
  }

  const filasLimpias = filasRaw.filter((_, idx) => !indicesAEliminar.has(idx));
  areaTrabajadores.value = filasLimpias.join("\n");
  validarListaInicial();
}

/* --- Visor de Lista Numerada por Filas --- */
btnToggleVisorFilas.addEventListener("click", () => {
  const estaOculto = visorFilasContenedor.classList.contains("d-none");
  visorFilasContenedor.classList.toggle("d-none", !estaOculto);
  txtToggleVisor.textContent = estaOculto ? "Ocultar lista numerada" : "Ver lista numerada por filas";
  if (estaOculto) {
    renderizarVisorFilas(trabajadores);
  }
});

function renderizarVisorFilas(registros) {
  cuerpoTablaVisor.replaceChildren();

  if (registros.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 7;
    td.textContent = "No hay filas para mostrar.";
    td.style.textAlign = "center";
    td.style.color = "var(--txt-muted)";
    tr.appendChild(td);
    cuerpoTablaVisor.appendChild(tr);
    return;
  }

  registros.forEach(r => {
    const tr = document.createElement("tr");
    if (r.estado === "duplicado") tr.className = "fila-num-duplicada";
    if (r.estado === "error") tr.className = "fila-num-error";

    // Fila #
    const tdFila = document.createElement("td");
    const badgeFila = document.createElement("span");
    badgeFila.className = "badge-num-fila";
    badgeFila.textContent = "#" + r.numeroFilaOriginal;
    tdFila.appendChild(badgeFila);
    tr.appendChild(tdFila);

    // Cedula
    const tdCed = document.createElement("td");
    tdCed.textContent = r.cedulaOriginal || "(vacia)";
    tdCed.style.fontWeight = "700";
    tr.appendChild(tdCed);

    // Nombre
    const tdNom = document.createElement("td");
    tdNom.textContent = r.nombreCompleto || "---";
    tdNom.style.fontSize = ".8rem";
    tdNom.style.color = "var(--txt-muted)";
    tr.appendChild(tdNom);

    // Puntuacion
    const tdVal = document.createElement("td");
    tdVal.style.textAlign = "center";
    tdVal.style.fontWeight = "700";
    if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
      tdVal.textContent = r.valoracionNumerica;
      if (r.estado === "error" && r.errores.some(function(e) { return e.includes("rango") || e.includes("BLOQUEADO"); })) {
        tdVal.style.color = "#d32f2f";
      }
    } else {
      tdVal.textContent = "---";
      tdVal.style.color = "var(--txt-muted)";
    }
    tr.appendChild(tdVal);

    // Evaluador
    const tdEval = document.createElement("td");
    tdEval.textContent = r.cedulaEvaluadorOriginal || "---";
    tdEval.style.fontSize = ".8rem";
    tr.appendChild(tdEval);

    // Estado
    const tdEst = document.createElement("td");
    const badgeEst = document.createElement("span");
    const mapaB = {
      pendiente: "badge-pendiente", valido: "badge-valido",
      duplicado: "badge-error", error: "badge-error", bloqueado: "badge-bloqueado"
    };
    badgeEst.className = "badge " + (mapaB[r.estado] || "badge-pendiente");
    badgeEst.textContent = r.estado;
    if (r.errores.length > 0) badgeEst.title = r.errores.join(" | ");
    tdEst.appendChild(badgeEst);
    tr.appendChild(tdEst);

    // Accion
    const tdAcc = document.createElement("td");
    const btnDel = document.createElement("button");
    btnDel.className = "btn-eliminar-fila";
    btnDel.type = "button";
    btnDel.textContent = "Eliminar";
    btnDel.addEventListener("click", function() { eliminarFilaOriginal(r.numeroFilaOriginal); });
    tdAcc.appendChild(btnDel);
    tr.appendChild(tdAcc);

    cuerpoTablaVisor.appendChild(tr);
  });
}

function eliminarFilaOriginal(numFila) {
  const filasRaw = areaTrabajadores.value.split("\n");
  if (numFila >= 1 && numFila <= filasRaw.length) {
    filasRaw.splice(numFila - 1, 1);
    areaTrabajadores.value = filasRaw.join("\n");
    validarListaInicial();
  }
}

btnCorregirLista.addEventListener("click", () => {
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  limpiarZona(zonaAlertasPaso1);
  areaTrabajadores.focus();
});

btnContinuarVal.addEventListener("click", () => {
  const excluidos = trabajadores.filter(r => r.estado === "duplicado").length;
  trabajadores = trabajadores.filter(r => r.estado !== "duplicado" && r.estado !== "error");
  zonaDuplicados.classList.add("d-none");
  limpiarZona(zonaAlertasPaso1);
  if (excluidos > 0) {
    const validosCnt = trabajadores.filter(r => r.estado === "pendiente").length;
    zonaAlertasPaso1.appendChild(
      crearAlerta("aviso", "⚠️", `Se excluyeron ${excluidos} registro${excluidos !== 1 ? "s" : ""} duplicado${excluidos !== 1 ? "s" : ""}. Se continuará con ${validosCnt} trabajador${validosCnt !== 1 ? "es" : ""} válido${validosCnt !== 1 ? "s" : ""}.`)
    );
  }
  zonaIniciar.classList.remove("d-none");
  const hayNombresV = trabajadores.some(r => r.nombreCompleto && r.nombreCompleto.trim());
  zonaOrdenamiento.style.display = hayNombresV ? "" : "none";
});

btnLimpiar.addEventListener("click", () => {
  areaTrabajadores.value = "";
  areaBloqueados.value   = "";
  areaReposo.value       = "";
  areaEspecial.value     = "";
  contadorFilas.textContent = "0 filas detectadas";
  contadorBloq.textContent  = "0 cédulas";
  contadorRep.textContent   = "0 cédulas";
  contadorEsp.textContent   = "0 cédulas";
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");
  zonaOrdenamiento.style.display = "none";
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.classList.remove("btn-orden-activo");
  btnOrdenarZA.classList.remove("btn-orden-activo");
  limpiarZona(zonaAlertasPaso1);
  trabajadores = [];
});

/* ============================================================
   11. ORDENAMIENTO — PASO 1
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
  btnOrdenarAZ.classList.add("btn-orden-activo");
  btnOrdenarZA.classList.remove("btn-orden-activo");
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
  btnOrdenarZA.classList.add("btn-orden-activo");
  btnOrdenarAZ.classList.remove("btn-orden-activo");
});

btnOrdenarOrig.addEventListener("click", () => {
  trabajadores.sort((a, b) => (a.numeroFilaOriginal || 0) - (b.numeroFilaOriginal || 0));
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.classList.remove("btn-orden-activo");
  btnOrdenarZA.classList.remove("btn-orden-activo");
});

/* ============================================================
   12. INICIAR EVALUACIÓN
   ============================================================ */
const btnIrExportarDirecto = $("btn-ir-exportar-directo");
if (btnIrExportarDirecto) {
  btnIrExportarDirecto.addEventListener("click", () => {
    sesionActiva = true;
    abrirPantallaExportacion();
  });
}

btnIniciar.addEventListener("click", () => {
  trabajadores = trabajadores.filter(r => r.estado === "pendiente" || r.estado === "bloqueado" || r.estado === "valido");

  if (trabajadores.length === 0) {
    limpiarZona(zonaAlertasPaso1);
    zonaAlertasPaso1.appendChild(crearAlerta("error", "❌", "No hay trabajadores para evaluar."));
    return;
  }

  indiceActual     = 0;
  evaluadorActual  = "";
  sesionActiva     = true;
  ultimaValoracion = null;
  historialDeshacer = [];

  mostrarPantalla(2);
  if (modoVista === "planilla") {
    renderizarPlanilla();
  } else {
    cargarTrabajador(indiceActual);
    inputValoracion.focus();
  }
});

/* ============================================================
   13. SELECTOR DE MODO DE VISTA
   ============================================================ */
btnModoFicha.addEventListener("click", () => cambiarModoVista("ficha"));
btnModoPlanilla.addEventListener("click", () => cambiarModoVista("planilla"));

function cambiarModoVista(modo) {
  modoVista = modo;

  if (modo === "ficha") {
    btnModoFicha.classList.add("activo");
    btnModoFicha.setAttribute("aria-pressed", "true");
    btnModoPlanilla.classList.remove("activo");
    btnModoPlanilla.setAttribute("aria-pressed", "false");
    vistaFicha.style.display = "";
    vistaPlanilla.style.display = "none";
    cargarTrabajador(indiceActual);
    inputValoracion.focus();
  } else {
    btnModoPlanilla.classList.add("activo");
    btnModoPlanilla.setAttribute("aria-pressed", "true");
    btnModoFicha.classList.remove("activo");
    btnModoFicha.setAttribute("aria-pressed", "false");
    vistaPlanilla.style.display = "";
    vistaFicha.style.display = "none";
    renderizarPlanilla();
  }
}

/* ============================================================
   14. EVALUACIÓN INDIVIDUAL — MODO FICHA
   ============================================================ */
function cargarTrabajador(idx) {
  if (idx < 0 || idx >= trabajadores.length) return;
  indiceActual = idx;

  const t = trabajadores[idx];
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
  const total = trabajadores.length;
  const totalEvaluables = trabajadores.filter(w => w.condicion !== "bloqueado").length;

  // Progreso
  actualizarProgreso();

  // Info del trabajador
  cedulaDisplay.textContent  = t.cedulaOriginal;
  numEvalDisplay.textContent = `${idx + 1} de ${total}`;

  if (t.nombreCompleto && t.nombreCompleto.trim()) {
    campoNombreCont.style.display = "";
    nombreDisplay.textContent = t.nombreCompleto;
  } else {
    campoNombreCont.style.display = "none";
    nombreDisplay.textContent = "";
  }

  // Badge de condición
  condicionDisplay.replaceChildren();
  const mapaBadge = {
    normal: "badge-normal",
    reposo: "badge-reposo",
    asignacion_especial: "badge-especial",
    bloqueado: "badge-bloqueado"
  };
  const badge = document.createElement("span");
  badge.className = `badge ${mapaBadge[t.condicion] || "badge-normal"}`;
  badge.textContent = regla.etiqueta;
  condicionDisplay.appendChild(badge);

  rangoDisplay.textContent = regla.rangoTexto;

  // Formulario
  if (t.condicion === "bloqueado") {
    panelBloqueado.classList.remove("d-none");
    formEval.style.display = "none";
    zonaChipsVal.style.display = "none";
    btnGuardarSig.disabled = true;
  } else {
    panelBloqueado.classList.add("d-none");
    formEval.style.display = "block";
    zonaChipsVal.style.display = "block";
    btnGuardarSig.disabled = false;

    inputValoracion.value = t.valoracionOriginal || "";
    inputEvaluador.value  = t.cedulaEvaluadorOriginal || evaluadorActual;

    hintValoracion.textContent = `Rango permitido: ${regla.rangoTexto}`;

    // Actualizar chip Máx
    chipMax.textContent = `Máx (${regla.maximo})`;
    chipMax.dataset.val = regla.maximo;

    // Habilitar/deshabilitar chips según condición
    document.querySelectorAll(".chip-val[data-val]").forEach(btn => {
      const val = parseInt(btn.dataset.val, 10);
      const fuera = val > regla.maximo || val < regla.minimo;
      btn.disabled = fuera;
      btn.title = fuera ? `Fuera del rango permitido (${regla.rangoTexto})` : "";
    });

    // Chip repetir
    chipRepeat.disabled = ultimaValoracion === null;

    limpiarErrores();
    inputValoracion.focus();
  }

  // Alertas del trabajador
  limpiarZona(zonaAlertasPaso2);
  t.advertencias.forEach(adv => {
    zonaAlertasPaso2.appendChild(crearAlerta("aviso", "⚠️", adv));
  });

  btnAnterior.disabled = idx === 0;

  // Evaluadores frecuentes
  actualizarEvaluadoresFrecuentes();
}

function actualizarProgreso() {
  const total    = trabajadores.length;
  const evaluados = trabajadores.filter(w => w.estado === "valido" || w.estado === "omitido").length;
  const pct      = total > 0 ? Math.round((evaluados / total) * 100) : 0;

  const totalEvaluables = trabajadores.filter(w => w.condicion !== "bloqueado").length;
  textoProgresoEval.textContent = `Evaluación ${indiceActual + 1} de ${total}${totalEvaluables !== total ? ` (${totalEvaluables} evaluables)` : ""}`;
  barraProgreso.style.width = `${pct}%`;
  barraProgreso.classList.toggle("completa", pct === 100);
  barraCont.setAttribute("aria-valuenow", pct);
  textoPorcentaje.textContent = `${evaluados} de ${total} procesados (${pct}%)`;
}

function limpiarErrores() {
  errorValoracion.classList.remove("visible");
  errorEvaluador.classList.remove("visible");
  inputValoracion.classList.remove("input-error", "input-ok");
  inputEvaluador.classList.remove("input-error", "input-ok");
}

/* --- Chips de valoración rápida --- */
document.querySelectorAll(".chip-val[data-val]").forEach(btn => {
  btn.addEventListener("click", () => {
    if (btn.disabled) return;
    inputValoracion.value = btn.dataset.val;
    validarCampoValoracion(false);
    inputValoracion.focus();
  });
});

chipMax.addEventListener("click", () => {
  const t = trabajadores[indiceActual];
  if (!t || t.condicion === "bloqueado") return;
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
  inputValoracion.value = regla.maximo;
  validarCampoValoracion(false);
  inputValoracion.focus();
});

chipRepeat.addEventListener("click", () => {
  if (ultimaValoracion !== null) {
    inputValoracion.value = ultimaValoracion;
    validarCampoValoracion(false);
    inputValoracion.focus();
  }
});

/* --- Validación en tiempo real --- */
inputValoracion.addEventListener("input", () => validarCampoValoracion(false));
inputEvaluador.addEventListener("input",  () => {
  validarCampoEvaluador(false);
  actualizarEvaluadoresFrecuentes();
});

function validarCampoValoracion(mostrarErr = true) {
  const t = trabajadores[indiceActual];
  if (!t) return false;
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
  const val = inputValoracion.value.trim();

  if (!val) {
    if (mostrarErr) mostrarError_(errorValoracion, "La valoración es obligatoria.");
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarErr);
    return false;
  }

  const num = parsearNumero(val);
  if (isNaN(num)) {
    if (mostrarErr) mostrarError_(errorValoracion, "La valoración debe ser un número válido.");
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarErr);
    return false;
  }

  if (num < regla.minimo || num > regla.maximo) {
    if (mostrarErr) mostrarError_(errorValoracion, `La valoración debe estar entre ${regla.minimo} y ${regla.maximo}.`);
    inputValoracion.classList.remove("input-ok");
    inputValoracion.classList.toggle("input-error", mostrarErr);
    return false;
  }

  errorValoracion.classList.remove("visible");
  inputValoracion.classList.remove("input-error");
  inputValoracion.classList.add("input-ok");
  return true;
}

function validarCampoEvaluador(mostrarErr = true) {
  const val = normalizarCedula(inputEvaluador.value);

  if (!val) {
    if (mostrarErr) mostrarError_(errorEvaluador, "Debe indicar la cédula del evaluador antes de guardar.");
    inputEvaluador.classList.remove("input-ok");
    inputEvaluador.classList.toggle("input-error", mostrarErr);
    return false;
  }

  if (!esFormatoValido(val)) {
    if (mostrarErr) mostrarError_(errorEvaluador, "La cédula del evaluador no tiene un formato válido.");
    inputEvaluador.classList.remove("input-ok");
    inputEvaluador.classList.toggle("input-error", mostrarErr);
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

/* --- Guardar evaluación + Deshacer --- */
function guardarYSiguiente() {
  const t = trabajadores[indiceActual];
  if (!t) return;

  if (t.condicion === "bloqueado") {
    avanzarSiguiente();
    return;
  }

  const valOk  = validarCampoValoracion(true);
  const evalOk = validarCampoEvaluador(true);
  if (!valOk || !evalOk) return;

  // Guardar snapshot en pila de deshacer
  historialDeshacer.push({
    idx: indiceActual,
    snapshot: { ...t }
  });
  if (historialDeshacer.length > 30) historialDeshacer.shift();

  const num = parsearNumero(inputValoracion.value.trim());
  ultimaValoracion                  = inputValoracion.value.trim().replace(",", ".");
  t.valoracionOriginal              = ultimaValoracion;
  t.valoracionNumerica              = num;
  t.cedulaEvaluadorOriginal         = inputEvaluador.value.trim();
  t.cedulaEvaluadorNormalizada      = normalizarCedula(inputEvaluador.value);
  t.estado                          = "valido";
  t.errores                         = [];

  evaluadorActual = t.cedulaEvaluadorOriginal;
  registrarEvaluadorFrecuente(evaluadorActual);

  chipRepeat.disabled = false;
  avanzarSiguiente();
}

function deshacerUltimaAccion() {
  if (historialDeshacer.length === 0) return;
  const { idx, snapshot } = historialDeshacer.pop();
  Object.assign(trabajadores[idx], snapshot);
  indiceActual = idx;
  cargarTrabajador(indiceActual);
  limpiarZona(zonaAlertasPaso2);
  zonaAlertasPaso2.appendChild(crearAlerta("aviso", "↩️", "Última valoración deshecha. Puede corregirla."));
}

function avanzarSiguiente() {
  const siguiente = indiceActual + 1;
  if (siguiente >= trabajadores.length) {
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

/* --- Evaluadores frecuentes --- */
function registrarEvaluadorFrecuente(ced) {
  if (!ced) return;
  evaluadoresFrecuentes = [ced, ...evaluadoresFrecuentes.filter(e => e !== ced)].slice(0, 3);
}

function actualizarEvaluadoresFrecuentes() {
  if (evaluadoresFrecuentes.length === 0) {
    zonaEvalFrecuentes.style.display = "none";
    return;
  }
  zonaEvalFrecuentes.style.display = "";
  listaEvalFrecuentes.replaceChildren();
  evaluadoresFrecuentes.forEach(ev => {
    const btn = document.createElement("button");
    btn.className = "chip-eval";
    btn.type = "button";
    btn.textContent = ev;
    btn.title = `Usar evaluador: ${ev}`;
    btn.addEventListener("click", () => {
      inputEvaluador.value = ev;
      validarCampoEvaluador(false);
    });
    listaEvalFrecuentes.appendChild(btn);
  });
}

/* --- Botones paso 2 ficha --- */
btnGuardarSig.addEventListener("click", guardarYSiguiente);
btnAnterior.addEventListener("click",   avanzarAnterior);

btnOmitir.addEventListener("click", () => {
  const t = trabajadores[indiceActual];
  if (t) {
    t.estado  = "omitido";
    t.omitido = true;
    t.errores = ["Omitido por el evaluador en esta sesión."];
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

/* --- Ir al siguiente pendiente --- */
btnIrPendiente.addEventListener("click", () => {
  const idx = trabajadores.findIndex(t => t.estado === "pendiente");
  if (idx === -1) {
    alert("No hay trabajadores pendientes por evaluar.");
    return;
  }
  if (modoVista === "ficha") {
    cargarTrabajador(idx);
    inputValoracion.focus();
  } else {
    const fila = document.querySelector(`[data-planilla-idx="${idx}"]`);
    if (fila) {
      fila.scrollIntoView({ behavior: "smooth", block: "center" });
      const inp = fila.querySelector(".planilla-input");
      if (inp) inp.focus();
    }
  }
});

/* ============================================================
   15. MODO PLANILLA RÁPIDA
   ============================================================ */
function renderizarPlanilla() {
  cuerpoTablaPlanilla.replaceChildren();

  // Sincronizar evaluador
  inputEvaluadorPlanilla.value = evaluadorActual;

  trabajadores.forEach((t, idx) => {
    if (t.condicion === "bloqueado") {
      const tr = crearFilaPlanilla(t, idx, true);
      cuerpoTablaPlanilla.appendChild(tr);
      return;
    }
    const tr = crearFilaPlanilla(t, idx, false);
    cuerpoTablaPlanilla.appendChild(tr);
  });

  actualizarProgreso();
}

function crearFilaPlanilla(t, idx, bloqueado) {
  const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
  const tr = document.createElement("tr");
  tr.dataset.planillaIdx = idx;

  // Clase de estado
  if (t.estado === "valido") tr.classList.add("fila-ok");
  if (t.condicion === "bloqueado") tr.classList.add("fila-error-val");

  // # fila
  const tdNum = document.createElement("td");
  tdNum.textContent = idx + 1;
  tr.appendChild(tdNum);

  // Cédula
  const tdCed = document.createElement("td");
  tdCed.textContent = t.cedulaOriginal;
  tr.appendChild(tdCed);

  // Nombre
  const tdNom = document.createElement("td");
  tdNom.textContent = t.nombreCompleto || "—";
  tdNom.style.color = "var(--txt-muted)";
  tdNom.style.fontSize = ".8rem";
  tr.appendChild(tdNom);

  // Condición badge
  const tdCond = document.createElement("td");
  const mapaBadge = {
    normal: "badge-normal", reposo: "badge-reposo",
    asignacion_especial: "badge-especial", bloqueado: "badge-bloqueado"
  };
  const badge = document.createElement("span");
  badge.className = `badge ${mapaBadge[t.condicion] || "badge-normal"}`;
  badge.textContent = regla.etiqueta;
  tdCond.appendChild(badge);
  tr.appendChild(tdCond);

  // Rango
  const tdRango = document.createElement("td");
  tdRango.textContent = regla.rangoTexto;
  tdRango.style.fontSize = ".78rem";
  tdRango.style.color = "var(--txt-muted)";
  tr.appendChild(tdRango);

  // Input de valoración
  const tdVal = document.createElement("td");
  if (bloqueado) {
    const spanB = document.createElement("span");
    spanB.textContent = "🚫";
    spanB.style.color = "var(--red)";
    tdVal.appendChild(spanB);
  } else {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "planilla-input";
    inp.value = t.valoracionOriginal || "";
    inp.placeholder = `${regla.minimo}–${regla.maximo}`;
    inp.autocomplete = "off";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", `Valoración para ${t.cedulaOriginal}`);
    inp.dataset.planillaIdx = idx;

    // Clase inicial si ya tiene valor
    if (t.estado === "valido") inp.classList.add("ok");

    inp.addEventListener("input", () => {
      const num = parsearNumero(inp.value.trim());
      if (!inp.value.trim()) {
        inp.classList.remove("ok", "err");
        tr.classList.remove("fila-ok", "fila-error-val");
      } else if (isNaN(num) || num < regla.minimo || num > regla.maximo) {
        inp.classList.remove("ok");
        inp.classList.add("err");
        tr.classList.remove("fila-ok");
        tr.classList.add("fila-error-val");
      } else {
        inp.classList.remove("err");
        inp.classList.add("ok");
        tr.classList.remove("fila-error-val");
        tr.classList.add("fila-ok");
      }
    });

    // Navegación por teclado en planilla
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === "ArrowDown") {
        e.preventDefault();
        irASiguienteFilaPlanilla(idx);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        irAFilaPlanillaAnterior(idx);
      }
    });

    tdVal.appendChild(inp);
  }
  tr.appendChild(tdVal);

  // Estado
  const tdEstado = document.createElement("td");
  const mapaEstado = {
    pendiente: "badge-pendiente", valido: "badge-valido",
    error: "badge-error", omitido: "badge-omitido", bloqueado: "badge-bloqueado"
  };
  const badgeEst = document.createElement("span");
  badgeEst.className = `badge ${mapaEstado[t.estado] || "badge-pendiente"}`;
  badgeEst.textContent = t.estado;
  badgeEst.dataset.estadoBadgeIdx = idx;
  tdEstado.appendChild(badgeEst);
  tr.appendChild(tdEstado);

  return tr;
}

function irASiguienteFilaPlanilla(idxActual) {
  for (let i = idxActual + 1; i < trabajadores.length; i++) {
    if (trabajadores[i].condicion !== "bloqueado") {
      const siguienteFila = document.querySelector(`[data-planilla-idx="${i}"] .planilla-input`);
      if (siguienteFila) { siguienteFila.focus(); return; }
    }
  }
}

function irAFilaPlanillaAnterior(idxActual) {
  for (let i = idxActual - 1; i >= 0; i--) {
    if (trabajadores[i].condicion !== "bloqueado") {
      const filaAnterior = document.querySelector(`[data-planilla-idx="${i}"] .planilla-input`);
      if (filaAnterior) { filaAnterior.focus(); return; }
    }
  }
}

btnGuardarPlanilla.addEventListener("click", () => {
  const evPlanilla = normalizarCedula(inputEvaluadorPlanilla.value);
  if (!evPlanilla || !esFormatoValido(evPlanilla)) {
    errorEvaluadorPlanilla.textContent = "Debe indicar la cédula del evaluador global antes de guardar.";
    errorEvaluadorPlanilla.classList.add("visible");
    inputEvaluadorPlanilla.focus();
    return;
  }
  errorEvaluadorPlanilla.classList.remove("visible");

  let guardados = 0;
  let errores   = 0;

  document.querySelectorAll(".planilla-input").forEach(inp => {
    const idx = parseInt(inp.dataset.planillaIdx, 10);
    const t = trabajadores[idx];
    if (!t || t.condicion === "bloqueado") return;

    const valStr = inp.value.trim();
    if (!valStr) return;

    const regla = REGLAS_VALORACION[t.condicion] || REGLAS_VALORACION.normal;
    const num = parsearNumero(valStr);

    if (isNaN(num) || num < regla.minimo || num > regla.maximo) {
      errores++;
      return;
    }

    t.valoracionOriginal         = valStr.replace(",", ".");
    t.valoracionNumerica         = num;
    t.cedulaEvaluadorOriginal    = inputEvaluadorPlanilla.value.trim();
    t.cedulaEvaluadorNormalizada = evPlanilla;
    t.estado                     = "valido";
    t.errores                    = [];
    guardados++;
  });

  evaluadorActual = inputEvaluadorPlanilla.value.trim();
  registrarEvaluadorFrecuente(evaluadorActual);

  limpiarZona(zonaAlertasPaso2);
  if (errores > 0) {
    zonaAlertasPaso2.appendChild(
      crearAlerta("aviso", "⚠️", `${errores} fila${errores !== 1 ? "s" : ""} con valores fuera de rango no fueron guardadas.`)
    );
  }
  if (guardados > 0) {
    zonaAlertasPaso2.appendChild(
      crearAlerta("exito", "✅", `${guardados} valoración${guardados !== 1 ? "es" : ""} guardada${guardados !== 1 ? "s" : ""} correctamente.`)
    );
  }

  renderizarPlanilla();
  actualizarProgreso();
});

/* ============================================================
   16. BUSCADOR DE TRABAJADORES — PASO 2
   ============================================================ */
inputBuscador.addEventListener("input", () => {
  const q = inputBuscador.value.trim().toLowerCase();
  if (!q || !sesionActiva) {
    buscadorResultados.style.display = "none";
    return;
  }

  const resultados = trabajadores
    .map((t, idx) => ({ t, idx }))
    .filter(({ t }) =>
      t.cedulaOriginal.toLowerCase().includes(q) ||
      t.cedulaNormalizada.includes(normalizarCedula(q)) ||
      (t.nombreCompleto && t.nombreCompleto.toLowerCase().includes(q))
    )
    .slice(0, 8);

  if (resultados.length === 0) {
    buscadorResultados.style.display = "none";
    return;
  }

  buscadorResultados.replaceChildren();
  resultados.forEach(({ t, idx }) => {
    const div = document.createElement("div");
    div.className = "buscador-item";
    div.setAttribute("role", "option");
    div.tabIndex = 0;

    const ced = document.createElement("span");
    ced.className = "buscador-item-ced";
    ced.textContent = t.cedulaOriginal;

    const nom = document.createElement("span");
    nom.className = "buscador-item-nom";
    nom.textContent = t.nombreCompleto ? ` · ${t.nombreCompleto}` : "";

    const cond = document.createElement("span");
    cond.className = `badge ${idx === indiceActual ? "badge-valido" : "badge-pendiente"}`;
    cond.style.cssText = "float:right; font-size:.68rem;";
    cond.textContent = `#${idx + 1} · ${t.estado}`;

    div.appendChild(ced);
    div.appendChild(nom);
    div.appendChild(cond);

    const irA = () => {
      buscadorResultados.style.display = "none";
      inputBuscador.value = "";
      if (modoVista === "ficha") {
        cargarTrabajador(idx);
        inputValoracion.focus();
      } else {
        const fila = document.querySelector(`[data-planilla-idx="${idx}"] .planilla-input`);
        if (fila) { fila.scrollIntoView({ behavior: "smooth", block: "center" }); fila.focus(); }
      }
    };

    div.addEventListener("click", irA);
    div.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); irA(); }
    });

    buscadorResultados.appendChild(div);
  });

  buscadorResultados.style.display = "block";
});

// Cerrar buscador al hacer clic fuera
document.addEventListener("click", e => {
  if (!inputBuscador.contains(e.target) && !buscadorResultados.contains(e.target)) {
    buscadorResultados.style.display = "none";
  }
});

/* ============================================================
   17. ATAJOS DE TECLADO — PASO 2
   ============================================================ */
document.addEventListener("keydown", e => {
  if (!pantalla2.classList.contains("activa")) return;
  if (modoVista !== "ficha") return;

  // Ctrl+Z: Deshacer
  if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
    e.preventDefault();
    deshacerUltimaAccion();
    return;
  }

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
   18. EXPORTACIÓN — PASO 3
   ============================================================ */
function abrirPantallaExportacion() {
  mostrarPantalla(3);
  generarExportacion();
}

function generarExportacion() {
  const validos  = trabajadores.filter(t => t.estado === "valido");
  const noValidos = trabajadores.filter(t => t.estado !== "valido");

  const nCed = validos.length;
  const alineado = nCed > 0;

  verificAlin.classList.toggle("error-alineacion", !alineado);

  if (alineado) {
    verificTitulo.textContent = `✅ ${nCed} registro${nCed !== 1 ? "s" : ""} válido${nCed !== 1 ? "s" : ""} listos para exportar`;
    verificDetalle.replaceChildren();
    const ul = document.createElement("ul");
    ul.style.cssText = "margin:8px 0 0 18px; font-size:.875rem;";
    [
      `Cédulas de trabajadores: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      `Valoraciones: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      `Cédulas de evaluadores: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      "Los tres listados están alineados y listos para pegarse por separado en Excel."
    ].forEach(txt => {
      const li = document.createElement("li"); li.textContent = txt; ul.appendChild(li);
    });
    verificDetalle.appendChild(ul);
  } else {
    verificTitulo.textContent = "❌ No hay registros válidos para exportar";
    verificDetalle.textContent = "Regrese a evaluar y complete al menos un trabajador.";
  }

  salidaCedulas.value      = validos.map(t => t.cedulaOriginal).join("\n");
  salidaValoraciones.value = validos.map(t => t.valoracionOriginal).join("\n");
  salidaEvaluadores.value  = validos.map(t => t.cedulaEvaluadorOriginal).join("\n");

  btnCopiarCedulas.disabled = !alineado;
  btnCopiarVals.disabled    = !alineado;
  btnCopiarEvals.disabled   = !alineado;
  btnCopiarTsv.disabled     = !alineado;

  generarPreview(validos);
  generarTablaIncidencias(noValidos);
}

function generarPreview(validos) {
  cuerpoPreview.replaceChildren();

  if (validos.length === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "Sin registros válidos.";
    td.style.textAlign = "center";
    td.style.color = "var(--txt-muted)";
    td.style.padding = "12px";
    tr.appendChild(td);
    cuerpoPreview.appendChild(tr);
    return;
  }

  const mostrar = [];
  const PREV = 3;

  if (validos.length <= PREV * 2) {
    validos.forEach(t => mostrar.push({ t, sep: false }));
  } else {
    validos.slice(0, PREV).forEach(t => mostrar.push({ t, sep: false }));
    mostrar.push({ sep: true });
    validos.slice(-PREV).forEach(t => mostrar.push({ t, sep: false }));
  }

  mostrar.forEach(item => {
    const tr = document.createElement("tr");
    if (item.sep) {
      tr.className = "preview-sep";
      const td = document.createElement("td");
      td.colSpan = 3;
      td.textContent = `··· ${validos.length - PREV * 2} fila${validos.length - PREV * 2 !== 1 ? "s" : ""} omitidas en la vista previa ···`;
      tr.appendChild(td);
    } else {
      [item.t.cedulaOriginal, item.t.valoracionOriginal, item.t.cedulaEvaluadorOriginal].forEach(v => {
        const td = document.createElement("td");
        td.textContent = v;
        tr.appendChild(td);
      });
    }
    cuerpoPreview.appendChild(tr);
  });
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

  const mapaEstadoBadge = {
    pendiente: "badge-pendiente", valido: "badge-valido",
    error: "badge-error", omitido: "badge-omitido",
    bloqueado: "badge-bloqueado", duplicado: "badge-error"
  };

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

    celdas.forEach((val, i) => {
      const td = document.createElement("td");
      if (i === 4) {
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

/* --- Botones de Copiar --- */
function copiarBloque(texto, msgEl) {
  if (!texto.trim()) return;
  copiarAlPortapapeles(texto)
    .then(() => mostrarMsgCopiado(msgEl))
    .catch(() => alert("No se pudo copiar automáticamente. Seleccione el texto y use Ctrl+C."));
}

btnCopiarCedulas.addEventListener("click", () =>
  copiarBloque(salidaCedulas.value, msgCedulas));

btnCopiarVals.addEventListener("click", () =>
  copiarBloque(salidaValoraciones.value, msgValores));

btnCopiarEvals.addEventListener("click", () =>
  copiarBloque(salidaEvaluadores.value, msgEvaluadores));

btnCopiarReporte.addEventListener("click", () => {
  const noValidos = trabajadores.filter(t => t.estado !== "valido");
  const lineas = ["Fila\tCédula\tNombre\tCondición\tEstado\tDetalle"];
  noValidos.forEach(t => {
    lineas.push([
      t.numeroFilaOriginal ?? "",
      t.cedulaOriginal || "",
      t.nombreCompleto  || "",
      REGLAS_VALORACION[t.condicion]?.etiqueta || "",
      t.estado,
      (t.errores.join(" / ") || t.advertencias.join(" / ") || "")
    ].join("\t"));
  });
  copiarBloque(lineas.join("\n"), msgReporte);
});

// Copiar tabla completa (3 columnas, TSV)
btnCopiarTsv.addEventListener("click", () => {
  const validos = trabajadores.filter(t => t.estado === "valido");
  if (validos.length === 0) return;
  const lineas = validos.map(t =>
    `${t.cedulaOriginal}\t${t.valoracionOriginal}\t${t.cedulaEvaluadorOriginal}`
  );
  copiarBloque(lineas.join("\n"), msgTsv);
});

/* --- Volver a evaluar pendientes --- */
btnVolverEval.addEventListener("click", () => {
  const idx = trabajadores.findIndex(t => t.estado === "pendiente");
  if (idx === -1) { alert("No hay trabajadores pendientes por evaluar."); return; }
  indiceActual = idx;
  mostrarPantalla(2);
  if (modoVista === "planilla") {
    renderizarPlanilla();
  } else {
    cargarTrabajador(indiceActual);
  }
});

/* --- Nueva sesión / Descartar --- */
btnNuevaSesion.addEventListener("click", () => {
  abrirModal("Iniciar nueva sesión", "Se eliminarán todos los datos de la sesión actual. ¿Desea continuar?", descartarSesion);
});

btnDescartarFinal.addEventListener("click", () => {
  abrirModal("Limpiar y descartar sesión", "Se eliminarán todos los datos de la sesión actual. Esta acción no se puede deshacer. ¿Continuar?", descartarSesion);
});

/* ============================================================
   19. GUARDAR / CARGAR BORRADOR LOCAL (.json)
   ============================================================ */
btnGuardarBorrador.addEventListener("click", () => {
  if (trabajadores.length === 0) {
    alert("No hay datos en la sesión actual para guardar.");
    return;
  }

  const borrador = {
    version: "2.0",
    fechaGuardado: new Date().toISOString(),
    evaluadorActual,
    ultimaValoracion,
    evaluadoresFrecuentes,
    trabajadores
  };

  const blob = new Blob([JSON.stringify(borrador, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `borrador-valoraciones-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

inputCargarBorrador.addEventListener("change", e => {
  const archivo = e.target.files && e.target.files[0];
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = evento => {
    try {
      const datos = JSON.parse(evento.target.result);

      if (!datos.trabajadores || !Array.isArray(datos.trabajadores)) {
        alert("El archivo no tiene el formato esperado de borrador.");
        return;
      }

      // Confirmar si hay sesión activa
      if (sesionActiva && trabajadores.length > 0) {
        if (!confirm("Hay una sesión activa. Al cargar el borrador se perderán los datos actuales. ¿Continuar?")) {
          inputCargarBorrador.value = "";
          return;
        }
      }

      trabajadores         = datos.trabajadores;
      evaluadorActual      = datos.evaluadorActual || "";
      ultimaValoracion     = datos.ultimaValoracion || null;
      evaluadoresFrecuentes = datos.evaluadoresFrecuentes || [];
      sesionActiva         = true;
      historialDeshacer    = [];
      duplicadosDetectados = [];

      // Restaurar pantalla según estado del borrador
      const pendientes = trabajadores.filter(t => t.estado === "pendiente").length;
      const validos    = trabajadores.filter(t => t.estado === "valido").length;

      if (pendientes === 0 && validos > 0) {
        abrirPantallaExportacion();
      } else {
        indiceActual = trabajadores.findIndex(t => t.estado === "pendiente");
        if (indiceActual === -1) indiceActual = 0;
        mostrarPantalla(2);
        if (modoVista === "planilla") {
          renderizarPlanilla();
        } else {
          cargarTrabajador(indiceActual);
        }
      }

      alert(`✅ Borrador cargado correctamente. ${trabajadores.length} trabajadores restaurados.`);

    } catch {
      alert("Error al leer el archivo. Asegúrese de que sea un borrador válido generado por esta herramienta.");
    }
    inputCargarBorrador.value = "";
  };
  lector.readAsText(archivo);
});

/* ============================================================
   20. DESCARTAR SESIÓN — Limpieza completa
   ============================================================ */
function descartarSesion() {
  trabajadores          = [];
  indiceActual          = 0;
  evaluadorActual       = "";
  sesionActiva          = false;
  ultimaValoracion      = null;
  historialDeshacer     = [];
  evaluadoresFrecuentes = [];
  duplicadosDetectados  = [];

  areaTrabajadores.value = "";
  areaBloqueados.value   = "";
  areaReposo.value       = "";
  areaEspecial.value     = "";
  contadorFilas.textContent = "0 filas detectadas";
  contadorBloq.textContent  = "0 cédulas";
  contadorRep.textContent   = "0 cédulas";
  contadorEsp.textContent   = "0 cédulas";

  salidaCedulas.value      = "";
  salidaValoraciones.value = "";
  salidaEvaluadores.value  = "";

  limpiarZona(zonaAlertasPaso1);
  limpiarZona(zonaAlertasPaso2);
  zonaDuplicados.classList.add("d-none");
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");
  zonaOrdenamiento.style.display = "none";
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.classList.remove("btn-orden-activo");
  btnOrdenarZA.classList.remove("btn-orden-activo");
  cuerpoTablaRep.replaceChildren();
  cuerpoTablaPlanilla.replaceChildren();
  cuerpoPreview.replaceChildren();

  msgCedulas.classList.remove("visible");
  msgValores.classList.remove("visible");
  msgEvaluadores.classList.remove("visible");
  msgReporte.classList.remove("visible");
  msgTsv.classList.remove("visible");

  mostrarPantalla(1);
  cerrarModal();
}

/* ============================================================
   21. MODAL DE CONFIRMACIÓN
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
   22. PROTECCIÓN CONTRA CIERRE ACCIDENTAL
   ============================================================ */
window.addEventListener("beforeunload", e => {
  if (sesionActiva && trabajadores.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============================================================
   23. INICIALIZACIÓN
   ============================================================ */
mostrarPantalla(1);
