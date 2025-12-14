import React, { useEffect, useState } from "react";
import api from "../Api";
import LoadingOverlay from "./Loading";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Row,
  Col,
  Card,
  Table,
  Button,
  Typography,
  Modal,
  DatePicker,
} from "antd";
import { FaDownload, FaChartPie } from "react-icons/fa";
import "./css/SlaughterReports.css";

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const COLORS = [
  "#27ae60",
  "#2980b9",
  "#f39c12",
  "#c0392b",
  "#8e44ad",
  "#16a085",
  "#e67e22",
  "#34495e",
];

// 🔹 Shared button styles
const primaryButtonStyle = {
  backgroundColor: "#1B4F72",
  borderColor: "#1B4F72",
  color: "#fff",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  backgroundColor: "#e3f2fd",
  borderColor: "#90caf9",
  color: "#1B4F72",
  fontWeight: "bold",
};

// 🔹 Custom pagination item render (for modal table)
const paginationItemRender = (current, type, originalElement, activePage) => {
  if (type === "prev") {
    return (
      <Button
        size="small"
        style={{
          borderRadius: 999,
          borderColor: "#d1d5db",
          padding: "0 10px",
          fontSize: 12,
        }}
      >
        Previous
      </Button>
    );
  }
  if (type === "next") {
    return (
      <Button
        size="small"
        style={{
          borderRadius: 999,
          borderColor: "#d1d5db",
          padding: "0 10px",
          fontSize: 12,
        }}
      >
        Next
      </Button>
    );
  }
  return (
    <span
      style={{
        minWidth: 28,
        height: 28,
        lineHeight: "28px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 999,
        border:
          current === activePage
            ? "1px solid #1D4ED8"
            : "1px solid transparent",
        backgroundColor: current === activePage ? "#eff6ff" : "transparent",
        fontSize: 12,
      }}
    >
      {current}
    </span>
  );
};

