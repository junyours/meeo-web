import React, { useEffect, useState, useRef } from "react";
import api from "../Api";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  Tooltip,
  Progress,
  message,
  Row,
  Col,
  Tag,
  DatePicker,
  Divider,
} from "antd";
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import LoadingOverlay from "./Loading";
import dayjs from "dayjs";
import { generateTargetReportPDF } from "./TargetPdf";

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DEPARTMENT_COLORS = ["#4CAF50", "#FF9800", "#2196F3", "#F44336"];

const primaryColor = "#1B4F72";
const primaryButtonStyle = {
  background: `linear-gradient(135deg, ${primaryColor}, #2471A3)`,
  borderColor: "transparent",
  color: "#fff",
  fontWeight: 600,
  borderRadius: 999,
  boxShadow: "0 4px 10px rgba(0,0,0,0.12)",
};

const ghostButtonStyle = {
  borderRadius: 999,
  fontWeight: 500,
};

const TargetsReports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [targetValues, setTargetValues] = useState({});
  const [yearRange, setYearRange] = useState([]);
  const reportRefs = useRef({});
  const chartRefs = useRef({});
  const progressRefs = useRef({});
  const currentYear = dayjs().year();

  const fetchReports = async (startYear, endYear) => {
    setLoading(true);
    try {
      const res = await api.get(
        `/targets?start_year=${startYear}&end_year=${endYear}`
      );
      setReports(res.data.data || {});
    } catch (error) {
      console.error(error);
      message.error("Failed to fetch reports");
    }
    setLoading(false);
  };

  useEffect(() => {
    setYearRange([currentYear, currentYear]);
    fetchReports(currentYear, currentYear);
  }, []);

  const handleYearChange = (dates) => {
    if (dates && dates.length === 2) {
      const startYear = dates[0].year();
      const endYear = dates[1].year();
      setYearRange([startYear, endYear]);
      fetchReports(startYear, endYear);
    }
  };

  const handleSaveRow = async (row, year) => {
    try {
      const payload = {
        module: row.module,
        annual_target: Number(targetValues[row.module]),
        year: year,
      };

      if (row.id) await api.put(`/targets/${row.id}`, payload);
      else await api.post("/targets", payload);

      message.success("Target updated successfully!");
      setEditingRow(null);
      fetchReports(yearRange[0], yearRange[1]);
    } catch (err) {
      console.error(err);
      message.error("Error saving target");
    }
  };

  const getProgressColor = (percent) => {
    if (percent < 50) return "#F44336";
    if (percent < 90) return "#FF9800";
    return "#4CAF50";
  };

  const handlePrint = async (year, reportData) => {
    const pieChartRef = chartRefs.current[year];
    const overallChartRef = progressRefs.current[year];
    await generateTargetReportPDF(year, reportData, pieChartRef, overallChartRef);
  };

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: "linear-gradient(180deg, #F4F6F9 0%, #FFFFFF 60%)",
      }}
    >
      {loading && <LoadingOverlay message="Loading target reports..." />}

      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {/* Page Header */}
        <Card
          bordered={false}
          style={{
            marginBottom: 24,
            borderRadius: 18,
            boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
            background:
              "radial-gradient(circle at top left, #D6EAF8 0, transparent 60%), #FFFFFF",
          }}
        >
          <Row justify="space-between" align="middle" gutter={[16, 16]}>
            <Col>
              <div>
                <Title
                  level={3}
                  style={{
                    margin: 0,
                    color: "#102A43",
                    letterSpacing: 0.4,
                  }}
                >
                  Targets & Collection Overview
                </Title>
                <Text type="secondary">
                  Monitor economic enterprise targets and collection performance
                  per year.
                </Text>
              </div>
            </Col>
            <Col>
              <Space size="middle" align="center">
                <div>
                  <Text strong style={{ display: "block", marginBottom: 4 }}>
                    Year Range
                  </Text>
                  <RangePicker
                    picker="year"
                    onChange={handleYearChange}
                    style={{
                      minWidth: 260,
                      borderRadius: 999,
                      padding: "4px 10px",
                    }}
                    value={
                      yearRange.length === 2
                        ? [
                            dayjs(`${yearRange[0]}`, "YYYY"),
                            dayjs(`${yearRange[1]}`, "YYYY"),
                          ]
                        : [
                            dayjs(`${currentYear}`, "YYYY"),
                            dayjs(`${currentYear}`, "YYYY"),
                          ]
                    }
                  />
                </div>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Per-year Reports */}
        {yearRange.length === 2 &&
          Array.from(
            { length: yearRange[1] - yearRange[0] + 1 },
            (_, i) => yearRange[0] + i
          ).map((year) => {
            const reportData = reports[year] || [];
            const hasCollection = reportData.some(
              (r) => Number(r.total_collection) > 0
            );

            if (!hasCollection) {
              return (
                <Card
                  key={year}
                  style={{
                    marginBottom: 24,
                    borderRadius: 16,
                    border: "1px dashed #D6DBDF",
                    background: "#FAFBFD",
                  }}
                  bordered={false}
                >
                  <Row justify="space-between" align="middle">
                    <Col>
                      <Title level={4} style={{ marginBottom: 4 }}>
                        Target Report for {year}
                      </Title>
                      <Text type="secondary">
                        No collection has been made for this year.
                      </Text>
                    </Col>
                  </Row>
                </Card>
              );
            }

            const totalCollection = reportData.reduce(
              (sum, r) => sum + Number(r.total_collection || 0),
              0
            );
            const totalTarget = reportData.reduce(
              (sum, r) => sum + Number(r.annual_target ?? 0),
              0
            );
            const overallProgress =
              totalTarget > 0
                ? ((totalCollection / totalTarget) * 100).toFixed(2)
                : 0;

            const pieData = reportData.map((r) => {
              const target = r.annual_target ?? 0;
              const value =
                target > 0 ? Math.min((r.total_collection / target) * 100, 100) : 0;
              return {
                name: r.module,
                value,
                collected: r.total_collection ?? 0,
                target,
              };
            });

            const columns = [
              {
                title: "Economic Enterprise",
                dataIndex: "module",
                key: "module",
                fixed: "left",
                render: (text, _, index) => (
                  <Tag
                    color={DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length]}
                    style={{
                      borderRadius: 999,
                      fontWeight: 600,
                      color: "white",
                      padding: "2px 12px",
                      textTransform: "capitalize",
                      fontSize: 13,
                    }}
                  >
                    {text}
                  </Tag>
                ),
              },
              {
                title: `Annual Target (${year})`,
                dataIndex: "annual_target",
                key: "annual_target",
                render: (text, row) => {
                  const isEditable = year >= currentYear;

                  if (editingRow === row.module) {
                    return (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          minWidth: 260,
                          gap: 8,
                        }}
                      >
                        <input
                          type="number"
                          value={targetValues[row.module]}
                          onChange={(e) =>
                            setTargetValues({
                              ...targetValues,
                              [row.module]: e.target.value,
                            })
                          }
                          style={{
                            width: "100%",
                            padding: "6px 10px",
                            borderRadius: 999,
                            border: "1px solid #d9d9d9",
                            fontSize: 14,
                            outline: "none",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = primaryColor;
                            e.target.style.boxShadow =
                              "0 0 0 2px rgba(25, 118, 210, 0.16)";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#d9d9d9";
                            e.target.style.boxShadow = "none";
                          }}
                        />

                        <Tooltip title="Save">
                          <Button
                            shape="circle"
                            icon={<SaveOutlined />}
                            style={{ ...primaryButtonStyle, paddingInline: 10 }}
                            onClick={() => handleSaveRow(row, year)}
                          />
                        </Tooltip>
                        <Tooltip title="Cancel">
                          <Button
                            shape="circle"
                            icon={<CloseOutlined />}
                            type="text"
                            danger
                            onClick={() => setEditingRow(null)}
                          />
                        </Tooltip>
                      </div>
                    );
                  }

                  return (
                    <Space>
                      <Text
                        strong
                        style={{
                          whiteSpace: "nowrap",
                          textAlign: "right",
                          display: "block",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₱
                        {Number(text ?? 0).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </Text>

                      {isEditable && (
                        <Tooltip title="Edit Target">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            style={{
                              ...ghostButtonStyle,
                              color: primaryColor,
                            }}
                            onClick={() => {
                              setTargetValues({
                                [row.module]: row.annual_target ?? 0,
                              });
                              setEditingRow(row.module);
                            }}
                          />
                        </Tooltip>
                      )}
                    </Space>
                  );
                },
              },
              ...months.map((m, i) => ({
                title: m,
                key: m,
                align: "right",
                render: (_, row) => (
                  <Text
                    style={{
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    ₱
                    {Number(row.monthly?.[i + 1] || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </Text>
                ),
              })),
              {
                title: "Total Collection",
                key: "total_collection",
                align: "right",
                render: (_, row) => (
                  <Text strong style={{ fontVariantNumeric: "tabular-nums" }}>
                    ₱
                    {Number(row.total_collection || 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </Text>
                ),
              },
              {
                title: "Progress",
                key: "progress",
                width: 200,
                render: (_, row) => {
                  const percent = Number(row.progress?.toFixed(2)) || 0;
                  return (
                    <div
                      style={{
                        position: "relative",
                        width: "100%",
                        minWidth: 140,
                      }}
                    >
                      <Progress
                        percent={percent}
                        strokeColor={getProgressColor(percent)}
                        trailColor="#f0f2f5"
                        showInfo={false}
                        style={{ height: 12, borderRadius: 999 }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          top: 0,
                          left: "50%",
                          transform: "translateX(-50%)",
                          color: "#102A43",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {percent.toFixed(2)}%
                      </span>
                    </div>
                  );
                },
              },
            ];

            // summary monthly totals
            const monthlyTotals = months.map((_, idx) => {
              const monthIndex = idx + 1; // monthly is 1-based
              return reportData.reduce((sum, row) => {
                const value = Number(row.monthly?.[monthIndex] || 0);
                return sum + value;
              }, 0);
            });

            return (
              <div
                key={year}
                ref={(el) => (reportRefs.current[year] = el)}
                style={{ marginBottom: 32 }}
              >
                <Card
                  bordered={false}
                  style={{
                    borderRadius: 18,
                    boxShadow: "0 8px 20px rgba(15, 23, 42, 0.06)",
                  }}
                  title={
                    <Row justify="space-between" align="middle">
                      <Col>
                        <div>
                          <Title
                            level={4}
                            style={{
                              margin: 0,
                              color: "#102A43",
                            }}
                          >
                            Target Report for {year}
                          </Title>
                          <Text type="secondary">
                            Performance breakdown and yearly summary.
                          </Text>
                        </div>
                      </Col>
                      <Col>
                        <Button
                          icon={<PrinterOutlined />}
                          style={primaryButtonStyle}
                          onClick={() => handlePrint(year, reportData)}
                        >
                          Export PDF
                        </Button>
                      </Col>
                    </Row>
                  }
                >
                  <Row gutter={[18, 18]}>
                    <Col xs={24} md={12}>
                      <Card
                        size="small"
                        bordered={false}
                        title={
                          <span style={{ fontWeight: 600, color: "#34495E" }}>
                            Progress per Department
                          </span>
                        }
                        style={{
                          height: "100%",
                          borderRadius: 16,
                          background: "#FBFCFE",
                        }}
                      >
                        <div ref={(el) => (chartRefs.current[year] = el)}>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={110}
                                label={(entry) =>
                                  `${entry.name}: ${entry.value.toFixed(2)}%`
                                }
                              >
                                {pieData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={
                                      DEPARTMENT_COLORS[
                                        index % DEPARTMENT_COLORS.length
                                      ]
                                    }
                                  />
                                ))}
                              </Pie>
                              <ReTooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </Card>
                    </Col>

                    <Col xs={24} md={12}>
  <Card
    size="small"
    bordered={false}
    title={
      <span style={{ fontWeight: 600, color: "#34495E" }}>
        Overall Progress
      </span>
    }
    style={{
      height: "100%",
      borderRadius: 16,
      background:
        "radial-gradient(circle at top right, #EAF2F8 0, transparent 55%), #FBFCFE",
      textAlign: "center",
      paddingBottom: 8,
    }}
  >
    {/* Circle Progress */}
    <div
      ref={(el) => (progressRefs.current[year] = el)}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 16,
        marginTop: 8,
      }}
    >
      <Progress
        type="circle"
        percent={Number(overallProgress)}
        strokeColor={getProgressColor(Number(overallProgress))}
        trailColor="#ECF0F1"
        size={230}
        format={(percent) => (
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                color: "#102A43",
                lineHeight: 1.1,
              }}
            >
              {percent?.toFixed(2)}%
            </div>
            <div
              style={{
                fontSize: 12,
                color: "#7F8C8D",
                marginTop: 4,
                textTransform: "uppercase",
                letterSpacing: 1.1,
              }}
            >
              Overall Achievement
            </div>
          </div>
        )}
      />
    </div>

    {/* KPI Row */}
    <div
      style={{
        marginTop: 10,
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#FFFFFF",
        boxShadow: "0 6px 16px rgba(15, 23, 42, 0.06)",
      }}
    >
      <Row gutter={16}>
        <Col span={12}>
          <div
            style={{
              borderRight: "1px solid #ECF0F1",
              paddingRight: 10,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#7F8C8D",
              }}
            >
              Total Target
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text
                style={{
                  display: "block",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1B4F72",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ₱
                {totalTarget.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>
            </div>
          </div>
        </Col>

        <Col span={12}>
          <div style={{ paddingLeft: 10 }}>
            <Text
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "#7F8C8D",
              }}
            >
              Total Collection
            </Text>
            <div style={{ marginTop: 4 }}>
              <Text
                style={{
                  display: "block",
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#117864",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                ₱
                {totalCollection.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </Text>

              {/* Optional small indicator under collection */}
              <Text
                style={{
                  fontSize: 11,
                  color: "#95A5A6",
                  marginTop: 2,
                  display: "inline-block",
                }}
              >
                {totalTarget > 0
                  ? `${overallProgress}% of total target`
                  : "No target set"}
              </Text>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  </Card>
</Col>

                  </Row>

                  <Card
                    bordered={false}
                    style={{
                      marginTop: 24,
                      borderRadius: 16,
                      background: "#FBFCFE",
                    }}
                    title={
                      <span style={{ fontWeight: 600, color: "#34495E" }}>
                        Detailed Targets Table for {year}
                      </span>
                    }
                  >
                    <Table
                      columns={columns}
                      dataSource={reportData}
                      rowKey="module"
                      pagination={false}
                      scroll={{ x: "max-content" }}
                      size="middle"
                      summary={() => (
                        <Table.Summary.Row
                          style={{
                            background: "#F2F4F7",
                            fontWeight: 600,
                            fontSize: 14,
                          }}
                        >
                          <Table.Summary.Cell index={0}>
                            <Text strong style={{ color: "#154360" }}>
                              TOTAL
                            </Text>
                          </Table.Summary.Cell>

                          {/* Annual Target Total */}
                          <Table.Summary.Cell index={1} align="right">
                            ₱
                            {totalTarget.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </Table.Summary.Cell>

                          {/* Monthly totals */}
                          {months.map((_, idx) => (
                            <Table.Summary.Cell
                              key={idx + 2}
                              index={idx + 2}
                              align="right"
                            >
                              ₱
                              {monthlyTotals[idx].toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </Table.Summary.Cell>
                          ))}

                          {/* Total Collection */}
                          <Table.Summary.Cell
                            index={months.length + 2}
                            align="right"
                          >
                            ₱
                            {totalCollection.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </Table.Summary.Cell>

                          {/* Overall Progress */}
                          <Table.Summary.Cell index={months.length + 3}>
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                minWidth: 140,
                              }}
                            >
                              <Progress
                                percent={Number(overallProgress)}
                                strokeColor={getProgressColor(
                                  Number(overallProgress)
                                )}
                                trailColor="#e5e7eb"
                                showInfo={false}
                                style={{ height: 12, borderRadius: 999 }}
                              />
                              <span
                                style={{
                                  position: "absolute",
                                  top: 0,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  color: "#102A43",
                                  fontWeight: "bold",
                                  fontSize: 12,
                                  lineHeight: "20px",
                                }}
                              >
                                {overallProgress}%
                              </span>
                            </div>
                          </Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                    />
                  </Card>
                </Card>
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default TargetsReports;
