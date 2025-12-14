// WharfReport.jsx
import React, { useEffect, useState } from "react";
import api from "../Api";
import LoadingOverlay from "./Loading";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
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

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const primaryButtonStyle = {
  backgroundColor: "#1B4F72",
  borderColor: "#1B4F72",
  color: "#fff",
  fontWeight: "600",
  borderRadius: 999,
};

const secondaryButtonStyle = {
  backgroundColor: "#e3f2fd",
  borderColor: "#90caf9",
  color: "#1B4F72",
  fontWeight: "600",
  borderRadius: 999,
};

const formatCurrency = (num) =>
  num.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const formatLongDate = (date) => dayjs(date).format("MMMM DD YYYY");

const formatDateRangeLabel = (start, end) => {
  if (!start || !end) return "";
  const s = dayjs(start).format("MMM DD");
  const e = dayjs(end).format("MMM DD");
  return `${s} - ${e}`;
};

// ✅ HCI-style pagination item renderer
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
          backgroundColor: "#ffffff",
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
          backgroundColor: "#ffffff",
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
        cursor: "pointer",
      }}
    >
      {current}
    </span>
  );
};

const WharfReport = () => {
  const [reportData, setReportData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [noData, setNoData] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [summary, setSummary] = useState({
    today: 0,
    monthly: 0,
    yearly: 0,
  });
  const [detailPage, setDetailPage] = useState(1); // modal pagination page

  // Default = full current year
  useEffect(() => {
    const today = dayjs();
    const start = dayjs(today).startOf("year").toDate();
    const end = dayjs(today).endOf("year").toDate();
    setStartDate(start);
    setEndDate(end);
    fetchReport(start, end);
  }, []);

  const fetchReport = async (start, end) => {
    if (!start || !end) return;

    setLoading(true);
    setNoData(false);

    try {
      const startStr = dayjs(start).format("YYYY-MM-DD");
     const endStr = dayjs(end).format("YYYY-MM-DD");

      const res = await api.get(
        `/remittance/wharf?start_date=${startStr}&end_date=${endStr}`
      );

      const monthsData = res.data.months || [];
      if (!monthsData.length || monthsData.every((m) => m.days.length === 0)) {
        setNoData(true);
        setReportData([]);
        setMonthlyTrend([]);
        setSummary({ today: 0, monthly: 0, yearly: 0 });
        return;
      }

      // Trend data
      const monthOrder = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const monthsMap = {};
      monthsData.forEach((m) => (monthsMap[m.month] = m));

      const fullMonthsForChart = monthOrder.map((name) => ({
        month: name,
        total: monthsMap[name]
          ? monthsMap[name].days.reduce((acc, d) => acc + d.total_amount, 0)
          : 0,
      }));
      setMonthlyTrend(fullMonthsForChart);

      // Only months with data for table
      setReportData(monthsData.filter((m) => m.days.length > 0));

      // Summary cards
      let todayTotal = 0;
      let monthlyTotal = 0;
      let yearlyTotal = 0;
      const now = dayjs();

      monthsData.forEach((m) => {
        m.days.forEach((d) => {
          d.details.forEach((entry) => {
            const entryDate = dayjs(entry.payment_date);

            if (entryDate.isSame(now, "day")) todayTotal += entry.amount;

            if (
              entryDate.isAfter(dayjs(start).subtract(1, "day")) &&
              entryDate.isBefore(dayjs(end).add(1, "day"))
            ) {
              monthlyTotal += entry.amount;
            }

            if (entryDate.year() === dayjs(start).year())
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
  if (!dates || dates.length < 2) return;

  const start = dates[0].toDate();
  const end = dates[1].toDate();

  setStartDate(start);
  setEndDate(end);

  // Auto-fetch the report immediately
  fetchReport(start, end);
};


  const generateReport = () => {
    if (!startDate || !endDate) return;
    fetchReport(startDate, endDate);
  };

  const printDayPDF = (day) => {
    if (!day) return;

    const rows = day.details.map((d) => [
      d.collector,
      d.received_by,
      formatCurrency(d.amount),
      formatLongDate(d.payment_date),
      d.status,
    ]);

    const pdf = new jsPDF("p", "pt", "a4");
    pdf.setFontSize(13);
    pdf.text(
      `Wharf Report – ${day.day_label}`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    autoTable(pdf, {
      head: [["Collector", "Received By", "Amount", "Payment Date", "Status"]],
      body: rows,
      startY: 50,
      styles: {
        fontSize: 9,
        cellPadding: 4,
        halign: "center",
        valign: "middle",
      },
      headStyles: {
        halign: "center",
        valign: "middle",
        fillColor: [26, 82, 118],
        textColor: 255,
        fontStyle: "bold",
      },
      theme: "grid",
    });

    pdf.save(`Wharf_Report_${day.day_label.replace(/\s+/g, "_")}.pdf`);
  };

  const printFullReportPDF = () => {
    if (!reportData.length || !startDate || !endDate) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const start = formatLongDate(startDate);
    const end = formatLongDate(endDate);

    pdf.setFontSize(14);
    pdf.text(
      `Wharf Collection Report`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );
    pdf.setFontSize(11);
    pdf.text(
      `Date Range: ${start} - ${end}`,
      pdf.internal.pageSize.getWidth() / 2,
      48,
      { align: "center" }
    );

    let yOffset = 70;

    reportData.forEach((month) => {
      pdf.setFontSize(12);
      pdf.text(month.month, 40, yOffset);
      yOffset += 10;

      const rows = month.days.map((d) => [d.day_label, d.total_amount]);

      autoTable(pdf, {
        head: [["Day", "Total Collected"]],
        body: rows,
        startY: yOffset,
        styles: {
          fontSize: 9,
          cellPadding: 4,
          halign: "center",
          valign: "middle",
        },
        headStyles: {
          halign: "center",
          valign: "middle",
          fillColor: [26, 82, 118],
          textColor: 255,
          fontStyle: "bold",
        },
        theme: "grid",
      });

      yOffset = pdf.lastAutoTable.finalY + 20;
    });

    const fileLabel = `${dayjs(startDate).format(
      "YYYYMMDD"
    )}_${dayjs(endDate).format("YYYYMMDD")}`;
    pdf.save(`Wharf_Full_Report_${fileLabel}.pdf`);
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

  return (
    <div
      style={{
        padding: 24,
        background: "linear-gradient(to bottom, #f9fafb, #eef2ff)",
        minHeight: "100%",
        borderRadius: 16,
      }}
    >
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
            Wharf Report
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Monitor daily remittances, trends, and export reports as PDF.
          </Text>
        </div>
      </div>

   

      {loading && <LoadingOverlay message="Loading Wharf Report..." />}
      {!loading && noData && (
        <Text type="warning">No wharf data available.</Text>
      )}

      {!loading && !noData && (
        <>
          {/* SUMMARY CARDS */}
         <Row gutter={16} style={{ marginBottom: 20 }}>
  {/* TODAY'S TOTAL COLLECTION */}
  <Col span={8}>
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
        // ⛴ Wharf color theme – teal/emerald gradient
        background:
          "linear-gradient(135deg, #0f766e, #14b8a6, #2dd4bf)",
        color: "#fff",
      }}
    >
      <Text strong style={{ color: "rgba(255,255,255,0.9)" }}>
        Today&apos;s Total Collection
      </Text>
      <Title
        level={3}
        style={{
          marginTop: 8,
          marginBottom: 0,
          color: "#ffffff",
        }}
      >
        {formatCurrency(summary.today)}
      </Title>
      <Text style={{ fontSize: 12, opacity: 0.9 }}>
        As of {dayjs().format("MMMM D, YYYY")}
      </Text>
    </Card>
  </Col>

  {/* MONTHLY TOTAL COLLECTION (CURRENT FILTER RANGE) */}
  <Col span={8}>
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(15,23,42,0.09)",
        background: "#ffffff",
      }}
    >
      <Text strong style={{ color: "#111827" }}>
        Monthly Total Collection
      </Text>
      <Title
        level={3}
        style={{ marginTop: 8, marginBottom: 0, color: "#111827" }}
      >
        {formatCurrency(summary.monthly)}
      </Title>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Current filter range
      </Text>
    </Card>
  </Col>

  {/* YEARLY TOTAL COLLECTION (BASED ON SELECTED YEAR) */}
  <Col span={8}>
    <Card
      bordered={false}
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 25px rgba(15,23,42,0.09)",
        background: "#ffffff",
      }}
    >
      <Text strong style={{ color: "#111827" }}>
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


          {/* MONTHLY TREND CHART */}
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={24}>
              <Card
                title="Monthly Trend"
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
                }}
                headStyle={{
                  fontWeight: 600,
                  borderBottom: "1px solid #e5e7eb",
                }}
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
                      <Tooltip formatter={(val) => formatCurrency(val)} />
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
                  <p style={{ textAlign: "center" }}>
                    No trend data available
                  </p>
                )}
              </Card>
            </Col>
          </Row>
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
            gap: 12,
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
              dropdownClassName="wharf-range-dropdown"
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
                paddingInline: 18,
              }}
            >
              <FaDownload style={{ marginRight: 6 }} /> Export PDF
            </Button>
          </div>
        </div>
      </div>
          {/* MONTHLY TABLES */}
          {reportData.map((month, i) => (
            <Card
              key={i}
              title={month.month}
              style={{
                marginBottom: 20,
                borderRadius: 16,
                boxShadow: "0 8px 20px rgba(15, 23, 42, 0.04)",
              }}
              headStyle={{
                fontWeight: 600,
                borderBottom: "1px solid #e5e7eb",
              }}
              bodyStyle={{ paddingTop: 12 }}
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

          {/* DAY DETAILS MODAL */}
          <Modal
            title={
              selectedDay
                ? `${selectedDay.day_label} – Wharf Payment Details`
                : ""
            }
            open={!!selectedDay}
            width={900}
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
                    { title: "Collector", dataIndex: "collector" },
                    { title: "Received By", dataIndex: "received_by" },
                    {
                      title: "Amount",
                      dataIndex: "amount",
                      render: (val) => formatCurrency(val),
                    },
                    {
                      title: "Payment Date",
                      dataIndex: "payment_date",
                      render: (val) => formatLongDate(val),
                    },
                    { title: "Status", dataIndex: "status" },
                  ]}
                  rowKey={(record) =>
                    `${record.id}-${record.collector}-${record.payment_date}`
                  }
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
                  scroll={{ x: 800 }}
                />
              </>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default WharfReport;
