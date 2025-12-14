import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Image,
  Typography,
  Space,
  Card,
  message,
  DatePicker,
  Pagination,
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

// Button styles
const primaryButton = {
  backgroundColor: "#1B4F72",
  borderColor: "#1B4F72",
  color: "#fff",
  fontWeight: 600,
};

const secondaryButton = {
  backgroundColor: "#e3f2fd",
  borderColor: "#90caf9",
  color: "#1B4F72",
  fontWeight: 600,
};

const approveButton = {
  backgroundColor: "#28a745",
  borderColor: "#28a745",
  color: "#fff",
  fontWeight: 600,
};

const rejectButton = {
  backgroundColor: "#ff4d4f",
  borderColor: "#ff4d4f",
  color: "#fff",
  fontWeight: 600,
};

const AdminApplications = () => {
  const [applications, setApplications] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [dateFilter, setDateFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const fetchApplications = async (startDate = null, endDate = null) => {
    try {
      setLoading(true);
      setLoadingMessage("Fetching Applications...");
      const params = {};
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      const res = await api.get("/applications", { params });
      let apps = res.data.applications || [];

      apps.sort((a, b) => {
        if (a.status === "pending" && b.status !== "pending") return -1;
        if (a.status !== "pending" && b.status === "pending") return 1;
        return (
          new Date(b.date_approved || b.updated_at) -
          new Date(a.date_approved || a.updated_at)
        );
      });

      setApplications(apps);
    } catch (err) {
      console.error("Error fetching applications:", err);
      message.error("Failed to fetch applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleStatusChange = async (ids, status) => {
    try {
      setLoading(true);
      setLoadingMessage(
        status === "approved"
          ? "Approving Application..."
          : "Rejecting Application..."
      );
      await Promise.all(
        ids.map((id) => api.post(`/applications/${id}/status`, { status }))
      );
      message.success(
        status === "approved"
          ? "Application approved successfully!"
          : "Application rejected successfully!"
      );
      await fetchApplications();
    } catch (err) {
      console.error("Error updating status:", err);
      message.error("Error updating status.");
    } finally {
      setLoading(false);
    }
  };

  const showConfirm = (ids, status) => {
    const isApprove = status === "approved";
    confirm({
      title: isApprove
        ? "Confirm Application Approval"
        : "Confirm Application Rejection",
      icon: (
        <ExclamationCircleOutlined
          style={{ color: isApprove ? "#52c41a" : "#ff4d4f" }}
        />
      ),
      content: isApprove
        ? "Are you sure you want to approve this application?"
        : "Are you sure you want to reject this application?",
      okText: isApprove ? "Approve" : "Reject",
      cancelText: "Cancel",
      okType: isApprove ? "primary" : "danger",
      onOk() {
        handleStatusChange(ids, status);
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
        return (
          <Tag icon={<ExclamationCircleOutlined />} color="default">
            Unknown
          </Tag>
        );
    }
  };

  const handleDateRangeChange = (dates) => setDateFilter(dates || []);
  const applyDateFilter = () => {
    if (dateFilter.length === 2) {
      const [start, end] = dateFilter;
      fetchApplications(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    } else {
      fetchApplications();
    }
  };

  const exportApplicationsPDF = (all = true) => {
    const doc = new jsPDF("p", "pt", "a4");
    const dataToExport = all
      ? applications
      : applications.slice(
          (currentPage - 1) * pageSize,
          currentPage * pageSize
        );

    const rows = dataToExport.map((app) => [
      app.vendor?.fullname || "N/A",
      app.business_name || "N/A",
      app.section?.name || "N/A",
      app.stall_details?.map((s) => `#${s.stall_number}`).join(", ") || "N/A",
      app.stall_details
        ?.reduce((sum, s) => sum + (parseFloat(s.daily_rent) || 0), 0)
        .toFixed(2),
      app.status,
      app.date_approved
        ? new Date(app.date_approved).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    ]);

    autoTable(doc, {
      head: [
        [
          "Vendor Name",
          "Business Name",
          "Section Name",
          "Stalls",
          "Daily Rent",
          "Status",
          "Date Approved",
        ],
      ],
      body: rows,
      startY: 50,
      theme: "grid",
      styles: { fontSize: 10, halign: "center", valign: "middle" },
    });

    doc.text("Applications Report", doc.internal.pageSize.getWidth() / 2, 30, {
      align: "center",
    });
    doc.save(
      all
        ? "Applications_Report_All.pdf"
        : `Applications_Report_Page${currentPage}.pdf`
    );
  };

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: ["vendor", "fullname"],
      key: "vendor",
      render: (text) => text || "—",
    },
    {
      title: "Business Name",
      dataIndex: "business_name",
      key: "business_name",
    },
    {
      title: "Section Name",
      dataIndex: ["section", "name"],
      key: "section",
    },
    {
      title: "Stalls",
      dataIndex: "stall_details",
      key: "stalls",
      render: (stalls) =>
        stalls?.map((s) => `#${s.stall_number}`).join(", ") || "—",
    },
    {
      title: "Daily Rent",
      dataIndex: "stall_details",
      key: "daily_rent",
      render: (stalls) => {
        const total = stalls?.reduce(
          (sum, s) => sum + (parseFloat(s.daily_rent) || 0),
          0
        );
        return total ? `₱${total.toFixed(2)}` : "₱0.00";
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Date Approved",
      dataIndex: "date_approved",
      key: "date_approved",
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
      title: "Letter of Intent",
      dataIndex: "letter_of_intent",
      key: "letter",
      align: "center",
      render: (img) =>
        img ? (
          <Image
            src={img}
            width={60}
            height={60}
            style={{ objectFit: "cover", borderRadius: 8, cursor: "pointer" }}
            onClick={() => setSelectedImage(img)}
            preview={false}
          />
        ) : (
          "—"
        ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          {record.status === "pending" ? (
            <>
              <Button
                icon={<CheckCircleOutlined />}
                onClick={() => showConfirm([record.id], "approved")}
                style={approveButton}
              >
                Approve
              </Button>
              <Button
                icon={<CloseCircleOutlined />}
                onClick={() => showConfirm([record.id], "rejected")}
                style={rejectButton}
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

  const handleTableChange = (pagination) => {
    setCurrentPage(pagination.current);
    setPageSize(pagination.pageSize);
  };

  const paginationItemRender = (current, type, originalElement) => {
    if (type === "prev") {
      return (
        <Button
          size="small"
          style={{
            borderRadius: 999,
            borderColor: "#d1d5db",
            padding: "0 12px",
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
            padding: "0 12px",
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
    <Card
      style={{
        padding: 20,
        borderRadius: 16,
        background: "linear-gradient(145deg, #ffffff, #f4f8fc)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      }}
    >
      {loading && <LoadingOverlay message={loadingMessage} />}

      <Space direction="vertical" style={{ width: "100%", marginBottom: 20 }}>
        <Space style={{ width: "100%", justifyContent: "space-between" }}>
          <Title level={3} style={{ color: "#1B4F72", margin: 0 }}>
            Applications
          </Title>

          <Space>
            <RangePicker
              value={dateFilter}
              format="YYYY-MM-DD"
              onChange={handleDateRangeChange}
            />
            <Button type="primary" onClick={applyDateFilter} style={primaryButton}>
              Filter by Date
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => exportApplicationsPDF(true)}
              style={secondaryButton}
            >
              Print All
            </Button>
            <Button
              icon={<PrinterOutlined />}
              onClick={() => exportApplicationsPDF(false)}
              style={secondaryButton}
            >
              Print Page
            </Button>
          </Space>
        </Space>

        <Text style={{ fontSize: 13, color: "#64748b" }}>
          Review each application carefully, then approve or reject pending items.
          You can filter applications by approval date and export them as a PDF.
        </Text>
      </Space>

      <Table
        dataSource={applications}
        columns={columns}
        rowKey="id"
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          showTotal: (total) => `Total ${total} applications`,
          itemRender: paginationItemRender,
        }}
        onChange={handleTableChange}
        bordered
      />

      <Modal
        open={!!selectedImage}
        footer={null}
        onCancel={() => setSelectedImage(null)}
        centered
      >
        <Image
          src={selectedImage}
          alt="Letter of Intent"
          width="100%"
          style={{ borderRadius: 8 }}
        />
      </Modal>
    </Card>
  );
};

export default AdminApplications;
