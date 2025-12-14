import React, { useEffect, useState } from "react";
import {
  PhoneOutlined,
  EnvironmentOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ManOutlined,
  WomanOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Table, Button, Select, Modal, Tag, Spin, Typography, message } from "antd";
import api from "../Api";

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const AdminInchargeProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/incharge-profiles");
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleValidation = async (id, status) => {
    confirm({
      title: `Are you sure you want to ${status} this profile?`,
      icon: <ExclamationCircleOutlined />,
      onOk: async () => {
        try {
          setLoading(true);
          await api.patch(`/admin/incharge-profiles/${id}/status`, { status });
          message.success(
            status === "approved" ? "Profile approved." : "Profile rejected."
          );
          fetchProfiles();
        } catch (err) {
          console.error("Error:", err);
          message.error("Action failed.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAssignArea = async (id, area) => {
    try {
      setLoading(true);
      await api.patch(`/admin/incharge-profiles/${id}/assign`, { area });
      message.success("Area assigned successfully.");
      fetchProfiles();
    } catch (err) {
      console.error("Error assigning area:", err);
      message.error("Failed to assign area.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
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
  };

  const columns = [
    {
      title: "Profile",
      dataIndex: "profile_picture",
      render: (img) => (
        <img
          src={img || "https://via.placeholder.com/80"}
          alt="Profile"
          style={{
            width: 60,
            height: 60,
            borderRadius: "50%",
            objectFit: "cover",
            cursor: "pointer",
            border: "3px solid #1677ff",
          }}
          onClick={() => setPreviewImage(img)}
        />
      ),
    },
    {
      title: "Full Name",
      dataIndex: "fullname",
      render: (val) => <Text strong>{val}</Text>,
    },
    {
      title: "Age",
      render: (_, p) => (
        <>
          <CalendarOutlined /> {p.age} yrs
        </>
      ),
    },
    {
      title: "Gender",
      render: (_, p) => (
        <>
          {p.gender === "Male" ? <ManOutlined /> : <WomanOutlined />} {p.gender}
        </>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact_number",
      render: (val) => (
        <>
          <PhoneOutlined /> {val}
        </>
      ),
    },
    {
      title: "Emergency Contact",
      dataIndex: "emergency_contact",
      render: (val) => (
        <>
          <ExclamationCircleOutlined /> {val}
        </>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      render: (val) => (
        <>
          <EnvironmentOutlined /> {val}
        </>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (val) => getStatusTag(val),
    },
    {
      title: "Assigned Area",
      render: (_, p) => p.area || "—",
    },
    {
      title: "Actions",
      render: (_, p) => {
        if (p.Status === "pending") {
          return (
            <>
              <Button
                type="primary"
                style={{ marginRight: 8 }}
                onClick={() => handleValidation(p.id, "approved")}
              >
                Approve
              </Button>
              <Button danger onClick={() => handleValidation(p.id, "rejected")}>
                Reject
              </Button>
            </>
          );
        }

        if (p.Status === "approved" && !p.area) {
          return (
            <Select
              placeholder="Assign Area"
              style={{ width: 150 }}
              onChange={(value) => handleAssignArea(p.id, value)}
            >
              <Option value="market">Market</Option>
              <Option value="wharf">Wharf</Option>
              <Option value="motorpool">Motorpool</Option>
              <Option value="slaughter">Slaughter</Option>
            </Select>
          );
        }

        return <Tag color="blue">Active</Tag>;
      },
    },
  ];

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh", padding: "30px" }}>
      <Title level={2} style={{ textAlign: "center", marginBottom: 30 }}>
        <UserOutlined /> In-Charge Collector Profiles
      </Title>
       <span style={{ display: "block", textAlign: "center", color: "#6c757d", marginBottom: 20 }}>
    Review pending profiles, approve or reject them, and assign areas to approved collectors.
  </span>

      <Spin spinning={loading} tip="Loading...">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={profiles}
          bordered
          pagination={{ pageSize: 6 }}
          style={{
            background: "white",
            borderRadius: 16,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        />
      </Spin>

      <Modal
        open={!!previewImage}
        footer={null}
        centered
        onCancel={() => setPreviewImage(null)}
      >
        <img
          src={previewImage}
          alt="Preview"
          style={{
            width: "300px",
            height: "300px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "5px solid #1677ff",
            display: "block",
            margin: "auto",
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminInchargeProfiles;
