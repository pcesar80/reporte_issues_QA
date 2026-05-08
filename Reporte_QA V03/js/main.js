let proyectoSeleccionado = "";
let dataOriginal=[];
document.getElementById('fileInput').addEventListener('change',handleFile);
document.getElementById('filtroVersion').addEventListener('change',aplicarFiltro);


function handleFile(e){
  const r=new FileReader();
  r.onload=e=>{
    dataOriginal=parseCSV(e.target.result);
    cargarFiltroVersion(dataOriginal);
    procesar(dataOriginal);
  };
  r.readAsText(e.target.files[0]);
}

function aplicarFiltro(){
  const v=document.getElementById("filtroVersion").value;
  procesar(v==="ALL"?dataOriginal:dataOriginal.filter(t=>t["versión"]===v));
}

function procesar(data){

let estado={},severidad={},prioridad={};
let tareas=[],sinFecha=[],proyectos=new Set();

let tiempoPorIdTipo = {};
let tiposSet = new Set();

let tiempoPorTipo = {};

data.forEach(t=>{
const id=t.id;if(!id)return;

const tipoLimpio = (t.tipo || "").toLowerCase().trim();

const tipo = t.tipo || "Sin tipo";
const tiempo = parseFloat(t["tiempo invertido"]);

if(!isNaN(tiempo) && tiempo > 0){

  tiposSet.add(tipo);

  if(!tiempoPorIdTipo[id]){
    tiempoPorIdTipo[id]={};
  }

  if(!tiempoPorIdTipo[id][tipo]){
    tiempoPorIdTipo[id][tipo]=0;
  }

  tiempoPorIdTipo[id][tipo]+=tiempo;

  if(!tiempoPorTipo[tipo]){
    tiempoPorTipo[tipo]=0;
  }

  tiempoPorTipo[tipo]+=tiempo;
}

if(t.proyecto)proyectos.add(t.proyecto);

const est=(t.estado||"").trim();
const estL=est.toLowerCase().replace(/\s/g,'');

if(tipoLimpio.includes("issue")){
  if(est)estado[est]=(estado[est]||0)+1;
  if(t.severidad)severidad[t.severidad]=(severidad[t.severidad]||0)+1;
  if(t.prioridad)prioridad[t.prioridad]=(prioridad[t.prioridad]||0)+1;
}

const inicio = parseFecha(t["fecha de inicio"]);
const fin = parseFecha(t["fecha de finalización"]);

console.log("🧪 DEBUG FECHAS:");
console.log("RAW inicio:", t["fecha de inicio"]);
console.log("PARSE inicio:", inicio);
console.log("Tipo:", t.tipo);
console.log("Estado:", t.estado);
console.log("----------------------");

if(tipoLimpio.includes("issue")){
  console.log("👉 CANDIDATO TOP5:", {
    id,
    inicio,
    estado: est
  });
}
console.log("🔥 TOTAL TAREAS:", tareas.length);



if(["closed","cerrado","done"].includes(estL)){
  if(!inicio || !fin){

    let motivo="";
    if(!inicio && !fin) motivo="Falta inicio y fin";
    else if(!inicio) motivo="Falta inicio";
    else if(!fin) motivo="Falta fin";

    sinFecha.push({
      id,
      tipo: t.tipo || "-",
      estado:est,
      motivo
    });
  }
  return;
}

if(!inicio){
  sinFecha.push({
    id,
    tipo: t.tipo || "-",
    estado:est,
    motivo:"Falta inicio"
  });
  return;
}

if(tipoLimpio.includes("issue")){
  const dias=Math.floor((new Date()-inicio)/86400000);
  tareas.push({id,asunto:t.asunto||"-",estado:est,dias});
}

});

// AGREGA AL TITULO H1 EL PROYECTO SELECCIONADO.

/*const versionSeleccionada = document.getElementById("filtroVersion").value;

document.getElementById("tituloProyecto").innerText =
  [...proyectos].join("_") + " - " + (versionSeleccionada === "ALL" ? "Todas las versiones" : versionSeleccionada); */

document.querySelector("#topTareas tbody").innerHTML=
tareas.sort((a,b)=>b.dias-a.dias).slice(0,5).map(t=>`
<tr>
<td><a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">${t.id}</a></td>
<td>${t.asunto}</td>
<td>${t.estado}</td>
<td>${t.dias}</td>
</tr>`).join("");

document.querySelector("#tablaSinFecha tbody").innerHTML=
sinFecha.map(t=>`
<tr class="${(t.tipo||'').toLowerCase().includes('caso') ? 'tipo-test' : 'tipo-issue'}">
<td><a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">${t.id}</a></td>
<td>${t.tipo || "-"}</td>
<td>${t.estado}</td>
<td>${t.motivo||""}</td>
</tr>`).join("");

document.querySelector("#tablaTodos tbody").innerHTML=
data.map(t=>`
<tr class="${(t.tipo||'').toLowerCase().includes('caso') ? 'tipo-test' : 'tipo-issue'}">
<td><a href="https://openproject.casademoneda.gob.ar/projects/${proyectoSeleccionado}/work_packages/${t.id}/relations" target="_blank">${t.id}</a></td>
<td>${t.tipo||"-"}</td>
<td>${t.asunto||"-"}</td>
<td>${t.estado||"-"}</td>
</tr>`).join("");

// KPI
generarTabla("tablaEstado",estado);
generarTabla("tablaSeveridad",severidad);
generarTabla("tablaPrioridad",prioridad);
generarTabla("tablaTiempoTipo", tiempoPorTipo);

crearGraficoUniforme("estadoChart","severidadChart","prioridadChart",{estado,severidad,prioridad});

try{
  renderGraficoTiempoAsignado({
    data: tiempoPorIdTipo,
    tipos: Array.from(tiposSet)
  });
}catch(e){
  console.error("grafico tiempo error:", e);
}

}

