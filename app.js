/* ============================================================
   VERIFICACIÓN Y CORRECCIÓN DE EMPLEADOS — app.js v3.0
   Modo Listado Exclusivo · Detección de discrepancias por estado
   Avisos personalizados · Resolución con 1 clic · Filtros
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
    mensajeError: "Empleado bloqueado: no elegible para evaluación.",
    etiqueta: "Bloqueado",
    rangoTexto: "No evaluable"
  },
  reposo: {
    permitido: true,
    minimo: 100,
    maximo: 300,
    mensajeError: "Empleado en reposo: la valoración debe estar entre 100 y 300.",
    etiqueta: "En reposo",
    rangoTexto: "100 a 300"
  },
  asignacion_especial: {
    permitido: false,
    minimo: null,
    maximo: null,
    mensajeError: "Asignación especial: no elegible para evaluación.",
    etiqueta: "Asig. especial",
    rangoTexto: "No evaluable"
  },
  normal: {
    permitido: true,
    minimo: 100,
    maximo: 500,
    mensajeError: "Empleado normal: la valoración debe estar entre 100 y 500.",
    etiqueta: "Normal",
    rangoTexto: "100 a 500"
  }
};

/* ============================================================
   2. ESTADO DE LA SESIÓN (Solo en memoria)
   ============================================================ */
let trabajadores         = [];
let sesionActiva         = false;
let duplicadosDetectados = [];
let evaluadoresFrecuentes = [];
let temaActual           = "light";
let filtroActual         = "todos";   // "todos" | "correctos" | "discrepancias"
let busquedaActual       = "";

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
const zonaAlertasPaso2       = $("zona-alertas-paso2");
const cuerpoTablaVerificacion= $("cuerpo-tabla-verificacion");
const tablaVaciaMsg          = $("tabla-vacia-msg");
const cntTotal               = $("cnt-total");
const cntOk                  = $("cnt-ok");
const cntDisc                = $("cnt-disc");
const btnFiltroTodos         = $("filtro-todos");
const btnFiltroCorrectos     = $("filtro-correctos");
const btnFiltroDisc          = $("filtro-discrepancias");
const inputBuscador          = $("input-buscador");
const accionesMasivas        = $("acciones-masivas");
const btnMassDedup           = $("btn-mass-dedup");
const btnMassReposo          = $("btn-mass-reposo");
const btnMassEspecial        = $("btn-mass-especial");
const btnMassBloqueados      = $("btn-mass-bloqueados");
const btnFinalizar           = $("btn-finalizar-evaluacion");
const btnVolverDatos         = $("btn-volver-datos");
const btnDescartarEval       = $("btn-descartar-sesion-eval");

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
const reporteVacio      = $("reporte-vacio");
const cuerpoTablaRep    = $("cuerpo-tabla-reporte");
const cuerpoPreview     = $("cuerpo-preview");
const btnVolverEval     = $("btn-volver-evaluar");
const btnNuevaSesion    = $("btn-nueva-sesion");
const btnDescartarFinal = $("btn-descartar-sesion-final");

// Modal general
const modalOverlay      = $("modal-overlay");
const modalTitulo       = $("modal-titulo");
const modalCuerpo       = $("modal-cuerpo");
const modalBtnCancelar  = $("modal-btn-cancelar");
const modalBtnConfirmar = $("modal-btn-confirmar");

// Modal resolución
const modalResolucionOverlay = $("modal-resolucion-overlay");
const modalResTipoBadge      = $("modal-res-tipo-badge");
const modalResTitulo         = $("modal-res-titulo");
const modalResDetalle        = $("modal-res-detalle");
const modalResBotones        = $("modal-res-botones");

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

