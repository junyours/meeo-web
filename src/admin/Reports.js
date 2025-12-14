import React, { useEffect, useState } from "react";

import {
  generateReportPDF,
  generateDayModalPDF,
  generateDeptModalPDF,
} from "./ReportsPdf";
import api from "../Api";
import LoadingOverlay from "./Loading";
import { FaChartBar, FaLayerGroup, FaCalendarAlt } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  Table,
  Space,
  Button,
  Modal,
  DatePicker,
  Typography,
  Row,
  Col,
  Descriptions,
  Segmented,
} from "antd";

import MarketReport from "./MarketReport";
import SlaughterReport from "./SlaughterReport";
import WharfReport from "./WharfReport";
import MotorPoolReport from "./MotorPoolReport";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = ["#2563eb", "#22c55e", "#f97316", "#ef4444"]; // modern palette
const ALL_MONTHS = [
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

// -------------------- STATIC PESO CURRENCY --------------------
const formatPeso = (num) => {
  let value = String(num).replace(/[^\d.-]/g, "").trim();
  value = Number(value) || 0;
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// ---------- Shared HCI-ish Button Styles ----------
const PRIMARY_BTN_STYLE = {
  background:
    "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)",
  borderColor: "#1d4ed8",
  color: "#ffffff",
  fontWeight: 600,
  borderRadius: 999,
  boxShadow: "0 8px 18px rgba(37, 99, 235, 0.25)",
};

const OUTLINE_BTN_STYLE = {
  borderRadius: 999,
  borderColor: "#d1d5db",
  fontWeight: 500,
};

// ---------- Custom Pagination Renderer (Prev / Next only) ----------
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
          fontWeight: 500,
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
          fontWeight: 500,
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

const Reports = () => {
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [departmentTotals, setDepartmentTotals] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [selectedFees, setSelectedFees] = useState(null);
  const [noDataMessage, setNoDataMessage] = useState("");
  // local view state: overview / wharf / motorpool / market / slaughter
  const [activeView, setActiveView] = useState("overview");

  // For pagination activePage in modals (just to highlight current page)
  const [dayModalPage, setDayModalPage] = useState(1);
  const [deptModalPage, setDeptModalPage] = useState(1);

  useEffect(() => {
    if (activeView === "overview") {
      fetchReports();
    }
  }, [activeView]);

  const fetchReports = async (start = null, end = null) => {
    setLoading(true);
    setNoDataMessage("");
    try {
      const params = new URLSearchParams();
      if (start && end) {
        params.append("start_date", start);
        params.append("end_date", end);
      }

      const res = await api.get(`/reports/combined?${params.toString()}`);
      console.log("[COMBINED REPORT]", res.data);

      const marketRes = { data: res.data.market };
      const wharfRes = { data: res.data.wharf };
      const motorRes = { data: res.data.motorpool };
      const slaughterRes = { data: res.data.slaughter };

      const hasData =
        res.data.market?.months?.length ||
        res.data.wharf?.months?.length ||
        res.data.motorpool?.months?.length ||
        res.data.slaughter?.months?.length;

      if (!hasData) {
        setReportData([]);
        setDepartmentTotals([]);
        setMonthlyTrend([]);
        setNoDataMessage("No collection found for the selected date range.");
        return;
      }

      const wharfMap = {};
      wharfRes.data.months.forEach((m) => {
        wharfMap[m.month] = m;
      });

      const motorMap = {};
      motorRes.data.months.forEach((m) => {
        motorMap[m.month] = m;
      });

      const marketMap = {};
      marketRes.data.months.forEach((m) => {
        marketMap[m.month] = m;
      });

      const slaughterMap = {};
      slaughterRes.data.months.forEach((m) => {
        slaughterMap[m.month] = m;
      });

      const monthNameSet = new Set([
        ...wharfRes.data.months.map((m) => m.month),
        ...motorRes.data.months.map((m) => m.month),
        ...marketRes.data.months.map((m) => m.month),
        ...slaughterRes.data.months.map((m) => m.month),
      ]);

      const orderedMonthNames = ALL_MONTHS.filter((name) =>
        monthNameSet.has(name)
      ).sort((a, b) => ALL_MONTHS.indexOf(b) - ALL_MONTHS.indexOf(a));

      const months = orderedMonthNames.map((monthName) => {
        const wharfMonth = wharfMap[monthName] || { month: monthName, days: [] };
        const motorMonth = motorMap[monthName] || { month: monthName, days: [] };
        const marketMonth = marketMap[monthName] || {
          month: monthName,
          days: [],
        };
        const slaughterMonth = slaughterMap[monthName] || {
          month: monthName,
          days: [],
        };

        const allDayLabels = new Set();
        wharfMonth.days.forEach((d) => allDayLabels.add(d.day_label));
        motorMonth.days.forEach((d) => allDayLabels.add(d.day_label));
        marketMonth.days.forEach((d) => allDayLabels.add(d.day_label));
        slaughterMonth.days.forEach((d) => allDayLabels.add(d.day_label));

        const sortedDayLabels = Array.from(allDayLabels).sort((a, b) => {
          const normalize = (label) => {
            const parts = label.split(") ")[1]; // "Nov 14"
            return new Date(parts);
          };
          return normalize(b) - normalize(a);
        });

        return {
          month: monthName,
          days: sortedDayLabels.map((dayLabel) => {
            const wharfDay =
              wharfMonth.days.find((d) => d.day_label === dayLabel) || {
                total_amount: 0,
                details: [],
              };
            const motorDay =
              motorMonth.days.find((d) => d.day_label === dayLabel) || {
                total_amount: 0,
                details: [],
              };
            const marketDay =
              marketMonth.days.find((d) => d.day_label === dayLabel) || {
                total_amount: 0,
                details: [],
              };
            const slaughterDay =
              slaughterMonth.days.find((d) => d.day_label === dayLabel) || {
                total_amount: 0,
                details: [],
              };

            wharfDay.total_amount =
              Number(
                String(wharfDay.total_amount).replace(/[^\d.-]/g, "")
              ) || 0;
            motorDay.total_amount =
              Number(
                String(motorDay.total_amount).replace(/[^\d.-]/g, "")
              ) || 0;
            marketDay.total_amount =
              Number(
                String(marketDay.total_amount).replace(/[^\d.-]/g, "")
              ) || 0;
            slaughterDay.total_amount =
              Number(
                String(slaughterDay.total_amount).replace(/[^\d.-]/g, "")
              ) || 0;

            return {
              day_label: dayLabel,
              wharf: wharfDay,
              motorpool: motorDay,
              market: marketDay,
              slaughter: slaughterDay,
              total_amount:
                wharfDay.total_amount +
                motorDay.total_amount +
                marketDay.total_amount +
                slaughterDay.total_amount,
              details: [
                ...wharfDay.details.map((d) => ({
                  ...d,
                  department: "Wharf",
                })),
                ...motorDay.details.map((d) => ({
                  ...d,
                  department: "Motorpool",
                })),
                ...marketDay.details.map((d) => ({
                  ...d,
                  department: "Market",
                })),
                ...slaughterDay.details.map((d) => ({
                  ...d,
                  department: "Slaughter",
                })),
              ],
            };
          }),
        };
      });

      setReportData(months);

      const totalWharf = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + d.wharf.total_amount, 0),
        0
      );
      const totalMotor = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + d.motorpool.total_amount, 0),
        0
      );
      const totalMarket = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + d.market.total_amount, 0),
        0
      );
      const totalSlaughter = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + d.slaughter.total_amount, 0),
        0
      );

    setDepartmentTotals([
  { name: "Wharf", value: totalWharf || 0 },
  { name: "Motorpool", value: totalMotor || 0 },
  { name: "Market", value: totalMarket || 0 },
  { name: "Slaughter", value: totalSlaughter || 0 },
]);


      const trend = ALL_MONTHS.map((monthName) => {
        const monthData = months.find((m) => m.month === monthName);
        return {
          month: monthName,
          Wharf: monthData
            ? monthData.days.reduce((a, b) => a + b.wharf.total_amount, 0)
            : 0,
          Motorpool: monthData
            ? monthData.days.reduce((a, b) => a + b.motorpool.total_amount, 0)
            : 0,
          Market: monthData
            ? monthData.days.reduce((a, b) => a + b.market.total_amount, 0)
            : 0,
          Slaughter: monthData
            ? monthData.days.reduce((a, b) => a + b.slaughter.total_amount, 0)
            : 0,
        };
      });

      setMonthlyTrend(trend);
    } catch (err) {
      console.error(err);
      setReportData([]);
      setDepartmentTotals([]);
      setMonthlyTrend([]);
      setNoDataMessage("Unable to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewFees = (record) => {
    setSelectedFees({
      customer_name: record.customer_name,
      animals_name: record.animal_type,
      slaughter_fee: record.breakdown?.slaughter_fee,
      ante_mortem: record.breakdown?.ante_mortem,
      post_mortem: record.breakdown?.post_mortem,
      permit_to_slh: record.breakdown?.permit_to_slh,
      total_amount:
        Number(record.breakdown?.slaughter_fee || 0) +
        Number(record.breakdown?.ante_mortem || 0) +
        Number(record.breakdown?.post_mortem || 0) +
        Number(record.breakdown?.coral_fee || 0) +
        Number(record.breakdown?.permit_to_slh || 0),
    });
    setShowFeesModal(true);
  };

  const handleGenerateReport = () => {
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      fetchReports(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    }
  };

  const formatCurrency = (num) => (num ? formatPeso(num) : "-");

  const groupDayDetails = (details, dept = null) => {
    const grouped = {};
    details.forEach((d) => {
      if (dept && d.department !== dept) return;
      const amountValue =
        Number(
          String(
            d.total_amount || d.amount || (d.breakdown?.total_amount ?? 0)
          ).replace(/[^\d.-]/g, "")
        ) || 0;
      const key =
        d.department === "Slaughter"
          ? `${d.customer_name}|${d.animal_type}|${d.payment_date}`
          : `${d.collector}|${d.received_by}|${d.payment_date}`;

      if (!grouped[key]) {
        grouped[key] = {
          ...d,
          stalls: d.stall_number ? [d.stall_number] : [],
          amount: amountValue,
        };
      } else {
        if (d.stall_number) grouped[key].stalls.push(d.stall_number);
        grouped[key].amount += amountValue;
      }
    });

    return Object.values(grouped);
  };

  const renderOverview = () => (
    <div
      style={{
        padding: 24,
        maxWidth: 1300,
        margin: "0 auto",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 24,
          gap: 16,
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "999px",
                background:
                  "linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)",
                color: "#fff",
              }}
            >
              <FaChartBar />
            </span>
            <span>Department Reports</span>
          </Title>
          <Text type="secondary">
            Centralized overview of Wharf, Motorpool, Market, and Slaughter
            collections.
          </Text>
        </div>

        
      </div>

      {/* Filters + Actions */}
    

      {loading && <LoadingOverlay />}

      {!loading && noDataMessage && (
        <Card
          style={{
            textAlign: "center",
            padding: 48,
            borderRadius: 16,
            boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
            background:
              "linear-gradient(135deg,#fff7ed 0%, #fffbeb 40%, #ffffff 90%)",
            border: "1px solid #fed7aa",
          }}
        >
          <Title level={4} style={{ color: "#ea580c", marginBottom: 8 }}>
            No Data Available
          </Title>
          <Text style={{ color: "#92400e" }}>{noDataMessage}</Text>
        </Card>
      )}

      {!loading && reportData.length > 0 && (
        <>
          {/* ===================== Enhanced Analytics Section ===================== */}
          <div
            style={{
              background: "#f9fafb",
              borderRadius: 16,
              padding: 24,
              marginBottom: 32,
              boxShadow: "0 4px 18px rgba(15,23,42,0.06)",
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <Title
                level={3}
                style={{
                  marginBottom: 4,
                  color: "#111827",
                }}
              >
                Analytics Overview
              </Title>
              <Text type="secondary">
                Visual breakdown of total collections and monthly performance by
                department.
              </Text>
            </div>

            {/* Collection Cards */}
            <Row gutter={[16, 16]} justify="center" style={{ marginBottom: 24 }}>
              {departmentTotals.map((dept, idx) => (
                <Col xs={24} sm={12} md={6} key={idx}>
                  <Card
                    hoverable
                    style={{
                      height: "100%",
                      textAlign: "left",
                      borderRadius: 16,
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #f9fafb 45%, #eff6ff 100%)",
                      border: "1px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    bodyStyle={{ padding: 16 }}
                    onClick={() => {
                      switch (dept.name) {
                        case "Wharf":
                          setActiveView("wharf");
                          break;
                        case "Motorpool":
                          setActiveView("motorpool");
                          break;
                        case "Market":
                          setActiveView("market");
                          break;
                        case "Slaughter":
                          setActiveView("slaughter");
                          break;
                        default:
                          break;
                      }
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        textTransform: "uppercase",
                        letterSpacing: 0.08,
                        color: "#6b7280",
                        fontWeight: 600,
                      }}
                    >
                      {dept.name} Collection
                    </Text>
                    <Title
                      level={3}
                      style={{
                        color: COLORS[idx % COLORS.length],
                        fontWeight: 700,
                        margin: "8px 0 4px 0",
                      }}
                    >
                      {formatCurrency(dept.value)}
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Tap to view detailed {dept.name.toLowerCase()} report
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Charts Section */}
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <span style={{ fontWeight: 600 }}>
                      <FaLayerGroup
                        style={{ marginRight: 8, color: "#2563eb" }}
                      />
                      Department Collection Share
                    </span>
                  }
                  style={{
                    height: "100%",
                    borderRadius: 16,
                    boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
                  }}
                  bodyStyle={{ height: 360 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={departmentTotals}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                        labelLine={true}
                        label={({ name, value }) =>
                          `${name}: ₱${value.toLocaleString("en-PH", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}`
                        }
                        minAngle={10}
                      >
                        {departmentTotals.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(value) => formatPeso(value)} />
                      <Legend
                        formatter={(value) => {
                          const dept = departmentTotals.find(
                            (d) => d.name === value
                          );
                          return `${value}: ₱${dept?.value.toLocaleString(
                            "en-PH",
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          )}`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title={
                    <span style={{ fontWeight: 600 }}>
                      <FaCalendarAlt
                        style={{ marginRight: 8, color: "#22c55e" }}
                      />
                      Monthly Collection Trend
                    </span>
                  }
                  style={{
                    height: "100%",
                    borderRadius: 16,
                    boxShadow: "0 4px 14px rgba(15,23,42,0.08)",
                  }}
                  bodyStyle={{ height: 360 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrend}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" />
                      <YAxis />
                      <ReTooltip formatter={formatCurrency} />
                      <Legend verticalAlign="bottom" />
                      <Line
                        type="monotone"
                        dataKey="Wharf"
                        stroke="#2563eb"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Motorpool"
                        stroke="#22c55e"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Market"
                        stroke="#f97316"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Slaughter"
                        stroke="#ef4444"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>
   <Card
        style={{
          marginBottom: 24,
          borderRadius: 16,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 22px rgba(15, 23, 42, 0.06)",
          background:
            "radial-gradient(circle at top left, #eff6ff, #ffffff 45%)",
        }}
        bodyStyle={{
          padding: 20,
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Space direction="vertical" size={4}>
          <Text strong>Seclect Date Range:</Text>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
            allowClear
          />
        </Space>
        <Space>
          <Button
            onClick={() => {
              setDateRange([]);
              fetchReports(null, null);
            }}
            style={OUTLINE_BTN_STYLE}
          >
            Reset
          </Button>
          <Button
            type="primary"
            onClick={handleGenerateReport}
            icon={<FaChartBar />}
            style={PRIMARY_BTN_STYLE}
          >
            Generate Report
          </Button>
        </Space>
      </Card>

          {/* Reports Table */}
          {reportData.map((month, i) => (
            <Card
              key={i}
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        backgroundColor: "#22c55e",
                      }}
                    />
                    <Text strong>{month.month}</Text>
                  </span>
                  <Button
                    type="primary"
                    onClick={() =>
                      generateReportPDF(
                        reportData,
                        dateRange[0]?.format("YYYY-MM-DD"),
                        dateRange[1]?.format("YYYY-MM-DD")
                      )
                    }
                    style={PRIMARY_BTN_STYLE}
                  >
                    Export Full Report PDF
                  </Button>
                </div>
              }
              style={{
                marginBottom: 24,
                borderRadius: 16,
                boxShadow: "0 3px 12px rgba(15,23,42,0.08)",
              }}
            >
              <Table
                dataSource={month.days.map((d, idx) => ({
                  ...d,
                  key: idx,
                }))}
                pagination={false}
                bordered={false}
                rowClassName={(_, index) =>
                  index % 2 === 0 ? "row-light" : "row-dark"
                }
                columns={[
                  {
                    title: "Day",
                    dataIndex: "day_label",
                    key: "day_label",
                  },
                  {
                    title: "Wharf",
                    dataIndex: ["wharf", "total_amount"],
                    key: "wharf",
                    align: "right",
                    render: (val) => (
                      <span style={{ color: "#111827" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Motorpool",
                    dataIndex: ["motorpool", "total_amount"],
                    key: "motorpool",
                    align: "right",
                    render: (val) => (
                      <span style={{ color: "#111827" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Market",
                    dataIndex: ["market", "total_amount"],
                    key: "market",
                    align: "right",
                    render: (val) => (
                      <span style={{ color: "#111827" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Slaughter",
                    dataIndex: ["slaughter", "total_amount"],
                    key: "slaughter",
                    align: "right",
                    render: (val) => (
                      <span style={{ color: "#111827" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Total",
                    dataIndex: "total_amount",
                    key: "total_amount",
                    align: "right",
                    render: (val) => (
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    align: "center",
                    render: (_, record) => (
                      <Button
                        type="primary"
                        onClick={() => {
                          setDayModalPage(1);
                          setSelectedDay(record);
                        }}
                        style={PRIMARY_BTN_STYLE}
                      >
                        View Details
                      </Button>
                    ),
                  },
                ]}
                summary={(pageData) => {
                  const totalWharf = pageData.reduce(
                    (sum, d) => sum + d.wharf.total_amount,
                    0
                  );
                  const totalMotor = pageData.reduce(
                    (sum, d) => sum + d.motorpool.total_amount,
                    0
                  );
                  const totalMarket = pageData.reduce(
                    (sum, d) => sum + d.market.total_amount,
                    0
                  );
                  const totalSlaughter = pageData.reduce(
                    (sum, d) => sum + d.slaughter.total_amount,
                    0
                  );
                  const grandTotal = pageData.reduce(
                    (sum, d) => sum + d.total_amount,
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell>
                        <b>Grand Total</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{formatCurrency(totalWharf)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{formatCurrency(totalMotor)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{formatCurrency(totalMarket)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{formatCurrency(totalSlaughter)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell align="right">
                        <b>{formatCurrency(grandTotal)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          ))}

          {/* Day Modal */}
          <Modal
            open={!!selectedDay}
            title={
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <FaCalendarAlt style={{ color: "#2563eb" }} />{" "}
                <span>{selectedDay?.day_label}</span>
              </span>
            }
            onCancel={() => setSelectedDay(null)}
            footer={[
              <Button
                key="pdf"
                type="primary"
                onClick={() => generateDayModalPDF(selectedDay)}
                style={PRIMARY_BTN_STYLE}
              >
                Export Day PDF
              </Button>,
              <Button
                key="close"
                onClick={() => setSelectedDay(null)}
                style={{ borderRadius: 999 }}
                danger
              >
                Close
              </Button>,
            ]}
            width={1000}
            bodyStyle={{ paddingTop: 8 }}
          >
            {selectedDay && (
              <Table
                dataSource={["Wharf", "Motorpool", "Market", "Slaughter"].flatMap(
                  (dept) => groupDayDetails(selectedDay.details, dept)
                )}
                columns={[
                  {
                    title: "Department",
                    dataIndex: "department",
                    key: "department",
                  },
                  {
                    title: "Collected By",
                    dataIndex: "collector",
                    key: "collector",
                  },
                  {
                    title: "Received By",
                    dataIndex: "received_by",
                    key: "received_by",
                  },
                  {
                    title: "Amount",
                    dataIndex: "amount",
                    key: "amount",
                    align: "right",
                    render: formatCurrency,
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    align: "center",
                    render: (_, record) => (
                      <Button
                        type="link"
                        onClick={() => {
                          const filteredDetails = selectedDay.details.filter(
                            (d) =>
                              d.department === record.department &&
                              d.collector === record.collector
                          );

                          let deptDetails = filteredDetails;
                          if (record.department === "Market") {
                            deptDetails = Object.values(
                              filteredDetails.reduce((acc, cur) => {
                                if (!acc[cur.vendor_name]) {
                                  acc[cur.vendor_name] = {
                                    ...cur,
                                    stalls: cur.stall_number
                                      ? [cur.stall_number]
                                      : [],
                                    amount:
                                      Number(
                                        String(
                                          cur.amount ||
                                            cur.total_amount ||
                                            0
                                        ).replace(/[^\d.-]/g, "")
                                      ) || 0,
                                  };
                                } else {
                                  if (cur.stall_number)
                                    acc[cur.vendor_name].stalls.push(
                                      cur.stall_number
                                    );
                                  acc[cur.vendor_name].amount +=
                                    Number(
                                      String(
                                        cur.amount ||
                                          cur.total_amount ||
                                          0
                                      ).replace(/[^\d.-]/g, "")
                                    ) || 0;
                                }
                                return acc;
                              }, {})
                            );
                          }

                          setDeptModalPage(1);
                          setSelectedDept({
                            dept: record.department,
                            details: deptDetails,
                          });
                   
                        }}
                        style={{ padding: 0, fontWeight: 500 }}
                      >
                        View Collection Details
                      </Button>
                    ),
                  },
                ]}
                pagination={{
                  pageSize: 5,
                  onChange: (page) => setDayModalPage(page),
                  itemRender: (current, type, originalElement) =>
                    paginationItemRender(current, type, originalElement, dayModalPage),
                  showSizeChanger: false,
                }}
                rowKey={(record) =>
                  `${record.department}-${record.collector}-${record.payment_date}`
                }
              />
            )}
          </Modal>

         {/* Department Modal */}
<Modal
  open={!!selectedDept}
  title={
    <span
      style={{
        fontWeight: 600,
        fontSize: 16,
        letterSpacing: 0.2,
      }}
    >
      {selectedDept?.dept} Collection Details
    </span>
  }
  onCancel={() => setSelectedDept(null)}
  footer={[
    <Button
      key="pdf"
      type="primary"
      onClick={() =>
        generateDeptModalPDF(selectedDept, selectedDay?.day_label)
      }
      style={{
        ...PRIMARY_BTN_STYLE,
        height: 34,
        padding: "0 18px",
        fontSize: 13,
      }}
    >
      Export Dept PDF
    </Button>,
    <Button
      key="close"
      onClick={() => setSelectedDept(null)}
      style={{ borderRadius: 999, height: 34, padding: "0 16px" }}
      danger
    >
      Close
    </Button>,
  ]}
  width={selectedDept?.dept === "Slaughter" ? 1400 : 1100} // a bit narrower
  style={{
    top: 32, // slightly lower than default but not too tall
  }}
  bodyStyle={{
    padding: 12,               // smaller padding for compressed look
    paddingTop: 4,
  }}
>
  {selectedDept && (
    <Table
      size="small"              // compact antd table
      dataSource={selectedDept.details.map((d, idx) => ({
        ...d,
        formattedDate: new Date(d.payment_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        formattedTime: new Date(d.payment_date).toLocaleTimeString("en-PH", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        key: idx,
      }))}
      columns={
        selectedDept.dept === "Slaughter"
          ? [
              {
                title: "Animal",
                dataIndex: "animal_type",
                key: "animal_type",
              },
              {
                title: "Customer",
                dataIndex: "customer_name",
                key: "customer_name",
              },
              {
                title: "Inspector",
                dataIndex: "inspector",
                key: "inspector",
              },
              {
                title: "Collected By",
                dataIndex: "collector",
                key: "collector",
              },
              {
                title: "Received By",
                dataIndex: "received_by",
                key: "received_by",
              },
              {
                title: "Qty",
                dataIndex: ["breakdown", "quantity"],
                key: "quantity",
              },
              {
                title: "Total Kilos",
                dataIndex: ["breakdown", "total_kilos"],
                key: "total_kilos",
                render: (val) => `${val} kg`,
              },
              {
                title: "Per Kilo",
                dataIndex: ["breakdown", "per_kilos"],
                key: "per_kilo",
                render: (val) =>
                  Array.isArray(val)
                    ? val.map((k) => `${k} kg`).join(", ")
                    : `${val} kg`,
              },
              {
                title: "Total Amount",
                key: "total_amount",
                align: "right",
                render: (_, record) => {
                  const total =
                    Number(record.slaughter_fee || 0) +
                    Number(record.breakdown?.ante_mortem || 0) +
                    Number(record.breakdown?.post_mortem || 0) +
                    Number(record.coral_fee || 0) +
                    Number(record.permit_to_slh || 0);
                  return formatCurrency(total);
                },
              },
              {
                title: "Payment Date",
                dataIndex: "formattedDate",
                key: "payment_date",
              },
              {
                title: "Time",
                dataIndex: "formattedTime",
                key: "time",
              },
              {
                title: "Actions",
                key: "actions",
                align: "center",
                render: (_, record) => (
                  <Button
                    type="primary"
                    onClick={() => handleViewFees(record)}
                    style={{
                      ...PRIMARY_BTN_STYLE,
                      height: 28,
                      padding: "0 12px",
                      fontSize: 12,
                      boxShadow: "none",
                    }}
                  >
                    View Fees
                  </Button>
                ),
              },
            ]
          : selectedDept.dept === "Market"
          ? [
              {
                title: "Vendor",
                dataIndex: "vendor_name",
                key: "vendor_name",
              },
              {
                title: "Stalls",
                dataIndex: "stalls",
                key: "stalls",
                render: (stalls) => stalls?.join(", ") || "—",
              },
              {
                title: "Payment Type",
                dataIndex: "payment_type",
                key: "payment_type",
              },
              {
                title: "Collected By",
                dataIndex: "collector",
                key: "collector",
              },
              {
                title: "Received By",
                dataIndex: "received_by",
                key: "received_by",
              },
              {
                title: "Amount",
                dataIndex: "amount",
                key: "amount",
                align: "right",
                render: formatCurrency,
              },
              {
                title: "Payment Date",
                dataIndex: "formattedDate",
                key: "payment_date",
              },
              {
                title: "Time",
                dataIndex: "formattedTime",
                key: "time",
              },
            ]
          : [
              {
                title: "Collected By",
                dataIndex: "collector",
                key: "collector",
              },
              {
                title: "Received By",
                dataIndex: "received_by",
                key: "received_by",
              },
              {
                title: "Amount",
                dataIndex: "amount",
                key: "amount",
                align: "right",
                render: formatCurrency,
              },
              {
                title: "Payment Date",
                dataIndex: "formattedDate",
                key: "payment_date",
              },
              {
                title: "Time",
                dataIndex: "formattedTime",
                key: "time",
              },
            ]
      }
      pagination={{
        pageSize: 5,
        onChange: (page) => setDeptModalPage(page),
        itemRender: (current, type, originalElement) =>
          paginationItemRender(current, type, originalElement, deptModalPage),
        showSizeChanger: false,
      }}
      rowKey={(record, idx) =>
        selectedDept.dept === "Market"
          ? `${record.department || ""}-${record.vendor_name || ""}-${
              record.payment_date || ""
            }-${idx}`
          : `${record.department || ""}-${record.collector || ""}-${
              record.payment_date || ""
            }-${idx}`
      }
      // tighter table padding & header
      components={{
        header: {
          cell: (props) => (
            <th
              {...props}
              style={{
                ...props.style,
                padding: "6px 8px",
                fontSize: 12,
                whiteSpace: "nowrap",
                backgroundColor: "#f9fafb",
              }}
            />
          ),
        },
        body: {
          cell: (props) => (
            <td
              {...props}
              style={{
                ...props.style,
                padding: "4px 8px",
                fontSize: 12,
                verticalAlign: "middle",
              }}
            />
          ),
        },
      }}
    />
  )}
</Modal>


          {/* Slaughter Fees Modal */}
          <Modal
            open={showFeesModal}
            title={
              selectedFees
                ? `Slaughter Fees — ${selectedFees.customer_name}`
                : "Slaughter Fees Details"
            }
            onCancel={() => setShowFeesModal(false)}
            footer={[
              <Button
                key="close"
                type="primary"
                style={{ borderRadius: 999 }}
                danger
                onClick={() => setShowFeesModal(false)}
              >
                Close
              </Button>,
            ]}
          >
            {selectedFees && (
              <Descriptions
                bordered
                column={1}
                size="middle"
                labelStyle={{ fontWeight: 600, width: 200 }}
                contentStyle={{ textAlign: "right" }}
              >
                <Descriptions.Item label="Customer">
                  {selectedFees.customer_name}
                </Descriptions.Item>
                <Descriptions.Item label="Animal">
                  {selectedFees.animals_name}
                </Descriptions.Item>
                <Descriptions.Item label="Slaughter Fee">
                  {formatCurrency(selectedFees.slaughter_fee)}
                </Descriptions.Item>
                <Descriptions.Item label="Ante Mortem">
                  {formatCurrency(selectedFees.ante_mortem)}
                </Descriptions.Item>
                <Descriptions.Item label="Post Mortem">
                  {formatCurrency(selectedFees.post_mortem)}
                </Descriptions.Item>
                <Descriptions.Item label="Permit">
                  {formatCurrency(selectedFees.permit_to_slh)}
                </Descriptions.Item>
                <Descriptions.Item label="Total">
                  {formatCurrency(selectedFees.total_amount)}
                </Descriptions.Item>
              </Descriptions>
            )}
          </Modal>
        </>
      )}
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "wharf":
        return <WharfReport />;
      case "motorpool":
        return <MotorPoolReport />;
      case "market":
        return <MarketReport />;
      case "slaughter":
        return <SlaughterReport />;
      default:
        return renderOverview();
    }
  };

  return renderContent();
};

export default Reports;
