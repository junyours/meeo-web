import React, { useEffect, useState } from "react";
import {
  MdPhone,
  MdLocationOn,
  MdWarning,
  MdPerson,
  MdCake,
  MdWc,
  MdCheckCircle,
  MdCancel,
  MdPendingActions,
} from "react-icons/md";
import { Table, Button, Modal, Tag, message, Spin, Typography } from "antd";
import api from "../Api";

const { confirm } = Modal;
const { Title, Text } = Typography;

const AdminMeatInspectorProfiles = () => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await api.get("/meat-profiles");
      setProfiles(res.data);
    } catch (err) {
      console.error("Error fetching profiles:", err);
      message.error("Failed to fetch meat inspector profiles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const showConfirm = (id, status) => {
    confirm({
      title:
        status === "approved"
          ? "Approve this profile?"
          : "Reject this profile?",
      content:
        status === "approved"
          ? "This profile will be marked as approved."
          : "This profile will be marked as rejected.",
      okText: status === "approved" ? "Approve" : "Reject",
      okType: status === "approved" ? "primary" : "danger",
      cancelText: "Cancel",
      centered: true,
      onOk: async () => {
        try {
          setLoading(true);
          await api.patch(`/meat-profiles/${id}/status`, { status });
          message.success(
            status === "approved"
              ? "Profile approved successfully."
              : "Profile rejected successfully."
          );
          fetchProfiles();
        } catch (err) {
          console.error("Error updating status:", err);
          message.error("Failed to update status.");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const getStatusTag = (status) => {
    if (status === "approved")
      return (
        <Tag color="green" icon={<MdCheckCircle size={16} />}>
          Approved
        </Tag>
      );
    if (status === "rejected")
      return (
        <Tag color="red" icon={<MdCancel size={16} />}>
          Rejected
        </Tag>
      );
    return (
      <Tag color="gold" icon={<MdPendingActions size={16} />}>
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
      render: (v) => <Text strong>{v}</Text>,
    },
    {
      title: "Age",
      render: (_, p) => (
        <>
          <MdCake /> {p.age} yrs
        </>
      ),
    },
    {
      title: "Gender",
      render: (_, p) => (
        <>
          <MdWc /> {p.gender}
        </>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact_number",
      render: (v) => (
        <>
          <MdPhone /> {v}
        </>
      ),
    },
    {
      title: "Emergency Contact",
      dataIndex: "emergency_contact",
      render: (v) => (
        <>
          <MdWarning /> {v}
        </>
      ),
    },
    {
      title: "Address",
      dataIndex: "address",
      render: (v) => (
        <>
          <MdLocationOn /> {v}
        </>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (s) => getStatusTag(s),
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
                onClick={() => showConfirm(p.id, "approved")}
              >
                Approve
              </Button>
              <Button danger onClick={() => showConfirm(p.id, "rejected")}>
                Reject
              </Button>
            </>
          );
        }
        return <Tag color="blue">Completed</Tag>;
      },
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "#f5f6fa",
        padding: "30px",
        minHeight: "100vh",
      }}
    >
      <Title level={2} style={{ textAlign: "center", marginBottom: 25 }}>
        <MdPerson size={28} /> Meat Inspector Profiles
      </Title>

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

      {/* Image Preview Modal */}
      <Modal
        open={!!previewImage}
        footer={null}
        centered
        onCancel={() => setPreviewImage(null)}
      >
        <img
          alt="Preview"
          src={previewImage}
          style={{
            width: "300px",
            height: "300px",
            objectFit: "cover",
            borderRadius: "50%",
            border: "5px solid #1677ff",
            display: "block",
            margin: "auto",
          }}
        />
      </Modal>
    </div>
  );
};

export default AdminMeatInspectorProfiles;
