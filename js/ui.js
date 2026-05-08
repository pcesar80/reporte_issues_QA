function showView(viewId,btn){document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));document.getElementById(viewId).classList.add('active');document.querySelectorAll('.tab-button').forEach(b=>b.classList.remove('active'));btn.classList.add('active');}
function generarTabla(id,data){let html="<tr><th>Tipo</th><th>Cantidad</th></tr>";Object.entries(data).forEach(([k,v])=>html+=`<tr><td>${k}</td><td>${v}</td></tr>`);document.getElementById(id).innerHTML=html;}
function cargarFiltroVersion(data){
    const s = document.getElementById("filtroVersion");
  
    const set = new Set();
  
    data.forEach(t => {
      const v = t["versión"];
      if (v && v.trim() !== "" && v !== "Sin versión") {
        set.add(v);
      }
    });
  
    s.innerHTML = '<option value="ALL">Todas</option>';
  
    Array.from(set)
      .sort()
      .forEach(v => {
        s.innerHTML += `<option value="${v}">${v}</option>`;
      });
  
    console.log("📌 Versiones cargadas:", Array.from(set));
  }