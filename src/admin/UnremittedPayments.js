import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  Button,
  Card,
  Typography,
  Tag,
  Row,
  Col,
  Space,
} from "antd";
import api from "../Api";
import dayjs from "dayjs";
import UnremittedPaymentsDetailsModal from "./UnremittedPaymentsDetailsModal";

const { Title, Text } = Typography;

const UnremittedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Primary tokens (keep consistent with your app)
  const primaryColor = "#1B4F72";

  const primaryButtonStyle = {
    background: "linear-gradient(135deg, #1B4F72, #2563EB)",
    borderColor: "#1B4F72",
    color: "#fff",
    fontWeight: 600,
    borderRadius: 999,
  };

  const tagPrimaryColor = primaryColor;

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get("/admin/unremitted-payments");
      const formatted = [];

      const processType = (data, typeLabel) => {
        data.forEach((p) => {
          formatted.push({
            key: `${typeLabel}-${p.id}`,
            collector: p.collector || "N/A",
            totalCollected: p.amount || 0,
            assignedArea: typeLabel,
            dateCollected: dayjs(p.collection_date).format("MMMM D, YYYY"),
            timeCollected: p.collection_time
              ? dayjs(p.collection_time).format("h:mm A")
              : "N/A",
            collectionDateRaw: p.collection_date, // for sorting
            rawData: p,
            type: typeLabel,
          });
        });
      };

      processType(res.data.market, "Market");
      processType(res.data.slaughter, "Slaughter");
      processType(res.data.wharf, "Wharf");
      processType(res.data.motorpool, "Motorpool");

      // Sort by collection date DESC (latest first)
      formatted.sort(
        (a, b) =>
          dayjs(b.collectionDateRaw).valueOf() -
          dayjs(a.collectionDateRaw).valueOf()
      );

      setPayments(formatted);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  // KPI: total amount
  const totalAmount = useMemo(
    () =>
      payments.reduce(
        (sum, p) => sum + Number(p.totalCollected || 0),
        0
      ),
    [payments]
  );

  // ---------- Custom Pagination Renderer (Prev / Next only look) ----------
  const paginationItemRender = (current, type, originalElement, activePage) => {
    if (type === "prev") {
      return (
        <Button
          size="small"
          style={{
            borderRadius: 999,
            borderColor: "#d1d5db",
            padding: "0 12px",
            fontSize: 12,
            background: "#ffffff",
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
            padding: "0 12px",
            fontSize: 12,
            background: "#ffffff",
          }}
        >
          Next
        </Button>
      );
    }

    // Numbered items (keep subtle pill look)
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

  const columns = [
    {
      title: "Collector",
      dataIndex: "collector",
      key: "collector",
      render: (name) => (
        <Space>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#e9f2ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 600,
              color: primaryColor,
              fontSize: 14,
            }}
          >
            {name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <Text strong style={{ fontSize: 14 }}>
              {name}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              Field Collector
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Total Collected",
      dataIndex: "totalCollected",
      key: "totalCollected",
      align: "right",
      render: (amount) => (
        <Text
          strong
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: 14,
          }}
        >
          ₱
          {Number(amount).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </Text>
      ),
    },
    {
      title: "Assigned Area",
      dataIndex: "assignedArea",
      key: "assignedArea",
      render: (area) => (
        <Tag
          color={tagPrimaryColor}
          style={{
            borderRadius: 999,
            padding: "2px 10px",
            fontWeight: 500,
            fontSize: 12,
          }}
        >
          {area}
        </Tag>
      ),
    },
    {
      title: "Date Collected",
      dataIndex: "dateCollected",
      key: "dateCollected",
      render: (val) => (
        <Text style={{ fontSize: 13, color: "#374151" }}>{val}</Text>
      ),
    },
    {
      title: "Time Collected",
      dataIndex: "timeCollected",
      key: "timeCollected",
      render: (val) => (
        <Text style={{ fontSize: 13, color: "#6b7280" }}>{val}</Text>
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
            setSelectedPayment(record);
            setModalVisible(true);
          }}
          style={primaryButtonStyle}
          size="small"
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
        background:
          "linear-gradient(180deg, #eef2f7 0%, #f7f9fc 45%, #ffffff 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Card */}
        <Card
          bordered={false}
          style={{
            marginBottom: 16,
            borderRadius: 18,
            boxShadow: "0 14px 30px rgba(15, 23, 42, 0.12)",
            background:
              "radial-gradient(circle at top left, #dbeafe 0, transparent 55%), #ffffff",
          }}
          bodyStyle={{ padding: 20 }}
        >
          <Row gutter={[24, 16]} align="middle" justify="space-between">
            <Col xs={24} md={14}>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Title
                  level={3}
                  style={{
                    color: primaryColor,
                    marginBottom: 0,
                    fontWeight: 700,
                    letterSpacing: 0.3,
                  }}
                >
                  Unremitted Collected Payments
                </Title>
                <Text style={{ color: "#4b5563", fontSize: 13 }}>
                  Monitor all collections that are still pending remittance.
                  Click on a record to view a detailed breakdown.
                </Text>
                <div
                  style={{
                    width: 70,
                    height: 3,
                    borderRadius: 999,
                    background:
                      "linear-gradient(90deg, #1B4F72, #2563EB, #22c55e)",
                    marginTop: 8,
                  }}
                />
              </Space>
            </Col>

            {/* KPI chips */}
            <Col xs={24} md={10}>
              <Row gutter={[12, 12]} justify="end">
                <Col xs={12} md={12}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 14,
                      background: "#f2f5ff",
                      padding: "10px 14px",
                    }}
                    bodyStyle={{ padding: 8 }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: "#6b7280",
                        letterSpacing: 0.5,
                      }}
                    >
                      Total Records
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 18,
                          color: primaryColor,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {payments.length}
                      </Text>
                    </div>
                  </Card>
                </Col>
                <Col xs={12} md={12}>
                  <Card
                    bordered={false}
                    style={{
                      borderRadius: 14,
                      background: "#ecfdf5",
                      padding: "10px 14px",
                    }}
                    bodyStyle={{ padding: 8 }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        textTransform: "uppercase",
                        color: "#047857",
                        letterSpacing: 0.5,
                      }}
                    >
                      Total Amount
                    </Text>
                    <div style={{ marginTop: 4 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 16,
                          color: "#047857",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        ₱
                        {totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </Text>
                    </div>
                  </Card>
                </Col>
              </Row>
            </Col>
          </Row>
        </Card>

        {/* Table Card */}
        <Card
          bordered={false}
          style={{
            boxShadow: "0 8px 20px rgba(15, 23, 42, 0.08)",
            borderRadius: 16,
          }}
          bodyStyle={{ padding: 20 }}
        >
          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15, display: "block" }}>
              Unremitted List
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Sorted by latest collection date. Use this list to follow up and
              reconcile remittances.
            </Text>
          </div>

          <Table
            columns={columns}
            dataSource={payments}
            loading={loading}
            pagination={{
              pageSize: 6,
              showSizeChanger: false,
              itemRender: (current, type, originalElement) =>
                paginationItemRender(
                  current,
                  type,
                  originalElement,
                  // AntD internally knows the active page,
                  // but we can just pass current for styling.
                  current
                ),
              style: {
                marginTop: 16,
                textAlign: "right",
              },
            }}
            rowKey="key"
            bordered={false}
          />
        </Card>

        {selectedPayment && (
          <UnremittedPaymentsDetailsModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            payment={selectedPayment}
          />
        )}
      </div>
    </div>
  );
};

export default UnremittedPayments;
