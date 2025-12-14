import React, { useEffect, useState } from "react";
import { Table, Card, Typography, Spin, message, Tag, Empty } from "antd";
import api from "../Api"; // your Axios instance
import dayjs from "dayjs";

const { Title, Text } = Typography;

const BlocklistedVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBlocklistedVendors = async () => {
    setLoading(true);
    try {
      const res = await api.get("/rented/blocklisted"); 
      setVendors(res.data);
    } catch (err) {
      console.error(err);
      message.error("Failed to fetch blocklisted vendors.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocklistedVendors();
  }, []);

  const columns = [
    {
      title: "Vendor Name",
      dataIndex: ["application", "vendor", "fullname"],
      key: "vendor_name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Stall Number",
      dataIndex: ["stall", "stall_number"],
      key: "stall_number",
      render: (text) => <Text>{text}</Text>,
    },
    {
      title: "Missed Days",
      dataIndex: "missed_days",
      key: "missed_days",
      render: (value) => (
        <Tag color={value > 20 ? "red" : "green"}>{value}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (value) =>
        value === "unoccupied" ? (
          <Tag color="volcano" style={{ fontWeight: "bold" }}>
            BLOCKLISTED
          </Tag>
        ) : (
          <Tag color="blue" style={{ fontWeight: "bold" }}>
            {value.toUpperCase()}
          </Tag>
        ),
    },
  ];

  return (
    <Card
      title={<Title level={4}>Blocklisted Vendors</Title>}
      style={{
        borderRadius: 20,
        boxShadow: "0 12px 30px rgba(0,0,0,0.12)",
        padding: 24,
        backgroundColor: "#fafafa",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <Spin size="large" tip="Loading blocklisted vendors..." />
        </div>
      ) : vendors.length === 0 ? (
        <Empty description="No blocklisted vendors found." />
      ) : (
        <Table
          dataSource={vendors}
          columns={columns}
          rowKey={(record) => record.id}
          pagination={{ pageSize: 8 }}
          bordered={false}
          style={{ background: "#fff", borderRadius: 16 }}
          rowClassName={() => "vendor-row"}
        />
      )}
    </Card>
  );
};

export default BlocklistedVendors;
