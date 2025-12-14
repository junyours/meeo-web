import React, { useEffect, useState, useMemo } from "react";
import api from "../Api";
import {
  Table,
  Select,
  Button,
  Modal,
  Spin,
  Pagination as AntPagination,
  Typography,
  Space,
  Card,
  Row,
  Col,
  Tag,
} from "antd";

const { Option } = Select;
const { Title, Text } = Typography;
const ITEMS_PER_PAGE = 5;

// 🔹 Design tokens (no gradients)
const primaryColor = "#1B4F72";
const accentColor = "#1D4ED8";

const primaryButtonStyle = {
  backgroundColor: primaryColor,
  borderColor: primaryColor,
  color: "#fff",
  fontWeight: 600,
  borderRadius: 999,
};

const primaryButtonGhostStyle = {
  borderColor: primaryColor,
  color: primaryColor,
  fontWeight: 600,
  borderRadius: 999,
  backgroundColor: "#ffffff",
};

const secondaryButtonStyle = {
  backgroundColor: "#f3f4f6",
  borderColor: "#e5e7eb",
  color: "#374151",
  fontWeight: 500,
  borderRadius: 999,
};

const StallHistory = () => {
  const [modalData, setModalData] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [report, setReport] = useState({
    rented_not_paid: [],
    new_rented: [],
    paid: [],
    never_rented: [],
    missed_payments: [],
  });
  const [loading, setLoading] = useState(false);
  const [filterSection, setFilterSection] = useState(undefined);
  const [filterVendor, setFilterVendor] = useState(undefined);
  const [allData, setAllData] = useState(null);
  const [selectedReport, setSelectedReport] = useState("all");

  const [page, setPage] = useState({
    rented_not_paid: 1,
    new_rented: 1,
    paid: 1,
    never_rented: 1,
    missed_payments: 1,
  });

  const [modalPage, setModalPage] = useState(1);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/stall-report");
        setReport(res.data);
        setAllData(res.data);
      } catch (err) {
        console.error("Error fetching stall report:", err);
      }
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const applyFilters = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterSection) params.section = filterSection;
      if (filterVendor) params.vendor = filterVendor;
      const res = await api.get("/stall-report", { params });
      setReport(res.data);
    } catch (err) {
      console.error("Error applying filters:", err);
    }
    setLoading(false);
  };

  const allSections = allData
    ? [
        ...new Set([
          ...allData.rented_not_paid.map((r) => r.section_name),
          ...allData.new_rented.map((r) => r.section_name),
          ...allData.paid.map((r) => r.section_name),
          ...allData.never_rented.map((r) => r.section_name),
        ]),
      ].filter(Boolean)
    : [];

  const filteredVendors = allData
    ? [
        ...new Set(
          allData
            .rented_not_paid.concat(allData.new_rented, allData.paid)
            .filter((r) => !filterSection || r.section_name === filterSection)
            .map((r) => r.vendor_name)
        ),
      ].filter(Boolean)
    : [];

  const paginate = (data, pageNumber) => {
    const start = (pageNumber - 1) * ITEMS_PER_PAGE;
    return data.slice(start, start + ITEMS_PER_PAGE);
  };

  const handlePageChange = (type, newPage) => {
    setPage((prev) => ({ ...prev, [type]: newPage }));
  };

  const handleModalPageChange = (newPage) => {
    setModalPage(newPage);
  };

  const openModal = (data) => {
    setModalData(data);
    setModalPage(1);
    setShowModal(true);
  };

  const getColumns = (type) => {
    switch (type) {
      case "never_rented":
        return [
          { title: "Section Name", dataIndex: "section_name", key: "section_name" },
          { title: "Stalls Count", dataIndex: "stall_count", key: "stall_count" },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Button
                style={primaryButtonGhostStyle}
                onClick={() => openModal({ ...record, type })}
                size="small"
              >
                View Details
              </Button>
            ),
          },
        ];
      case "rented_not_paid":
        return [
          { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
          { title: "Stalls Count", dataIndex: "stall_count", key: "stall_count" },
          {
            title: "Total Missed Days",
            dataIndex: "total_missed_days",
            key: "total_missed_days",
          },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Button
                style={primaryButtonGhostStyle}
                onClick={() => openModal({ ...record, type })}
                size="small"
              >
                View Details
              </Button>
            ),
          },
        ];
      case "paid":
        return [
          { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
          { title: "Stalls Count", dataIndex: "stall_count", key: "stall_count" },
          { title: "Total Paid", dataIndex: "total_paid", key: "total_paid" },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Button
                style={primaryButtonGhostStyle}
                onClick={() => openModal({ ...record, type })}
                size="small"
              >
                View Details
              </Button>
            ),
          },
        ];
      default:
        return [
          { title: "Vendor Name", dataIndex: "vendor_name", key: "vendor_name" },
          { title: "Stalls Count", dataIndex: "stall_count", key: "stall_count" },
          {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
              <Button
                style={primaryButtonGhostStyle}
                onClick={() => openModal({ ...record, type })}
                size="small"
              >
                View Details
              </Button>
            ),
          },
        ];
    }
  };

  // Small KPIs
  const totalStalls = useMemo(
    () =>
      (report.rented_not_paid.length ||
        report.new_rented.length ||
        report.paid.length ||
        report.never_rented.length ||
        report.missed_payments.length) &&
      [
        ...report.rented_not_paid,
        ...report.new_rented,
        ...report.paid,
        ...report.never_rented,
        ...report.missed_payments,
      ].length,
    [report]
  );

  return (
    <div
      style={{
        padding: 24,
        backgroundColor: "#f3f4f6",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header / Hero */}
        <Card
          bordered
          style={{
            marginBottom: 20,
            borderRadius: 14,
            boxShadow: "0 4px 14px rgba(15, 23, 42, 0.08)",
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[16, 16]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={6} style={{ width: "100%" }}>
                <Title
                  level={3}
                  style={{
                    color: "#111827",
                    marginBottom: 0,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  Stall Rental History
                </Title>
                <Text style={{ color: "#4b5563", fontSize: 14 }}>
                  Review rental performance across all market stalls. Filter by
                  section or vendor and explore detailed payment and missed rent
                  history.
                </Text>
                <div
                  style={{
                    width: 64,
                    height: 2,
                    borderRadius: 999,
                    backgroundColor: primaryColor,
                    marginTop: 4,
                  }}
                />
              </Space>
            </Col>

            <Col xs={24} md={10}>
              <Row gutter={[12, 12]} justify="end">
                <Col xs={12} md={12}>
                  <Card
                    bordered
                    style={{
                      borderRadius: 12,
                      backgroundColor: "#f9fafb",
                      padding: "10px 14px",
                      borderColor: "#e5e7eb",
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    <div style={{ padding: "10px 14px" }}>
                      <Text
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: "#6b7280",
                          letterSpacing: 0.4,
                        }}
                      >
                        Active Categories
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text
                          strong
                          style={{ fontSize: 18, color: primaryColor }}
                        >
                          5
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Rented, Paid, Missed, Never Rented
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={12} md={12}>
                  <Card
                    bordered
                    style={{
                      borderRadius: 12,
                      backgroundColor: "#ecfdf3",
                      padding: "10px 14px",
                      borderColor: "#bbf7d0",
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    <div style={{ padding: "10px 14px" }}>
                      <Text
                        style={{
                          fontSize: 11,
                          textTransform: "uppercase",
                          color: "#047857",
                          letterSpacing: 0.4,
                        }}
                      >
                        Total Entries
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        <Text
                          strong
                          style={{
                            fontSize: 18,
                            color: "#047857",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {totalStalls || 0}
                        </Text>
                      </div>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        Across all categories
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Filters */}
        <Card
          bordered
          style={{
            marginBottom: 16,
            borderRadius: 14,
            boxShadow: "0 3px 10px rgba(15, 23, 42, 0.06)",
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
          }}
          bodyStyle={{ padding: 16 }}
        >
          <Space direction="vertical" style={{ width: "100%" }} size={10}>
            <Text strong style={{ color: "#111827" }}>
              Filters
            </Text>
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} sm={8}>
                <Select
                  placeholder="Select Section"
                  value={filterSection}
                  onChange={setFilterSection}
                  style={{ width: "100%" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {allSections.map((sec) => (
                    <Option key={sec} value={sec}>
                      {sec}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={8}>
                <Select
                  placeholder="Select Vendor"
                  value={filterVendor}
                  onChange={setFilterVendor}
                  style={{ width: "100%" }}
                  allowClear
                  showSearch
                  optionFilterProp="children"
                >
                  {filteredVendors.map((vendor) => (
                    <Option key={vendor} value={vendor}>
                      {vendor}
                    </Option>
                  ))}
                </Select>
              </Col>

              <Col xs={24} sm={8}>
                <Space>
                  <Button
                    type="primary"
                    onClick={applyFilters}
                    style={primaryButtonStyle}
                  >
                    Display Details
                  </Button>
                  <Button
                    style={secondaryButtonStyle}
                    onClick={() => {
                      setFilterSection(undefined);
                      setFilterVendor(undefined);
                      if (allData) setReport(allData);
                    }}
                  >
                    Reset
                  </Button>
                </Space>
              </Col>
            </Row>
          </Space>
        </Card>

        {/* Report Selector */}
        <Space
          style={{
            marginBottom: 16,
            flexWrap: "wrap",
            display: "flex",
          }}
        >
          {["all", "rented_not_paid", "new_rented", "paid", "never_rented", "missed_payments"].map(
            (type) => (
              <Button
                key={type}
                type={selectedReport === type ? "primary" : "default"}
                style={
                  selectedReport === type ? primaryButtonStyle : secondaryButtonStyle
                }
                onClick={() => setSelectedReport(type)}
                size="small"
              >
                {type === "all"
                  ? "All"
                  : type === "rented_not_paid"
                  ? "Rented But Not Paid"
                  : type === "new_rented"
                  ? "Newly Rented"
                  : type === "paid"
                  ? "Paid Today"
                  : type === "never_rented"
                  ? "Never Rented"
                  : "Missed Payments"}
              </Button>
            )
          )}
        </Space>

        {loading ? (
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {["rented_not_paid", "new_rented", "paid", "never_rented", "missed_payments"].map(
              (type) =>
                (selectedReport === "all" || selectedReport === type) && (
                  <Card
                    key={type}
                    bordered
                    style={{
                      marginBottom: 24,
                      borderRadius: 14,
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                      backgroundColor: "#ffffff",
                      borderColor: "#e5e7eb",
                    }}
                    bodyStyle={{ padding: 18 }}
                  >
                    <Space
                      style={{ marginBottom: 12, justifyContent: "space-between" }}
                      align="center"
                    >
                      <Space>
                        <Title level={4} style={{ margin: 0, color: "#111827" }}>
                          {type === "rented_not_paid"
                            ? "Rented But Not Paid"
                            : type === "new_rented"
                            ? "Newly Rented (Last 7 Days)"
                            : type === "paid"
                            ? "Paid Today"
                            : type === "never_rented"
                            ? "Never Rented"
                            : "Missed Payments"}
                        </Title>
                        <Tag color="blue">
                          {report[type]?.length || 0} record
                          {(report[type]?.length || 0) === 1 ? "" : "s"}
                        </Tag>
                      </Space>
                    </Space>

                    <Table
                      columns={getColumns(type)}
                      dataSource={paginate(report[type], page[type])}
                      pagination={false}
                      size="middle"
                      rowKey={(record) =>
                        record.stall_number || record.section_name || record.vendor_name
                      }
                    />

                    {report[type].length > ITEMS_PER_PAGE && (
                      <AntPagination
                        current={page[type]}
                        pageSize={ITEMS_PER_PAGE}
                        total={report[type].length}
                        onChange={(p) => handlePageChange(type, p)}
                        style={{ marginTop: 16, textAlign: "center" }}
                        size="small"
                        showSizeChanger={false}
                        itemRender={(p, typeRender, originalElement) => {
                          if (typeRender === "prev") {
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
                          if (typeRender === "next") {
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
                                  p === page[type]
                                    ? `1px solid ${accentColor}`
                                    : "1px solid transparent",
                                backgroundColor:
                                  p === page[type] ? "#eff6ff" : "transparent",
                                fontSize: 12,
                              }}
                            >
                              {p}
                            </span>
                          );
                        }}
                      />
                    )}
                  </Card>
                )
            )}

            {/* Modal */}
            <Modal
              open={showModal}
              title={
                modalData?.type === "never_rented"
                  ? `Never Rented Stalls | Section: ${modalData.section_name}`
                  : modalData?.vendor_name
              }
              footer={null}
              width={900}
              onCancel={() => setShowModal(false)}
            >
              {modalData?.details ? (
                <>
                  <ModalTable
                    type={modalData.type}
                    details={modalData.details}
                    page={modalPage}
                  />
               {modalData.details.length > ITEMS_PER_PAGE && (
  <AntPagination
    current={modalPage}
    pageSize={ITEMS_PER_PAGE}
    total={modalData.details.length}
    onChange={handleModalPageChange}
    style={{ marginTop: 16, textAlign: "center" }}
    size="small"
    showSizeChanger={false}
    itemRender={(p, typeRender, originalElement) => {
      if (typeRender === "prev") {
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
      if (typeRender === "next") {
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
              p === modalPage
                ? `1px solid ${accentColor}`
                : "1px solid transparent",
            backgroundColor: p === modalPage ? "#eff6ff" : "transparent",
            fontSize: 12,
          }}
        >
          {p}
        </span>
      );
    }}
  />
)}

                </>
              ) : (
                <p>No details available</p>
              )}
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

/* ====================== Modal Table Dispatcher ====================== */

const ModalTable = ({ type, details, page }) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  const pageData = details.slice(start, start + ITEMS_PER_PAGE);

  switch (type) {
    case "rented_not_paid":
      return <UnpaidTable details={pageData} />;
    case "paid":
      return <PaidTable details={pageData} />;
    case "new_rented":
      return <NewRentedTable details={pageData} />;
    case "missed_payments":
      return <MissedTable details={pageData} />;
    default:
      return (
        <Table
          dataSource={pageData}
          columns={[
            { title: "Stall Number", dataIndex: "stall_number", key: "stall_number" },
            { title: "Status", dataIndex: "status", key: "status" },
          ]}
          pagination={false}
          rowKey={(record) =>
            record.stall_number || record.section_name || record.vendor_name
          }
          size="middle"
        />
      );
  }
};

/* ====================== Modal Tables ====================== */

const UnpaidTable = ({ details }) => {
  const [missedDatesModal, setMissedDatesModal] = useState({
    open: false,
    dates: [],
  });

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const columns = [
    { title: "Stall Number", dataIndex: "stall_number", key: "stall_number" },
    { title: "Section Name", dataIndex: "section_name", key: "section_name" },
    {
      title: "Date Rented",
      key: "created_at",
      render: (_, record) => formatDate(record.created_at),
    },
    {
      title: "Daily Rent",
      key: "daily_rent",
      render: (_, record) => Number(record.daily_rent).toFixed(2),
    },
    { title: "Missed Days", dataIndex: "missed_days", key: "missed_days" },
    {
      title: "Total Missed Amount",
      key: "total_missed",
      render: (_, record) => Number(record.total_missed).toFixed(2),
    },
    {
      title: "Missed Dates",
      key: "missed_dates",
      render: (_, record) => {
        const firstDate = record.missed_dates[0]
          ? formatDate(record.missed_dates[0])
          : "-";
        return (
          <Button
            type="link"
            onClick={() =>
              setMissedDatesModal({ open: true, dates: record.missed_dates })
            }
            disabled={!record.missed_dates?.length}
          >
            {firstDate} ({record.missed_dates.length})
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Table
        dataSource={details}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey={(record) =>
          record.stall_number || record.section_name || record.vendor_name
        }
      />

      <Modal
        title="Missed Payment Dates"
        open={missedDatesModal.open}
        onCancel={() => setMissedDatesModal({ open: false, dates: [] })}
        footer={null}
      >
        {missedDatesModal.dates?.length ? (
          <ul style={{ paddingLeft: 20 }}>
            {missedDatesModal.dates.map((date) => (
              <li key={date}>{formatDate(date)}</li>
            ))}
          </ul>
        ) : (
          <p>No missed dates found.</p>
        )}
      </Modal>
    </>
  );
};

const MissedTable = ({ details }) => {
  const [missedDatesModal, setMissedDatesModal] = useState({
    open: false,
    dates: [],
  });

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  const columns = [
    { title: "Stall Number", dataIndex: "stall_number", key: "stall_number" },
    { title: "Section Name", dataIndex: "section_name", key: "section_name" },
    {
      title: "Date Rented",
      key: "created_at",
      render: (_, record) => formatDate(record.created_at),
    },
    {
      title: "Last Payment Date",
      key: "last_payment",
      render: (_, record) => formatDate(record.last_payment),
    },
    { title: "Missed Days", dataIndex: "missed_days", key: "missed_days" },
    {
      title: "Missed Dates",
      key: "missed_dates",
      render: (_, record) => {
        const firstDate = record.missed_dates[0]
          ? formatDate(record.missed_dates[0])
          : "-";
        return (
          <Button
            type="link"
            onClick={() =>
              setMissedDatesModal({ open: true, dates: record.missed_dates })
            }
            disabled={!record.missed_dates?.length}
          >
            {firstDate} ({record.missed_dates.length})
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Table
        dataSource={details}
        columns={columns}
        pagination={false}
        size="middle"
        rowKey={(record) =>
          record.stall_number || record.section_name || record.vendor_name
        }
      />

      <Modal
        title="Missed Payment Dates"
        open={missedDatesModal.open}
        onCancel={() => setMissedDatesModal({ open: false, dates: [] })}
        footer={null}
      >
        {missedDatesModal.dates?.length ? (
          <ul style={{ paddingLeft: 20 }}>
            {missedDatesModal.dates.map((date) => (
              <li key={date}>{formatDate(date)}</li>
            ))}
          </ul>
        ) : (
          <p>No missed dates found.</p>
        )}
      </Modal>
    </>
  );
};

const PaidTable = ({ details }) => {
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "2-digit",
        })
      : "-";

  const columns = [
    { title: "Stall Number", dataIndex: "stall_number", key: "stall_number" },
    { title: "Section Name", dataIndex: "section_name", key: "section_name" },
    { title: "Daily Rent", dataIndex: "daily_rent", key: "daily_rent" },
    {
      title: "Last Payment Date",
      key: "last_payment",
      render: (_, record) => formatDate(record.last_payment),
    },
    {
      title: "Amount Paid",
      key: "amount_paid",
      render: (_, record) => Number(record.amount_paid).toFixed(2),
    },
    { title: "Payment Type", dataIndex: "payment_type", key: "payment_type" },
    { title: "Missed Days", dataIndex: "missed_days", key: "missed_days" },
    {
      title: "Advance Days",
      key: "advance_days",
      render: (_, record) =>
        record.payment_type === "advance" ? record.advance_days : "-",
    },
    { title: "Status", dataIndex: "status", key: "status" },
  ];

  return (
    <Table
      dataSource={details}
      columns={columns}
      pagination={false}
      size="middle"
      rowKey={(record) =>
        record.stall_number || record.section_name || record.vendor_name
      }
    />
  );
};

const NewRentedTable = ({ details }) => {
  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "-";

  const columns = [
    { title: "Stall Number", dataIndex: "stall_number", key: "stall_number" },
    { title: "Section Name", dataIndex: "section_name", key: "section_name" },
    {
      title: "Date Rented",
      key: "created_at",
      render: (_, record) => formatDate(record.created_at),
    },
    {
      title: "Daily Rent",
      key: "daily_rent",
      render: (_, record) => Number(record.daily_rent).toFixed(2),
    },
    {
      title: "Monthly Rent",
      key: "monthly_rent",
      render: (_, record) => Number(record.monthly_rent).toFixed(2),
    },
  ];

  return (
    <Table
      dataSource={details}
      columns={columns}
      pagination={false}
      size="middle"
      rowKey={(record) =>
        record.stall_number || record.section_name || record.vendor_name
      }
    />
  );
};

export default StallHistory;