function normalizarCedula(valor) {
  if (valor === null || valor === undefined) return "";
  return String(valor)
    .trim()
    .toUpperCase()
    .replace(/\u00A0/g, " ")
    .replace(/[\u2018\u2019\u201C\u201D]/g, "")
    .replace(/[.,\s\-]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function parsearNumero(valor) {
  if (valor === null || valor === undefined) return NaN;
  const limpio = String(valor).trim().replace(",", ".");
  return parseFloat(limpio);
}

function primerColumna(fila) {
  return fila.split(/\t|;|(?:\s{2,})/)[0].trim();
}

function extraerDatosFila(filaCruda) {
  const filaLimpia = filaCruda
    .replace(/\u00A0/g, ' ')
    .replace(/\uFEFF/g, '')
    .replace(/[\u2018\u2019\u201C\u201D]/g, '');

  let cols = filaLimpia.split('\t').map(c => c.trim()).filter(c => c.length > 0);

  if (cols.length <= 1) {
    const por2esp = filaLimpia.split(/\s{2,}/).map(c => c.trim()).filter(c => c.length > 0);
    if (por2esp.length > 1) cols = por2esp;
  }

  if (cols.length <= 1) {
    const tokens = filaLimpia.trim().split(/\s+/);
    if (tokens.length > 1) {
      const esCed = t => /\d{5,}/.test(t.replace(/[^0-9]/g, ''));
      const idxCed = tokens.findIndex(t => esCed(t));
      if (idxCed !== -1) {
        const ced = tokens[idxCed];
        const nom = tokens.filter((_, i) => i !== idxCed).join(' ');
        let condicionDetectada = null;
        if (/asignaci[oó]n\s+especial/i.test(filaLimpia)) condicionDetectada = "asignacion_especial";
        else if (/\bbloquead[oa]s?\b/i.test(filaLimpia)) condicionDetectada = "bloqueado";
        else if (/\breposo\b/i.test(filaLimpia)) condicionDetectada = "reposo";
        return { cedula: ced, nombre: capitalizarNombre(nom), valoracion: '', evaluador: '', condicionDetectada };
      }
    }
    let condicionDetectada = null;
    if (/asignaci[oó]n\s+especial/i.test(filaLimpia)) condicionDetectada = "asignacion_especial";
    else if (/\bbloquead[oa]s?\b/i.test(filaLimpia)) condicionDetectada = "bloqueado";
    else if (/\breposo\b/i.test(filaLimpia)) condicionDetectada = "reposo";
    return { cedula: filaLimpia.trim(), nombre: '', valoracion: '', evaluador: '', condicionDetectada };
  }

  if (cols.length >= 3) {
    const limpio = v => v.replace(/\./g, '').replace(',', '.');
    const esPuro = v => /^\d+([.,]\d+)?$/.test(limpio(v));

    const cedula = cols[0];

    let condicionDetectada = null;
    for (const c of cols) {
      if (/asignaci[oó]n\s+especial/i.test(c)) { condicionDetectada = "asignacion_especial"; break; }
      else if (/\bbloquead[oa]s?\b/i.test(c)) { condicionDetectada = "bloqueado"; break; }
      else if (/\breposo\b/i.test(c)) { condicionDetectada = "reposo"; break; }
    }

    let evaluador = '';
    let idxEval = -1;
    if (esPuro(cols[cols.length - 1])) {
      evaluador = cols[cols.length - 1];
      idxEval   = cols.length - 1;
    }

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

    const excluir = new Set([0, idxVal, idxEval].filter(i => i !== -1));
    const nombreCols = cols.filter((c, i) => {
      if (excluir.has(i)) return false;
      if (/^\d+$/.test(limpio(c)) && limpio(c).length <= 6) return false;
      if (/^(Muy\s*Bueno|Bueno|Regular|Deficiente|Excelente|MB|B|R|D|Bloqueado|Bloqueada|Reposo|Asignaci[oó]n\s+Especial)$/i.test(c.trim())) return false;
      return true;
    });
    let nombre = '';
    if (cols.length >= 7 && /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(cols[2])) {
      nombre = capitalizarNombre(cols[2]);
    } else {
      nombre = capitalizarNombre(nombreCols.join(' '));
    }

    if (valoracion || evaluador || condicionDetectada) {
      return { cedula, nombre, valoracion, evaluador, condicionDetectada };
    }
  }

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

  let condicionDetectada = null;
  if (/asignaci[oó]n\s+especial/i.test(filaLimpia)) {
    condicionDetectada = "asignacion_especial";
  } else if (/\bbloquead[oa]s?\b/i.test(filaLimpia)) {
    condicionDetectada = "bloqueado";
  } else if (/\breposo\b/i.test(filaLimpia)) {
    condicionDetectada = "reposo";
  }

  if (indiceCedula === -1) {
    return { cedula: cols[0], nombre: capitalizarNombre(cols.slice(1).join(' ')), valoracion: '', evaluador: '', condicionDetectada };
  }

  const cedula = cols[indiceCedula];
  const nombre = capitalizarNombre(cols.filter((_, i) => i !== indiceCedula).join(' '));

  return { cedula, nombre, valoracion: '', evaluador: '', condicionDetectada };
}

function capitalizarNombre(str) {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

function esFormatoValido(cedulaNorm) {
  return cedulaNorm.length > 0 && /\d/.test(cedulaNorm);
}

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

function mostrarMsgCopiado(elemento) {
  elemento.classList.add("visible");
  setTimeout(() => elemento.classList.remove("visible"), 3500);
}

/* ============================================================
   6. CONSTRUCCIÓN DE ALERTAS
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
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");

  const textoRaw = areaTrabajadores.value;

  if (!textoRaw.trim()) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "La lista de empleados está vacía. Pegue al menos una cédula para continuar.")
    );
    return;
  }

  const cedsBloquNorm  = new Set(leerCedulasDeArea(areaBloqueados).map(normalizarCedula).filter(v => v));
  const cedsReposoNorm = new Set(leerCedulasDeArea(areaReposo).map(normalizarCedula).filter(v => v));
  const cedsEspecNorm  = new Set(leerCedulasDeArea(areaEspecial).map(normalizarCedula).filter(v => v));

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
    const { cedula: colUno, nombre: nombreExtraido, valoracion: valPrec, evaluador: evalPrec, condicionDetectada } = extraerDatosFila(filaCruda);

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
        condicionDetectada: condicionDetectada || null,
        estado: "error",
        errores: ["Cédula con formato inválido (sin dígitos)."],
        advertencias: [],
        valoracionOriginal: "",
        valoracionNumerica: null,
        cedulaEvaluadorOriginal: "",
        cedulaEvaluadorNormalizada: "",
        omitido: false,
        eliminado: false
      });
      return;
    }

    if (!mapaVistas.has(cedulaNorm)) mapaVistas.set(cedulaNorm, []);
    mapaVistas.get(cedulaNorm).push(numFilaOriginal);

    const numPrec = valPrec ? parsearNumero(valPrec) : null;
    const evalNorm = evalPrec ? normalizarCedula(evalPrec) : "";

    registros.push({
      numeroFilaOriginal: numFilaOriginal,
      cedulaOriginal: colUno,
      cedulaNormalizada: cedulaNorm,
      nombreCompleto: nombreExtraido,
      condicion: null,
      condicionDetectada: condicionDetectada || null,
      estado: "pendiente",
      errores: [],
      advertencias: [],
      valoracionOriginal: valPrec || "",
      valoracionNumerica: numPrec,
      cedulaEvaluadorOriginal: evalPrec || "",
      cedulaEvaluadorNormalizada: evalNorm,
      omitido: false,
      eliminado: false
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

  // Asignar condición por prioridad
  let cntBloq = 0, cntRep = 0, cntEsp = 0, cntNorm = 0;
  let cntPreValido = 0, cntPreError = 0;
  registros.forEach(r => {
    if (r.estado === "error" || r.estado === "duplicado") return;
    const cn = r.cedulaNormalizada;
    if (cedsBloquNorm.has(cn) || r.condicionDetectada === "bloqueado") {
      r.condicion = "bloqueado";
      r.estado = "bloqueado";
      cntBloq++;
      if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
        r.errores.push(`Discrepancia: empleado BLOQUEADO pero trae puntuación (${r.valoracionNumerica}). No debe evaluarse.`);
        r.estado = "error";
        cntBloq--;
        cntPreError++;
      }
    } else if (cedsReposoNorm.has(cn) || r.condicionDetectada === "reposo") {
      r.condicion = "reposo";
      cntRep++;
    } else if (cedsEspecNorm.has(cn) || r.condicionDetectada === "asignacion_especial") {
      r.condicion = "asignacion_especial";
      r.estado = "asignacion_especial";
      cntEsp++;
      if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
        r.errores.push(`Discrepancia: empleado con ASIGNACIÓN ESPECIAL pero trae puntuación (${r.valoracionNumerica}). No debe evaluarse.`);
        r.estado = "error";
        cntEsp--;
        cntPreError++;
      }
    } else {
      r.condicion = "normal";
      cntNorm++;
    }
  });

  // Validar puntuaciones pre-cargadas
  registros.forEach(r => {
    if (r.estado === "error" || r.estado === "duplicado" || r.estado === "bloqueado" || r.estado === "asignacion_especial") return;
    if (r.valoracionNumerica === null || isNaN(r.valoracionNumerica)) return;

    const regla = REGLAS_VALORACION[r.condicion] || REGLAS_VALORACION.normal;
    const n = r.valoracionNumerica;

    if (r.condicion === "reposo" && (n < 100 || n > 300)) {
      r.errores.push(`Discrepancia de rango: empleado en REPOSO con puntuación ${n} (permitido 100-300).`);
      r.estado = "error";
      cntPreError++;
    } else if (!regla.permitido || n < regla.minimo || n > regla.maximo) {
      r.errores.push(`Discrepancia de rango: puntuación ${n} fuera del rango permitido (${regla.rangoTexto}).`);
      r.estado = "error";
      cntPreError++;
    } else if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
      r.estado = "valido";
      cntPreValido++;
    }
  });

  const totalDuplicados  = duplicadosDetectados.length;
  const totalInvalidos   = vaciosInvalidos + registros.filter(r => r.estado === "error").length;
  const totalPendientes  = registros.filter(r => r.estado === "pendiente" || r.estado === "reposo").length;

  mostrarResumen(totalPendientes, cntBloq, cntRep, cntEsp, totalDuplicados, totalInvalidos);

  trabajadores = registros;

  const totalProcesados = filasAUsar.filter(l => l.trim()).length;

  if (cntPreError > 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("aviso", "⚠️",
        `${cntPreError} fila${cntPreError !== 1 ? "s" : ""} con discrepancias detectadas ` +
        `(bloqueado/asignación especial con puntuación, reposo fuera de rango). Se corregirán en el paso de verificación.`)
    );
  }
  if (cntPreValido > 0) {
    zonaAlertasPaso1.appendChild(
      crearAlerta("exito", "✅",
        `${cntPreValido} registro${cntPreValido !== 1 ? "s" : ""} con puntuación y evaluador válidos detectados automáticamente.`)
    );
  }

  const hayRegistros = registros.filter(r => r.estado !== "error" || r.errores.length > 0).length > 0;

  zonaAlertasPaso1.appendChild(
    crearAlerta(
      hayRegistros ? "exito" : "aviso",
      "📊",
      `Se procesaron ${totalProcesados} fila${totalProcesados !== 1 ? "s" : ""}. ` +
      `${totalPendientes} pendientes, ${cntPreValido} pre-validados, ` +
      `${cntBloq} bloqueado${cntBloq !== 1 ? "s" : ""}, ` +
      `${cntEsp} con asignación especial, ` +
      `${totalDuplicados} duplicado${totalDuplicados !== 1 ? "s" : ""}, ${totalInvalidos} inválido${totalInvalidos !== 1 ? "s" : ""}.`
    )
  );

  if (hayRegistros || cntPreValido > 0 || cntBloq > 0 || cntEsp > 0 || totalDuplicados > 0) {
    zonaIniciar.classList.remove("d-none");
    const hayNombres = registros.some(r => r.nombreCompleto && r.nombreCompleto.trim());
    const hayParaOrdenar = registros.some(r => r.estado === "pendiente" || r.condicion === "reposo");
    zonaOrdenamiento.style.display = hayNombres && hayParaOrdenar ? "" : "none";

    if (cntPreValido > 0 && totalPendientes === 0 && totalDuplicados === 0) {
      const btnIrExportar = $("btn-ir-exportar-directo");
      if (btnIrExportar) btnIrExportar.style.display = "";
    }
  } else {
    zonaAlertasPaso1.appendChild(
      crearAlerta("error", "❌", "No hay empleados válidos para verificar. Revise la lista.")
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

/* ============================================================
   11. LIMPIAR LISTA
   ============================================================ */
btnLimpiar.addEventListener("click", () => {
  areaTrabajadores.value = "";
  areaBloqueados.value   = "";
  areaReposo.value       = "";
  areaEspecial.value     = "";
  contadorFilas.textContent = "0 filas detectadas";
  contadorBloq.textContent  = "0 cédulas";
  contadorRep.textContent   = "0 cédulas";
  contadorEsp.textContent   = "0 cédulas";
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
   12. ORDENAMIENTO — PASO 1
   ============================================================ */
btnOrdenarAZ.addEventListener("click", () => {
  trabajadores.sort((a, b) => {
    const na = (a.nombreCompleto || a.cedulaOriginal || "").toLowerCase();
    const nb = (b.nombreCompleto || b.cedulaOriginal || "").toLowerCase();
    return na.localeCompare(nb, "es", { sensitivity: "base" });
  });
  alertaOrdenamiento.style.display = "";
  textoOrdenamiento.textContent = "Lista ordenada A → Z por nombre.";
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
  textoOrdenamiento.textContent = "Lista ordenada Z → A por nombre.";
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
   13. INICIAR VERIFICACIÓN
   ============================================================ */
const btnIrExportarDirecto = $("btn-ir-exportar-directo");
if (btnIrExportarDirecto) {
  btnIrExportarDirecto.addEventListener("click", () => {
    sesionActiva = true;
    abrirPantallaExportacion();
  });
}

btnIniciar.addEventListener("click", () => {
  // Excluir solo los que fueron marcados como eliminados o completamente inválidos sin datos
  trabajadores = trabajadores.filter(r => !r.eliminado);

  if (trabajadores.length === 0) {
    limpiarZona(zonaAlertasPaso1);
    zonaAlertasPaso1.appendChild(crearAlerta("error", "❌", "No hay empleados para verificar."));
    return;
  }

  sesionActiva = true;
  mostrarPantalla(2);
  filtroActual = "todos";
  busquedaActual = "";
  inputBuscador.value = "";
  actualizarFiltros();
  renderizarTablaVerificacion();
});

/* ============================================================
   14. MOTOR DE DETECCIÓN DE DISCREPANCIAS
   ============================================================ */

/**
 * Evalúa un registro y retorna el diagnóstico de discrepancia.
 * @returns {{ tieneDiscrepancia: boolean, tipo: string, mensaje: string }}
 */
function evaluarDiscrepancia(r) {
  // Eliminados
  if (r.eliminado) {
    return { tieneDiscrepancia: false, tipo: null, mensaje: "Eliminado" };
  }

  // Duplicado
  if (r.estado === "duplicado") {
    return {
      tieneDiscrepancia: true,
      tipo: "duplicado",
      mensaje: `⚠️ Cédula duplicada. Aparece en filas: ${r.errores.join(" ")}`.slice(0, 140)
    };
  }

  // Bloqueado con puntuación
  if (r.condicion === "bloqueado" && r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
    return {
      tieneDiscrepancia: true,
      tipo: "bloqueado",
      mensaje: `🚫 BLOQUEADO pero tiene puntuación asignada (${r.valoracionNumerica}). No debe evaluarse.`
    };
  }

  // Asignación especial con puntuación
  if (r.condicion === "asignacion_especial" && r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
    return {
      tieneDiscrepancia: true,
      tipo: "especial",
      mensaje: `🔵 ASIGNACIÓN ESPECIAL con puntuación (${r.valoracionNumerica}). No debe tener puntuación.`
    };
  }

  // Reposo fuera de rango
  if (r.condicion === "reposo" && r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
    if (r.valoracionNumerica < 100 || r.valoracionNumerica > 300) {
      return {
        tieneDiscrepancia: true,
        tipo: "reposo",
        mensaje: `🟡 EN REPOSO con puntuación fuera de rango (${r.valoracionNumerica}). Permitido: 100–300.`
      };
    }
  }

  // Normal fuera de rango
  if (r.condicion === "normal" && r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
    if (r.valoracionNumerica < 100 || r.valoracionNumerica > 500) {
      return {
        tieneDiscrepancia: true,
        tipo: "invalido",
        mensaje: `⚠️ Puntuación fuera del rango permitido (${r.valoracionNumerica}). Normal: 100–500.`
      };
    }
  }

  // Error genérico
  if (r.estado === "error" && r.errores.length > 0) {
    return {
      tieneDiscrepancia: true,
      tipo: "invalido",
      mensaje: `❌ ${r.errores[0]}`
    };
  }

  // Bloqueado sin puntuación — es correcto (se conserva sin nota)
  if (r.condicion === "bloqueado") {
    return { tieneDiscrepancia: false, tipo: null, mensaje: "🚫 Bloqueado — sin puntuación (correcto)" };
  }

  // Asignación especial sin puntuación — es correcto
  if (r.condicion === "asignacion_especial") {
    return { tieneDiscrepancia: false, tipo: null, mensaje: "🔵 Asignación especial — sin puntuación (correcto)" };
  }

  // Pendiente sin puntuación
  if ((r.estado === "pendiente" || r.estado === "reposo") && (r.valoracionNumerica === null || isNaN(r.valoracionNumerica))) {
    return {
      tieneDiscrepancia: false,
      tipo: null,
      mensaje: "⏳ Pendiente — sin puntuación asignada aún"
    };
  }

  // Válido
  if (r.estado === "valido") {
    return { tieneDiscrepancia: false, tipo: null, mensaje: "✅ Correcto — datos completos y válidos" };
  }

  return { tieneDiscrepancia: false, tipo: null, mensaje: "—" };
}

/**
 * Determina si un registro es "correcto" a efectos de filtro.
 */
function esCorrecto(r) {
  if (r.eliminado) return false;
  const d = evaluarDiscrepancia(r);
  if (d.tieneDiscrepancia) return false;
  // Pendiente sin puntuación no es "correcto" aún
  if ((r.estado === "pendiente" || r.estado === "reposo") && (r.valoracionNumerica === null || isNaN(r.valoracionNumerica))) return false;
  return true;
}

/* ============================================================
   15. RENDERIZADO DE LA TABLA DE VERIFICACIÓN
   ============================================================ */
function renderizarTablaVerificacion() {
  cuerpoTablaVerificacion.replaceChildren();

  const q = busquedaActual.toLowerCase();

  const registrosFiltrados = trabajadores.filter(r => {
    if (r.eliminado) return false;

    // Filtro de búsqueda
    if (q) {
      const cedMatch = r.cedulaOriginal.toLowerCase().includes(q);
      const nomMatch = r.nombreCompleto && r.nombreCompleto.toLowerCase().includes(q);
      if (!cedMatch && !nomMatch) return false;
    }

    // Filtro de estado
    const diag = evaluarDiscrepancia(r);
    if (filtroActual === "correctos") return esCorrecto(r);
    if (filtroActual === "discrepancias") return diag.tieneDiscrepancia;
    return true;
  });

  if (registrosFiltrados.length === 0) {
    tablaVaciaMsg.style.display = "";
  } else {
    tablaVaciaMsg.style.display = "none";
  }

  registrosFiltrados.forEach((r, idx) => {
    const tr = crearFilaVerificacion(r, idx);
    cuerpoTablaVerificacion.appendChild(tr);
  });

  actualizarContadoresEstado();
}

function crearFilaVerificacion(r, idx) {
  const diag   = evaluarDiscrepancia(r);
  const regla  = REGLAS_VALORACION[r.condicion] || REGLAS_VALORACION.normal;

  const tr = document.createElement("tr");
  tr.dataset.cedNorm = r.cedulaNormalizada;

  if (diag.tieneDiscrepancia) {
    tr.classList.add("fila-discrepancia");
  } else if (esCorrecto(r)) {
    tr.classList.add("fila-correcta");
  }

  // # fila original
  const tdNum = document.createElement("td");
  const numBadge = document.createElement("span");
  numBadge.className = "badge-num-fila";
  numBadge.textContent = "#" + r.numeroFilaOriginal;
  tdNum.appendChild(numBadge);
  tr.appendChild(tdNum);

  // Cédula
  const tdCed = document.createElement("td");
  tdCed.textContent = r.cedulaOriginal;
  tdCed.style.fontWeight = "700";
  tr.appendChild(tdCed);

  // Nombre
  const tdNom = document.createElement("td");
  tdNom.textContent = r.nombreCompleto || "—";
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
  badge.className = `badge ${mapaBadge[r.condicion] || "badge-normal"}`;
  badge.textContent = regla.etiqueta;
  tdCond.appendChild(badge);
  tr.appendChild(tdCond);

  // Puntuación (editable si la condición lo permite)
  const tdVal = document.createElement("td");
  const noEvaluable = !regla.permitido;
  if (noEvaluable) {
    const spanB = document.createElement("span");
    spanB.textContent = "🚫";
    spanB.style.color = "var(--txt-muted)";
    spanB.title = regla.mensajeError;
    tdVal.appendChild(spanB);
    if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)) {
      const numSpan = document.createElement("span");
      numSpan.textContent = ` ${r.valoracionNumerica}`;
      numSpan.style.color = "var(--red-text)";
      numSpan.style.fontWeight = "700";
      numSpan.style.fontSize = ".8rem";
      tdVal.appendChild(numSpan);
    }
  } else {
    const inp = document.createElement("input");
    inp.type = "text";
    inp.className = "verif-input";
    inp.value = r.valoracionOriginal || "";
    inp.placeholder = `${regla.minimo}–${regla.maximo}`;
    inp.autocomplete = "off";
    inp.inputMode = "decimal";
    inp.setAttribute("aria-label", `Puntuación para ${r.cedulaOriginal}`);

    // Clase inicial
    if (r.estado === "valido") inp.classList.add("ok");
    if (diag.tieneDiscrepancia && r.valoracionNumerica !== null) inp.classList.add("err");

    inp.addEventListener("input", () => {
      const val = inp.value.trim();
      const num = parsearNumero(val);
      if (!val) {
        inp.classList.remove("ok", "err");
        r.valoracionOriginal = "";
        r.valoracionNumerica = null;
        if (r.estado === "valido") r.estado = "pendiente";
      } else if (isNaN(num) || num < regla.minimo || num > regla.maximo) {
        inp.classList.remove("ok");
        inp.classList.add("err");
        r.valoracionNumerica = num;
        r.valoracionOriginal = val;
      } else {
        inp.classList.remove("err");
        inp.classList.add("ok");
        r.valoracionOriginal = val;
        r.valoracionNumerica = num;
        r.errores = r.errores.filter(e => !e.includes("rango"));
        // Si ya tiene evaluador, marcar como válido
        if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
          r.estado = "valido";
        }
      }
      refrescarFilaDiagnostico(tr, r);
    });

    // Enter pasa al siguiente input de puntuación
    inp.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        const inputs = Array.from(document.querySelectorAll(".verif-input"));
        const ci = inputs.indexOf(inp);
        if (ci < inputs.length - 1) inputs[ci + 1].focus();
      }
    });

    tdVal.appendChild(inp);
  }
  tr.appendChild(tdVal);

  // Evaluador (editable)
  const tdEval = document.createElement("td");
  const evalInp = document.createElement("input");
  evalInp.type = "text";
  evalInp.className = "verif-eval-input";
  evalInp.value = r.cedulaEvaluadorOriginal || "";
  evalInp.placeholder = "Cédula eval.";
  evalInp.autocomplete = "off";
  evalInp.setAttribute("aria-label", `Evaluador de ${r.cedulaOriginal}`);
  evalInp.addEventListener("change", () => {
    r.cedulaEvaluadorOriginal    = evalInp.value.trim();
    r.cedulaEvaluadorNormalizada = normalizarCedula(evalInp.value);
    // Si tiene puntuación válida, marcar como válido
    if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada) &&
        r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica) &&
        r.valoracionNumerica >= regla.minimo && r.valoracionNumerica <= regla.maximo &&
        regla.permitido) {
      r.estado = "valido";
      r.errores = [];
    }
    refrescarFilaDiagnostico(tr, r);
  });
  tdEval.appendChild(evalInp);
  tr.appendChild(tdEval);

  // Diagnóstico y acciones
  const tdDiag = document.createElement("td");
  tdDiag.className = "celda-diagnostico";
  construirCeldaDiagnostico(tdDiag, r, tr);
  tr.appendChild(tdDiag);

  return tr;
}

