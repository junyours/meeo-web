import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Card, Typography, Space, Divider, message, Input } from "antd";
import { CheckOutlined, CloseOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title, Text } = Typography;

const RenewalRequests = () => {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  const buttonStyle = {
    backgroundColor: "#1B4F72",
    borderColor: "#1B4F72",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: 8,
  };

  const dangerButtonStyle = {
    backgroundColor: "#f44336",
    borderColor: "#f44336",
    color: "#fff",
    fontWeight: "bold",
    borderRadius: 8,
  };

  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const [activePage, setActivePage] = useState(1);

  // Fetch pending renewal requests
  const fetchRenewals = () => {
    setLoading(true);
    api
      .get("/market-registration/renewals")
      .then((res) => setRenewals(res.data.renewals))
      .catch(() => message.error("Failed to fetch renewal requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRenewals();
  }, []);

  const handleAction = (id, action) => {
    if (action === "reject") {
      let reason = "";
      Modal.confirm({
        title: "Reject Renewal Request",
        icon: <ExclamationCircleOutlined />,
        content: (
          <div>
            <p>Please provide a reason for rejection:</p>
            <Input.TextArea
              onChange={(e) => (reason = e.target.value)}
              placeholder="Enter reason..."
              rows={4}
              style={{ borderRadius: 8 }}
            />
          </div>
        ),
        okText: "Reject",
        okType: "danger",
        cancelText: "Cancel",
        onOk: () => performAction(id, action, reason),
      });
    } else {
      Modal.confirm({
        title: "Approve Renewal Request",
        icon: <ExclamationCircleOutlined />,
        content: "Are you sure you want to approve this renewal request?",
        okText: "Approve",
        okType: "primary",
        cancelText: "Cancel",
        onOk: () => performAction(id, action),
      });
    }
  };

  const performAction = (id, action, reason = "") => {
    setActionLoading(id);
    api
      .post(`/market-registration/${id}/renewal/${action}`, { reason })
      .then(() => {
        message.success(`Renewal request ${action}d successfully`);
        setRenewals((prev) => prev.filter((r) => r.id !== id));
        fetchRenewals();
      })
      .catch(() => message.error(`Failed to ${action} the request`))
      .finally(() => setActionLoading(null));
  };

  const columns = [
    { title: "Full Name", dataIndex: ["vendor", "fullname"], key: "fullname" },
    { title: "Business Name", dataIndex: "business_name", key: "business_name" },
    {
      title: "Expiry Date",
      dataIndex: ["registration", "expiry_date"],
      key: "expiry_date",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("en-US", dateOptions) : "N/A",
    },
    {
      title: "Requested On",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date) =>
        date ? new Date(date).toLocaleDateString("en-US", dateOptions) : "N/A",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let color = "#ffa500"; // default pending
        if (status === "approved") color = "#4caf50";
        else if (status === "rejected") color = "#f44336";

        return (
          <span style={{ color, fontWeight: "bold", textTransform: "capitalize" }}>
            {status || "Pending"}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.status === "pending" ? (
          <Space>
            <Button
              type="primary"
              icon={<CheckOutlined />}
              loading={actionLoading === record.id}
              onClick={() => handleAction(record.id, "approve")}
              style={buttonStyle}
            >
              Approve
            </Button>
            <Button
              type="danger"
              icon={<CloseOutlined />}
              loading={actionLoading === record.id}
              onClick={() => handleAction(record.id, "reject")}
              style={dangerButtonStyle}
            >
              Reject
            </Button>
          </Space>
        ) : (
          <span style={{ color: "#999", fontStyle: "italic" }}>No Action</span>
        ),
    },
  ];

  // Custom pagination item render
  const paginationItemRender = (current, type, originalElement) => {
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
          border: current === activePage ? "1px solid #1D4ED8" : "1px solid transparent",
          backgroundColor: current === activePage ? "#eff6ff" : "transparent",
          fontSize: 12,
        }}
      >
        {current}
      </span>
    );
  };

  return (
    <Card
      style={{
        padding: 30,
        borderRadius: 16,
        boxShadow: "0 8px 25px rgba(0,0,0,0.08)",
        backgroundColor: "#f9fafb",
      }}
    >
      {loading && <LoadingOverlay message="Loading renewal requests..." />}
      <Title level={3} style={{ color: "#1B4F72", marginBottom: 12 }}>
        Market Registration Renewal Requests
      </Title>
      <Text type="secondary" style={{ display: "block", marginBottom: 20, fontSize: 14 }}>
        Review pending renewal requests and approve or reject.
      </Text>

      <Table
        dataSource={renewals}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          itemRender: paginationItemRender,
          onChange: (page) => setActivePage(page),
        }}
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      />
    </Card>
  );
};

export default RenewalRequests;
