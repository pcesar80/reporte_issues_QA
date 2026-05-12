// ==========================================
// 🔹 CACHE VERSIONES
// Para guarda datasets ya filtrados.
// ==========================================
let cacheVersiones = {};


// ==========================================
// 🔹 PROYECTO SELECCIONADO
// Guarda el ID del proyecto actualmente
// seleccionado desde el combo.
// ==========================================
let proyectoSeleccionado = "";


// ==========================================
// 🔹 DATA ORIGINAL
// Contiene todos los datos cargados desde
// CSV o desde la API.
// ==========================================
let dataOriginal = [];


// ==========================================
// 🔹 EVENTOS PRINCIPALES
// - fileInput: carga CSV manual
// - filtroVersion: filtra datos por versión
// ==========================================
document.getElementById('fileInput').addEventListener('change', handleFile);

document.getElementById('filtroVersion').addEventListener('change', aplicarFiltro);



// ==========================================
// 🔹 CALCULAR DIAS HABILES
// Cuenta únicamente:
// - lunes
// - martes
// - miércoles
// - jueves
// - viernes
//
// Excluye:
// - sábados
// - domingos
// ==========================================
function calcularDiasHabiles(fechaInicio){

  const hoy =
    new Date();

  let contador = 0;

  let fecha =
    new Date(fechaInicio);

  while (fecha <= hoy) {

    const dia =
      fecha.getDay();

    // ==========================================
    // 🔹 0 = Domingo
    // 🔹 6 = Sábado
    // ==========================================
    if (dia !== 0 && dia !== 6) {

      contador++;
    }

    fecha.setDate(
      fecha.getDate() + 1
    );
  }

  return contador;
}



// ==========================================
// 🔹 CARGA DE ARCHIVO CSV
// Lee el archivo seleccionado y procesa
// la información.
// ==========================================
function handleFile(e){

  const r = new FileReader();

  r.onload = e => {

    // ==========================================
    // 🔹 PARSEO CSV
    // Convierte el contenido del CSV en objetos.
    // ==========================================
    dataOriginal = parseCSV(e.target.result);

    // ==========================================
    // 🔹 CARGA FILTRO VERSIONES
    // Llena el combo con versiones encontradas.
    // ==========================================
    cargarFiltroVersion(dataOriginal);

    // ==========================================
    // 🔹 PROCESAMIENTO GENERAL
    // Genera tablas, métricas y gráficos.
    // ==========================================
    procesar(dataOriginal);
  };

  r.readAsText(e.target.files[0]);
}



// ==========================================
// 🔹 FILTRO POR VERSION
// Filtra datos según la versión seleccionada.
// ==========================================
function aplicarFiltro(){

  const v =
    document.getElementById("filtroVersion").value;

  procesar(
    cacheVersiones[v] || []
  );
}