/**
 * Rellena la celda de diagnóstico y acciones para un registro.
 */
function construirCeldaDiagnostico(tdDiag, r, tr) {
  tdDiag.replaceChildren();
  const diag = evaluarDiscrepancia(r);

  const msgEl = document.createElement("div");
  msgEl.className = diag.tieneDiscrepancia ? "diagnostico-msg" : "diagnostico-msg ok-msg";
  msgEl.textContent = diag.mensaje;
  tdDiag.appendChild(msgEl);

  if (!diag.tieneDiscrepancia) return;

  const accionesEl = document.createElement("div");
  accionesEl.className = "diagnostico-acciones";

  // Botones según el tipo de discrepancia
  switch (diag.tipo) {
    case "duplicado":
      crearBtnResolver(accionesEl, "⚡ Fusionar", "btn-resolver-corregir", () => {
        fusionarDuplicados(r);
        renderizarTablaVerificacion();
      });
      crearBtnResolver(accionesEl, "Detalle / Resolver", "btn-resolver-detalle", () => {
        abrirModalResolucion(r, diag, tr, tdDiag);
      });
      crearBtnResolver(accionesEl, "🗑️ Eliminar", "btn-resolver-eliminar", () => {
        eliminarRegistro(r, tr);
      });
      break;

    case "bloqueado":
      crearBtnResolver(accionesEl, "🗑️ Eliminar", "btn-resolver-eliminar", () => {
        eliminarRegistro(r, tr);
      });
      crearBtnResolver(accionesEl, "🧹 Conservar sin puntuación", "btn-resolver-conservar", () => {
        limpiarPuntuacion(r, tr, tdDiag);
      });
      break;

    case "reposo":
      crearBtnResolver(accionesEl, "📉 Ajustar a 300", "btn-resolver-corregir", () => {
        corregirReposo(r, tr, tdDiag, 300);
      });
      crearBtnResolver(accionesEl, "🗑️ Eliminar", "btn-resolver-eliminar", () => {
        eliminarRegistro(r, tr);
      });
      crearBtnResolver(accionesEl, "Detalle", "btn-resolver-detalle", () => {
        abrirModalResolucion(r, diag, tr, tdDiag);
      });
      break;

    case "especial":
      crearBtnResolver(accionesEl, "🧹 Conservar sin puntuación", "btn-resolver-conservar", () => {
        limpiarPuntuacion(r, tr, tdDiag);
      });
      crearBtnResolver(accionesEl, "🗑️ Eliminar", "btn-resolver-eliminar", () => {
        eliminarRegistro(r, tr);
      });
      break;

    case "invalido":
    default:
      crearBtnResolver(accionesEl, "🗑️ Eliminar", "btn-resolver-eliminar", () => {
        eliminarRegistro(r, tr);
      });
      crearBtnResolver(accionesEl, "Detalle", "btn-resolver-detalle", () => {
        abrirModalResolucion(r, diag, tr, tdDiag);
      });
      break;
  }

  tdDiag.appendChild(accionesEl);
}

