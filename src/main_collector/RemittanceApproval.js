import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Card,
  Modal,
  Typography,
  Space,
  message,
  Spin,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import api from "../Api";

const { Title } = Typography;

const RemittanceApproval = () => {
  const [remittances, setRemittances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedRemittance, setSelectedRemittance] = useState(null);
  const [detailedData, setDetailedData] = useState(null);

  const [marketModalData, setMarketModalData] = useState(null);
  const [slaughterModalData, setSlaughterModalData] = useState(null);

  const BUTTON_STYLE = {
    backgroundColor: "#ffffff",
    borderColor: "#ffffff",
    color: "#000000",
    fontWeight: "bold",
  };

  const fetchRemittances = async () => {
    try {
      const res = await api.get("/remittance/all");
      setRemittances(res.data);
    } catch (err) {
      message.error("Failed to fetch remittances");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRemittances();
  }, []);

  const handleApprove = async (id) => {
    try {
      await api.post(`/remittance/${id}/approve`);
      message.success("Remittance approved successfully");
      fetchRemittances();
      setSelectedRemittance(null);
    } catch {
      message.error("Failed to approve remittance");
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatType = (type) => {
    if (type === "SlaughterPayment") return "Slaughter";
    if (type === "Payments") return "Market";
    return type;
  };

  const formatCurrency = (value) =>
    `₱${Number(value).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fetchDetails = async (remittance) => {
    setViewLoading(true);
    setSelectedRemittance(remittance);
    setDetailedData(null);

    try {
      const results = {};
      const uniqueTypes = Array.from(new Set(remittance.types));

      for (const type of uniqueTypes) {
        let endpoint = "";
        if (type === "SlaughterPayment")
          endpoint = `/slaughter/details/${remittance.id}`;
        else if (type === "Payments")
          endpoint = `/market/details/${remittance.id}`;
        else if (type === "MotorPool")
          endpoint = `/motorpool/details/${remittance.id}`;
        else if (type === "Wharf")
          endpoint = `/wharf/details/${remittance.id}`;

        if (endpoint) {
          const res = await api.get(endpoint);

          if (type === "Payments") {
            const grouped = {};
            res.data.forEach((entry) => {
              if (!grouped[entry.vendor_name])
                grouped[entry.vendor_name] = {
                  ...entry,
                  totalAmount: 0,
                  entries: [],
                };

              grouped[entry.vendor_name].totalAmount += entry.amount;
              grouped[entry.vendor_name].entries.push(entry);
            });
            results[type] = Object.values(grouped);
          } else if (type === "SlaughterPayment") {
            const grouped = {};
            res.data.forEach((entry) => {
              if (!grouped[entry.customer_name])
                grouped[entry.customer_name] = {
                  ...entry,
                  totalAmount: 0,
                  entries: [],
                };

              grouped[entry.customer_name].totalAmount += entry.amount;
              grouped[entry.customer_name].entries.push(entry);
            });
            results[type] = Object.values(grouped);
          } else {
            results[type] = res.data;
          }
        }
      }

      setDetailedData(results);
    } catch {
      message.error("Failed to fetch remittance details");
    } finally {
      setViewLoading(false);
    }
  };

  const columns = [
    {
      title: "Collector",
      dataIndex: "remitted_by",
      align: "center",
    },
    {
      title: "Received By",
      dataIndex: "received_by",
      align: "center",
      render: (text) => text || "-",
    },
    {
      title: "Amount",
      dataIndex: "amount",
      align: "center",
      render: (val) => formatCurrency(val),
    },
    {
      title: "Date",
      dataIndex: "remit_date",
      align: "center",
      render: (date) => formatDate(date),
    },
    {
      title: "Type",
      dataIndex: "types",
      align: "center",
      render: (types) =>
        Array.from(new Set(types)).map((t) => (
          <Tag color="blue" key={t}>
            {formatType(t)}
          </Tag>
        )),
    },
    {
      title: "Status",
      dataIndex: "status",
      align: "center",
      render: (status) => {
        let color =
          status === "approved"
            ? "green"
            : status === "declined"
            ? "red"
            : "gold";
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Actions",
      align: "center",
      render: (record) => (
        <Button
          icon={<EyeOutlined />}
          onClick={() => fetchDetails(record)}
          loading={viewLoading && selectedRemittance?.id === record.id}
          style={BUTTON_STYLE}
          className="primary-action-btn"
        >
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: "32px", background: "#f3f4f6", minHeight: "100vh" }}>
      {/* Internal CSS for primary buttons */}
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
          border-color: #0022feff !important;
          color: #ffffff !important;
        }

        .helper-text {
          color: #6b7280;
          font-size: 13px;
        }
      `}</style>

      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          padding: "24px",
          background: "#ffffff",
          boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
        }}
      >
        <Title level={3} style={{ color: "#111827", marginBottom: 4 }}>
          Remittance Approvals
        </Title>

        {/* 👇 Helper span/description message here */}
        <span className="helper-text">
          Review all remittances submitted by collectors. Click{" "}
          <strong>“View Details”</strong> to see the full breakdown, then{" "}
          <strong>approve</strong> pending remittances if everything is correct.
        </span>

        <div
          style={{
            height: 3,
            width: 60,
            background: "#2563eb",
            borderRadius: 8,
            marginTop: 16,
            marginBottom: 24,
          }}
        ></div>

        <Table
          dataSource={remittances}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 6 }}
          bordered
        />
      </Card>

      {/* MAIN DETAILS MODAL */}
      <Modal
        open={!!selectedRemittance}
        onCancel={() => setSelectedRemittance(null)}
        title={
          <div style={{ padding: "4px 0" }}>
            <Title level={4} style={{ margin: 0, color: "#1f2937" }}>
              Remittance Details
            </Title>
            <div
              style={{ height: 2, background: "#e5e7eb", marginTop: 12 }}
            ></div>
          </div>
        }
        width={800}
        footer={null}
      >
        {viewLoading ? (
          <div style={{ textAlign: "center", padding: "50px 0" }}>
            <Spin size="large" tip="Loading details..." />
          </div>
        ) : detailedData ? (
          <>
            {/* TOTAL AMOUNT CARD */}
            <Card
              style={{
                padding: 12,
                background:
                  selectedRemittance?.status === "pending"
                    ? "#eef2ff"
                    : "#f0fdf4",
                marginBottom: 20,
                borderRadius: 12,
              }}
            >
              <Title level={5} style={{ margin: 0 }}>
                {selectedRemittance?.status === "pending"
                  ? "Total Required Amount: "
                  : "Total Amount: "}
                <span
                  style={{
                    color:
                      selectedRemittance?.status === "pending"
                        ? "#1e3a8a"
                        : "green",
                  }}
                >
                  {formatCurrency(selectedRemittance?.amount || 0)}
                </span>
              </Title>
            </Card>

            {/* DISPLAY TYPES */}
            {Object.entries(detailedData).map(([type, entries]) => (
              <div key={type} style={{ marginBottom: 20 }}>
                <Title level={5}>{formatType(type)}</Title>

                <Table
                  dataSource={entries}
                  rowKey={(r, i) => i}
                  pagination={false}
                  columns={
                    type === "Payments"
                      ? [
                          { title: "Vendor", dataIndex: "vendor_name" },
                          {
                            title: "Total Amount",
                            dataIndex: "totalAmount",
                            render: (val) => formatCurrency(val),
                          },
                          {
                            title: "Action",
                            render: (entry) => (
                              <Button
                                type="link"
                                onClick={() =>
                                  setMarketModalData(entry.entries)
                                }
                                className="primary-action-btn"
                                style={BUTTON_STYLE}
                              >
                                View Details
                              </Button>
                            ),
                          },
                        ]
                      : type === "SlaughterPayment"
                      ? [
                          { title: "Customer", dataIndex: "customer_name" },
                          {
                            title: "Total Amount",
                            dataIndex: "totalAmount",
                            render: (val) => formatCurrency(val),
                          },
                          {
                            title: "Action",
                            render: (entry) => (
                              <Button
                                type="link"
                                onClick={() =>
                                  setSlaughterModalData(entry.entries)
                                }
                                className="primary-action-btn"
                                style={BUTTON_STYLE}
                              >
                                View Details
                              </Button>
                            ),
                          },
                        ]
                      : [
                          { title: "Collector", dataIndex: "collector" },
                          {
                            title: "Amount",
                            dataIndex: "amount",
                            render: (val) => formatCurrency(val),
                          },
                          { title: "Received By", dataIndex: "received_by" },
                          { title: "Status", dataIndex: "status" },
                        ]
                  }
                />
              </div>
            ))}

            {/* ACCEPT BUTTON */}
            {selectedRemittance?.status === "pending" && (
              <div style={{ textAlign: "right", marginTop: 20 }}>
                <Space>
                  <Button
                    type="primary"
                    onClick={() => handleApprove(selectedRemittance?.id)}
                    style={BUTTON_STYLE}
                    className="primary-action-btn"
                  >
                    Approved
                  </Button>
                </Space>
              </div>
            )}
          </>
        ) : null}
      </Modal>

      {/* MARKET MODAL */}
      <Modal
        open={!!marketModalData}
        onCancel={() => setMarketModalData(null)}
        title="Market Full Details"
        width={1000}
        footer={null}
      >
        <Table
          dataSource={marketModalData || []}
          rowKey={(r, i) => i}
          pagination={false}
          columns={[
            { title: "Vendor", dataIndex: "vendor_name" },
            { title: "Contact", dataIndex: "vendor_contact" },
            { title: "Section", dataIndex: "section_name" },
            { title: "Stall Number", dataIndex: "stall_number" },
            { title: "Stall Size", dataIndex: "stall_size" },
            { title: "Daily Rent", dataIndex: "daily_rent" },
            { title: "Monthly Rent", dataIndex: "monthly_rent" },
            {
              title: "Amount",
              dataIndex: "amount",
              render: (val) => formatCurrency(val),
            },
            { title: "Collector", dataIndex: "collector" },
            { title: "Received By", dataIndex: "received_by" },
          ]}
        />
      </Modal>

      {/* SLAUGHTER MODAL */}
      <Modal
        open={!!slaughterModalData}
        onCancel={() => setSlaughterModalData(null)}
        title="Slaughter Full Details"
        width={1100}
        footer={null}
      >
        <Table
          dataSource={slaughterModalData || []}
          rowKey={(r, i) => i}
          pagination={false}
          columns={[
            { title: "Animal Type", dataIndex: "animal_type" },
            { title: "Customer", dataIndex: "customer_name" },
            { title: "Collector", dataIndex: "collector" },
            { title: "Received By", dataIndex: "received_by" },
            {
              title: "Amount",
              dataIndex: "amount",
              render: (val) => formatCurrency(val),
            },
            { title: "Slaughter Fee", dataIndex: ["breakdown", "slaughter_fee"] },
            { title: "Ante Mortem", dataIndex: ["breakdown", "ante_mortem"] },
            { title: "Post Mortem", dataIndex: ["breakdown", "post_mortem"] },
            { title: "Corral Fee", dataIndex: ["breakdown", "coral_fee"] },
            { title: "Permit to SLH", dataIndex: ["breakdown", "permit_to_slh"] },
            { title: "Quantity", dataIndex: ["breakdown", "quantity"] },
            { title: "Total Kilos", dataIndex: ["breakdown", "total_kilos"] },
            { title: "Per Kilo", dataIndex: ["breakdown", "per_kilos"] },
          ]}
        />
      </Modal>
    </div>
  );
};

export default RemittanceApproval;
