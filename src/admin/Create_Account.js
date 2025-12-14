import React, { useEffect, useState } from "react";
import { Form, Input, Select, Button, Card, message, Typography } from "antd";
import { UserAddOutlined, LockOutlined } from "@ant-design/icons";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title } = Typography;
const { Option } = Select;

const CreateAccount = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const [form] = Form.useForm();

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        setLoadingMessage("Fetching Roles...");
        const res = await api.get("/roles");
        setRoles(res.data.roles || []);
      } catch (err) {
        console.error("Failed to fetch roles:", err);
        message.error("Failed to fetch roles.");
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      setLoadingMessage("Creating Account...");
      await api.post("/create_account", values);
      message.success("✅ Account created successfully!");
      form.resetFields();
    } catch (err) {
      console.error("Error creating account:", err);
      message.error("❌ Error creating account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f7fa, #ffffff)",
        fontFamily: "'Inter','Segoe UI', sans-serif",
        padding: 16,
      }}
    >
      {loading && <LoadingOverlay message={loadingMessage} />}

      <Card
        variant="outlined"
        style={{
          width: 400,
          borderRadius: 16,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
          backgroundColor: "#fff",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={3} style={{ color: "#154360", marginBottom: 0 }}>
            Create New Account
          </Title>
            <span style={{ fontSize: 14, color: "#6c757d" }}>
      Please select a role, enter a unique username, and create a secure password for the new user.
    </span>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Please select a role." }]}
          >
            <Select placeholder="Select Role" showSearch optionFilterProp="children">
              {roles.map((role, index) => (
                <Option key={index} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="username"
            label="Username"
            rules={[
              { required: true, message: "Username is required." },
              { min: 4, message: "Username must be at least 4 characters." },
            ]}
          >
            <Input
              prefix={<UserAddOutlined style={{ color: "#154360" }} />}
              placeholder="Enter username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Password is required." },
              { min: 6, message: "Password must be at least 6 characters." },
              {
                pattern: /[A-Z]/,
                message: "Password must contain at least 1 uppercase letter.",
              },
              {
                pattern: /[0-9]/,
                message: "Password must contain at least 1 number.",
              },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#154360" }} />}
              placeholder="Enter password"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              style={{
                height: 45,
                borderRadius: 8,
                background: "linear-gradient(90deg, #1E90FF, #63B8FF)",
                border: "none",
                fontWeight: 600,
              }}
            >
              Create Account
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateAccount;
