import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Helper: format number with 2 decimals and replace 0 with "-"
const formatNumber = (num) => {
  const value = Number(num) || 0;
  return value === 0 ? "-" : value.toFixed(2);
};

// -------------------- FULL YEAR REPORT PDF --------------------
export const generateReportPDF = async (reportData, startDate, endDate) => {
  const doc = new jsPDF("p", "pt", "a4");
  doc.setFont("helvetica", "normal");
  let yOffset = 20;

  doc.setFontSize(16);
  doc.text("Full Year Collection Report", 40, yOffset);
  yOffset += 10;

  doc.setFontSize(10);

  yOffset += 20;

  // --- Monthly Tables ---
  for (let i = 0; i < reportData.length; i++) {
    const month = reportData[i];

    if (yOffset + 30 > doc.internal.pageSize.height) {
      doc.addPage();
      yOffset = 20;
    }

    doc.setFontSize(14);
    doc.text(month.month, 40, yOffset);
    yOffset += 10;

    const tableData = month.days.map((day) => [
      day.day_label,
      formatNumber(day.wharf.total_amount),
      formatNumber(day.motorpool.total_amount),
      formatNumber(day.market.total_amount),
      formatNumber(day.slaughter.total_amount),
      formatNumber(day.total_amount),
    ]);

    const grandTotal = [
      "Grand Total",
      formatNumber(month.days.reduce((sum, d) => sum + Number(d.wharf.total_amount || 0), 0)),
      formatNumber(month.days.reduce((sum, d) => sum + Number(d.motorpool.total_amount || 0), 0)),
      formatNumber(month.days.reduce((sum, d) => sum + Number(d.market.total_amount || 0), 0)),
      formatNumber(month.days.reduce((sum, d) => sum + Number(d.slaughter.total_amount || 0), 0)),
      formatNumber(month.days.reduce((sum, d) => sum + Number(d.total_amount || 0), 0)),
    ];
    tableData.push(grandTotal);

    autoTable(doc, {
      startY: yOffset,
      head: [["Day", "Wharf", "Motorpool", "Market", "Slaughter", "Total"]],
      body: tableData,
      theme: "grid",
      styles: {
        fontSize: 10,
        font: "helvetica",
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        halign: "center",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      didDrawPage: (data) => {
        yOffset = data.cursor.y + 10;
      },
    });
  }

  doc.save(`Full_Year_Report_${startDate || "start"}_to_${endDate || "end"}.pdf`);
};

// -------------------- DAY MODAL PDF --------------------
export const generateDayModalPDF = async (day) => {
  const doc = new jsPDF("p", "pt", "a4");
  doc.setFont("helvetica", "normal");
  let yOffset = 20;

  doc.setFontSize(16);
  doc.text(`Collection Report - ${day.day_label}`, 40, yOffset);
  yOffset += 20;

  const tableData = ["Wharf", "Motorpool", "Market", "Slaughter"].flatMap((dept) =>
    day.details.filter(d => d.department === dept).map((d) => [
      dept,
      d.collector || d.customer_name || "-",
      d.received_by || "-",
      formatNumber(d.amount || d.total_amount),
    ])
  );

  tableData.push(["Grand Total", "", "", formatNumber(day.total_amount)]);

  autoTable(doc, {
    startY: yOffset,
    head: [["Department", "Collected By / Customer", "Received By", "Amount"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      font: "helvetica",
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: "center",
      valign: "middle",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
  });

  doc.save(`Day_Report_${day.day_label}.pdf`);
};

// -------------------- DEPARTMENT MODAL PDF --------------------
export const generateDeptModalPDF = async (deptData, dayLabel) => {
  const doc = new jsPDF("p", "pt", "a4");
  doc.setFont("helvetica", "normal");
  let yOffset = 20;

  doc.setFontSize(16);
  doc.text(`${deptData.dept} Collection - ${dayLabel}`, 40, yOffset);
  yOffset += 20;

  const tableData = deptData.details.map((d) => {
    if (deptData.dept === "Slaughter") {
      return [
        d.animal_type || "-",
        d.customer_name || "-",
        d.inspector || "-",
        d.collector || "-",
        d.received_by || "-",
        formatNumber(d.slaughter_fee),
        formatNumber(d.ante_mortem_fee),
        formatNumber(d.post_mortem_fee),
        formatNumber(d.coral_fee),
        formatNumber(d.permit_to_slh_fee),
        formatNumber(d.quantity),
        formatNumber(d.total_kilos),
        formatNumber(d.per_kilo),
        formatNumber(d.total_amount),
      ];
    } else if (deptData.dept === "Market") {
      return [
        d.vendor_name || "-",
        d.stalls?.join(", ") || "-",
        d.payment_type || "-",
        d.collector || "-",
        d.received_by || "-",
        formatNumber(d.amount),
      ];
    } else {
      return [
        d.collector || "-",
        d.received_by || "-",
        formatNumber(d.amount),
      ];
    }
  });

  let head = [];
  if (deptData.dept === "Slaughter") {
    head = ["Animal Type","Customer","Inspector","Collector","Received By","Slaughter Fee",
      "Ante Mortem Fee","Post Mortem Fee","Coral Fee","Permit Fee","Quantity",
      "Total Kilos","Per Kilo","Total Amount"];
  } else if (deptData.dept === "Market") {
    head = ["Vendor","Stalls","Payment Type","Collector","Received By","Amount"];
  } else {
    head = ["Collector","Received By","Amount"];
  }

  autoTable(doc, {
    startY: yOffset,
    head: [head],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 10,
      font: "helvetica",
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      halign: "center",
      valign: "middle",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
      lineWidth: 0.5,
      lineColor: [0, 0, 0],
    },
  });

  doc.save(`${deptData.dept}_Report_${dayLabel}.pdf`);
};
