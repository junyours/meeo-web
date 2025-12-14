import React, { useState, useEffect } from "react";
import {
  Table,
  Card,
  Input,
  Modal,
  Button,
  Tag,
  Space,
  Typography,
  message,
  Divider,
  Skeleton,
} from "antd";
import {
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  UserOutlined,
  PhoneOutlined,
  ShopOutlined,
  CalendarOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title, Text } = Typography;
const { Search } = Input;

// 🔹 Button styles
const primaryButton = {
  backgroundColor: "#1B4F72",
  borderColor: "#1B4F72",
  color: "#fff",
  fontWeight: 600,
  borderRadius: 6,
};

const secondaryButton = {
  backgroundColor: "#e3f2fd",
  borderColor: "#90caf9",
  color: "#1B4F72",
  fontWeight: 600,
  borderRadius: 6,
};

const VendorsMissedPayments = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [notifying, setNotifying] = useState(false);
  const [expandedStall, setExpandedStall] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await api.get("/vendors/missed-payments");
      setVendors(res.data);
    } catch {
      message.error("Failed to load missed payments");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getMissedColor = (days) => {
    if (days <= 3) return "green";
    if (days <= 5) return "gold";
    if (days <= 10) return "orange";
    return "red";
  };

  const handleViewDetails = (vendor) => {
    setSelectedVendor(vendor);
    setExpandedStall(null);
    setDetailsVisible(true);
  };

  const handleNotify = async (vendorId) => {
    setNotifying(true);
    try {
      const res = await api.post("/admin/notify-vendor", { vendor_id: vendorId });
      message.success(res.data.message);
      setVendors((prev) =>
        prev.map((v) =>
          v.vendor_id === vendorId ? { ...v, already_notified: true } : v
        )
      );
      if (selectedVendor?.vendor_id === vendorId) {
        setSelectedVendor((prev) => ({ ...prev, already_notified: true }));
      }
    } catch {
      message.error("Failed to notify vendor");
    } finally {
      setNotifying(false);
    }
  };

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor_name",
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: "#1890ff" }} />
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact_number",
      key: "contact_number",
      render: (text) => (
        <Space>
          <PhoneOutlined />
          <Text>{text || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Stalls",
      key: "stall_numbers",
      render: (_, record) => (
        <Space>
          <ShopOutlined />
          <Text>{record.stalls?.map((s) => s.stall_number).join(", ") || "N/A"}</Text>
        </Space>
      ),
    },
    {
      title: "Missed Days",
      dataIndex: "days_missed",
      key: "days_missed",
      render: (days) => <Tag color={getMissedColor(days)}>{days} days</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button
          type="primary"
          icon={<InfoCircleOutlined />}
          onClick={() => handleViewDetails(record)}
          style={primaryButton}
        >
          View Details
        </Button>
      ),
    },
  ];

  const paginationItemRender = (current, type) => {
    if (type === "prev")
      return <Button size="small" style={{ borderRadius: 999, padding: "0 12px" }}>Previous</Button>;
    if (type === "next")
      return <Button size="small" style={{ borderRadius: 999, padding: "0 12px" }}>Next</Button>;
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
          border: current === currentPage ? "1px solid #1D4ED8" : "1px solid transparent",
          backgroundColor: current === currentPage ? "#eff6ff" : "transparent",
          fontSize: 12,
        }}
      >
        {current}
      </span>
    );
  };

  return (
    <div style={{ padding: "40px", backgroundColor: "#f5f7fa", minHeight: "100vh" }}>
      <Card style={{ borderRadius: 12, boxShadow: "0 8px 20px rgba(0,0,0,0.08)" }}>
        <Title level={3} style={{ marginBottom: 20 }}>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />
          Vendors with Missed Payments
        </Title>

   <Search
  placeholder="Search by vendor name"
  allowClear
  
  onSearch={(value) => {
    const filtered = value
      ? vendors.filter((v) => v.vendor_name.toLowerCase().includes(value.toLowerCase()))
      : fetchVendors();
    if (Array.isArray(filtered)) setVendors(filtered);
  }}
  style={{
    maxWidth: 400,
    marginBottom: 20,
    
  }}
  enterButton={
    <Button
      type="primary"
      style={{
        ...primaryButton,
        padding: "1px 15px",
        fontSize: 14,
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#153e5f";
        e.currentTarget.style.borderColor = "#153e5f";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "#1B4F72";
        e.currentTarget.style.borderColor = "#1B4F72";
      }}
    >
      Search
    </Button>
  }
/>

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : vendors.length > 0 ? (
          <Table
            columns={columns}
            dataSource={vendors}
            rowKey="vendor_id"
            pagination={{
              current: currentPage,
              pageSize,
              showTotal: (total) => `Total ${total} vendors`,
              onChange: (page) => setCurrentPage(page),
              itemRender: paginationItemRender,
            }}
            bordered
            rowClassName={(record, index) =>
              index % 2 === 0 ? "table-row-light" : "table-row-dark"
            }
            style={{ borderRadius: 12 }}
          />
        ) : (
          <Text type="secondary" style={{ display: "block", textAlign: "center", marginTop: 50 }}>
            🎉 All vendors are up-to-date. No missed days.
          </Text>
        )}
      </Card>

      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: "#1890ff" }} />
            <Text strong>{selectedVendor?.vendor_name}</Text>
          </Space>
        }
        open={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button
            key="notify"
            type="primary"
            icon={<NotificationOutlined />}
            loading={notifying}
            disabled={selectedVendor?.already_notified}
            onClick={() => handleNotify(selectedVendor?.vendor_id)}
            style={primaryButton}
          >
            {selectedVendor?.already_notified ? "Already Notified" : "Notify Vendor"}
          </Button>,
          <Button key="close" onClick={() => setDetailsVisible(false)} style={secondaryButton}>
            Close
          </Button>,
        ]}
        width={750}
        bodyStyle={{ padding: "24px", backgroundColor: "#fafafa" }}
      >
        {selectedVendor ? (
          <>
            <Divider orientation="left">Vendor Details</Divider>
            <Space direction="vertical" style={{ width: "100%" }}>
              <Text>
                <PhoneOutlined /> <strong>Contact:</strong> {selectedVendor.contact_number || "N/A"}
              </Text>
              <Text>
                <ShopOutlined /> <strong>Rented Stalls:</strong>{" "}
                {selectedVendor.stalls?.map((s) => s.stall_number).join(", ") || "N/A"}
              </Text>
              <Tag color={getMissedColor(selectedVendor.days_missed)} style={{ marginTop: 8 }}>
                {selectedVendor.days_missed} days missed
              </Tag>
            </Space>

            <Divider orientation="left">Stall Breakdown</Divider>
            {selectedVendor.stalls?.map((stall, index) => {
              const isExpanded = expandedStall === index;
              return (
                <Card
                  key={index}
                  size="small"
                  title={
                    <Space>
                      <ShopOutlined />
                      Stall #{stall.stall_number}
                    </Space>
                  }
                  style={{
                    marginBottom: 12,
                    borderRadius: 10,
                    border: "1px solid #f0f0f0",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.05)",
                  }}
                  extra={
                    <Tag color={getMissedColor(stall.missed_days)}>{stall.missed_days} days missed</Tag>
                  }
                >
                  {stall.missed_dates?.length > 0 && (
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Text strong>
                        <CalendarOutlined /> Missed Dates:
                      </Text>
                      {!isExpanded ? (
                        <>
                          <ul style={{ paddingLeft: 20 }}>
                            <li>{formatDate(stall.missed_dates[0])}</li>
                          </ul>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => setExpandedStall(index)}
                            style={{ paddingLeft: 20 }}
                          >
                            View All Missed Dates
                          </Button>
                        </>
                      ) : (
                        <>
                          <ul style={{ paddingLeft: 20 }}>
                            {stall.missed_dates.map((date, idx) => (
                              <li key={idx}>{formatDate(date)}</li>
                            ))}
                          </ul>
                          <Button
                            type="link"
                            size="small"
                            onClick={() => setExpandedStall(null)}
                            style={{ paddingLeft: 20 }}
                          >
                            Collapse
                          </Button>
                        </>
                      )}
                    </Space>
                  )}
                </Card>
              );
            })}
          </>
        ) : (
          <LoadingOverlay message="Loading vendor details..." />
        )}
      </Modal>
    </div>
  );
};

export default VendorsMissedPayments;