// ==========================================
// 🔹 FUNCION PRINCIPAL
// Procesa datos y genera:
// - KPIs
// - tablas
// - gráficos
// ==========================================
function procesar(data){

// ==========================================
// 🔹 OBJETOS KPI
// Acumulan métricas para gráficos y tablas.
// ==========================================
let estado = {};
let severidad = {};
let prioridad = {};


// ==========================================
// 🔹 ARRAYS AUXILIARES
// tareas: top 5 tareas antiguas
// sinFecha: inconsistencias de fechas
// proyectos: listado único de proyectos
// ==========================================
let tareas = [];
let sinFecha = [];
let proyectos = new Set();


// ==========================================
// 🔹 TIEMPO POR ID Y TIPO
// Se utiliza para gráfico de tiempo asignado.
// ==========================================
let tiempoPorIdTipo = {};


// ==========================================
// 🔹 LISTA DE TIPOS
// Guarda todos los tipos encontrados.
// ==========================================
let tiposSet = new Set();


// ==========================================
// 🔹 TIEMPO TOTAL POR TIPO
// Acumula horas por tipo de tarea.
// ==========================================
let tiempoPorTipo = {};


// ==========================================
// 🔹 RECORRIDO PRINCIPAL
// Procesa cada registro.
// ==========================================
data.forEach(t => {

const id = t.id;


// ==========================================
// 🔹 VALIDACION ID
// Ignora registros inválidos.
// ==========================================
if(!id) return;


// ==========================================
// 🔹 NORMALIZACION TIPO
// Facilita comparaciones posteriores.
// ==========================================
const tipoLimpio = (t.tipo || "").toLowerCase().trim();

const tipo = t.tipo || "Sin tipo";


// ==========================================
// 🔹 TIEMPO INVERTIDO
// Convierte tiempo a número.
// ==========================================
const tiempo = parseFloat(t["tiempo invertido"]);


// ==========================================
// 🔹 ACUMULACION DE TIEMPOS
// Guarda tiempo:
// - por ID
// - por tipo
// ==========================================
if(!isNaN(tiempo) && tiempo > 0){

  tiposSet.add(tipo);

  if(!tiempoPorIdTipo[id]){
    tiempoPorIdTipo[id] = {};
  }

  if(!tiempoPorIdTipo[id][tipo]){
    tiempoPorIdTipo[id][tipo] = 0;
  }

  tiempoPorIdTipo[id][tipo] += tiempo;

  if(!tiempoPorTipo[tipo]){
    tiempoPorTipo[tipo] = 0;
  }

  tiempoPorTipo[tipo] += tiempo;
}


// ==========================================
// 🔹 LISTADO UNICO DE PROYECTOS
// ==========================================
if(t.proyecto){
  proyectos.add(t.proyecto);
}


// ==========================================
// 🔹 NORMALIZACION ESTADO
// ==========================================
const est = (t.estado || "").trim();

const estL = est
  .toLowerCase()
  .replace(/\s/g,'');


// ==========================================
// 🔹 KPIs SOLO PARA ISSUES
// Cuenta:
// - estado
// - severidad
// - prioridad
// ==========================================
if(tipoLimpio.includes("issue")){

  if(est){
    estado[est] = (estado[est] || 0) + 1;
  }

  if(t.severidad){
    severidad[t.severidad] =
      (severidad[t.severidad] || 0) + 1;
  }

  if(t.prioridad){
    prioridad[t.prioridad] =
      (prioridad[t.prioridad] || 0) + 1;
  }
}


// ==========================================
// 🔹 PARSEO FECHAS
// ==========================================
const inicio = parseFecha(t["fecha de inicio"]);

const fin = parseFecha(t["fecha de finalización"]);


// ==========================================
// 🔹 VALIDACION TAREAS CERRADAS
// Detecta inconsistencias de fechas.
// ==========================================
if(["closed","cerrado","done"].includes(estL)){

  if(!inicio || !fin){

    let motivo = "";

    if(!inicio && !fin){
      motivo = "Falta inicio y fin";
    }
    else if(!inicio){
      motivo = "Falta inicio";
    }
    else if(!fin){
      motivo = "Falta fin";
    }

    sinFecha.push({
      id,
      tipo: t.tipo || "-",
      estado: est,
      motivo
    });
  }

  return;
}


// ==========================================
// 🔹 VALIDACION FECHA INICIO
// Detecta tareas abiertas sin inicio.
// ==========================================
if(!inicio){

  sinFecha.push({
    id,
    tipo: t.tipo || "-",
    estado: est,
    motivo: "Falta inicio"
  });

  return;
}


// ==========================================
// 🔹 CALCULO ANTIGÜEDAD
// Calcula días hábiles abiertos para TOP 5.
// Excluye sábados y domingos.
// ==========================================
if(tipoLimpio.includes("issue")){

  const dias =
    calcularDiasHabiles(inicio);

  tareas.push({
    id,
    asunto: t.asunto || "-",
    estado: est,
    dias
  });
}

});


// ==========================================
// 🔹 TABLA TOP 5
// Muestra las issues abiertas más antiguas.
// ==========================================
document.querySelector("#topTareas tbody").innerHTML =

tareas
.sort((a,b)=>b.dias-a.dias)
.slice(0,5)

.map(t=>`

<tr>
<td>
<a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">
${t.id}
</a>
</td>

<td>${t.asunto}</td>

<td>${t.estado}</td>

<td>${t.dias}</td>
</tr>

`).join("");


// ==========================================
// 🔹 TABLA SIN FECHA
// Muestra tareas inconsistentes.
// ==========================================
document.querySelector("#tablaSinFecha tbody").innerHTML =

sinFecha.map(t=>`

<tr class="${(t.tipo||'').toLowerCase().includes('caso') ? 'tipo-test' : 'tipo-issue'}">

<td>
<a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">
${t.id}
</a>
</td>

<td>${t.tipo || "-"}</td>

<td>${t.estado}</td>

<td>${t.motivo || ""}</td>

</tr>

`).join("");


// ==========================================
// 🔹 TABLA GENERAL
// Muestra todos los registros cargados.
// ==========================================
document.querySelector("#tablaTodos tbody").innerHTML =

data.map(t=>`

<tr class="${(t.tipo||'').toLowerCase().includes('caso') ? 'tipo-test' : 'tipo-issue'}">

<td>
<a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">
${t.id}
</a>
</td>

<td>${t.tipo || "-"}</td>

<td>${t.asunto || "-"}</td>

<td>${t.estado || "-"}</td>

</tr>

`).join("");



// ==========================================
// 🔹 GENERACION KPIs
// ==========================================
generarTabla("tablaEstado", estado);

generarTabla("tablaSeveridad", severidad);

generarTabla("tablaPrioridad", prioridad);

generarTabla("tablaTiempoTipo", tiempoPorTipo);



// ==========================================
// 🔹 GRAFICOS PRINCIPALES
// ==========================================
crearGraficoUniforme(
  "estadoChart",
  "severidadChart",
  "prioridadChart",
  {estado,severidad,prioridad}
);



// ==========================================
// 🔹 GRAFICO TIEMPO ASIGNADO
// ==========================================
try{

  renderGraficoTiempoAsignado({
    data: tiempoPorIdTipo,
    tipos: Array.from(tiposSet)
  });

}catch(e){

  console.error("grafico tiempo error:", e);
}

}



