import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Image,
  message,
  Spin,
  Typography,
} from "antd";
import {
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import api from "../Api";

const { confirm } = Modal;
const { Title } = Typography;

const AdminVendorProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchProfiles = async () => {
  setLoading(true);
  try {
    const res = await api.get("/admin/vendor-profiles");

    // Sort by newest first (assuming each profile has a created_at field)
    const sortedProfiles = res.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setProfiles(sortedProfiles);
  } catch (err) {
    console.error("Error fetching vendor profiles:", err);
    message.error("Failed to load vendor profiles.");
  } finally {
    setLoading(false);
  }
};


  const handleValidation = (vendorId, status) => {
    confirm({
      title: `Confirm ${status === "approved" ? "Approval" : "Rejection"}`,
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure you want to ${status} this vendor? This action cannot be undone.`,
      okText: "Yes",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        setUpdating(true);
        try {
          await api.post(`/admin/vendor-profiles/${vendorId}/validate`, {
            status,
          });
          message.success(`Vendor ${status} successfully.`);
          fetchProfiles();
        } catch (err) {
          console.error("Error updating status:", err);
          message.error("Error updating vendor status.");
        } finally {
          setUpdating(false);
        }
      },
    });
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const renderPermitImage = (text, label) =>
    text ? (
      <Image
        src={text}
        alt={label}
        width={70}
        height={70}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
          boxShadow: "0 0 8px rgba(0,0,0,0.15)",
          border: "2px solid #e0e0e0",
        }}
      />
    ) : (
      <Tag color="default">No File</Tag>
    );

  const columns = [
    {
      title: "Full Name",
      dataIndex: "fullname",
      key: "fullname",
      render: (text) => <strong>{text}</strong>,
    },
    { title: "Age", dataIndex: "age", key: "age" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
    { title: "Contact", dataIndex: "contact_number", key: "contact_number" },
    {
      title: "Emergency",
      dataIndex: "emergency_contact",
      key: "emergency_contact",
    },
    { title: "Address", dataIndex: "address", key: "address" },
    {
      title: "Business Permit",
      dataIndex: "business_permit",
      key: "business_permit",
      render: (text) => renderPermitImage(text, "business_permit"),
    },
    {
      title: "Sanitary Permit",
      dataIndex: "sanitary_permit",
      key: "sanitary_permit",
      render: (text) => renderPermitImage(text, "sanitary_permit"),
    },
    {
      title: "DTI Registration",
      dataIndex: "dti_permit",
      key: "dti_permit",
      render: (text) => renderPermitImage(text, "dti_permit"),
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      render: (status) => {
        let color = "gold";
        let icon = <ExclamationCircleOutlined />;
        if (status === "approved") {
          color = "green";
          icon = <CheckCircleOutlined />;
        } else if (status === "rejected") {
          color = "red";
          icon = <CloseCircleOutlined />;
        }
        return (
          <Tag icon={icon} color={color} style={{ textTransform: "capitalize" }}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.Status === "approved" ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Approved
          </Tag>
        ) : (
          <div style={{ display: "flex", gap: "8px" }}>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleValidation(record.id, "approved")}
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              icon={<CloseCircleOutlined />}
              onClick={() => handleValidation(record.id, "rejected")}
            >
              Reject
            </Button>
          </div>
        ),
    },
  ];

  return (
    <div
      style={{
        background: "#fff",
        padding: "30px",
        borderRadius: "16px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        margin: "20px",
        minHeight: "400px",
      }}
    >
      {/* Title */}
      <Title
        level={3}
        style={{
          marginBottom: 25,
          color: "#1E293B",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        <ShopOutlined /> Vendor Profiles
      </Title>

      {/* Animated Table Header Style */}
      <style>{`
        @keyframes shine {
          0% { background-position: -200px; }
          100% { background-position: 200px; }
        }
        
      `}</style>

      <Spin spinning={loading || updating} tip="Loading vendor profiles...">
        <Table
          columns={columns}
          dataSource={profiles}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          bordered
          style={{
            borderRadius: "12px",
            overflow: "hidden",
          }}
        />
      </Spin>
    </div>
  );
};

export default AdminVendorProfiles;