function crearBtnResolver(parent, texto, claseExtra, handler) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-resolver ${claseExtra}`;
  btn.textContent = texto;
  btn.addEventListener("click", handler);
  parent.appendChild(btn);
}

/**
 * Refresca solo la parte visual de diagnóstico de una fila existente.
 */
function refrescarFilaDiagnostico(tr, r) {
  const diag = evaluarDiscrepancia(r);

  // Actualizar clases de la fila
  tr.classList.remove("fila-discrepancia", "fila-correcta");
  if (diag.tieneDiscrepancia) {
    tr.classList.add("fila-discrepancia");
  } else if (esCorrecto(r)) {
    tr.classList.add("fila-correcta");
  }

  // Actualizar celda de diagnóstico
  const tdDiag = tr.querySelector(".celda-diagnostico");
  if (tdDiag) construirCeldaDiagnostico(tdDiag, r, tr);

  actualizarContadoresEstado();
}

/* ============================================================
   16. ACCIONES DE RESOLUCIÓN
   ============================================================ */

function eliminarRegistro(r, tr) {
  r.eliminado = true;
  r.estado = "eliminado";
  tr.remove();
  actualizarContadoresEstado();
  // Mostrar acciones masivas si quedan discrepancias
  verificarAccionesMasivas();
}

function limpiarPuntuacion(r, tr, tdDiag) {
  r.valoracionOriginal = "";
  r.valoracionNumerica = null;
  r.errores = [];
  if (r.condicion === "bloqueado") r.estado = "bloqueado";
  else if (r.condicion === "asignacion_especial") r.estado = "asignacion_especial";

  // Limpiar el input de puntuación en la fila
  const inp = tr.querySelector(".verif-input");
  if (inp) {
    inp.value = "";
    inp.classList.remove("ok", "err");
  }
  refrescarFilaDiagnostico(tr, r);
}

function corregirReposo(r, tr, tdDiag, valorNuevo) {
  r.valoracionOriginal = String(valorNuevo);
  r.valoracionNumerica = valorNuevo;
  r.errores = r.errores.filter(e => !e.includes("rango"));
  if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
    r.estado = "valido";
  }

  const inp = tr.querySelector(".verif-input");
  if (inp) {
    inp.value = String(valorNuevo);
    inp.classList.remove("err");
    inp.classList.add("ok");
  }
  refrescarFilaDiagnostico(tr, r);
}

function fusionarDuplicados(r) {
  const duplicados = trabajadores.filter(t => t.cedulaNormalizada === r.cedulaNormalizada && !t.eliminado);
  if (duplicados.length <= 1) return;

  let mejorNombre = r.nombreCompleto || "";
  let mejorValoracion = r.valoracionOriginal || "";
  let mejorValoracionNum = r.valoracionNumerica;
  let mejorEvaluadorOrig = r.cedulaEvaluadorOriginal || "";
  let mejorEvaluadorNorm = r.cedulaEvaluadorNormalizada || "";
  let mejorCondicion = r.condicion || "normal";

  duplicados.forEach(d => {
    if (!mejorNombre && d.nombreCompleto) mejorNombre = d.nombreCompleto;
    if ((mejorValoracionNum === null || isNaN(mejorValoracionNum)) && d.valoracionNumerica !== null && !isNaN(d.valoracionNumerica)) {
      mejorValoracion = d.valoracionOriginal;
      mejorValoracionNum = d.valoracionNumerica;
    }
    if (!mejorEvaluadorNorm && d.cedulaEvaluadorNormalizada) {
      mejorEvaluadorOrig = d.cedulaEvaluadorOriginal;
      mejorEvaluadorNorm = d.cedulaEvaluadorNormalizada;
    }
    if (d.condicion === "bloqueado") mejorCondicion = "bloqueado";
    else if (d.condicion === "reposo" && mejorCondicion !== "bloqueado") mejorCondicion = "reposo";
    else if (d.condicion === "asignacion_especial" && mejorCondicion !== "bloqueado" && mejorCondicion !== "reposo") mejorCondicion = "asignacion_especial";
  });

  r.nombreCompleto = mejorNombre;
  r.valoracionOriginal = mejorValoracion;
  r.valoracionNumerica = mejorValoracionNum;
  r.cedulaEvaluadorOriginal = mejorEvaluadorOrig;
  r.cedulaEvaluadorNormalizada = mejorEvaluadorNorm;
  r.condicion = mejorCondicion;
  r.advertencias = [];
  r.errores = [];

  duplicados.forEach(d => {
    if (d !== r) {
      d.eliminado = true;
      d.estado = "eliminado";
    }
  });

  const regla = REGLAS_VALORACION[r.condicion] || REGLAS_VALORACION.normal;
  if (!regla.permitido) {
    r.estado = r.condicion;
    if (r.valoracionNumerica !== null) r.valoracionNumerica = null;
  } else if (r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica) &&
             r.valoracionNumerica >= regla.minimo && r.valoracionNumerica <= regla.maximo &&
             r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
    r.estado = "valido";
  } else {
    r.estado = "pendiente";
  }
}

/* ============================================================
   17. MODAL DE RESOLUCIÓN DETALLADA
   ============================================================ */
function abrirModalResolucion(r, diag, tr, tdDiag) {
  const mapaTipoClase = {
    duplicado: "tipo-duplicado",
    bloqueado: "tipo-bloqueado",
    reposo:    "tipo-reposo",
    especial:  "tipo-especial",
    invalido:  "tipo-invalido"
  };
  const mapaTipoLabel = {
    duplicado: "Duplicado",
    bloqueado: "Bloqueado",
    reposo:    "En reposo",
    especial:  "Asignación especial",
    invalido:  "Discrepancia"
  };

  modalResTipoBadge.className = `modal-res-tipo ${mapaTipoClase[diag.tipo] || "tipo-invalido"}`;
  modalResTipoBadge.textContent = mapaTipoLabel[diag.tipo] || "Discrepancia";

  modalResTitulo.textContent = `${r.cedulaOriginal}${r.nombreCompleto ? " · " + r.nombreCompleto : ""}`;

  // Construir texto de detalle
  let detalleHTML = diag.mensaje;
  if (diag.tipo === "duplicado") {
    const duplicados = trabajadores.filter(t => t.cedulaNormalizada === r.cedulaNormalizada && !t.eliminado);
    const info = duplicados.map(d =>
      `Fila #${d.numeroFilaOriginal}${d.nombreCompleto ? " (" + d.nombreCompleto + ")" : ""}${d.valoracionNumerica ? " — Puntuación: " + d.valoracionNumerica : ""}`
    ).join("\n");
    detalleHTML += "\n\nRegistros encontrados:\n" + info;
  }
  modalResDetalle.textContent = detalleHTML;

  // Botones de resolución
  modalResBotones.replaceChildren();

  if (diag.tipo === "duplicado") {
    crearBtnResolver(modalResBotones, "⚡ Fusionar datos en un solo registro", "btn-resolver-corregir btn", () => {
      fusionarDuplicados(r);
      cerrarModalResolucion();
      renderizarTablaVerificacion();
    });

    crearBtnResolver(modalResBotones, "🧹 Conservar esta entrada (eliminar las demás)", "btn-resolver-conservar btn", () => {
      const duplicados = trabajadores.filter(t => t.cedulaNormalizada === r.cedulaNormalizada && !t.eliminado && t !== r);
      duplicados.forEach(d => { d.eliminado = true; d.estado = "eliminado"; });
      r.advertencias = [];
      r.estado = r.condicion === "bloqueado" ? "bloqueado" :
                 r.condicion === "asignacion_especial" ? "asignacion_especial" : "pendiente";
      cerrarModalResolucion();
      renderizarTablaVerificacion();
    });

    crearBtnResolver(modalResBotones, "🗑️ Eliminar esta entrada", "btn-resolver-eliminar btn", () => {
      r.eliminado = true;
      r.estado = "eliminado";
      cerrarModalResolucion();
      renderizarTablaVerificacion();
    });

  } else if (diag.tipo === "bloqueado") {
    crearBtnResolver(modalResBotones, "🧹 Conservar sin puntuación", "btn-resolver-conservar btn", () => {
      limpiarPuntuacion(r, tr, tdDiag);
      cerrarModalResolucion();
    });
    crearBtnResolver(modalResBotones, "🗑️ Eliminar empleado", "btn-resolver-eliminar btn", () => {
      eliminarRegistro(r, tr);
      cerrarModalResolucion();
    });

  } else if (diag.tipo === "reposo") {
    crearBtnResolver(modalResBotones, "📉 Ajustar nota a 300 (máximo permitido)", "btn-resolver-corregir btn", () => {
      corregirReposo(r, tr, tdDiag, 300);
      cerrarModalResolucion();
    });
    crearBtnResolver(modalResBotones, "🗑️ Eliminar empleado", "btn-resolver-eliminar btn", () => {
      eliminarRegistro(r, tr);
      cerrarModalResolucion();
    });

  } else if (diag.tipo === "especial") {
    crearBtnResolver(modalResBotones, "🧹 Conservar sin puntuación", "btn-resolver-conservar btn", () => {
      limpiarPuntuacion(r, tr, tdDiag);
      cerrarModalResolucion();
    });
    crearBtnResolver(modalResBotones, "🗑️ Eliminar empleado", "btn-resolver-eliminar btn", () => {
      eliminarRegistro(r, tr);
      cerrarModalResolucion();
    });

  } else {
    crearBtnResolver(modalResBotones, "🗑️ Eliminar empleado", "btn-resolver-eliminar btn", () => {
      eliminarRegistro(r, tr);
      cerrarModalResolucion();
    });
  }

  // Botón cancelar
  const btnCancelarRes = document.createElement("button");
  btnCancelarRes.type = "button";
  btnCancelarRes.className = "btn btn-gris";
  btnCancelarRes.textContent = "Cancelar";
  btnCancelarRes.addEventListener("click", cerrarModalResolucion);
  modalResBotones.appendChild(btnCancelarRes);

  modalResolucionOverlay.classList.add("visible");
}