// ==========================================
// 🔹 DESCARGA CSV DESDE OPENPROJECT
// Abre OpenProject y descarga el CSV.
// ==========================================
function cargarDesdeOpenProject(){

  alert("⚠️ Recordá: debés estar logueado en OpenProject para poder descargar el CSV");

  const w = window.open(
    "https://openproject.casademoneda.gob.ar",
    "_blank"
  );

  setTimeout(()=>{

    try {

      if(!w || w.closed){

        alert("❌ No se pudo abrir OpenProject. Verificá bloqueador de popups.");

      } else {

        window.open(
          "https://openproject.casademoneda.gob.ar/projects/nuevo-sistema-rrhh/work_packages.csv?query_id=960",
          "_blank"
        );
      }

    } catch(e){

      alert("⚠️ Error al intentar acceder a OpenProject");
    }

  },1500);
}



// ==========================================
// 🔹 CONTROL DE ORDENAMIENTO
// Guarda estado ASC/DESC de cada tabla.
// ==========================================
window.ordenTablas = {};


// ==========================================
// 🔹 ORDENAR TABLAS
// Permite ordenar cualquier tabla por columna.
// ==========================================
window.ordenarTabla = function(tablaId, colIndex) {

    const tabla = document.getElementById(tablaId);

    if (!tabla) return;

    const tbody = tabla.querySelector("tbody");

    const filas = Array.from(
      tbody.querySelectorAll("tr")
    );

    const key = `${tablaId}_${colIndex}`;

    window.ordenTablas[key] =
      !window.ordenTablas[key];

    const asc = window.ordenTablas[key];

    filas.sort((a, b) => {

        let A =
          a.children[colIndex].innerText.trim();

        let B =
          b.children[colIndex].innerText.trim();

        if (!isNaN(A) && !isNaN(B)) {

            return asc ? A - B : B - A;
        }

        return asc
            ? A.localeCompare(B, undefined, { numeric: true })
            : B.localeCompare(A, undefined, { numeric: true });
    });

    filas.forEach(f => tbody.appendChild(f));
};


// ==========================================
// 🔹 CARGA PROYECTOS DESDE API
// Llena combo de proyectos.
// ==========================================
async function cargarProyectos() {

  try {

    const res =
      await fetch("http://localhost:3000/projects");

    if (!res.ok)
      throw new Error("Error en API projects");

    const data = await res.json();

    const select =
      document.getElementById("proyectoSelect");

    if (!select) return;

    select.innerHTML =
      '<option value="">Seleccionar proyecto</option>';

    data.forEach(p => {

      const option =
        document.createElement("option");

      option.value = p.id;

      option.textContent = p.nombre;

      select.appendChild(option);
    });

  } catch (e) {

    console.error("Error cargando proyectos:", e);
  }
}



// ==========================================
// 🔹 CARGA WORK PACKAGES
// Obtiene tareas desde la API.
// ==========================================
async function cargarWorkPackages(projectId, recargarVersiones = true){

  try {

    const res =
      await fetch(`http://localhost:3000/workpackages?projectId=${projectId}`);

    const data = await res.json();

    dataOriginal = data.map(wp => ({
      id: wp.id,
      tipo: wp.tipo,
      estado: wp.estado,
      prioridad: wp.prioridad,
      severidad: wp.severidad || "",
      proyecto: wp.proyecto || "",
      asunto: wp.asunto,
      "fecha de inicio": wp.fechaInicio,
      "fecha de finalización": wp.fechaFin,
      "tiempo invertido": wp.tiempo || 0,
      "versión": wp.version,
      link: wp.link
    }));

    cacheVersiones = {
      ALL: dataOriginal
    };

    dataOriginal.forEach(t => {

      const v = t["versión"] || "SIN_VERSION";

      if(!cacheVersiones[v]){
        cacheVersiones[v] = [];
      }

      cacheVersiones[v].push(t);
    });

    if(recargarVersiones){
      cargarFiltroVersion(dataOriginal);
    }

    procesar(dataOriginal);

  } catch(e){

    console.error(e);

    alert("Error cargando datos desde API");
  }
}



// ==========================================
// 🔹 REFRESH DASHBOARD
// ==========================================
async function refreshDashboard(){

  const versionActual =
    document.getElementById("filtroVersion").value;

  if(!proyectoSeleccionado){

    alert("Seleccionar proyecto");

    return;
  }

  await cargarWorkPackages(
    proyectoSeleccionado,
    false
  );

  const filtro =
    document.getElementById("filtroVersion");

  const existeVersion =
    [...filtro.options].some(
      o => o.value === versionActual
    );

  if(existeVersion){

    filtro.value = versionActual;

    aplicarFiltro();
  }
}



// ==========================================
// 🔹 INICIALIZACION APP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

  cargarProyectos();

  const select =
    document.getElementById("proyectoSelect");

  select.addEventListener("change", (e) => {

    proyectoSeleccionado = e.target.value;

    if (proyectoSeleccionado) {

      cargarWorkPackages(proyectoSeleccionado);
    }
  });

});