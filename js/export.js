async function exportarPDF(){

  const { jsPDF } = window.jspdf;

  const barra =
    document.querySelector(".barra-superior");

  const tabs =
    document.querySelector(".tabs");

  // ==========================================
  // 🔹 OCULTAR CONTROLES
  // ==========================================
  barra.style.display = "none";
  tabs.style.display = "none";

  // ==========================================
  // 🔹 CAPTURAR DASHBOARD
  // ==========================================
  const canvas =
    await html2canvas(document.body, {
      scale: 2,
      useCORS: true
    });

  // ==========================================
  // 🔹 RESTAURAR CONTROLES
  // ==========================================
  barra.style.display = "flex";
  tabs.style.display = "flex";

  // ==========================================
  // 🔹 PDF
  // ==========================================
  const pdf =
    new jsPDF("p", "mm", "a4");

  const pdfWidth =
    pdf.internal.pageSize.getWidth();

  const pdfHeight =
    pdf.internal.pageSize.getHeight();

  // Márgenes
  const margin = 10;

  const usableWidth =
    pdfWidth - (margin * 2);

  const usableHeight =
    pdfHeight - (margin * 2);

  // Escala canvas → PDF
  const ratio =
    usableWidth / canvas.width;

  const pageCanvasHeight =
    usableHeight / ratio;

  let renderedHeight = 0;

  let page = 0;

  // ==========================================
  // 🔹 PAGINADO REAL
  // ==========================================
  while (renderedHeight < canvas.height) {

    // Canvas temporal
    const pageCanvas =
      document.createElement("canvas");

    pageCanvas.width =
      canvas.width;

    pageCanvas.height =
      Math.min(
        pageCanvasHeight,
        canvas.height - renderedHeight
      );

    const ctx =
      pageCanvas.getContext("2d");

    ctx.drawImage(
      canvas,
      0,
      renderedHeight,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      canvas.width,
      pageCanvas.height
    );

    const imgData =
      pageCanvas.toDataURL(
        "image/jpeg",
        0.95
      );

    const imgHeight =
      pageCanvas.height * ratio;

    if (page > 0) {
      pdf.addPage();
    }

    pdf.addImage(
      imgData,
      "JPEG",
      margin,
      margin,
      usableWidth,
      imgHeight
    );

    renderedHeight += pageCanvasHeight;

    page++;
  }

  // ==========================================
  // 🔹 EXPORTAR
  // ==========================================
  pdf.save("dashboard.pdf");
}