// NO SE TOCA
function cargarDesdeOpenProject(){
  alert("⚠️ Recordá: debés estar logueado en OpenProject para poder descargar el CSV");

  const w = window.open("https://openproject.casademoneda.gob.ar", "_blank");

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

// ✅ SOLO TOP 5
window.ordenTop5 = {};

window.ordenarTop5 = function(colIndex) {
    const tabla = document.getElementById("topTareas");
    if (!tabla) return;

    const tbody = tabla.querySelector("tbody");
    const filas = Array.from(tbody.querySelectorAll("tr"));

    window.ordenTop5[colIndex] = !window.ordenTop5[colIndex];
    const asc = window.ordenTop5[colIndex];

    filas.sort((a, b) => {
        let A = a.children[colIndex].innerText.trim();
        let B = b.children[colIndex].innerText.trim();

        if (!isNaN(A) && !isNaN(B)) {
            return asc ? A - B : B - A;
        }

        return asc
            ? A.localeCompare(B, undefined, { numeric: true })
            : B.localeCompare(A, undefined, { numeric: true });
    });

    filas.forEach(f => tbody.appendChild(f));
};

// =========================
// 🔹 NUEVO: PROYECTOS + API
// =========================

async function cargarProyectos() {
  try {
    console.log("🚀 Cargando proyectos...");

    const res = await fetch("http://localhost:3000/projects");

    if (!res.ok) throw new Error("Error en API projects");

    const data = await res.json();

    const select = document.getElementById("proyectoSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar proyecto</option>';

    data.forEach(p => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = p.nombre;
      select.appendChild(option);
    });

  } catch (e) {
    console.error("Error cargando proyectos:", e);
  }
}

async function cargarWorkPackages(projectId){
  try {
    const res = await fetch(`http://localhost:3000/workpackages?projectId=${projectId}`);
    const data = await res.json();
    console.log(proyectoSeleccionado);

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

  
    console.log(proyectoSeleccionado);

    cargarFiltroVersion(dataOriginal);
    procesar(dataOriginal);

  } catch(e){
    console.error(e);
    alert("Error cargando datos desde API");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cargarProyectos();

  const select = document.getElementById("proyectoSelect");

  select.addEventListener("change", (e) => {

    proyectoSeleccionado = e.target.value;
  
    console.log("📌 Proyecto seleccionado:", proyectoSeleccionado);
  
    if (proyectoSeleccionado) {
      cargarWorkPackages(proyectoSeleccionado);
    }
  });
  
});