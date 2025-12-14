import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Skeleton,
  Typography,
  Row,
  Col,
  Tag,
  message,
} from "antd";
import api from "../Api";

const { Title, Text } = Typography;
const { Option } = Select;

const MainProfile = () => {
  const [form] = Form.useForm();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await api.get("/admin/main-details", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        if (response.data) {
          const data = response.data;
          setProfile(data);

          const formValues = {
            fullname: data.fullname || "",
            age: data.age || "",
            gender: data.gender || "",
            contact_number: data.contact_number || "",
            emergency_contact: data.emergency_contact || "",
            address: data.address || "",
          };

          form.setFieldsValue(formValues);

          const isSubmitted =
            data.fullname &&
            data.age &&
            data.gender &&
            data.contact_number &&
            data.emergency_contact &&
            data.address;

          setSubmitted(!!isSubmitted);
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        message.error("Failed to fetch profile details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const handleSubmit = async (values) => {
    setFormSubmitting(true);

    try {
      const response = await api.post("/admin/main-details", values, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      setProfile(response.data);
      setSubmitted(true);
      setEditMode(false);
      message.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error submitting profile:", error);
      message.error("Failed to save profile.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const profileStatusTag = (status) => {
    if (!status) return <Tag color="default">No Status</Tag>;
    const lower = String(status).toLowerCase();
    if (lower === "active") return <Tag color="green">ACTIVE</Tag>;
    if (lower === "inactive") return <Tag color="red">INACTIVE</Tag>;
    return <Tag color="blue">{status.toUpperCase()}</Tag>;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "32px",
        background: "linear-gradient(135deg, #f3f4f6, #e5e7eb)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
      }}
    >
      {/* Internal CSS for primary buttons + layout tweaks */}
      <style>{`
        .profile-card {
          max-width: 900px;
          width: 100%;
          border-radius: 20px !important;
          box-shadow: 0 15px 30px rgba(15, 23, 42, 0.12) !important;
          border: none !important;
        }

        .profile-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }

        .profile-subtitle {
          color: #6b7280;
          font-size: 14px;
        }

        .profile-divider {
          height: 3px;
          width: 72px;
          border-radius: 999px;
          background: linear-gradient(90deg, #0ea5e9, #6366f1);
          margin-bottom: 24px;
        }

        .primary-action-btn {
          background-color: #ffffff !important;
          border-color: #ffffff !important;
          color: #000000 !important;
          font-weight: 600;
          border-radius: 999px !important;
          padding: 0 20px !important;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
        }

        .primary-action-btn:hover,
        .primary-action-btn:focus {
          background-color: #38bdf8 !important; /* sky blue */
          border-color: #38bdf8 !important;
          color: #ffffff !important;
        }

        .secondary-btn {
          border-radius: 999px !important;
        }

        .profile-summary-row {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px 18px;
          margin-bottom: 8px;
        }

        .profile-label {
          font-size: 13px;
          color: #6b7280;
        }

        .profile-value {
          font-size: 15px;
          color: #111827;
          font-weight: 500;
        }
      `}</style>

      <Card className="profile-card">
        <div className="profile-header">
          <Title level={3} style={{ marginBottom: 0, color: "#111827" }}>
            Staff Collector Profile
          </Title>
          <span className="profile-subtitle">
            Manage your personal and contact information used across the system.
          </span>
        </div>
        <div className="profile-divider" />

        {loading ? (
          <>
            <Skeleton active paragraph={{ rows: 3 }} />
            <Skeleton
              active
              paragraph={{ rows: 3 }}
              style={{ marginTop: 16 }}
            />
          </>
        ) : !submitted || editMode ? (
          <>
            <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
              <Col>
                <Text type="secondary">
                  Please provide your complete details. Fields marked with * are
                  required.
                </Text>
              </Col>
              {submitted && (
                <Col>
                  <Button
                    className="secondary-btn"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </Button>
                </Col>
              )}
            </Row>

            <Form
              layout="vertical"
              form={form}
              onFinish={handleSubmit}
              requiredMark="optional"
            >
              <Row gutter={[16, 8]}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Fullname"
                    name="fullname"
                    rules={[
                      { required: true, message: "Please enter your fullname" },
                    ]}
                  >
                    <Input placeholder="Enter your full name" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    label="Age"
                    name="age"
                    rules={[
                      { required: true, message: "Please enter your age" },
                    ]}
                  >
                    <Input placeholder="Age" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    label="Gender"
                    name="gender"
                    rules={[
                      { required: true, message: "Please select gender" },
                    ]}
                  >
                    <Select placeholder="Select gender">
                      <Option value="male">Male</Option>
                      <Option value="female">Female</Option>
                      <Option value="others">Others</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Contact Number"
                    name="contact_number"
                    rules={[
                      {
                        required: true,
                        message: "Please enter your contact number",
                      },
                    ]}
                  >
                    <Input placeholder="09XX-XXX-XXXX" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label="Emergency Contact"
                    name="emergency_contact"
                    rules={[
                      {
                        required: true,
                        message: "Please enter emergency contact",
                      },
                    ]}
                  >
                    <Input placeholder="Person to contact in case of emergency" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    label="Address"
                    name="address"
                    rules={[
                      { required: true, message: "Please enter your address" },
                    ]}
                  >
                    <Input.TextArea
                      placeholder="Complete address"
                      rows={3}
                      autoSize={{ minRows: 2, maxRows: 4 }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row justify="space-between" align="middle">
                <Col>
                  {profile?.Status && (
                    <>
                      <Text type="secondary" style={{ marginRight: 8 }}>
                        Current Status:
                      </Text>
                      {profileStatusTag(profile.Status)}
                    </>
                  )}
                </Col>
                <Col>
                  <Button
                    htmlType="submit"
                    type="primary"
                    loading={formSubmitting}
                    className="primary-action-btn"
                  >
                    {editMode || submitted ? "Update Profile" : "Submit Profile"}
                  </Button>
                </Col>
              </Row>
            </Form>
          </>
        ) : (
          <>
            <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
              <Col>
                <Text type="secondary">
                  Review your profile details. Click{" "}
                  <Text strong>Update Profile</Text> to make changes.
                </Text>
              </Col>
              <Col>
                {profile?.Status && profileStatusTag(profile.Status)}
              </Col>
            </Row>

            <div style={{ marginBottom: 16 }}>
              <div className="profile-summary-row">
                <div className="profile-label">Fullname</div>
                <div className="profile-value">{profile.fullname}</div>
              </div>
              <div className="profile-summary-row">
                <div className="profile-label">Age</div>
                <div className="profile-value">{profile.age}</div>
              </div>
              <div className="profile-summary-row">
                <div className="profile-label">Gender</div>
                <div className="profile-value">
                  {profile.gender
                    ? profile.gender.charAt(0).toUpperCase() +
                      profile.gender.slice(1)
                    : "-"}
                </div>
              </div>
              <div className="profile-summary-row">
                <div className="profile-label">Contact Number</div>
                <div className="profile-value">{profile.contact_number}</div>
              </div>
              <div className="profile-summary-row">
                <div className="profile-label">Emergency Contact</div>
                <div className="profile-value">{profile.emergency_contact}</div>
              </div>
              <div className="profile-summary-row">
                <div className="profile-label">Address</div>
                <div className="profile-value">{profile.address}</div>
              </div>
            </div>

            <Row justify="end">
              <Button
                className="primary-action-btn"
                onClick={() => {
                  setEditMode(true);
                  form.setFieldsValue({
                    fullname: profile.fullname || "",
                    age: profile.age || "",
                    gender: profile.gender || "",
                    contact_number: profile.contact_number || "",
                    emergency_contact: profile.emergency_contact || "",
                    address: profile.address || "",
                  });
                }}
              >
                Update Profile
              </Button>
            </Row>
          </>
        )}
      </Card>
    </div>
  );
};

export default MainProfile;
