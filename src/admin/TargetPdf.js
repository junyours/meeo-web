import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

// Helper: format number with 2 decimals and replace 0 with "-"
const formatNumber = (num) => {
  const value = Number(num) || 0;
  return value === 0 ? "-" : value.toFixed(2);
};

// -------------------- TARGET REPORT PDF --------------------
export const generateTargetReportPDF = async (year, tableData, pieChartRef, overallChartRef) => {
  const doc = new jsPDF("p", "pt", "a4");
  doc.setFont("helvetica", "normal");
  let yOffset = 30;

  // Title
  doc.setFontSize(16);
  doc.text(`Target Report - ${year}`, 40, yOffset);
  yOffset += 20;

  // Function to render a chart div
  const renderChart = async (chartRef) => {
    if (!chartRef || !chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfWidth = 480;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      const centeredX = (doc.internal.pageSize.width - pdfWidth) / 2;
      doc.addImage(imgData, "PNG", centeredX, yOffset, pdfWidth, imgHeight);
      yOffset += imgHeight + 20; // space after chart
    } catch (error) {
      console.warn("Chart rendering failed:", error);
    }
  };

  // ✅ Render Pie Chart first
  await renderChart(pieChartRef);

  // ✅ Render Overall Progress Chart below pie chart
  await renderChart(overallChartRef);

  // -------------------- TABLE DATA --------------------
  const months = [
    "Jan", "Feb", "Marc", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const head = [
    ["Department", "Annual Target", ...months, "Total Collection", "Progress (%)"],
  ];

  const body = tableData.map((item) => {
    const target = Number(item.annual_target) || 0;
    const collected = Number(item.total_collection) || 0;
    const progress = target > 0 ? ((collected / target) * 100).toFixed(2) + "%" : "-";
    return [
      item.module,
      formatNumber(target),
      ...months.map((_, i) => formatNumber(item.monthly?.[i + 1])),
      formatNumber(collected),
      progress,
    ];
  });

  // ✅ TOTALS (Annual, Monthly, Collection, Progress)
  const totalTarget = tableData.reduce(
    (sum, r) => sum + (Number(r.annual_target) || 0),
    0
  );
  const totalCollection = tableData.reduce(
    (sum, r) => sum + (Number(r.total_collection) || 0),
    0
  );
  const totalProgress =
    totalTarget > 0
      ? ((totalCollection / totalTarget) * 100).toFixed(2) + "%"
      : "-";

  // 🔽 NEW: vertical monthly totals (same logic as AntD table summary)
  const monthlyTotals = months.map((_, idx) => {
    const monthIndex = idx + 1; // monthly is 1-based
    return tableData.reduce((sum, row) => {
      const value = Number(row.monthly?.[monthIndex] || 0);
      return sum + value;
    }, 0);
  });

  // 🔽 TOTAL ROW using monthlyTotals instead of "-" per month
  const totalRow = [
    "TOTAL",
    formatNumber(totalTarget),
    ...monthlyTotals.map((value) => formatNumber(value)),
    formatNumber(totalCollection),
    totalProgress,
  ];
  body.push(totalRow);

  // ✅ ADD TABLE WITH TOTAL STYLING (unchanged)
  autoTable(doc, {
    startY: yOffset,
    head,
    body,
    theme: "grid",
    styles: {
      fontSize: 8,
      font: "helvetica",
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: "center",
      valign: "middle",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  // Save PDF
  doc.save(`Target_Report_${year}.pdf`);
};
