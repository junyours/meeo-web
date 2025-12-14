import React, { useEffect, useState } from "react";
import { Table, Button, Modal, message, Tag, Space, Input, Card, Typography } from "antd";
import api from "../Api";

const { TextArea } = Input;
const { Title, Text } = Typography;

const primaryColor = "#1B4F72";
const secondaryColor = "#e3f2fd";

const AdminRemoveStall = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [reasonModalVisible, setReasonModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState("");
  const [rejectMessage, setRejectMessage] = useState("");
  const [activePage, setActivePage] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stall-removal-requests");
      const mapped = (res.data.requests || []).map((r) => ({
        ...r,
        request_id: r.id,
        request_status: r.request_status,
        request_message: r.request_message,
      }));
      setRequests(mapped);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch removal requests");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request, type) => {
    setSelectedRequest(request);
    setActionType(type);
    setRejectMessage("");
    setActionModalVisible(true);
  };

  const handleViewReason = (request) => {
    setSelectedRequest(request);
    setReasonModalVisible(true);
  };

  const confirmAction = async () => {
    if (!selectedRequest || !actionType) return;
    try {
      const endpoint =
        actionType === "approve"
          ? `/admin/stall-removal-requests/${selectedRequest.request_id}/approve`
          : `/admin/stall-removal-requests/${selectedRequest.request_id}/reject`;

      const payload = actionType === "reject" ? { reason: rejectMessage } : {};
      const res = await api.post(endpoint, payload);

      message.success(res.data.message || "Action successful");
      setActionModalVisible(false);
      fetchRequests();
    } catch (err) {
      console.error(err);
      message.error("Failed to perform action");
    }
  };

  const buttonPrimary = {
    backgroundColor: primaryColor,
    borderColor: primaryColor,
    color: "#fff",
    fontWeight: "bold",
    borderRadius: 8,
  };
  const buttonSecondary = {
    backgroundColor: secondaryColor,
    borderColor: "#90caf9",
    color: primaryColor,
    fontWeight: "bold",
    borderRadius: 8,
  };

  const columns = [
    { title: "Stall #", dataIndex: "stall_number", key: "stall_number" },
    { title: "Section", dataIndex: ["section", "name"], key: "section" },
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor",
      render: (name) => name || "N/A",
    },
    {
      title: "Daily Rent",
      dataIndex: "daily_rent",
      key: "daily_rent",
      render: (val) => `₱${val || 0}`,
    },
    {
      title: "Request Status",
      key: "request_status",
      render: (_, record) => {
        const statusColor = {
          pending: "gold",
          approved: "green",
          rejected: "red",
        };
        return <Tag color={statusColor[record.request_status] || "default"}>{record.request_status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Reason",
      dataIndex: "request_message",
      key: "request_message",
      render: (_, record) => (
        <Button
          type="link"
          style={{ padding: 0, color: primaryColor }}
          onClick={() => handleViewReason(record)}
        >
          View Reason
        </Button>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => {
        if (record.request_status !== "pending")
          return <Tag color="default">No Action</Tag>;
        return (
          <Space size="middle">
            <Button
              style={{ ...buttonPrimary }}
              onClick={() => handleAction(record, "approve")}
            >
              Approve
            </Button>
            <Button
              style={{ ...buttonSecondary }}
              onClick={() => handleAction(record, "reject")}
            >
              Reject
            </Button>
          </Space>
        );
      },
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
      <Title level={3} style={{ color: primaryColor, marginBottom: 6 }}>
        Stall Removal Requests
      </Title>
      <Text
        style={{
          display: "block",
          marginBottom: 24,
          color: "#64748b",
          fontSize: 14,
        }}
      >
        Review each stall removal request, check the vendor’s reason, then
        approve or reject. Rejected requests must include a clear explanation.
      </Text>

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="request_id"
        loading={loading}
        pagination={{
          pageSize: 5,
          showSizeChanger: false,
          itemRender: paginationItemRender,
          onChange: (page) => setActivePage(page),
        }}
        bordered
        style={{
          borderRadius: 12,
          overflow: "hidden",
          backgroundColor: "#fff",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      />

      {/* Action Modal */}
      <Modal
        title={actionType === "approve" ? "Approve Removal" : "Reject Removal"}
        open={actionModalVisible}
        onOk={confirmAction}
        onCancel={() => setActionModalVisible(false)}
        okText={actionType === "approve" ? "Yes, Approve" : "Yes, Reject"}
        okButtonProps={{
          style: actionType === "approve" ? buttonPrimary : buttonSecondary,
        }}
        bodyStyle={{ padding: 24 }}
      >
        <Text style={{ display: "block", marginBottom: 16 }}>
          Are you sure you want to <strong>{actionType}</strong> the removal of Stall #
          {selectedRequest?.stall_number}?
        </Text>
        {actionType === "reject" && (
          <TextArea
            placeholder="Enter reason for rejection"
            value={rejectMessage}
            onChange={(e) => setRejectMessage(e.target.value)}
            rows={4}
            style={{ borderRadius: 8 }}
          />
        )}
      </Modal>

      {/* Reason Modal */}
      <Modal
        title="Reason"
        open={reasonModalVisible}
        onOk={() => setReasonModalVisible(false)}
        onCancel={() => setReasonModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            style={{ ...buttonPrimary }}
            onClick={() => setReasonModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        bodyStyle={{ padding: 24 }}
      >
        <Text style={{ display: "block", marginBottom: 12 }}>
          <strong>
            {selectedRequest?.request_status === "rejected"
              ? "Rejection Reason"
              : "Vendor Reason"}
            :
          </strong>
        </Text>
        <Text>{selectedRequest?.request_message || "-"}</Text>
      </Modal>
    </Card>
  );
};

export default AdminRemoveStall;
