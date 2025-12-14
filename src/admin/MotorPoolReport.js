import React, { useEffect, useState } from "react";
import api from "../Api";
import LoadingOverlay from "./Loading";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import dayjs from "dayjs";
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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { FaDownload, FaChartPie } from "react-icons/fa";
import "./css/Motorpool.css";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

const formatCurrency = (num) =>
  num.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

const formatLongDate = (date) => dayjs(date).format("MMMM DD YYYY");

const formatDateRangeLabel = (start, end) => {
  if (!start || !end) return "";
  return `${dayjs(start).format("MMM DD")} - ${dayjs(end).format("MMM DD")}`;
};

// ✅ Custom pagination UI
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

const MotorPoolReport = () => {
  const [reportData, setReportData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [summary, setSummary] = useState({ today: 0, monthly: 0, yearly: 0 });
  const [startDate, setStartDate] = useState(null); // JS Date
  const [endDate, setEndDate] = useState(null); // JS Date
  const [noData, setNoData] = useState(false);

  // pagination for detail table in modal
  const [detailPage, setDetailPage] = useState(1);

  // Month order (for chart + sorting)
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

  // Default range = full current year
  useEffect(() => {
    const today = dayjs();
    const start = dayjs(today).startOf("year").toDate();
    const end = dayjs(today).endOf("year").toDate();
    setStartDate(start);
    setEndDate(end);
    fetchReport(start, end);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchReport = async (start, end) => {
    if (!start || !end) return;
    setLoading(true);
    setNoData(false);

    try {
    const startStr = dayjs(start).format("YYYY-MM-DD");
const endStr = dayjs(end).format("YYYY-MM-DD");
      const res = await api.get(
        `/reports/motorpool?start_date=${startStr}&end_date=${endStr}`
      );

      let monthsData = res.data.months || [];

      if (!monthsData.length || monthsData.every((m) => m.days.length === 0)) {
        setNoData(true);
        setReportData([]);
        setMonthlyTrend([]);
        setSummary({ today: 0, monthly: 0, yearly: 0 });
        setLoading(false);
        return;
      }

      // 🔧 sort months DESC by year then by month_name
      monthsData.sort((a, b) => {
        // a.year, a.month_name come from backend
        const aYear = parseInt(a.year, 10);
        const bYear = parseInt(b.year, 10);
        if (aYear !== bYear) {
          return bYear - aYear; // latest year first
        }
        const aIndex = monthOrder.indexOf(a.month_name);
        const bIndex = monthOrder.indexOf(b.month_name);
        return bIndex - aIndex; // within same year, latest month first
      });

      // ✅ Build monthly trend: use month_name instead of month label
      const monthsMap = {};
      monthsData.forEach((m) => {
        const key = m.month_name; // "October", "November", etc.
        const monthTotal = m.days.reduce(
          (acc, d) => acc + d.total_amount,
          0
        );
        if (!monthsMap[key]) {
          monthsMap[key] = 0;
        }
        monthsMap[key] += monthTotal;
      });

      // If you want all 12 months (with 0 when no data)
      const trendData = monthOrder.map((name) => ({
        month: name,
        total: monthsMap[name] || 0,
      }));

      // 👉 If you only want months with data, use this instead:
      // const trendData = monthOrder
      //   .filter((name) => monthsMap[name])
      //   .map((name) => ({
      //     month: name,
      //     total: monthsMap[name],
      //   }));

      // sort days DESC in each month for the table
      monthsData.forEach((month) => {
        month.days.sort((a, b) => {
          const da = dayjs(a.date || a.payment_date || a.day_label, [
            "YYYY-MM-DD",
            "MMM D, YYYY",
            "(ddd) MMM D",
          ]);
          const db = dayjs(b.date || b.payment_date || b.day_label, [
            "YYYY-MM-DD",
            "MMM D, YYYY",
            "(ddd) MMM D",
          ]);
          return db.valueOf() - da.valueOf();
        });
      });

      setReportData(monthsData.filter((m) => m.days.length > 0));
      setMonthlyTrend(trendData);

      // summary cards
      let todayTotal = 0;
      let monthlyTotal = 0;
      let yearlyTotal = 0;

      const now = dayjs();
      const rangeStart = dayjs(start);
      const rangeEnd = dayjs(end);

      monthsData.forEach((m) => {
        m.days.forEach((d) => {
          d.details.forEach((entry) => {
            const entryDate = dayjs(entry.payment_date || entry.date);

            if (entryDate.isSame(now, "day")) {
              todayTotal += entry.amount;
            }

            // here "monthlyTotal" is actually the total for the selected date range
            if (
              entryDate.isAfter(rangeStart.subtract(1, "day")) &&
              entryDate.isBefore(rangeEnd.add(1, "day"))
            ) {
              monthlyTotal += entry.amount;
            }

            if (entryDate.year() === rangeStart.year()) {
              yearlyTotal += entry.amount;
            }
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
      d.amount,
      formatLongDate(d.date || d.payment_date),
      d.status,
    ]);

    const pdf = new jsPDF("p", "pt", "a4");
    pdf.setFontSize(13);
    pdf.text(
      `Motor Pool Report – ${day.day_label}`,
      pdf.internal.pageSize.getWidth() / 2,
      30,
      { align: "center" }
    );

    autoTable(pdf, {
      head: [["Collector", "Received By", "Amount", "Date", "Status"]],
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

    pdf.save(`MotorPool_Report_${day.day_label.replace(/\s+/g, "_")}.pdf`);
  };

  const printFullReportPDF = () => {
    if (!reportData.length || !startDate || !endDate) return;

    const pdf = new jsPDF("p", "pt", "a4");
    const start = formatLongDate(startDate);
    const end = formatLongDate(endDate);

    pdf.setFontSize(14);
    pdf.text(
      "Motor Pool Collection Report",
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
    pdf.save(`MotorPool_Full_Report_${fileLabel}.pdf`);
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
  <div style={{ padding: 20 }}>
      <div>
             <Title level={3} style={{ marginBottom: 4 }}>
               <FaChartPie style={{ marginRight: 8, color: "#1B4F72" }} />
               Motor Pool Report
             </Title>
             <Text type="secondary" style={{ fontSize: 13 }}>
               Monitor daily remittances, trends, and export reports as PDF.
             </Text>
           </div>

    {loading && <LoadingOverlay message="Loading Motor Pool Report..." />}
    {!loading && noData && (
      <Text type="warning">No motor pool data available.</Text>
    )}

    {!loading && !noData && (
      <>
        {/* SUMMARY CARDS – MODERN LAYOUT */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          {/* TODAY */}
          <Col span={8}>
            <Card
              bordered={false}
              style={{
                borderRadius: 16,
                boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
                background:
                  "linear-gradient(135deg, #1e3a8a, #2563eb, #38bdf8)",
                color: "#ffffff",
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

          {/* MONTHLY / RANGE */}
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

          {/* YEARLY */}
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

        {/* MONTHLY TREND CHART */}
        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col span={24}>
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
                <p style={{ textAlign: "center" }}>No trend data available</p>
              )}
            </Card>
          </Col>
        </Row>

        {/* FILTER + ACTION BAR – PILL STYLE */}
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
                dropdownClassName="motorpool-range-dropdown"
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
                <FaDownload style={{ marginRight: 6 }} /> Export PDF
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

        {/* DAY DETAILS MODAL (unchanged logic, UI already good) */}
        <Modal
          title={
            selectedDay
              ? `${selectedDay.day_label} – Motor Pool Payment Details`
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
                Total Collected: {formatCurrency(selectedDay.total_amount)}
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
                    title: "Date",
                    dataIndex: "payment_date",
                    render: (val, record) =>
                      formatLongDate(val || record.date),
                  },
                  { title: "Status", dataIndex: "status" },
                ]}
                rowKey={(record) =>
                  `${record.id}-${record.collector}-${
                    record.payment_date || record.date
                  }`
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

export default MotorPoolReport;
