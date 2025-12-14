import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Space,
  Card,
  Typography,
  message,
  Modal,
  DatePicker,
} from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const buttonStyle = {
  backgroundColor: "#1B4F72",
  borderColor: "#1B4F72",
  color: "#fff",
  fontWeight: "bold",
};

const secondaryButtonStyle = {
  backgroundColor: "#e3f2fd",
  borderColor: "#90caf9",
  color: "#1B4F72",
  fontWeight: "bold",
};

const approveButtonStyle = {
  backgroundColor: "#28a745",
  borderColor: "#28a745",
  color: "#fff",
  fontWeight: "bold",
};

const rejectButtonStyle = {
  backgroundColor: "#ff4d4f",
  borderColor: "#ff4d4f",
  color: "#fff",
  fontWeight: "bold",
};

const AdminStallChangeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [dateFilter, setDateFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const fetchRequests = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setLoadingMessage("Fetching Stall Change Requests...");
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const res = await api.get("/stall-change-requests", { params });
      setRequests(res.data.requests || []);
    } catch (err) {
      console.error("Error fetching stall change requests:", err);
      message.error("Failed to fetch stall change requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      setLoading(true);
      setLoadingMessage(
        status === "approved" ? "Approving request..." : "Rejecting request..."
      );
      await api.put(`/stall-change-requests/${id}/status`, { status });
      message.success(
        status === "approved"
          ? "Request approved successfully!"
          : "Request rejected successfully!"
      );
      await fetchRequests();
    } catch (err) {
      console.error("Error updating request status:", err);
      message.error("Failed to update request status.");
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = (id, status) => {
    const isApprove = status === "approved";
    confirm({
      title: isApprove ? "Approve Request?" : "Reject Request?",
      icon: (
        <ExclamationCircleOutlined
          style={{ color: isApprove ? "#52c41a" : "#ff4d4f" }}
        />
      ),
      content: isApprove
        ? "Are you sure you want to approve this stall change request?"
        : "Are you sure you want to reject this stall change request?",
      okText: isApprove ? "Yes, Approve" : "Yes, Reject",
      cancelText: "Cancel",
      okType: isApprove ? "primary" : "danger",
      centered: true,
      async onOk() {
        await handleStatusChange(id, status);
      },
    });
  };

  const getStatusTag = (status) => {
    switch (status) {
      case "approved":
        return (
          <Tag icon={<CheckCircleOutlined />} color="success">
            Approved
          </Tag>
        );
      case "rejected":
        return (
          <Tag icon={<CloseCircleOutlined />} color="error">
            Rejected
          </Tag>
        );
      case "pending":
        return (
          <Tag icon={<ClockCircleOutlined />} color="warning">
            Pending
          </Tag>
        );
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  const handleDateRangeChange = (dates) => {
    setDateFilter(dates || []);
  };

  const applyDateFilter = () => {
    if (dateFilter.length === 2) {
      const [start, end] = dateFilter;
      fetchRequests(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    } else {
      fetchRequests();
    }
  };

  const exportRequestsPDF = (all = true) => {
    const doc = new jsPDF("p", "pt", "a4");
    const dataToExport = all
      ? requests
      : requests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const rows = dataToExport.map((req) => [
      req.vendor?.fullname || "N/A",
      req.business_name || "N/A",
      req.section?.name || "N/A",
      req.current_stalls?.length ? req.current_stalls.join(", ") : "—",
      req.new_stalls?.length ? req.new_stalls.join(", ") : "—",
      req.status,
      req.updated_at
        ? new Date(req.updated_at).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    ]);

    autoTable(doc, {
      head: [
        [
          "Vendor",
          "Business",
          "Section",
          "Current Stalls",
          "Requested Stalls",
          "Status",
          "Date Approved",
        ],
      ],
      body: rows,
      startY: 50,
      theme: "grid",
      styles: {
        fontSize: 10,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
    });

    doc.text(
      "Stall Change Requests Report",
      doc.internal.pageSize.getWidth() / 2,
      30,
      {
        align: "center",
      }
    );

    doc.save(
      all
        ? "Stall_Change_Requests_All.pdf"
        : `Stall_Change_Requests_Page${currentPage}.pdf`
    );
  };

  const columns = [
    {
      title: "Vendor",
      dataIndex: ["vendor", "fullname"],
      key: "vendor",
      render: (text) => text || "—",
    },
    {
      title: "Business",
      dataIndex: "business_name",
      key: "business_name",
    },
    {
      title: "Section",
      dataIndex: ["section", "name"],
      key: "section",
    },
    {
      title: "Current Stalls",
      dataIndex: "current_stalls",
      key: "current_stalls",
      render: (stalls) => (stalls?.length ? stalls.join(", ") : "—"),
    },
    {
      title: "Requested Stalls",
      dataIndex: "new_stalls",
      key: "new_stalls",
      render: (stalls) => (stalls?.length ? stalls.join(", ") : "—"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Date Approved",
      dataIndex: "updated_at",
      key: "updated_at",
      render: (text) =>
        text
          ? new Date(text).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "—",
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          {record.status === "pending" ? (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => showConfirmModal(record.id, "approved")}
                style={approveButtonStyle}
              >
                Approve
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => showConfirmModal(record.id, "rejected")}
                style={rejectButtonStyle}
              >
                Reject
              </Button>
            </>
          ) : (
            <Tag color="default">No Action</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      style={{
        padding: 20,
        borderRadius: 16,
        background: "linear-gradient(145deg, #ffffff, #f4f8fc)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      }}
    >
      {loading && <LoadingOverlay message={loadingMessage} />}

      <Space
        direction="vertical"
        style={{
          width: "100%",
          marginBottom: 20,
        }}
      >
        <Space
          style={{
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <Title level={3} style={{ color: "#1B4F72", margin: 0 }}>
            Stall Change Requests
          </Title>

          <Space>
            <RangePicker
              value={dateFilter}
              format="YYYY-MM-DD"
              onChange={handleDateRangeChange}
            />
            <Button
              type="primary"
              onClick={applyDateFilter}
              style={buttonStyle}
            >
              Filter by Date Approved
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => exportRequestsPDF(true)}
              style={secondaryButtonStyle}
            >
              Print All
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => exportRequestsPDF(false)}
              style={secondaryButtonStyle}
            >
              Print Current Page
            </Button>
          </Space>
        </Space>

        {/* 🔹 Helper span / message */}
        <Text
          style={{
            fontSize: 13,
            color: "#64748b",
          }}
        >
          Review each stall change request, then approve or reject pending items.
          You can filter by approval date and export the list as a PDF for
          documentation.
        </Text>
      </Space>

      <Table
        dataSource={requests}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize,
          showTotal: (total) => `Total ${total} requests`,
          onChange: (page) => setCurrentPage(page),
        }}
        bordered
      />
    </Card>
  );
};

export default AdminStallChangeRequests;
