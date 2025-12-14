  import React, { useEffect, useState } from "react";
  import api from "../Api";
  import LoadingOverlay from "./Loading";
  import jsPDF from "jspdf";
  import autoTable from "jspdf-autotable";
  import dayjs from "dayjs";
  import { FaDownload } from "react-icons/fa";
  import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
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
  import "./css/MarketReports.css";

  const { Title, Text } = Typography;
  const { RangePicker } = DatePicker;

  const COLORS = [
    "#2563eb",
    "#22c55e",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
    "#0ea5e9",
    "#a855f7",
  ];

  // Core button styles
  const primaryButtonStyle = {
    background:
      "linear-gradient(135deg, rgba(37,99,235,0.95), rgba(16,185,129,0.92))",
    borderColor: "transparent",
    color: "#fff",
    fontWeight: 600,
    borderRadius: 999,
    padding: "0 18px",
    boxShadow: "0 8px 18px rgba(37,99,235,0.28)",
  };

  const secondaryButtonStyle = {
    backgroundColor: "#eef2ff",
    borderColor: "#c7d2fe",
    color: "#1e3a8a",
    fontWeight: 500,
    borderRadius: 999,
    padding: "0 16px",
  };

 const MarketReport = () => {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [sectionData, setSectionData] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [noData, setNoData] = useState(false);

  const [todayCollection, setTodayCollection] = useState(0);
  const [monthlyCollection, setMonthlyCollection] = useState(0);
  const [yearlyCollection, setYearlyCollection] = useState(0);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedDetailRecord, setSelectedDetailRecord] = useState(null);

  // Load default year range
  useEffect(() => {
    const yearStart = dayjs().startOf("year");
    const yearEnd = dayjs().endOf("year");

    setStartDate(yearStart.toDate());
    setEndDate(yearEnd.toDate());

    fetchReport(yearStart.format("YYYY-MM-DD"), yearEnd.format("YYYY-MM-DD"));
  }, []);

  // Fetch report
  const fetchReport = async (startStr, endStr) => {
    if (!startStr || !endStr) return;

    setLoading(true);
    setNoData(false);

    try {
      console.log("Fetching range:", startStr, endStr);
      const res = await api.get(
        `/market/reports?start_date=${startStr}&end_date=${endStr}`
      );

      const monthsData = res.data.months || [];

      if (!monthsData.length || monthsData.every((m) => m.days.length === 0)) {
        setNoData(true);
        setReportData([]);
        setSectionData([]);
        setMonthlyTrend([]);
        setTodayCollection(0);
        setMonthlyCollection(0);
        setYearlyCollection(0);
        return;
      }

      // Monthly trend
      const monthOrder = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
      ];
      const monthsMap = {};
      monthsData.forEach((m) => (monthsMap[m.month] = m));
      const fullMonthsForChart = monthOrder.map((name) => ({
        month: name,
        total: monthsMap[name]
          ? monthsMap[name].days.reduce((a, b) => a + (b.total_amount || 0), 0)
          : 0,
      }));
      setMonthlyTrend(fullMonthsForChart);

      const monthsWithData = monthsData.filter((m) => m.days.length > 0);
      setReportData(monthsWithData);

      // Section distribution
      const sectionMap = {};
      monthsWithData.forEach((month) =>
        month.days.forEach((day) =>
          day.details.forEach((d) => {
            sectionMap[d.section_name] = (sectionMap[d.section_name] || 0) + d.amount;
          })
        )
      );
      const sectionArray = Object.keys(sectionMap).map((key) => ({
        name: key,
        value: sectionMap[key],
      }));
      setSectionData(sectionArray);

      // Collection cards
      let todayTotal = 0;
      let monthlyTotal = 0;
      let yearlyTotal = 0;
      const todayStr = dayjs().format("YYYY-MM-DD");

      monthsData.forEach((m) => {
        m.days.forEach((d) => {
          yearlyTotal += d.total_amount;

          const parsed = dayjs(d.day_label.replace(/\(.+\)\s/, ""), "MMM D");
          if (parsed.isValid()) {
            const fullDate = parsed.year(dayjs().year()).format("YYYY-MM-DD");

            if (fullDate === todayStr) todayTotal += d.total_amount;
            if (parsed.month() === dayjs().month()) monthlyTotal += d.total_amount;
          }
        });
      });

      setTodayCollection(todayTotal);
      setMonthlyCollection(monthlyTotal);
      setYearlyCollection(yearlyTotal);
    } catch (error) {
      console.error(error);
      setNoData(true);
    } finally {
      setLoading(false);
    }
  };

  // Date range picker change
  const onRangeChange = (dates) => {
    if (!dates || dates.length < 2) return;

    const [start, end] = dates;
    const startStr = start.format("YYYY-MM-DD");
    const endStr = end.format("YYYY-MM-DD");

    setStartDate(start.toDate());
    setEndDate(end.toDate());

    fetchReport(startStr, endStr); // 🔹 fetch immediately
  };




    const formatCurrency = (num) =>
      num.toLocaleString("en-PH", { style: "currency", currency: "PHP" });

    const groupDayDetails = (details) => {
      const grouped = {};

      details.forEach((d) => {
        const key = `${d.vendor_name}|${d.payment_type}|${d.section_name}|${d.collector}|${d.received_by}`;

        if (!grouped[key]) {
          grouped[key] = { ...d, stalls: [d.stall_number] };
        } else {
          grouped[key].stalls.push(d.stall_number);
          grouped[key].amount += d.amount;
        }
      });

      return Object.values(grouped);
    };

    const chunkArray = (arr, size = 3) => {
      const result = [];
      for (let i = 0; i < arr.length; i += size) {
        result.push(arr.slice(i, i + size).join(", "));
      }
      return result.join("\n");
    };

    const printDayPDF = () => {
      if (!selectedDay) return;

      const groupedDetails = groupDayDetails(selectedDay.details);

      const rows = groupedDetails.map((d) => [
        d.vendor_name,
        d.vendor_contact,
        d.section_name,
        chunkArray(d.stalls, 3),
        d.stall_size,
        d.daily_rent.toFixed(2),
        d.monthly_rent.toFixed(2),
        d.payment_type,
        d.collector,
        d.received_by,
        d.amount.toFixed(2),
      ]);

      const doc = new jsPDF("p", "pt", "a4");
      doc.setFontSize(13);
      doc.text(
        `Market Collection Report – ${selectedDay.day_label}`,
        doc.internal.pageSize.getWidth() / 2,
        30,
        { align: "center" }
      );

      autoTable(doc, {
        head: [
          [
            "Vendor Name",
            "Contact",
            "Section",
            "Stalls",
            "Size",
            "Daily Rent",
            "Monthly Rent",
            "Payment",
            "Collector",
            "Receiver",
            "Amount",
          ],
        ],
        body: rows,
        startY: 50,
        styles: { fontSize: 9, cellPadding: 3, overflow: "linebreak" },
        headStyles: { fillColor: [37, 99, 235] },
      });

      doc.save(`Day_Report_${selectedDay.day_label}.pdf`);
    };

    const printFullReportPDF = () => {
      if (!reportData.length) return;

      const doc = new jsPDF("p", "pt", "a4");
      const start = startDate.toISOString().split("T")[0];
      const end = endDate.toISOString().split("T")[0];

      doc.setFontSize(14);
      doc.text(
        `Market Collection Report\nDate Range: ${start} to ${end}`,
        doc.internal.pageSize.getWidth() / 2,
        30,
        { align: "center" }
      );

      let yOffset = 60;

      reportData.forEach((month) => {
        doc.setFontSize(12);
        doc.text(month.month, 40, yOffset);
        yOffset += 10;

        const rows = month.days.map((d) => [
          d.day_label,
          d.total_amount.toFixed(2),
        ]);

        autoTable(doc, {
          head: [["Day", "Total Collected"]],
          body: rows,
          startY: yOffset,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [16, 185, 129] },
          theme: "grid",
        });

        yOffset = doc.lastAutoTable.finalY + 20;
      });

      doc.save(`Market_Report_${start}_to_${end}.pdf`);
    };

    const computeMonthlyTotal = () => {
      let total = 0;
      reportData.forEach((month) => {
        month.days.forEach((day) => {
          total += day.total_amount;
        });
      });
      return total;
    };

    const columns = [
      {
        title: "Day",
        dataIndex: "day_label",
        key: "day",
        render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
      },
      {
        title: "Total Collected",
        dataIndex: "total_amount",
        key: "total",
        render: (v) => (
          <span style={{ fontWeight: 600, color: "#14532d" }}>
            {formatCurrency(v)}
          </span>
        ),
      },
      {
        title: "Actions",
        key: "actions",
        align: "right",
        render: (_, record) => (
          <Button
            type="primary"
            style={{
              ...secondaryButtonStyle,
              padding: "0 12px",
              fontSize: 12,
            }}
            onClick={() => setSelectedDay(record)}
          >
            View Details
          </Button>
        ),
      },
    ];

    // ✅ Custom pagination (Previous / Next)
    const paginationItemRender = (current, type, originalElement) => {
      if (type === "prev") {
        return (
          <Button
            size="small"
            style={{
              borderRadius: 999,
              borderColor: "#e5e7eb",
              padding: "0 12px",
              fontSize: 12,
              backgroundColor: "#f9fafb",
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
              borderColor: "#e5e7eb",
              padding: "0 12px",
              fontSize: 12,
              backgroundColor: "#f9fafb",
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
              originalElement.props["aria-current"] === "page"
                ? "1px solid #1D4ED8"
                : "1px solid transparent",
            backgroundColor:
              originalElement.props["aria-current"] === "page"
                ? "#eff6ff"
                : "transparent",
            fontSize: 12,
          }}
        >
          {current}
        </span>
      );
    };

    return (
      <div
        style={{
          padding: 24,
          background: "#f3f4f6",
          minHeight: "100vh",
        }}
      >
        {/* HEADER / TITLE BAR */}
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 16,
          }}
        >
          <div>
            <Title
              level={3}
              style={{
                margin: 0,
                color: "#0f172a",
              }}
            >
              Market Collection Report
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Overview of daily, monthly, and yearly market collections
            </Text>
          </div>

          {/* Filter bar */}
      
        </div>

        {loading && <LoadingOverlay />}

        {!loading && noData && (
          <Card
            style={{
              borderRadius: 16,
              border: "1px dashed #d1d5db",
              background: "#f9fafb",
            }}
          >
            <Text type="secondary">No collection data available.</Text>
          </Card>
        )}

        {!loading && !noData && (
          <>
            {/* KPI CARDS */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={8}>
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 10px 25px rgba(15,23,42,0.12)",
                    background:
                      "linear-gradient(135deg, #1d4ed8, #3b82f6, #38bdf8)",
                    color: "#fff",
                  }}
                >
                  <Text strong style={{ color: "rgba(255,255,255,0.85)" }}>
                    Today's Total Collection
                  </Text>
                  <Title
                    level={3}
                    style={{
                      marginTop: 8,
                      marginBottom: 0,
                      color: "#fff",
                    }}
                  >
                    {formatCurrency(todayCollection)}
                  </Title>
                  <Text style={{ fontSize: 12, opacity: 0.85 }}>
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
                  <Text strong style={{ color: "#111827" }}>
                    Monthly Total Collection
                  </Text>
                  <Title
                    level={3}
                    style={{ marginTop: 8, marginBottom: 0, color: "#111827" }}
                  >
                    {formatCurrency(computeMonthlyTotal())}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Current filter range
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
                  <Text strong style={{ color: "#111827" }}>
                    Yearly Total Collection
                  </Text>
                  <Title
                    level={3}
                    style={{ marginTop: 8, marginBottom: 0, color: "#111827" }}
                  >
                    {formatCurrency(yearlyCollection)}
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Based on selected year
                  </Text>
                </Card>
              </Col>
            </Row>

            {/* CHARTS */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
              <Col span={12}>
                <Card
                  title={
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      Monthly Collection Trend
                    </span>
                  }
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                  }}
                  headStyle={{ borderBottom: "none" }}
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={monthlyTrend.map((m) => ({
                        ...m,
                        monthShort: m.month.slice(0, 3),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="monthShort" />
                      <YAxis
                        tickFormatter={(v) => `₱${(v / 1000).toFixed(0)}k`}
                        width={60}
                      />
                      <Tooltip
                        formatter={(v) => formatCurrency(v)}
                        labelFormatter={(label) => `Month: ${label}`}
                      />
                      <Legend />
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
                </Card>
              </Col>

              <Col span={12}>
                <Card
                  title={
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      Section Collection Distribution
                    </span>
                  }
                  bordered={false}
                  style={{
                    borderRadius: 16,
                    boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                  }}
                  headStyle={{ borderBottom: "none" }}
                >
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={sectionData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={100}
                        innerRadius={40}
                        label={({ name, value }) =>
                          `${name}: ${formatCurrency(value)}`
                        }
                      >
                        {sectionData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
    <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "10px 14px",
    
      
  
    }}
  >
    {/* Label + Date Range stacked */}
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
    dropdownClassName="market-report-range-dropdown"
  />

    </div>

    {/* Actions */}
    <div style={{ display: "flex", gap: 8 }}>
    
      <Button
        type="default"
        onClick={printFullReportPDF}
        style={{ ...secondaryButtonStyle, height: 36, display: "flex", alignItems: "center" }}
      >
        <FaDownload style={{ marginRight: 6 }} /> Export PDF
      </Button>
    </div>
  </div>

            {/* MONTHLY TABLES */}
            {reportData.map((month, i) => (
              <Card
                key={i}
                title={
                  <span style={{ fontWeight: 600, color: "#0f172a" }}>
                    {month.month}
                  </span>
                }
                style={{
                  marginBottom: 20,
                  borderRadius: 16,
                  boxShadow: "0 8px 20px rgba(15,23,42,0.06)",
                }}
                headStyle={{
                  background: "#f9fafb",
                  borderRadius: "16px 16px 0 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
                bodyStyle={{ padding: 16 }}
              >
                <Table
                  dataSource={month.days}
                  columns={columns}
                  rowKey="day_label"
                  pagination={{
                    pageSize: 5,
                    itemRender: paginationItemRender,
                    showSizeChanger: false,
                  }}
                  size="middle"
                  summary={(pageData) => {
                    let grandTotal = 0;
                    pageData.forEach(({ total_amount }) => {
                      grandTotal += total_amount;
                    });

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

            {/* DAY MODAL */}
            <Modal
              title={
                selectedDay ? (
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#0f172a",
                        fontSize: 16,
                      }}
                    >
                      {selectedDay.day_label}
                    </div>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Payment Summary
                    </Text>
                  </div>
                ) : (
                  ""
                )
              }
              open={!!selectedDay}
              width={900}
              onCancel={() => setSelectedDay(null)}
              footer={[
                <Button
                  key="download"
                  type="primary"
                  onClick={printDayPDF}
                  style={primaryButtonStyle}
                >
                  <FaDownload style={{ marginRight: 6 }} /> Download Day PDF
                </Button>,
              ]}
              bodyStyle={{ paddingTop: 12 }}
            >
              {selectedDay && (
                <>
                  <Card
                    size="small"
                    style={{
                      marginBottom: 12,
                      borderRadius: 12,
                      background: "#f9fafb",
                    }}
                    bordered={false}
                  >
                    <Text strong>Total Collected: </Text>
                    <Text>{formatCurrency(selectedDay.total_amount)}</Text>
                  </Card>

                  <Table
                    dataSource={groupDayDetails(selectedDay.details)}
                    columns={[
                      { title: "Vendor Name", dataIndex: "vendor_name" },
                      { title: "Section", dataIndex: "section_name" },
                      {
                        title: "Stalls",
                        dataIndex: "stalls",
                        render: (stalls) => stalls.join(", "),
                      },
                      {
                        title: "Amount",
                        dataIndex: "amount",
                        render: (v) => formatCurrency(v),
                      },
                      {
                        title: "Action",
                        key: "action",
                        render: (_, record) => (
                          <Button
                            type="link"
                            onClick={() => {
                            
                              setSelectedDetailRecord(record);
                              setDetailModalVisible(true);
                            }}
                          >
                            View Details
                          </Button>
                        ),
                      },
                    ]}
                    rowKey={(record) =>
                      record.vendor_name + record.section_name
                    }
                    pagination={{
                      pageSize: 5,
                      itemRender: paginationItemRender,
                      showSizeChanger: false,
                    }}
                    size="middle"
                  />
                </>
              )}
            </Modal>

            {/* DETAIL MODAL */}
            <Modal
              title="Additional Payment Details"
              open={detailModalVisible}
              width={700}
              onCancel={() => {
                setDetailModalVisible(false);
                
                setSelectedDetailRecord(null);
              }}
              footer={[
                <Button
                  key="close"
                  onClick={() => {
                    setDetailModalVisible(false);
                    setSelectedDetailRecord(null);
                    
                  }}
                  style={secondaryButtonStyle}
                >
                  Close
                </Button>,
              ]}
            >
              {selectedDetailRecord && (
                <Table
                  dataSource={[selectedDetailRecord]}
                  columns={[
                    { title: "Contact", dataIndex: "vendor_contact" },
                    { title: "Stall Size", dataIndex: "stall_size" },
                    {
                      title: "Daily Rent",
                      dataIndex: "daily_rent",
                      render: (v) => formatCurrency(v),
                    },
                    {
                      title: "Monthly Rent",
                      dataIndex: "monthly_rent",
                      render: (v) => formatCurrency(v),
                    },
                    { title: "Payment Type", dataIndex: "payment_type" },
                    { title: "Collected By", dataIndex: "collector" },
                    { title: "Received By", dataIndex: "received_by" },
                  ]}
                  rowKey={(record) =>
                    record.vendor_name + record.section_name + "_detail"
                  }
                  pagination={false}
                  size="small"
                />
              )}
            </Modal>
          </>
        )}
      </div>
    );
  };

  export default MarketReport;
