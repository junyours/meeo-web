import React, { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Spin, Typography, message } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../Api";

const { Title } = Typography;
const { confirm } = Modal;

const AdminMainProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/main-profiles");
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching main profiles:", err);
      message.error("Failed to fetch profiles.");
    } finally {
      setLoading(false);
    }
  };

  const handleValidation = async (id, status) => {
    confirm({
      title: `Are you sure you want to ${status} this profile?`,
      icon: <ExclamationCircleOutlined />,
      okText: "Yes",
      cancelText: "No",
      onOk: async () => {
        try {
          setLoading(true);
          await api.patch(`/admin/main-profiles/${id}/status`, { status });
          message.success(`Profile ${status} successfully!`);
          fetchProfiles();
        } catch (err) {
          console.error("Error updating status:", err);
          message.error("Action failed.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const columns = [
    {
      title: "Fullname",
      dataIndex: "fullname",
      key: "fullname",
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: "Age",
      dataIndex: "age",
      key: "age",
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
    },
    {
      title: "Contact",
      dataIndex: "contact_number",
      key: "contact_number",
    },
    {
      title: "Emergency Contact",
      dataIndex: "emergency_contact",
      key: "emergency_contact",
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Status",
      dataIndex: "Status",
      key: "Status",
      render: (status) => {
        if (status === "approved")
          return (
            <Tag color="green" icon={<CheckCircleOutlined />}>
              Approved
            </Tag>
          );
        if (status === "rejected")
          return (
            <Tag color="red" icon={<CloseCircleOutlined />}>
              Rejected
            </Tag>
          );
        return (
          <Tag color="orange" icon={<ClockCircleOutlined />}>
            Pending
          </Tag>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) =>
        record.Status === "pending" ? (
          <>
            <Button
              type="primary"
              size="small"
              style={{ marginRight: 8 }}
              onClick={() => handleValidation(record.id, "approved")}
            >
              Approve
            </Button>
            <Button
              danger
              size="small"
              onClick={() => handleValidation(record.id, "rejected")}
            >
              Reject
            </Button>
          </>
        ) : (
          <Tag color="blue" icon={<CheckCircleOutlined />}>
            Done
          </Tag>
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
        <UserOutlined /> Staff Collector Profiles
      </Title>
<span style={{ display: "block", marginBottom: 20, color: "#6c757d" }}>
    Review pending staff profiles, approve or reject them as needed.
  </span>
      <Spin spinning={loading} tip="Loading...">
        <Table
          columns={columns}
          dataSource={profiles}
          rowKey="id"
          pagination={{ pageSize: 6 }}
          bordered
          style={{ borderRadius: "12px", overflow: "hidden" }}
        />
      </Spin>
    </div>
  );
};



export default AdminMainProfiles;
