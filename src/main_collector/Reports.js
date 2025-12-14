// MainCollectorReports.js
import React, { useEffect, useState } from "react";

import {
  generateReportPDF,
  generateDayModalPDF,
  generateDeptModalPDF,
} from "./ReportsPdf"; // reuse if PDF logic is compatible
import api from "../Api";
import LoadingOverlay from "./Loading";
import { FaChartBar, FaLayerGroup, FaCalendarAlt } from "react-icons/fa";
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
  Card,
  Table,
  Space,
  Button,
  Modal,
  DatePicker,
  Typography,
  Row,
  Col,
} from "antd";

const { RangePicker } = DatePicker;
const { Title } = Typography;

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF4C4C"];
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

const formatPeso = (num) => {
  let value = String(num).replace(/[^\d.-]/g, "").trim();
  value = Number(value) || 0;
  return `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const MainCollectorReports = () => {
  const [dateRange, setDateRange] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState([]); // months[]
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDept, setSelectedDept] = useState(null);
  const [departmentTotals, setDepartmentTotals] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [slaughterFeesModal, setSlaughterFeesModal] = useState(false);
  const [activeSlaughterFees, setActiveSlaughterFees] = useState(null);

  const BUTTON_STYLE = {
    backgroundColor: "#ffffff", // white
    borderColor: "#000000ff",
    color: "#000000", // black text
    fontWeight: "bold",
  };

  const CLOSE_BUTTON_STYLE = {
    backgroundColor: "#d9534f",
    borderColor: "#d43f3a",
    color: "#fff",
    fontWeight: "bold",
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (start = null, end = null) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (start && end) {
        params.append("start_date", start);
        params.append("end_date", end);
      }

      const res = await api.get(`/main-collector/reports?${params.toString()}`);
      let months = res.data.months || [];
      console.log(res.data.months);

      // Normalize numeric amounts & compute totals
      months.forEach((m) => {
        m.days.forEach((d) => {
          d.total_amount =
            Number(String(d.total_amount).replace(/[^\d.-]/g, "")) || 0;

          ["wharf", "motorpool", "market", "slaughter"].forEach((dept) => {
            if (!d[dept]) {
              d[dept] = { total_amount: 0, details: [] };
            } else {
              d[dept].total_amount =
                Number(
                  String(d[dept].total_amount).replace(/[^\d.-]/g, "")
                ) || 0;
            }
          });

          if (Array.isArray(d.details)) {
            d.details = d.details.map((det) => ({
              ...det,
              amount:
                Number(
                  String(
                    det.total_amount ||
                      det.amount ||
                      det.breakdown?.total_amount ||
                      0
                  ).replace(/[^\d.-]/g, "")
                ) || 0,
            }));
          } else {
            d.details = [];
          }
        });
      });

      // 🔹 SORT MONTHS DESCENDING
      months = months.sort(
        (a, b) => ALL_MONTHS.indexOf(b.month) - ALL_MONTHS.indexOf(a.month)
      );

      // 🔹 SORT DAYS DESCENDING
      months = months.map((month) => ({
        ...month,
        days: month.days.sort((a, b) => {
          const dateA = new Date(a.day_label.split(") ")[1]);
          const dateB = new Date(b.day_label.split(") ")[1]);
          return dateB - dateA; // descending
        }),
      }));

      setReportData(months);

      // Department totals
      const totalWharf = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + (d.wharf?.total_amount || 0), 0),
        0
      );
      const totalMotor = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce(
            (sumD, d) => sumD + (d.motorpool?.total_amount || 0),
            0
          ),
        0
      );
      const totalMarket = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce((sumD, d) => sumD + (d.market?.total_amount || 0), 0),
        0
      );
      const totalSlaughter = months.reduce(
        (sumM, month) =>
          sumM +
          month.days.reduce(
            (sumD, d) => sumD + (d.slaughter?.total_amount || 0),
            0
          ),
        0
      );

      setDepartmentTotals([
        { name: "Wharf", value: totalWharf === 0 ? 0 : totalWharf },
        { name: "Motorpool", value: totalMotor === 0 ? 0 : totalMotor },
        { name: "Market", value: totalMarket === 0 ? 1 : totalMarket },
        { name: "Slaughter", value: totalSlaughter === 0 ? 0 : totalSlaughter },
      ]);

      // Monthly Trend (for LineChart)
      const trend = ALL_MONTHS.map((monthName) => {
        const monthData = months.find((m) => m.month === monthName);
        return {
          month: monthName,
          Wharf: monthData
            ? monthData.days.reduce(
                (a, b) => a + (b.wharf?.total_amount || 0),
                0
              )
            : 0,
          Motorpool: monthData
            ? monthData.days.reduce(
                (a, b) => a + (b.motorpool?.total_amount || 0),
                0
              )
            : 0,
          Market: monthData
            ? monthData.days.reduce(
                (a, b) => a + (b.market?.total_amount || 0),
                0
              )
            : 0,
          Slaughter: monthData
            ? monthData.days.reduce(
                (a, b) => a + (b.slaughter?.total_amount || 0),
                0
              )
            : 0,
        };
      });

      setMonthlyTrend(trend);
    } catch (err) {
      console.error(err);
      setReportData([]);
      setDepartmentTotals([]);
      setMonthlyTrend([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      fetchReports(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    }
  };

  const formatCurrency = (num) => (num ? formatPeso(num) : "-");

  const groupDayModalByCollector = (day) => {
    const allDetails = ["wharf", "motorpool", "market", "slaughter"].flatMap(
      (deptKey) => {
        const dept = day[deptKey];
        return (
          dept?.details?.map((d) => ({
            ...d,
            department: deptKey.charAt(0).toUpperCase() + deptKey.slice(1),
          })) || []
        );
      }
    );

    const grouped = {};

    allDetails.forEach((item) => {
      const key = `${item.department}|${item.collector}|${item.received_by}`;

      const amountValue =
        Number(
          String(
            item.amount ||
              item.total_amount ||
              item.breakdown?.total_amount ||
              0
          ).replace(/[^\d.-]/g, "")
        ) || 0;

      if (!grouped[key]) {
        grouped[key] = {
          department: item.department,
          collector: item.collector,
          received_by: item.received_by,
          amount: amountValue,
        };
      } else {
        grouped[key].amount += amountValue;
      }
    });

    return Object.values(grouped);
  };

  const groupDeptDetails = (selectedDept) => {
    if (!selectedDept) return [];

    const dept = selectedDept.dept;
    const details = selectedDept.details || [];

    // SLAUGHTER — RETURN RAW LIST WITH FULL BREAKDOWN
    if (dept === "Slaughter") {
      return details.map((item) => {
        const amountValue =
          Number(
            String(
              item.amount ||
                item.total_amount ||
                item.breakdown?.total_amount ||
                0
            ).replace(/[^\d.-]/g, "")
          ) || 0;

        return {
          animal_type: item.animal_type,
          quantity: item.quantity,
          total_kilos: item.total_kilos,
          per_kilos: item.per_kilos || [],
          breakdown: item.breakdown || {},
          collector: item.collector,
          received_by: item.received_by,
          customer_name: item.customer_name,
          inspector: item.inspector,
          payment_date: item.payment_date,
          amount: amountValue,
        };
      });
    }

    // OTHER DEPARTMENTS — GROUPING LOGIC
    const grouped = {};

    details.forEach((item) => {
      const vendor = item.vendor_name || "";
      const payment = item.payment_type || "";
      const collector = item.collector || "";
      const received = item.received_by || "";

      let key = "";

      if (dept === "Market") {
        key = `${vendor}|${payment}|${collector}|${received}`;
      } else {
        // Wharf + Motorpool
        key = `${collector}|${received}`;
      }

      const amountValue =
        Number(
          String(item.amount || item.total_amount || 0).replace(/[^\d.-]/g, "")
        ) || 0;

      if (!grouped[key]) {
        grouped[key] = {
          ...item,
          amount: amountValue,
        };

        if (dept === "Market") {
          grouped[key].stalls = [item.stall_number];
        }
      } else {
        grouped[key].amount += amountValue;

        if (dept === "Market") {
          grouped[key].stalls.push(item.stall_number);
        }
      }
    });

    return Object.values(grouped);
  };



  // ---------- SAME LAYOUT AS ADMIN REPORTS ----------
  return (
    <div style={{ padding: 24 }}>
      {/* Internal CSS for primary button style */}
      <style>{`
        .primary-action-btn {
          background-color: #ffffff !important;
          border-color: #000000ff !important;
          color: #000000 !important;
          font-weight: bold;
        }

        .primary-action-btn:hover,
        .primary-action-btn:focus {
          background-color: #38bdf8 !important; /* sky blue */
          border-color: #38bdf8 !important;
          color: #ffffff !important;
        }

        .helper-text {
          color: #6b7280;
          font-size: 13px;
        }
      `}</style>

      <Title level={2} style={{ marginBottom: 4 }}>
        <FaChartBar /> Main Collector Reports
      </Title>

      {/* 👇 Helper text under the title */}
      <span className="helper-text">
        Select a <strong>date range</strong> to view collection reports per
        department. Use the <strong>charts</strong> for quick trends, the{" "}
        <strong>tables</strong> to review per day, and the{" "}
        <strong>Export PDF</strong> buttons to download printable copies.
      </span>

      {loading && <LoadingOverlay />}

      {/* Date range controls + small hint */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <Space style={{ marginBottom: 4 }}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />
          <Button
            type="primary"
            onClick={handleGenerateReport}
            icon={<FaChartBar />}
            style={BUTTON_STYLE}
            className="primary-action-btn"
          >
            Generate Report
          </Button>
        </Space>
        <div className="helper-text">
          Tip: Choose a start and end date, then click{" "}
          <strong>Generate Report</strong> to refresh the analytics.
        </div>
      </div>

      {!loading && reportData.length === 0 && (
        <Card
          style={{
            textAlign: "center",
            padding: 40,
            borderRadius: 12,
            background: "#fff6f0",
            color: "#d46b08",
            fontWeight: "bold",
            fontSize: 16,
            boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          📊 No collections found for the selected date range.
        </Card>
      )}

      {!loading && reportData.length > 0 && (
        <>
          {/* Analytics Overview */}
          <div
            style={{
              background: "#f9fafc",
              borderRadius: 12,
              padding: 24,
              marginBottom: 40,
              boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
            }}
          >
            <Title
              level={3}
              style={{ marginBottom: 24, textAlign: "center", color: "#333" }}
            >
              <FaChartBar style={{ marginRight: 8, color: "#1890ff" }} />
              Analytics Overview
            </Title>

            {/* Cards */}
            <Row gutter={[16, 16]} justify="center" style={{ marginBottom: 32 }}>
              {departmentTotals.map((dept, idx) => (
                <Col xs={24} sm={12} md={6} key={idx}>
                  <Card
                    hoverable
                    style={{
                      height: "100%",
                      textAlign: "center",
                      borderRadius: 12,
                      background: "linear-gradient(145deg, #ffffff, #f0f2f5)",
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      cursor: "pointer",
                    }}
                    styles={{ body: { padding: 20 } }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "translateY(-4px)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "translateY(0px)")
                    }
                  >
                    <Title level={4} style={{ color: "#555", marginBottom: 8 }}>
                      {dept.name} Collection
                    </Title>
                    <Title
                      level={3}
                      style={{
                        color: COLORS[idx % COLORS.length],
                        fontWeight: 700,
                        marginBottom: 0,
                      }}
                    >
                      {formatCurrency(dept.value)}
                    </Title>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Charts */}
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <span style={{ fontWeight: 600 }}>
                      <FaLayerGroup
                        style={{ marginRight: 8, color: "#0088FE" }}
                      />
                      Department Collection
                    </span>
                  }
                  style={{
                    height: "100%",
                    borderRadius: 12,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  }}
                  styles={{ body: { height: 360 } }}
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
                      <Tooltip formatter={(value) => formatPeso(value)} />
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
                        style={{ marginRight: 8, color: "#00C49F" }}
                      />
                      Monthly Collection Trend
                    </span>
                  }
                  style={{
                    height: "100%",
                    borderRadius: 12,
                    boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                  }}
                  styles={{ body: { height: 360 } }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={monthlyTrend}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" angle={-45} textAnchor="end" />
                      <YAxis />
                      <Tooltip formatter={formatCurrency} />
                      <Legend verticalAlign="bottom" />
                      <Line
                        type="monotone"
                        dataKey="Wharf"
                        stroke="#0088FE"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Motorpool"
                        stroke="#00C49F"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Market"
                        stroke="#FFBB28"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="Slaughter"
                        stroke="#FF4C4C"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>
          </div>

          {/* Table per month */}
          {reportData.map((month, i) => (
            <Card
              key={i}
              title={month.month}
              style={{ marginBottom: 32 }}
              extra={
                <Button
                  type="primary"
                  onClick={() =>
                    generateReportPDF(
                      reportData,
                      dateRange[0]?.format("YYYY-MM-DD"),
                      dateRange[1]?.format("YYYY-MM-DD")
                    )
                  }
                  style={BUTTON_STYLE}
                  className="primary-action-btn"
                >
                  Export Full Report PDF
                </Button>
              }
            >
              <Table
                dataSource={month.days
                  .filter(
                    (d) =>
                      (d.wharf?.total_amount || 0) > 0 ||
                      (d.motorpool?.total_amount || 0) > 0 ||
                      (d.market?.total_amount || 0) > 0 ||
                      (d.slaughter?.total_amount || 0) > 0
                  )
                  .map((d, idx) => ({ ...d, key: idx }))}
                pagination={false}
                bordered
                columns={[
                  { title: "Day", dataIndex: "day_label", key: "day_label" },
                  {
                    title: "Wharf",
                    dataIndex: ["wharf", "total_amount"],
                    key: "wharf",
                    render: (val) => (
                      <span style={{ color: "#000" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Motorpool",
                    dataIndex: ["motorpool", "total_amount"],
                    key: "motorpool",
                    render: (val) => (
                      <span style={{ color: "#000" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Market",
                    dataIndex: ["market", "total_amount"],
                    key: "market",
                    render: (val) => (
                      <span style={{ color: "#000" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Slaughter",
                    dataIndex: ["slaughter", "total_amount"],
                    key: "slaughter",
                    render: (val) => (
                      <span style={{ color: "#000" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Total",
                    dataIndex: "total_amount",
                    key: "total_amount",
                    render: (val) => (
                      <span style={{ fontWeight: "bold", color: "#000" }}>
                        {formatCurrency(val)}
                      </span>
                    ),
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <Button
                        type="primary"
                        onClick={() => setSelectedDay(record)}
                        style={BUTTON_STYLE}
                        className="primary-action-btn"
                      >
                        View Details
                      </Button>
                    ),
                  },
                ]}
                summary={(pageData) => {
                  const totalWharf = pageData.reduce(
                    (sum, d) => sum + (d.wharf?.total_amount || 0),
                    0
                  );
                  const totalMotor = pageData.reduce(
                    (sum, d) => sum + (d.motorpool?.total_amount || 0),
                    0
                  );
                  const totalMarket = pageData.reduce(
                    (sum, d) => sum + (d.market?.total_amount || 0),
                    0
                  );
                  const totalSlaughter = pageData.reduce(
                    (sum, d) => sum + (d.slaughter?.total_amount || 0),
                    0
                  );
                  const grandTotal = pageData.reduce(
                    (sum, d) => sum + (d.total_amount || 0),
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell>
                        <b>Grand Total</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>
                        <b>{formatCurrency(totalWharf)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>
                        <b>{formatCurrency(totalMotor)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>
                        <b>{formatCurrency(totalMarket)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>
                        <b>{formatCurrency(totalSlaughter)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell>
                        <b>{formatCurrency(grandTotal)}</b>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell />
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>
          ))}

          <Modal
            open={!!selectedDay}
            title={
              <span>
                <FaCalendarAlt /> {selectedDay?.day_label}
              </span>
            }
            onCancel={() => setSelectedDay(null)}
            footer={[
              <Button
                key="pdf"
                type="primary"
                onClick={() => generateDayModalPDF(selectedDay)}
                style={BUTTON_STYLE}
                className="primary-action-btn"
              >
                Export Day PDF
              </Button>,
              <Button
                key="close"
                onClick={() => setSelectedDay(null)}
                style={CLOSE_BUTTON_STYLE}
              >
                Close
              </Button>,
            ]}
            width={1000}
          >
            {selectedDay && (
              <Table
                dataSource={groupDayModalByCollector(selectedDay)}
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
                    render: formatCurrency,
                  },
                  {
                    title: "Actions",
                    key: "actions",
                    render: (_, record) => (
                      <Button
                        type="link"
                        onClick={() => {
                          const deptKey =
                            record.department.toLowerCase();
                          const deptDetails =
                            selectedDay[deptKey]?.details || [];

                          const filtered = deptDetails.filter(
                            (d) =>
                              d.collector === record.collector &&
                              d.received_by === record.received_by
                          );

                          setSelectedDept({
                            dept: record.department,
                            collector: record.collector,
                            received_by: record.received_by,
                            details: filtered,
                          });
                        }}
                        style={BUTTON_STYLE}
                        className="primary-action-btn"
                      >
                        View Dept Details
                      </Button>
                    ),
                  },
                ]}
                pagination={{ pageSize: 5 }}
                rowKey={(record) =>
                  `${record.department}-${record.collector}-${record.received_by}`
                }
              />
            )}
          </Modal>

          {/* Department Modal */}
          <Modal
            open={!!selectedDept}
            title={selectedDept?.dept + " Details"}
            onCancel={() => setSelectedDept(null)}
            footer={[
              <Button
                key="pdf"
                type="primary"
                onClick={() =>
                  generateDeptModalPDF(
                    selectedDept,
                    selectedDay?.day_label
                  )
                }
                style={BUTTON_STYLE}
                className="primary-action-btn"
              >
                Export Dept PDF
              </Button>,
              <Button
                key="close"
                onClick={() => setSelectedDept(null)}
                style={CLOSE_BUTTON_STYLE}
              >
                Close
              </Button>,
            ]}
            width={selectedDept?.dept === "Slaughter" ? 1600 : 1200}
            style={{ top: 20 }}
          >
            {selectedDept && (
              <Table
                dataSource={groupDeptDetails(selectedDept).map(
                  (d, idx) => ({
                    ...d,
                    formattedDate: d.payment_date
                      ? new Date(d.payment_date).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : "",
                    formattedTime: d.payment_date
                      ? new Date(d.payment_date).toLocaleTimeString(
                          "en-PH",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )
                      : "",
                    key: idx,
                  })
                )}
                columns={
                  selectedDept.dept === "Slaughter"
                    ? [
                        {
                          title: "Animal Type",
                          dataIndex: "animal_type",
                        },
                        {
                          title: "Customer Name",
                          dataIndex: "customer_name",
                        },
                        {
                          title: "Inspector",
                          dataIndex: "inspector",
                        },
                        {
                          title: "Collected By",
                          dataIndex: "collector",
                        },
                        {
                          title: "Received By",
                          dataIndex: "received_by",
                        },
                        {
                          title: "Quantity",
                          dataIndex: ["breakdown", "quantity"],
                        },
                        {
                          title: "Total Kilos",
                          dataIndex: ["breakdown", "total_kilos"],
                          key: "total_kilos",
                          render: (val) => val ?? "—",
                        },
                        {
                          title: "Per Kilo",
                          dataIndex: ["breakdown", "per_kilos"],
                          key: "per_kilos",
                          render: (val) =>
                            Array.isArray(val) ? val.join(", ") : "—",
                        },
                        {
                          title: "Total Amount",
                          render: (_, r) =>
                            formatCurrency(
                              Number(r.breakdown?.slaughter_fee || 0) +
                                Number(r.breakdown?.ante_mortem || 0) +
                                Number(r.breakdown?.post_mortem || 0) +
                                Number(r.breakdown?.coral_fee || 0) +
                                Number(r.breakdown?.permit_to_slh || 0)
                            ),
                        },
                        {
                          title: "Payment Date",
                          dataIndex: "formattedDate",
                        },
                        { title: "Time", dataIndex: "formattedTime" },
                        {
                          title: "Actions",
                          key: "fees_breakdown",
                          render: (_, record) => (
                            <Button
                              style={BUTTON_STYLE}
                              type="primary"
                              onClick={() => {
                                setActiveSlaughterFees(
                                  record.breakdown || {}
                                );
                                setSlaughterFeesModal(true);
                              }}
                              className="primary-action-btn"
                            >
                              View Fees
                            </Button>
                          ),
                        },
                      ]
                    : selectedDept.dept === "Market"
                    ? [
                        {
                          title: "Vendor Name",
                          dataIndex: "vendor_name",
                        },
                        {
                          title: "Stalls",
                          dataIndex: "stalls",
                          render: (stalls) =>
                            stalls?.join(", ") || "—",
                        },
                        {
                          title: "Payment Type",
                          dataIndex: "payment_type",
                        },
                        {
                          title: "Collected By",
                          dataIndex: "collector",
                        },
                        {
                          title: "Received By",
                          dataIndex: "received_by",
                        },
                        {
                          title: "Amount",
                          dataIndex: "amount",
                          render: formatCurrency,
                        },
                        {
                          title: "Payment Date",
                          dataIndex: "formattedDate",
                        },
                        { title: "Time", dataIndex: "formattedTime" },
                      ]
                    : [
                        {
                          title: "Collected By",
                          dataIndex: "collector",
                        },
                        {
                          title: "Received By",
                          dataIndex: "received_by",
                        },
                        {
                          title: "Amount",
                          dataIndex: "amount",
                          render: formatCurrency,
                        },
                        {
                          title: "Payment Date",
                          dataIndex: "formattedDate",
                        },
                        { title: "Time", dataIndex: "formattedTime" },
                      ]
                }
                pagination={{ pageSize: 5 }}
                rowKey={(r, i) => i}
              />
            )}
          </Modal>

          <Modal
            open={slaughterFeesModal}
            title="Slaughter Fees Breakdown"
            onCancel={() => {
              setSlaughterFeesModal(false);
              setActiveSlaughterFees(null);
            }}
            footer={[
              <Button
                key="close"
                danger
                onClick={() => {
                  setSlaughterFeesModal(false);
                  setActiveSlaughterFees(null);
                }}
              >
                Close
              </Button>,
            ]}
          >
            {activeSlaughterFees && (
              <div style={{ fontSize: "16px", lineHeight: "28px" }}>
                <p>
                  <b>Slaughter Fee:</b>{" "}
                  {formatCurrency(activeSlaughterFees.slaughter_fee)}
                </p>
                <p>
                  <b>Ante Mortem Fee:</b>{" "}
                  {formatCurrency(activeSlaughterFees.ante_mortem)}
                </p>
                <p>
                  <b>Post Mortem Fee:</b>{" "}
                  {formatCurrency(activeSlaughterFees.post_mortem)}
                </p>
                <p>
                  <b>Coral Fee:</b>{" "}
                  {formatCurrency(activeSlaughterFees.coral_fee)}
                </p>
                <p>
                  <b>Permit to SLH Fee:</b>{" "}
                  {formatCurrency(activeSlaughterFees.permit_to_slh)}
                </p>

                <hr />

                <p>
                  <b>Quantity:</b> {activeSlaughterFees.quantity}
                </p>
                <p>
                  <b>Total Kilos:</b> {activeSlaughterFees.total_kilos}
                </p>
                <p>
                  <b>Per Kilo:</b>{" "}
                  {Array.isArray(activeSlaughterFees.per_kilos)
                    ? activeSlaughterFees.per_kilos.join(", ")
                    : "—"}
                </p>
              </div>
            )}
          </Modal>
        </>
      )}
    </div>
  );
};

export default MainCollectorReports;