const SlaughterReport = () => {
  const [reportData, setReportData] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [noData, setNoData] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [summary, setSummary] = useState({ today: 0, monthly: 0, yearly: 0 });

  // modal detail pagination
  const [detailPage, setDetailPage] = useState(1);

  const formatCurrency = (num) =>
    num.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

  const formatDateRangeLabel = (start, end) => {
    if (!start || !end) return "";
    const s = dayjs(start).format("MMM DD");
    const e = dayjs(end).format("MMM DD");
    return `${s} - ${e}`;
  };

  useEffect(() => {
    const today = dayjs();
    const start = dayjs(today).startOf("year").toDate(); // Jan 1
    const end = dayjs(today).endOf("year").toDate(); // Dec 31
    setStartDate(start);
    setEndDate(end);
    fetchReport(start, end);
  }, []);

 const fetchReport = async (start, end) => {
  if (!start || !end) return;
  setLoading(true);
  setNoData(false);

  try {
    // Convert to local YYYY-MM-DD string
    const startStr = dayjs(start).format("YYYY-MM-DD");
    const endStr = dayjs(end).format("YYYY-MM-DD");

    const res = await api.get(
      `/slaughter-remittance?start_date=${startStr}&end_date=${endStr}`
    );

    let monthsData = res.data.months || [];
    if (!monthsData.length || monthsData.every((m) => m.days.length === 0)) {
      setNoData(true);
      setReportData([]);
      setAnalyticsData([]);
      setMonthlyTrend([]);
      setSummary({ today: 0, monthly: 0, yearly: 0 });
      return;
    }

      // =============================
      // ANALYTICS PIE CHART
      // =============================
      const allDetails = monthsData.flatMap((m) =>
        m.days.flatMap((d) => d.details)
      );
      const animalMap = {};
      allDetails.forEach((d) => {
        animalMap[d.animal_type] = (animalMap[d.animal_type] || 0) + d.amount;
      });
      const analyticsArray = Object.entries(animalMap).map(
        ([name, value]) => ({
          name,
          value,
        })
      );
      setAnalyticsData(analyticsArray);

   
   // MONTHLY TREND
const monthOrder = [
  { full: "January", short: "Jan" },
  { full: "February", short: "Feb" },
  { full: "March", short: "Mar" },
  { full: "April", short: "Apr" },
  { full: "May", short: "May" },
  { full: "June", short: "Jun" },
  { full: "July", short: "Jul" },
  { full: "August", short: "Aug" },
  { full: "September", short: "Sep" },
  { full: "October", short: "Oct" },
  { full: "November", short: "Nov" },
  { full: "December", short: "Dec" },
];

const monthsMap = {};
monthsData.forEach((m) => (monthsMap[m.month] = m));

const fullMonthsForChart = monthOrder.map((m) => ({
  month: m.short, // 👈 use short label here
  total: monthsMap[m.full]
    ? monthsMap[m.full].days.reduce((a, b) => a + b.total_amount, 0)
    : 0,
}));
setMonthlyTrend(fullMonthsForChart);

// 👉 SORT MONTHS: latest month first (DESC) using full names
monthsData.sort(
  (a, b) =>
    monthOrder.findIndex((m) => m.full === b.month) -
    monthOrder.findIndex((m) => m.full === a.month)
);


      // Only keep months that actually have days
      setReportData(monthsData.filter((m) => m.days.length > 0));

      // =============================
      // SUMMARY CARDS (DATE RANGE)
      // =============================
      let todayTotal = 0;
      let monthlyTotal = 0;
      let yearlyTotal = 0;

      const todayDate = dayjs().tz("Asia/Manila");
      const selectedStart = dayjs(start).tz("Asia/Manila");
      const selectedEnd = dayjs(end).tz("Asia/Manila");

      monthsData.forEach((m) => {
        m.days.forEach((d) => {
          d.details.forEach((entry) => {
            const entryDate = dayjs(entry.payment_date).tz("Asia/Manila");

            // Today's collection
            if (entryDate.isSame(todayDate, "day")) todayTotal += entry.amount;

            // Monthly collection -> sum all payments in selected date range
            if (
              entryDate.isAfter(selectedStart.subtract(1, "day")) &&
              entryDate.isBefore(selectedEnd.add(1, "day"))
            ) {
              monthlyTotal += entry.amount;
            }

            // Yearly collection
            if (entryDate.year() === todayDate.year())
              yearlyTotal += entry.amount;
          });
        });
      });

      setSummary({
        today: todayTotal,
        monthly: monthlyTotal,
        yearly: yearlyTotal,
      });
    } catch (err) {
      console.error(err);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

const onRangeChange = (dates) => {
  if (!dates || dates.length === 0) return;

  let start, end;

  if (dates.length === 1) {
    start = dates[0].toDate();
    end = dates[0].toDate();
  } else if (dates.length === 2) {
    start = dates[0].toDate();
    end = dates[1].toDate();
  }

  setStartDate(start);
  setEndDate(end);

  // Fetch report immediately with the selected dates
  fetchReport(start, end);
};



  const generateReport = () => fetchReport(startDate, endDate);

  const printDayPDF = (day) => {
    if (!day) return;

    const rows = day.details.map((d) => [
      d.animal_type,
      d.customer_name,
      d.collector,
      d.received_by,
      d.breakdown.quantity,
      d.breakdown.total_kilos,
      Array.isArray(d.breakdown.per_kilos)
        ? d.breakdown.per_kilos.join(", ")
        : d.breakdown.per_kilos,
      d.amount.toFixed(2),
      dayjs(d.payment_date).format("YYYY-MM-DD"),
    ]);

    const pdf = new jsPDF("p", "pt", "a4");
    pdf.setFontSize(13);
    pdf.text(
      `Slaughter Report – ${day.day_label}`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    autoTable(pdf, {
      head: [
        [
          "Animal",
          "Customer",
          "Collector",
          "Inspector",
          "Quantity",
          "Total Kilos",
          "Per Kilos",
          "Amount",
          "Payment Date",
        ],
      ],
      body: rows,
      startY: 50,
      styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
      headStyles: { fillColor: [39, 174, 96] },
      theme: "grid",
    });

    pdf.save(`Slaughter_Report_${day.day_label.replace(/\s+/g, "_")}.pdf`);
  };

  const dayColumns = [
    { title: "Day", dataIndex: "day_label", key: "day_label" },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (v) => formatCurrency(v),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="primary"
          style={secondaryButtonStyle}
          onClick={() => {
            setSelectedDay(record);
            setDetailPage(1);
          }}
        >
          View Details
        </Button>
      ),
    },
  ];

  const printFullReportPDF = () => {
    if (!reportData.length || !startDate || !endDate) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const start = startDate.toISOString().split("T")[0];
    const end = endDate.toISOString().split("T")[0];

    pdf.setFontSize(14);
    pdf.text(
      `Slaughter Collection Report\nDate Range: ${start} to ${end}`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    let yOffset = 60;

    reportData.forEach((month) => {
      pdf.setFontSize(12);
      pdf.text(month.month, 40, yOffset);
      yOffset += 10;

      const rows = month.days.map((d) => [
        d.day_label,
        d.total_amount.toFixed(2),
      ]);

      autoTable(pdf, {
        head: [["Day", "Total Collected"]],
        body: rows,
        startY: yOffset,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [39, 174, 96] },
        theme: "grid",
      });

      yOffset = pdf.lastAutoTable.finalY + 20;
    });

    pdf.save(`Slaughter_Report_${start}_to_${end}.pdf`);
  };

  return (
    <div style={{ padding: 20 }}>
      {/* Header */}
           <div
             style={{
               marginBottom: 24,
               display: "flex",
               justifyContent: "space-between",
               alignItems: "center",
               gap: 12,
               flexWrap: "wrap",
             }}
           >
             <div>
               <Title level={3} style={{ marginBottom: 4 }}>
                 <FaChartPie style={{ marginRight: 8, color: "#1B4F72" }} />
                 Slaughter Report
               </Title>
               <Text type="secondary" style={{ fontSize: 13 }}>
                 Monitor daily remittances, trends, and export reports as PDF.
               </Text>
             </div>
           </div>

    

      {loading && <LoadingOverlay message="Loading Slaughter Report..." />}
      {!loading && noData && (
        <Text type="warning">No slaughter data available.</Text>
      )}

      {!loading && !noData && (
        <>
          {/* SUMMARY CARDS – modern style */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
                  background:
                    "linear-gradient(135deg, #15803d, #22c55e, #4ade80)",
                  color: "#fff",
                }}
              >
                <Text
                  strong
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Today&apos;s Total Collection
                </Text>
                <Title
                  level={3}
                  style={{ marginTop: 8, marginBottom: 0, color: "#fff" }}
                >
                  {formatCurrency(summary.today)}
                </Title>
                <Text style={{ fontSize: 12, opacity: 0.9 }}>
                  As of {dayjs().format("MMMM D, YYYY")}
                </Text>
              </Card>
            </Col>

            <Col span={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.09)",
                  background: "#ffffff",
                }}
              >
                <Text
                  strong
                  style={{
                    color: "#111827",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Monthly Total Collection
                </Text>
                <Title
                  level={3}
                  style={{ marginTop: 8, marginBottom: 0, color: "#111827" }}
                >
                  {formatCurrency(summary.monthly)}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Current filter range{" "}
                  {startDate && endDate
                    ? `(${formatDateRangeLabel(startDate, endDate)})`
                    : ""}
                </Text>
              </Card>
            </Col>

            <Col span={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.09)",
                  background: "#ffffff",
                }}
              >
                <Text
                  strong
                  style={{
                    color: "#111827",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.6,
                  }}
                >
                  Yearly Total Collection
                </Text>
                <Title
                  level={3}
                  style={{ marginTop: 8, marginBottom: 0, color: "#111827" }}
                >
                  {formatCurrency(summary.yearly)}
                </Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Based on selected year
                </Text>
              </Card>
            </Col>
          </Row>

          {/* CHARTS – with card styling */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                }}
                title={
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      fontSize: 14,
                    }}
                  >
                    Animal Type Analytics
                  </span>
                }
              >
                {analyticsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analyticsData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        label
                      >
                        {analyticsData.map((entry, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                   <RechartsTooltip
  formatter={(val) => val.toFixed(2)}
/>

                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: "center" }}>No data available</p>
                )}
              </Card>
            </Col>
            <Col span={12}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                }}
                title={
                  <span
                    style={{
                      fontWeight: 600,
                      color: "#111827",
                      fontSize: 14,
                    }}
                  >
                    Monthly Trend
                  </span>
                }
              >
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={monthlyTrend}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, "auto"]} />
                   <RechartsTooltip
  formatter={(val) => val.toFixed(2)}
