function exportarPDF(){
    const {jsPDF}=window.jspdf;
    const barra=document.querySelector(".barra-superior");
    const tabs=document.querySelector(".tabs");
    
    barra.style.display="none";
    tabs.style.display="none";
  
    html2canvas(document.body,{scale:1,useCORS:true}).then(c=>{
      const pdf=new jsPDF();
      pdf.addImage(c.toDataURL("image/jpeg", 0.7),'JPEG',10,10,190,0);
      pdf.save("dashboard.pdf");
  
      barra.style.display="flex";
      tabs.style.display="flex";
    });
  }