function cerrarModalResolucion() {
  modalResolucionOverlay.classList.remove("visible");
}

modalResolucionOverlay.addEventListener("click", e => {
  if (e.target === modalResolucionOverlay) cerrarModalResolucion();
});

/* ============================================================
   18. CONTADORES Y FILTROS
   ============================================================ */
function actualizarContadoresEstado() {
  const activos = trabajadores.filter(r => !r.eliminado);
  const total   = activos.length;
  const ok      = activos.filter(r => esCorrecto(r)).length;
  const disc    = activos.filter(r => evaluarDiscrepancia(r).tieneDiscrepancia).length;

  cntTotal.textContent = total;
  cntOk.textContent    = ok;
  cntDisc.textContent  = disc;

  verificarAccionesMasivas();
}

function verificarAccionesMasivas() {
  const activos = trabajadores.filter(r => !r.eliminado);
  const hayDisc = activos.some(r => evaluarDiscrepancia(r).tieneDiscrepancia);
  accionesMasivas.style.display = hayDisc ? "" : "none";
}

function actualizarFiltros() {
  [btnFiltroTodos, btnFiltroCorrectos, btnFiltroDisc].forEach(btn => {
    btn.classList.toggle("activo", btn.dataset.filtro === filtroActual);
  });
}

btnFiltroTodos.addEventListener("click", () => {
  filtroActual = "todos";
  actualizarFiltros();
  renderizarTablaVerificacion();
});