/>

                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: "center" }}>No trend data available</p>
                )}
              </Card>
            </Col>
          </Row>
  {/* FILTER + ACTION BAR – modern layout */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            padding: "10px 14px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                color: "#6b7280",
              }}
            >
              Select Date Range
            </span>
            <RangePicker
              value={
                startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : []
              }
              onChange={onRangeChange}
              format="YYYY-MM-DD"
              style={{
                borderRadius: 999,
                padding: "4px 10px",
                minWidth: 230,
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 8 }}>
          
            <Button
              type="default"
              onClick={printFullReportPDF}
              style={{
                ...secondaryButtonStyle,
                height: 36,
                display: "flex",
                alignItems: "center",
              }}
            >
              <FaDownload style={{ marginRight: 6 }} /> Download Full PDF
            </Button>
          </div>
        </div>
      </div>
          {/* MONTHLY TABLES */}
          {reportData.map((month, i) => (
            <Card
              key={i}
              bordered={false}
              style={{
                marginBottom: 20,
                borderRadius: 16,
                boxShadow: "0 6px 16px rgba(15,23,42,0.04)",
              }}
              title={
                <span
                  style={{
                    fontWeight: 600,
                    color: "#111827",
                    fontSize: 14,
                  }}
                >
                  {month.month}
                </span>
              }
            >
              <Table
                dataSource={month.days}
                columns={dayColumns}
                rowKey="day_label"
                pagination={false}
                summary={(pageData) => {
                  let grandTotal = 0;
                  pageData.forEach((d) => (grandTotal += d.total_amount));
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <b>Grand Total</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <b>{formatCurrency(grandTotal)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}></Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          ))}

          {/* DAY MODAL with pagination */}
          <Modal
            title={
              selectedDay
                ? `${selectedDay.day_label} – Payment Details`
                : ""
            }
            open={!!selectedDay}
            width={1000}
            onCancel={() => {
              setSelectedDay(null);
              setDetailPage(1);
            }}
            footer={[
              <Button
                key="close"
                onClick={() => {
                  setSelectedDay(null);
                  setDetailPage(1);
                }}
                style={secondaryButtonStyle}
              >
                Close
              </Button>,
              <Button
                key="download"
                type="primary"
                onClick={() => printDayPDF(selectedDay)}
                style={primaryButtonStyle}
              >
                <FaDownload style={{ marginRight: 6 }} /> Download PDF
              </Button>,
            ]}
          >
            {selectedDay && (
              <>
                <Text strong style={{ display: "block", marginBottom: 12 }}>
                  Total Collected:{" "}
                  {formatCurrency(selectedDay.total_amount)}
                </Text>
                <Table
                  dataSource={selectedDay.details}
                  columns={[
                    { title: "Animal", dataIndex: "animal_type" },
                    { title: "Customer", dataIndex: "customer_name" },
                    { title: "Collector", dataIndex: "collector" },
                    { title: "Inspector", dataIndex: "received_by" },
                    {
                      title: "Quantity",
                      dataIndex: ["breakdown", "quantity"],
                    },
                    {
                      title: "Total Kilos",
                      dataIndex: ["breakdown", "total_kilos"],
                    },
                    {
                      title: "Per Kilos",
                      dataIndex: ["breakdown", "per_kilos"],
                      render: (val) =>
                        Array.isArray(val) ? val.join(", ") : val,
                    },
                    {
                      title: "Amount",
                      dataIndex: "amount",
                      render: (val) => formatCurrency(val),
                    },
                  ]}
                  rowKey={(record) =>
                    record.customer_name + record.animal_type
                  }
                  scroll={{ x: 1000 }}
                  pagination={{
                    pageSize: 5,
                    current: detailPage,
                    onChange: (page) => setDetailPage(page),
                    showSizeChanger: false,
                    itemRender: (current, type, originalElement) =>
                      paginationItemRender(
                        current,
                        type,
                        originalElement,
                        detailPage
                      ),
                  }}
                />
              </>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default SlaughterReport;
