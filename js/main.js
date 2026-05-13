// ==========================================
// 🔹 CACHE VERSIONES API
// Guarda versiones por proyecto.
// ==========================================
let cacheVersiones = {};


// ==========================================
// 🔹 CACHE DATASETS
// Guarda datasets filtrados.
// ==========================================
let cacheDatasets = {};


// ==========================================
// 🔹 PROYECTO SELECCIONADO
// ==========================================
let proyectoSeleccionado = "";


// ==========================================
// 🔹 DATA ORIGINAL
// ==========================================
let dataOriginal = [];


// ==========================================
// 🔹 EVENTOS PRINCIPALES
// ==========================================
document.getElementById('fileInput').addEventListener('change', handleFile);

document.getElementById('filtroVersion').addEventListener('change', aplicarFiltro);



// ==========================================
// 🔹 CALCULAR DIAS HABILES
// ==========================================
function calcularDiasHabiles(fechaInicio){

  const hoy = new Date();

  let contador = 0;

  let fecha = new Date(fechaInicio);

  while (fecha <= hoy) {

    const dia = fecha.getDay();

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
// 🔹 CARGA CSV
// ==========================================
function handleFile(e){

  const r = new FileReader();

  r.onload = e => {

    dataOriginal = parseCSV(e.target.result);

    cargarFiltroVersion(dataOriginal);

    procesar(dataOriginal);
  };

  r.readAsText(e.target.files[0]);
}



// ==========================================
// 🔹 FILTRO VERSION
// ==========================================
function aplicarFiltro(){

  const v =
    document.getElementById("filtroVersion").value;

  procesar(
    cacheDatasets[v] || []
  );
}



// ==========================================
// 🔹 FUNCION PRINCIPAL
// ==========================================
function procesar(data){

let estado = {};
let severidad = {};
let prioridad = {};

let tareas = [];
let sinFecha = [];
let proyectos = new Set();

let tiempoPorIdTipo = {};

let tiposSet = new Set();

let tiempoPorTipo = {};

data.forEach(t => {

const id = t.id;

if(!id) return;

const tipoLimpio =
  (t.tipo || "").toLowerCase().trim();

const tipo =
  t.tipo || "Sin tipo";

const tiempo =
  parseFloat(t["tiempo invertido"]);

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

if(t.proyecto){
  proyectos.add(t.proyecto);
}

const est =
  (t.estado || "").trim();

const estL =
  est.toLowerCase().replace(/\s/g,'');

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

const inicio =
  parseFecha(t["fecha de inicio"]);

const fin =
  parseFecha(t["fecha de finalización"]);

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

if(!inicio){

  sinFecha.push({
    id,
    tipo: t.tipo || "-",
    estado: est,
    motivo: "Falta inicio"
  });

  return;
}

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

generarTabla("tablaEstado", estado);

generarTabla("tablaSeveridad", severidad);

generarTabla("tablaPrioridad", prioridad);

generarTabla("tablaTiempoTipo", tiempoPorTipo);

crearGraficoUniforme(
  "estadoChart",
  "severidadChart",
  "prioridadChart",
  {estado,severidad,prioridad}
);

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
// 🔹 CARGA PROYECTOS
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
// 🔹 CARGA VERSIONES DESDE API
// ==========================================
async function cargarVersionesProyecto(projectId){

  try {

    const select =
      document.getElementById("filtroVersion");

    select.innerHTML =
      '<option value="">Cargando versiones...</option>';

    // ==========================================
    // 🔹 CACHE
    // ==========================================
    if(cacheVersiones[projectId]){

      renderizarVersiones(
        cacheVersiones[projectId]
      );

      return;
    }

    const res =
      await fetch(`http://localhost:3000/versions?projectId=${projectId}`);

    if(!res.ok){
      throw new Error("Error cargando versiones");
    }

    const data =
      await res.json();

    const versiones =
      data.map(v => ({
        id: v.id,
        nombre: v.nombre
      }));

    cacheVersiones[projectId] =
      versiones;

    renderizarVersiones(versiones);

  } catch(e){

    console.error(e);

    alert("Error cargando versiones");
  }
}



// ==========================================
// 🔹 RENDER VERSIONES
// ==========================================
function renderizarVersiones(versiones){

  const select =
    document.getElementById("filtroVersion");

  select.innerHTML =
    '<option value="ALL">Todas las versiones</option>';

  versiones.forEach(v => {

    const option =
      document.createElement("option");

    option.value = v.nombre;

    option.textContent = v.nombre;

    select.appendChild(option);
  });
}



// ==========================================
// 🔹 CARGA WORK PACKAGES
// ==========================================
async function cargarWorkPackages(projectId){

  try {

    const res =
      await fetch(`http://localhost:3000/workpackages?projectId=${projectId}`);

    const data =
      await res.json();

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

    // ==========================================
    // 🔹 CACHE DATASETS
    // ==========================================
    cacheDatasets = {
      ALL: dataOriginal
    };

    dataOriginal.forEach(t => {

      const v =
        t["versión"] || "SIN_VERSION";

      if(!cacheDatasets[v]){
        cacheDatasets[v] = [];
      }

      cacheDatasets[v].push(t);
    });

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
    proyectoSeleccionado
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

  select.addEventListener("change", async (e) => {

    proyectoSeleccionado =
      e.target.value;

    if (proyectoSeleccionado) {

      // ==========================================
      // 🔹 CARGA VERSIONES
      // ==========================================
      cargarVersionesProyecto(
        proyectoSeleccionado
      );

      // ==========================================
      // 🔹 CARGA WORKPACKAGES
      // ==========================================
      cargarWorkPackages(
        proyectoSeleccionado
      );
    }
  });

});