btnFiltroCorrectos.addEventListener("click", () => {
  filtroActual = "correctos";
  actualizarFiltros();
  renderizarTablaVerificacion();
});

btnFiltroDisc.addEventListener("click", () => {
  filtroActual = "discrepancias";
  actualizarFiltros();
  renderizarTablaVerificacion();
});

// Buscador
inputBuscador.addEventListener("input", () => {
  busquedaActual = inputBuscador.value.trim();
  renderizarTablaVerificacion();
});

/* ============================================================
   19. ACCIONES MASIVAS
   ============================================================ */

// Auto-desduplicar: conservar la primera aparición de cada cédula
btnMassDedup.addEventListener("click", () => {
  abrirModal(
    "Auto-desduplicar",
    "Se conservará la primera aparición de cada cédula y se eliminarán las demás copias. ¿Continuar?",
    () => {
      const vistas = new Set();
      trabajadores.forEach(r => {
        if (r.eliminado) return;
        if (r.estado !== "duplicado" && !r.advertencias.some(a => a.includes("duplicada"))) return;
        if (vistas.has(r.cedulaNormalizada)) {
          r.eliminado = true;
          r.estado = "eliminado";
        } else {
          vistas.add(r.cedulaNormalizada);
          r.advertencias = [];
          r.estado = r.condicion === "bloqueado" ? "bloqueado" :
                     r.condicion === "asignacion_especial" ? "asignacion_especial" : "pendiente";
        }
      });
      renderizarTablaVerificacion();
    }
  );
});

