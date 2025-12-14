import React, { useState, useEffect, useCallback, useMemo } from "react";
import api from "../Api";
import {
  Table,
  Select,
  Button,
  Modal,
  Spin,
  Typography,
  Space,
  DatePicker,
  Card,
  Descriptions,
  Row,
  Col,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Centralized button styles
const primaryActionStyle = {
  backgroundColor: "#1f3c88",
  borderColor: "#1f3c88",
};

const secondaryActionStyle = {
  backgroundColor: "#1abc9c",
  borderColor: "#1abc9c",
  color: "#fff",
};

const closeButtonStyle = {
  backgroundColor: "#6c757d",
  borderColor: "#6c757d",
  color: "#fff",
};

const filterButtonStyle = {
  backgroundColor: "#1f3c88",
  borderColor: "#1f3c88",
  color: "#fff",
};

// Shared pagination renderer (same style idea as StallHistory)
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

const CollectorReports = () => {
  const [loading, setLoading] = useState(false);
  const [collectors, setCollectors] = useState([]);

  // filter by collector
  const [selectedCollectorFilter, setSelectedCollectorFilter] =
    useState("All");

  const [showModal, setShowModal] = useState(false);
  const [selectedCollector, setSelectedCollector] = useState(null);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [selectedFees, setSelectedFees] = useState(null);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedSourceType, setSelectedSourceType] = useState(null);
  const [dateRange, setDateRange] = useState([]);

  const [pageTotal, setPageTotal] = useState(0);
  const [sectionPageTotals, setSectionPageTotals] = useState({});
  const [groupPageTotal, setGroupPageTotal] = useState(0);

  // pagination state
  const [collectorPage, setCollectorPage] = useState(1);
  const [sectionPages, setSectionPages] = useState({});
  const [groupPage, setGroupPage] = useState(1);

  // Color generator for charts
  const collectorColors = {};
  const getColor = (name) => {
    if (!collectorColors[name]) {
      const hash = Array.from(name).reduce(
        (acc, char) => acc + char.charCodeAt(0),
        0
      );
      collectorColors[name] = `hsl(${hash % 360}, 70%, 50%)`;
    }
    return collectorColors[name];
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "-";

  const formatCurrency = (num) =>
    `₱${Number(num || 0).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  // 🔹 simplified: no year/month in query anymore
  const fetchCollectors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/collector-totals`);
      const collectorsData = (res.data.collectors || []).map((c, idx) => ({
        ...c,
        key: c.id || idx,
      }));
      setCollectors(collectorsData);
    } catch (err) {
      console.error(err);
      setCollectors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollectors();
  }, [fetchCollectors]);

  // Filtered collectors for main table + chart based on picker
  const filteredCollectors = useMemo(() => {
    if (selectedCollectorFilter === "All") return collectors;
    return collectors.filter(
      (c) => c.collector_name === selectedCollectorFilter
    );
  }, [collectors, selectedCollectorFilter]);

  // Recompute first page total when list changes
  useEffect(() => {
    if (filteredCollectors.length > 0) {
      const firstPageItems = filteredCollectors.slice(0, 3);
      const total = firstPageItems.reduce(
        (sum, c) => sum + Number(c.total_amount || 0),
        0
      );
      setPageTotal(total);
      setCollectorPage(1);
    } else {
      setPageTotal(0);
      setCollectorPage(1);
    }
  }, [filteredCollectors]);

  const openModal = (collector) => {
    setSelectedCollector(collector);
    setSectionPages({});
    setSectionPageTotals({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCollector(null);
    setShowDetailsModal(false);
    setSelectedGroup(null);
    setSelectedSourceType(null);
    setDateRange([]);
    setGroupPageTotal(0);
    setSectionPageTotals({});
    setShowFeesModal(false);
    setSelectedFees(null);
    setGroupPage(1);
  };

  const openGroupDetails = (sourceType, group) => {
    setSelectedSourceType(sourceType);
    setSelectedGroup(group);
    setShowDetailsModal(true);
    setGroupPage(1);

    if (group.records && group.records.length > 0) {
      const firstPage = group.records.slice(0, 5);
      setGroupPageTotal(
        firstPage.reduce(
          (sum, d) => sum + Number(d.total_amount || d.amount || 0),
          0
        )
      );
    } else {
      setGroupPageTotal(0);
    }
  };

  const openSlaughterFeesModal = (record) => {
    setSelectedFees(record);
    setShowFeesModal(true);
  };

  const chartData = filteredCollectors.map((c) => ({
    name: c.collector_name,
    total: Number(c.total_amount || 0),
  }));

  const collectorColumns = [
    {
      title: "Collector Name",
      dataIndex: "collector_name",
      key: "collector_name",
    },
    { title: "Assigned Area", dataIndex: "assigned", key: "assigned" },
    {
      title: "Total Collections",
      dataIndex: "total_collections",
      key: "total_collections",
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      key: "total_amount",
      render: (value) => formatCurrency(value),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          style={primaryActionStyle}
          onClick={() => openModal(record)}
        >
          View Details
        </Button>
      ),
    },
  ];

  const getSectionTable = (source, items) => {
    if (!items || items.length === 0) return null;

    let columns = [];
    if (source === "market") {
      columns = [
        { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
        {
          title: "Total Amount",
          dataIndex: "total_amount",
          key: "total_amount",
          render: formatCurrency,
        },
        {
          title: "Action",
          key: "action",
          render: (_, row) => (
            <Button
              type="primary"
              size="small"
              style={primaryActionStyle}
              
              onClick={() => openGroupDetails("market", row) }
            >
              View Details
            </Button>
          ),
        },
      ];
    } else if (source === "wharf" || source === "motor_pool") {
      columns = [
        { title: "Received By", dataIndex: "received_by", key: "received_by" },
        {
          title: "Total Amount",
          dataIndex: "total_amount",
          key: "total_amount",
          render: formatCurrency,
        },
        {
          title: "Action",
          key: "action",
          render: (_, row) => (
            <Button
              type="primary"
              size="small"
              style={primaryActionStyle}
              onClick={() => openGroupDetails(source, row)}
            >
              View Details
            </Button>
          ),
        },
      ];
    } else if (source === "slaughter") {
      columns = [
        {
          title: "Customer",
          dataIndex: "customer_name",
          key: "customer_name",
        },
        {
          title: "Total Amount",
          dataIndex: "total_amount",
          key: "total_amount",
          render: formatCurrency,
        },
        {
          title: "Action",
          key: "action",
          render: (_, row) => (
            <Button
              type="primary"
              size="small"
              style={primaryActionStyle}
              onClick={() => openGroupDetails("slaughter", row)}
            >
              View Details
            </Button>
          ),
        },
      ];
    }

    const pageSize = 3;
    const firstPageTotal = items
      .slice(0, pageSize)
      .reduce((sum, i) => sum + Number(i.total_amount || 0), 0);

    const currentSectionPage = sectionPages[source] || 1;

    const sectionTitle =
      source === "market"
        ? "Market Collections"
        : source === "wharf"
        ? "Wharf Collections"
        : source === "motor_pool"
        ? "Motor Pool Collections"
        : "Slaughter House Collections";

    return (
      <Card
        key={source}
        style={{
          marginBottom: 16,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          boxShadow: "0 8px 18px rgba(15, 23, 42, 0.06)",
        }}
        bodyStyle={{ padding: 20 }}
      >
        <div
          style={{
            marginBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
            {sectionTitle}
          </Title>
        </div>
        <Table
          dataSource={items.map((i, idx) => ({ ...i, key: i.id || idx }))}
          columns={columns}
          rowKey="key"
          pagination={{
            pageSize,
            current: currentSectionPage,
            onChange: (page) => {
              setSectionPages((prev) => ({ ...prev, [source]: page }));
              const start = (page - 1) * pageSize;
              const pageItems = items.slice(start, start + pageSize);
              setSectionPageTotals((prev) => ({
                ...prev,
                [source]: pageItems.reduce(
                  (sum, i) => sum + Number(i.total_amount || 0),
                  0
                ),
              }));
            },
            itemRender: (p, type, originalElement) =>
              paginationItemRender(p, type, originalElement, currentSectionPage),
          }}
          footer={() => (
            <Text strong>
              Grand Total (Page):{" "}
              {formatCurrency(sectionPageTotals[source] ?? firstPageTotal)}
            </Text>
          )}
        />
      </Card>
    );
  };

  const getGroupRecordsTable = () => {
    if (!selectedGroup) return null;

    let columns = [];
    if (selectedSourceType === "market") {
      columns = [
        { title: "Stall #", dataIndex: "stall_number", key: "stall_number" },
        { title: "Section", dataIndex: "section_name", key: "section_name" },
        { title: "Type", dataIndex: "payment_type", key: "payment_type" },
        {
          title: "Amount",
          dataIndex: "amount",
          key: "amount",
          render: formatCurrency,
        },
        { title: "Missed", dataIndex: "missed_days", key: "missed_days" },
        { title: "Advance", dataIndex: "advance_days", key: "advance_days" },
        { title: "Received By", dataIndex: "received_by", key: "received_by" },
        { title: "Status", dataIndex: "status", key: "status" },
        {
          title: "Collected Date",
          dataIndex: "payment_date",
          key: "payment_date",
          render: formatDate,
        },
        {
          title: "Time Remitted",
          dataIndex: "time_remitted",
          key: "time_remitted",
        },
      ];
    } else if (
      selectedSourceType === "wharf" ||
      selectedSourceType === "motor_pool"
    ) {
      columns = [
        { title: "Received By", dataIndex: "received_by", key: "received_by" },
        {
          title: "Amount",
          dataIndex: "amount",
          key: "amount",
          render: formatCurrency,
        },
        {
          title: "Collected Date",
          dataIndex: "payment_date",
          key: "payment_date",
          render: formatDate,
        },
        {
          title: "Time Remitted",
          dataIndex: "time_remitted",
          key: "time_remitted",
        },
        { title: "Status", dataIndex: "status", key: "status" },
      ];
    } else if (selectedSourceType === "slaughter") {
      columns = [
        {
          title: "Customer",
          dataIndex: "customer_name",
          key: "customer_name",
        },
        { title: "Animal", dataIndex: "animals_name", key: "animal_name" },
        {
          title: "Inspector",
          dataIndex: "inspector_name",
          key: "inspector_name",
        },
        { title: "Qty", dataIndex: "quantity", key: "quantity" },
        {
          title: "Kilos",
          dataIndex: "total_kilos",
          key: "total_kilos",
          render: (v) => Number(v || 0).toLocaleString(),
        },
        {
          title: "Per Kilo",
          dataIndex: "per_kilos",
          key: "per_kilos",
          render: (v) =>
            Array.isArray(v)
              ? v.map((n) => Number(n).toLocaleString()).join(", ")
              : Number(v || 0).toLocaleString(),
        },
        { title: "Received By", dataIndex: "received_by", key: "received_by" },
        {
          title: "Amount",
          dataIndex: "total_amount",
          key: "total_amount",
          render: formatCurrency,
        },
        { title: "Status", dataIndex: "status", key: "status" },
        {
          title: "Collected Date",
          dataIndex: "payment_date",
          key: "payment_date",
          render: formatDate,
        },
        {
          title: "Time Remitted",
          dataIndex: "time_remitted",
          key: "time_remitted",
        },
        {
          title: "Action",
          key: "action",
          render: (_, row) => (
            <Button
              type="primary"
              size="small"
              style={secondaryActionStyle}
              onClick={() => openSlaughterFeesModal(row)}
            >
              View Fees
            </Button>
          ),
        },
      ];
    }

    // sort by latest payment date
    const sortedRecords = [...(selectedGroup.records || [])].sort((a, b) => {
      const dateA = a.payment_date ? new Date(a.payment_date).getTime() : 0;
      const dateB = b.payment_date ? new Date(b.payment_date).getTime() : 0;
      return dateB - dateA;
    });

    const data =
      (dateRange.length === 2
        ? sortedRecords.filter((r) => {
            const d = new Date(r.payment_date);
            return d >= dateRange[0] && d <= dateRange[1];
          })
        : sortedRecords) || [];

    const pageSize = 5;
    const firstPageTotal = data
      .slice(0, pageSize)
      .reduce(
        (sum, d) => sum + Number(d.total_amount || d.amount || 0),
        0
      );

    return (
      <Table
        dataSource={data.map((d, idx) => ({ ...d, key: d.id || idx }))}
        columns={columns}
        rowKey="key"
        pagination={{
          pageSize,
          current: groupPage,
          onChange: (page) => {
            setGroupPage(page);
            const start = (page - 1) * pageSize;
            const pageItems = data.slice(start, start + pageSize);
            setGroupPageTotal(
              pageItems.reduce(
                (sum, d) => sum + Number(d.total_amount || d.amount || 0),
                0
              )
            );
          },
          itemRender: (p, type, originalElement) =>
            paginationItemRender(p, type, originalElement, groupPage),
        }}
        footer={() => (
          <Text strong>
            Grand Total (Page):{" "}
            {formatCurrency(groupPageTotal || firstPageTotal)}
          </Text>
        )}
      />
    );
  };

  // Unique collector names for picker
  const collectorOptions = useMemo(
    () => Array.from(new Set(collectors.map((c) => c.collector_name))),
    [collectors]
  );

  return (
    <Spin spinning={loading} tip="Loading..." size="large">
      <div
        style={{
          padding: 24,
          background: "linear-gradient(135deg, #eef2f7 0%, #f9fafb 100%)",
          minHeight: "100vh",
        }}
      >
        {/* Header (no month/year now) */}
        <Card
          style={{
            marginBottom: 24,
            borderRadius: 14,
            padding: 0,
            backgroundColor: "#ffffff",
            boxShadow: "0 8px 22px rgba(15, 23, 42, 0.08)",
            border: "1px solid #e5e7eb",
          }}
          bodyStyle={{ padding: 0 }}
        >
          <Row
            gutter={[24, 16]}
            align="middle"
            style={{
              padding: "18px 22px",
            }}
          >
            <Col
              xs={24}
              md={16}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "center",
              }}
            >
              {/* Icon badge */}
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  backgroundColor: "#eff6ff",
                  border: "1px solid #dbeafe",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 24,
                    lineHeight: 1,
                  }}
                >
                  📊
                </span>
              </div>

              {/* Text block */}
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <Title
                  level={3}
                  style={{
                    color: "#111827",
                    marginBottom: 0,
                    fontWeight: 700,
                    letterSpacing: 0.2,
                  }}
                >
                  Collector Performance Dashboard
                </Title>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#4b5563",
                  }}
                >
                  Municipal Economic Enterprise Office •{" "}
                  <span style={{ color: "#1f3c88", fontWeight: 500 }}>
                    Collections Overview
                  </span>
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    maxWidth: 640,
                  }}
                >
                  Monitor collection performance across{" "}
                  <b style={{ color: "#374151" }}>
                    Market, Wharf, Motor Pool, and Slaughter House
                  </b>
                  . Use the filters and tables below to drill into individual
                  collector activity and remittance details.
                </Text>
              </div>
            </Col>

            {/* Right-side quick stats pill */}
            <Col
              xs={24}
              md={8}
              style={{
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  backgroundColor: "#f9fafb",
                  border: "1px solid #e5e7eb",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  minWidth: 240,
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "#22c55e",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Text
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                      color: "#6b7280",
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: "#111827",
                      fontWeight: 500,
                    }}
                  >
                    Collections data loaded
                  </Text>
                </div>
                <div
                  style={{
                    padding: "4px 10px",
                    borderRadius: 999,
                    backgroundColor: "#eff6ff",
                    border: "1px solid #bfdbfe",
                    fontSize: 11,
                    color: "#1d4ed8",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  MEEO Monitoring
                </div>
              </div>
            </Col>
          </Row>
        </Card>

        {/* Chart Card */}
        <Card
          style={{
            marginBottom: 20,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.08)",
          }}
          bodyStyle={{ padding: 20 }}
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontWeight: 600, color: "#111827" }}>
                Total Amount per Collector
              </span>
              <span style={{ fontSize: 12, color: "#6b7280" }}>
                Hover a bar to see exact amount
              </span>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" minPointSize={5}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={getColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Main Table Card + Collector Filter Picker */}
        <Card
          style={{
            marginBottom: 16,
            borderRadius: 16,
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
          }}
          bodyStyle={{ padding: 20 }}
        >
          {/* Top bar inside card: picker + summary */}
          <div
            style={{
              marginBottom: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Space direction="vertical" size={2}>
              <Text style={{ fontSize: 13, color: "#6b7280" }}>
                Collector filter
              </Text>
              <Select
                value={selectedCollectorFilter}
                onChange={setSelectedCollectorFilter}
                style={{ minWidth: 220 }}
                size="middle"
              >
                <Option value="All">All Collectors</Option>
                {collectorOptions.map((name) => (
                  <Option key={name} value={name}>
                    {name}
                  </Option>
                ))}
              </Select>
            </Space>

            <div
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                backgroundColor: "#eff6ff",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "#1d4ed8",
                }}
              />
              <Text style={{ fontSize: 12, color: "#1d4ed8" }}>
                Showing {filteredCollectors.length}{" "}
                {selectedCollectorFilter === "All"
                  ? "collectors"
                  : "record(s) for selected collector"}
              </Text>
            </div>
          </div>

          <Table
            dataSource={filteredCollectors}
            columns={collectorColumns}
            rowKey="key"
            pagination={{
              pageSize: 3,
              current: collectorPage,
              onChange: (page) => {
                setCollectorPage(page);
                const start = (page - 1) * 3;
                const pageItems = filteredCollectors.slice(start, start + 3);
                setPageTotal(
                  pageItems.reduce(
                    (sum, c) => sum + Number(c.total_amount || 0),
                    0
                  )
                );
              },
              itemRender: (p, type, originalElement) =>
                paginationItemRender(p, type, originalElement, collectorPage),
            }}
            footer={() => (
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  paddingTop: 8,
                }}
              >
                <Text strong>
                  Grand Total (Page): {formatCurrency(pageTotal)}
                </Text>
              </div>
            )}
          />
        </Card>

        {/* Collector Details Modal */}
        <Modal
          open={showModal}
          title={
            selectedCollector
              ? `Collector: ${selectedCollector.collector_name} — Collected Payments`
              : ""
          }
          width={1000}
          onCancel={closeModal}
          footer={[
            <Button
              key="close"
              type="primary"
              style={closeButtonStyle}
              onClick={closeModal}
            >
              Close
            </Button>,
          ]}
        >
          {selectedCollector &&
            ["market", "wharf", "motor_pool", "slaughter"].map((sec) => (
              <div key={sec}>
                {getSectionTable(sec, selectedCollector.details?.[sec])}
              </div>
            ))}
        </Modal>

        {/* Group Details Modal */}
        <Modal
          open={showDetailsModal}
          title={
            selectedGroup
              ? selectedSourceType === "market"
                ? `Vendor: ${selectedGroup.vendor_name} — Payment Details`
                : selectedSourceType === "slaughter"
                ? `Customer: ${selectedGroup.customer_name} — Payment Details`
                : `${selectedSourceType?.toUpperCase()} — Payment Details`
              : ""
          }
          width={1100}
          onCancel={() => setShowDetailsModal(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              style={closeButtonStyle}
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>,
          ]}
        >
          <Space style={{ marginBottom: 16 }}>
            <RangePicker
              onChange={(dates) =>
                setDateRange(dates ? [dates[0].toDate(), dates[1].toDate()] : [])
              }
            />
            <Button type="primary" style={filterButtonStyle} onClick={() => {}}>
              Filter
            </Button>
          </Space>
          {getGroupRecordsTable()}
        </Modal>

        {/* Slaughter Fees Modal */}
        <Modal
          open={showFeesModal}
          title={
            selectedFees
              ? `Slaughter Fees — Customer: ${selectedFees.customer_name}`
              : "Slaughter Fees Details"
          }
          onCancel={() => setShowFeesModal(false)}
          footer={[
            <Button
              key="close"
              type="primary"
              style={closeButtonStyle}
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
              labelStyle={{ fontWeight: "bold", width: 220 }}
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
      </div>
    </Spin>
  );
};

export default CollectorReports;
