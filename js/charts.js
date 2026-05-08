let charts={};

// 🔵 GRÁFICOS ORIGINALES (con títulos)
function crearGraficoUniforme(id1,id2,id3,d){
  try {
    [id1,id2,id3].forEach(i=>charts[i]&&charts[i].destroy());

    const keys=Object.keys(d);

    const coloresEstado = {
      "new":"#2aa198",
      "in specification":"#74b9ff",
      "specified":"#74b9ff",
      "in progress":"#be4bdb",
      "developed":"#69db7c",
      "in testing":"#15aabf",
      "tested":"#12b886",
      "test failed":"#fa5252",
      "closed":"#adb5bd",
      "rejected":"#ff6b6b",
      "on hold":"#ffa94d"
    };

    const coloresPrioridad = {
      "low":"#74c0fc",
      "normal":"#228be6",
      "high":"#ffd43b",
      "immediate":"#fa5252"
    };

    const coloresSeveridad = {
      "bloqueante":"#fa5252",
      "high":"#ff922b",
      "media":"#228be6",
      "baja":"#74c0fc"
    };

    [id1,id2,id3].forEach((id,i)=>{

      const el = document.getElementById(id);
      if(!el) return;

      const tipo = keys[i];
      const labels = Object.keys(d[tipo]);
      const values = Object.values(d[tipo]);

      const colors = labels.map(label=>{
        const l = (label || "").toLowerCase().trim();

        if(tipo === "estado") return coloresEstado[l] || "#ccc";
        if(tipo === "prioridad") return coloresPrioridad[l] || "#ccc";
        if(tipo === "severidad") return coloresSeveridad[l] || "#ccc";

        return "#ccc";
      });

      charts[id]=new Chart(el,{
        type:'bar',
        data:{
          labels: labels,
          datasets:[{
            data: values,
            backgroundColor: colors,
            borderWidth:1
          }]
        },
        options:{
          indexAxis:'y',
          responsive:true,
          plugins:{
            title:{
              display:true,
              text: tipo.charAt(0).toUpperCase() + tipo.slice(1),
              align:'center',
              font:{
                size:16,
                weight:'bold'
              }
            },
            legend:{display:false},
            tooltip:{
              callbacks:{
                label:function(context){
                  return `Cantidad: ${context.raw}`;
                }
              }
            }
          },
          scales:{
            x:{beginAtZero:true}
          }
        }
      });

    });

  } catch(e){
    console.error("Error gráficos base:", e);
  }
}

// 🔥 GRÁFICO TIEMPO (con título)
function renderGraficoTiempoAsignado(obj){

  try {

    const canvas = document.getElementById("tiempoChart");
    if(!canvas) return;

    if(charts["tiempoChart"]){
      charts["tiempoChart"].destroy();
    }

    const ids = Object.keys(obj?.data || {});
    const tipos = obj?.tipos || [];

    const datasets = tipos.map(tipo => {

      const tipoLimpio = (tipo || "").toLowerCase().trim();

      const color = tipoLimpio.includes("casos de prueba")
        ? "#2ecc71"
        : "#e74c3c";

      return {
        label: tipo,
        data: ids.map(id => obj.data[id]?.[tipo] || 0),
        backgroundColor: color
      };
    });

    charts["tiempoChart"] = new Chart(canvas,{
      type:'bar',
      data:{
        labels: ids,
        datasets: datasets
      },
      options:{
        responsive:true,
        plugins:{
          title:{
            display:true,
            text:"Tiempo invertido por ID y Tipo",
            align:'center',
            font:{
              size:16,
              weight:'bold'
            }
          },
          legend:{display:true},
          tooltip:{
            callbacks:{
              label:function(context){
                return `${context.dataset.label}: ${context.raw} hs`;
              }
            }
          }
        },
        scales:{
          x:{stacked:true},
          y:{stacked:true}
        },

        onClick: function(evt, elements){
          try {
            if(!elements || elements.length === 0) return;

            const index = elements[0].index;
            const idSeleccionado = this.data.labels[index];
            if(!idSeleccionado) return;

            const url = `https://openproject.casademoneda.gob.ar/projects/nuevo-sistema-rrhh/work_packages/${idSeleccionado}/relations`;
            window.open(url, '_blank');

          } catch(e){
            console.error("Error click gráfico:", e);
          }
        }
      }
    });

    canvas.style.cursor = "pointer";

  } catch(e){
    console.error("Error gráfico tiempo:", e);
  }
}