// Ajustar todos los reposos fuera de rango a 300
btnMassReposo.addEventListener("click", () => {
  const afectados = trabajadores.filter(r =>
    !r.eliminado && r.condicion === "reposo" &&
    r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica) &&
    (r.valoracionNumerica < 100 || r.valoracionNumerica > 300)
  );
  if (afectados.length === 0) {
    limpiarZona(zonaAlertasPaso2);
    zonaAlertasPaso2.appendChild(crearAlerta("exito", "✅", "No hay empleados en reposo con puntuación fuera de rango."));
    return;
  }
  abrirModal(
    "Ajustar reposos",
    `${afectados.length} empleado${afectados.length !== 1 ? "s" : ""} en reposo con puntuación fuera de rango (100–300) serán ajustados al máximo permitido (300). ¿Continuar?`,
    () => {
      afectados.forEach(r => {
        r.valoracionOriginal = "300";
        r.valoracionNumerica = 300;
        r.errores = r.errores.filter(e => !e.includes("rango"));
        if (r.cedulaEvaluadorNormalizada && esFormatoValido(r.cedulaEvaluadorNormalizada)) {
          r.estado = "valido";
        }
      });
      renderizarTablaVerificacion();
    }
  );
});

// Limpiar puntuaciones de asignaciones especiales
btnMassEspecial.addEventListener("click", () => {
  const afectados = trabajadores.filter(r =>
    !r.eliminado && r.condicion === "asignacion_especial" &&
    r.valoracionNumerica !== null && !isNaN(r.valoracionNumerica)
  );
  if (afectados.length === 0) {
    limpiarZona(zonaAlertasPaso2);
    zonaAlertasPaso2.appendChild(crearAlerta("exito", "✅", "No hay empleados con asignación especial que tengan puntuación indebida."));
    return;
  }
  abrirModal(
    "Limpiar notas de asignaciones especiales",
    `${afectados.length} empleado${afectados.length !== 1 ? "s" : ""} con asignación especial tienen una puntuación asignada que se eliminará. ¿Continuar?`,
    () => {
      afectados.forEach(r => {
        r.valoracionOriginal = "";
        r.valoracionNumerica = null;
        r.errores = [];
        r.estado = "asignacion_especial";
      });
      renderizarTablaVerificacion();
    }
  );
});

// Eliminar todos los bloqueados
btnMassBloqueados.addEventListener("click", () => {
  const afectados = trabajadores.filter(r => !r.eliminado && r.condicion === "bloqueado");
  if (afectados.length === 0) {
    limpiarZona(zonaAlertasPaso2);
    zonaAlertasPaso2.appendChild(crearAlerta("exito", "✅", "No hay empleados bloqueados en la lista."));
    return;
  }
  abrirModal(
    "Eliminar empleados bloqueados",
    `${afectados.length} empleado${afectados.length !== 1 ? "s" : ""} bloqueado${afectados.length !== 1 ? "s" : ""} serán eliminados de la lista. ¿Continuar?`,
    () => {
      afectados.forEach(r => { r.eliminado = true; r.estado = "eliminado"; });
      renderizarTablaVerificacion();
    }
  );
});

/* ============================================================
   20. BOTONES GLOBALES PASO 2
   ============================================================ */
btnFinalizar.addEventListener("click", () => {
  const disc = trabajadores.filter(r => !r.eliminado && evaluarDiscrepancia(r).tieneDiscrepancia).length;
  if (disc > 0) {
    abrirModal(
      "¿Exportar con discrepancias pendientes?",
      `Hay ${disc} registro${disc !== 1 ? "s" : ""} con discrepancias sin resolver. Solo los registros correctos y válidos serán exportados. ¿Desea continuar?`,
      abrirPantallaExportacion
    );
  } else {
    abrirPantallaExportacion();
  }
});

btnVolverDatos.addEventListener("click", () => mostrarPantalla(1));

btnDescartarEval.addEventListener("click", () => {
  abrirModal(
    "Descartar sesión",
    "Se eliminarán todos los datos de la sesión actual. Esta acción no se puede deshacer. ¿Continuar?",
    descartarSesion
  );
});

/* ============================================================
   21. EXPORTACIÓN — PASO 3
   ============================================================ */
function abrirPantallaExportacion() {
  mostrarPantalla(3);
  generarExportacion();
}

function generarExportacion() {
  // Solo exportar válidos: tienen puntuación válida y evaluador, condición permitida
  const validos  = trabajadores.filter(t => {
    if (t.eliminado) return false;
    if (t.estado === "valido") return true;
    // Bloqueados y asignación especial sin puntuación — se incluyen en reporte pero NO en export
    return false;
  });
  const noValidos = trabajadores.filter(t => !t.eliminado && t.estado !== "valido");

  const nCed = validos.length;
  const alineado = nCed > 0;

  verificAlin.classList.toggle("error-alineacion", !alineado);

  if (alineado) {
    verificTitulo.textContent = `✅ ${nCed} registro${nCed !== 1 ? "s" : ""} válido${nCed !== 1 ? "s" : ""} listos para exportar`;
    verificDetalle.replaceChildren();
    const ul = document.createElement("ul");
    ul.style.cssText = "margin:8px 0 0 18px; font-size:.875rem;";
    [
      `Cédulas de empleados: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      `Valoraciones: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      `Cédulas de evaluadores: ${nCed} fila${nCed !== 1 ? "s" : ""}.`,
      "Los tres listados están alineados y listos para pegarse por separado en Excel."
    ].forEach(txt => {
      const li = document.createElement("li"); li.textContent = txt; ul.appendChild(li);
    });
    verificDetalle.appendChild(ul);
  } else {
    verificTitulo.textContent = "❌ No hay registros válidos para exportar";
    verificDetalle.textContent = "Regrese a verificar y complete o corrija los registros pendientes.";
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

  // Incluir también eliminados para el reporte
  const todos = [...registros, ...trabajadores.filter(t => t.eliminado)];

  if (todos.length === 0) {
    reporteVacio.style.display = "block";
    btnCopiarReporte.disabled = true;
    return;
  }
  reporteVacio.style.display = "none";
  btnCopiarReporte.disabled = false;

  const mapaEstadoBadge = {
    pendiente: "badge-pendiente", valido: "badge-valido",
    error: "badge-error", omitido: "badge-omitido",
    bloqueado: "badge-bloqueado", asignacion_especial: "badge-especial",
    duplicado: "badge-error", eliminado: "badge-error", reposo: "badge-reposo"
  };

  todos.forEach(t => {
    const tr = document.createElement("tr");
    const diag = evaluarDiscrepancia(t);
    let detalle = t.eliminado ? "Eliminado manualmente en verificación." : (diag.mensaje || t.errores.join(" / ") || "—");

    const celdas = [
      t.numeroFilaOriginal ?? "—",
      t.cedulaOriginal || "(vacía)",
      t.nombreCompleto  || "—",
      REGLAS_VALORACION[t.condicion]?.etiqueta || "—",
      t.eliminado ? "eliminado" : t.estado,
      detalle
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

btnCopiarCedulas.addEventListener("click", () => copiarBloque(salidaCedulas.value, msgCedulas));
btnCopiarVals.addEventListener("click",    () => copiarBloque(salidaValoraciones.value, msgValores));
btnCopiarEvals.addEventListener("click",   () => copiarBloque(salidaEvaluadores.value, msgEvaluadores));

btnCopiarReporte.addEventListener("click", () => {
  const noValidos = trabajadores.filter(t => t.estado !== "valido");
  const eliminados = trabajadores.filter(t => t.eliminado);
  const todos = [...noValidos.filter(t => !t.eliminado), ...eliminados];
  const lineas = ["Fila\tCédula\tNombre\tCondición\tEstado\tDetalle"];
  todos.forEach(t => {
    const diag = evaluarDiscrepancia(t);
    const detalle = t.eliminado ? "Eliminado manualmente." : (diag.mensaje || t.errores.join(" / ") || "—");
    lineas.push([
      t.numeroFilaOriginal ?? "",
      t.cedulaOriginal || "",
      t.nombreCompleto  || "",
      REGLAS_VALORACION[t.condicion]?.etiqueta || "",
      t.eliminado ? "eliminado" : t.estado,
      detalle
    ].join("\t"));
  });
  copiarBloque(lineas.join("\n"), msgReporte);
});

btnCopiarTsv.addEventListener("click", () => {
  const validos = trabajadores.filter(t => !t.eliminado && t.estado === "valido");
  if (validos.length === 0) return;
  const lineas = validos.map(t =>
    `${t.cedulaOriginal}\t${t.valoracionOriginal}\t${t.cedulaEvaluadorOriginal}`
  );
  copiarBloque(lineas.join("\n"), msgTsv);
});

/* --- Volver a verificar / Nueva sesión / Descartar --- */
btnVolverEval.addEventListener("click", () => mostrarPantalla(2));

btnNuevaSesion.addEventListener("click", () => {
  abrirModal("Iniciar nueva sesión", "Se eliminarán todos los datos de la sesión actual. ¿Desea continuar?", descartarSesion);
});

btnDescartarFinal.addEventListener("click", () => {
  abrirModal("Limpiar y descartar sesión", "Se eliminarán todos los datos de la sesión actual. Esta acción no se puede deshacer. ¿Continuar?", descartarSesion);
});

/* ============================================================
   22. GUARDAR / CARGAR BORRADOR LOCAL (.json)
   ============================================================ */
btnGuardarBorrador.addEventListener("click", () => {
  if (trabajadores.length === 0) {
    alert("No hay datos en la sesión actual para guardar.");
    return;
  }

  const borrador = {
    version: "3.0",
    fechaGuardado: new Date().toISOString(),
    evaluadoresFrecuentes,
    trabajadores
  };

  const blob = new Blob([JSON.stringify(borrador, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `borrador-verificacion-${new Date().toISOString().slice(0, 10)}.json`;
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

      if (sesionActiva && trabajadores.length > 0) {
        if (!confirm("Hay una sesión activa. Al cargar el borrador se perderán los datos actuales. ¿Continuar?")) {
          inputCargarBorrador.value = "";
          return;
        }
      }

      trabajadores          = datos.trabajadores;
      evaluadoresFrecuentes = datos.evaluadoresFrecuentes || [];
      sesionActiva          = true;
      duplicadosDetectados  = [];

      const pendientes = trabajadores.filter(t => t.estado === "pendiente" || t.estado === "reposo").length;
      const validos    = trabajadores.filter(t => t.estado === "valido").length;

      if (pendientes === 0 && validos > 0) {
        abrirPantallaExportacion();
      } else {
        mostrarPantalla(2);
        filtroActual = "todos";
        actualizarFiltros();
        renderizarTablaVerificacion();
      }

      alert(`✅ Borrador cargado correctamente. ${trabajadores.length} empleados restaurados.`);

    } catch {
      alert("Error al leer el archivo. Asegúrese de que sea un borrador válido generado por esta herramienta.");
    }
    inputCargarBorrador.value = "";
  };
  lector.readAsText(archivo);
});

/* ============================================================
   23. DESCARTAR SESIÓN
   ============================================================ */
function descartarSesion() {
  trabajadores          = [];
  sesionActiva          = false;
  evaluadoresFrecuentes = [];
  duplicadosDetectados  = [];
  filtroActual          = "todos";
  busquedaActual        = "";

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
  zonaResumen.classList.add("d-none");
  zonaIniciar.classList.add("d-none");
  zonaOrdenamiento.style.display = "none";
  alertaOrdenamiento.style.display = "none";
  btnOrdenarOrig.disabled = true;
  btnOrdenarAZ.classList.remove("btn-orden-activo");
  btnOrdenarZA.classList.remove("btn-orden-activo");
  cuerpoTablaRep.replaceChildren();
  cuerpoTablaVerificacion.replaceChildren();
  cuerpoPreview.replaceChildren();
  inputBuscador.value = "";

  cntTotal.textContent = "0";
  cntOk.textContent    = "0";
  cntDisc.textContent  = "0";
  accionesMasivas.style.display = "none";

  mostrarPantalla(1);
  cerrarModal();
  cerrarModalResolucion();
}

/* ============================================================
   24. MODAL DE CONFIRMACIÓN GENERAL
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
  if (e.key === "Escape") {
    if (modalResolucionOverlay.classList.contains("visible")) cerrarModalResolucion();
    else if (modalOverlay.classList.contains("visible")) cerrarModal();
  }
});

/* ============================================================
   25. PROTECCIÓN CONTRA CIERRE ACCIDENTAL
   ============================================================ */
window.addEventListener("beforeunload", e => {
  if (sesionActiva && trabajadores.length > 0) {
    e.preventDefault();
    e.returnValue = "";
  }
});

/* ============================================================
   26. INICIALIZACIÓN
   ============================================================ */
mostrarPantalla(1);
