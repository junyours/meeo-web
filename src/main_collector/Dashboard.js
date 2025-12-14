import React, { useState, useEffect } from "react";
import { Layout, Typography, message, Row, Col, Card, Spin } from "antd";
import {
  DollarOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  CarOutlined,
  ShopFilled,
  GoldOutlined
} from "@ant-design/icons";
import Sidebar from "./Sidebar";
import MainProfile from "./Main_Collector_Details";
import RemittanceApproval from "./RemittanceApproval";
import MainCollectorReports from "./Reports";
import api from "../Api";

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const MainDashboard = () => {
  const [activeView, setActiveView] = useState("overview");
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/remittance/dashboard");
        setDashboardData(res.data);
      } catch (err) {
        console.error(err);
        message.error("Failed to load dashboard data");
      } finally {
        setLoadingDashboard(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const response = await api.post("/logout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        localStorage.removeItem("authToken");
        message.success("Logged out successfully");
        window.location.href = "/";
      } else message.error("Logout failed");
    } catch (err) {
      console.error(err);
      message.error("Network error");
    }
  };

  const formatPeso = (num) =>
    `₱${(Number(num) || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const cardColors = {
    estimated: "#1890ff", // blue
    remitted: "#52c41a",  // green
    pending: "#fa8c16",   // orange
  };

  const iconsMap = {
    "Wharf Collection": <ShopOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
    "Motorpool Collection": <CarOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
    "Market Collection": <ShopFilled style={{ fontSize: 28, color: "#1890ff" }} />,
    "Slaughter Collection": <GoldOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
    "Total Approved": <DollarOutlined style={{ fontSize: 28, color: "#52c41a" }} />,
    "Total Pending": <ClockCircleOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
  };

  const DashboardOverview = ({ totals }) => {
    if (!totals) return <Spin size="large" />;

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    const cards = [
      { name: "Wharf Collection", data: totals.wharf, type: "collection" },
      { name: "Motorpool Collection", data: totals.motorpool, type: "collection" },
      { name: "Market Collection", data: totals.market, type: "collection" },
      { name: "Slaughter Collection", data: totals.slaughter, type: "collection" },
      { name: "Total Approved", data: { remitted: totals.totalApproved }, type: "approved" },
      { name: "Total Pending", data: { remitted: totals.totalPending }, type: "pending" },
    ];

    return (
      <>
        <Text style={{ fontSize: 16, color: "#555", marginBottom: 16, display: "block" }}>
          Today is {today}
        </Text>
        <Row gutter={[16, 16]}>
          {cards.map((c, idx) => {
            let borderColor = cardColors.estimated;
            if (c.type === "approved") borderColor = cardColors.remitted;
            if (c.type === "pending") borderColor = cardColors.pending;

            return (
              <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                <Card
                  hoverable
                  style={{
                    borderRadius: 12,
                    borderLeft: `5px solid ${borderColor}`,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    textAlign: "center",
                    padding: 24,
                  }}
                >
                  {iconsMap[c.name] && <div style={{ marginBottom: 8 }}>{iconsMap[c.name]}</div>}
                  <Title level={5}>{c.name}</Title>

                  {c.data.estimated !== undefined && (
                    <Text type="secondary" style={{ display: "block" }}>
                      Estimated: {formatPeso(c.data.estimated)}
                    </Text>
                  )}
                  {c.type === "collection" && (
                    <Text type="secondary" style={{ display: "block" }}>Today's Collection</Text>
                  )}
                  <Title level={3} style={{ marginTop: 8 }}>
                    {formatPeso(c.data.remitted)}
                  </Title>
                </Card>
              </Col>
            );
          })}
        </Row>
      </>
    );
  };

  const renderContent = () => {
    switch (activeView) {
      case "profile": return <MainProfile />;
      case "remittance": return <RemittanceApproval />;
      case "reports": return <MainCollectorReports />;
      default: return <DashboardOverview totals={dashboardData?.totals} />;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar
        activeView={activeView}
        onMenuClick={setActiveView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onLogout={handleLogout}
      />
      <Layout style={{ marginLeft: isSidebarCollapsed ? 80 : 250, transition: "margin-left 0.3s ease" }}>
        <Header style={{
          background: "#1e3a8a",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo_meeo.png" alt="logo" style={{ width: 50, height: 50, borderRadius: "50%" }} />
            <Title level={4} style={{ color: "white", margin: 0 }}>
              {activeView === "overview" && "Staff Collector Dashboard"}
              {activeView === "profile" && "Profile"}
              {activeView === "remittance" && "Remittance Approval"}
              {activeView === "reports" && "Reports"}
            </Title>
          </div>
        </Header>
        <Content style={{ padding: "20px", backgroundColor: "#f1f5f9", flexGrow: 1, overflowY: "auto" }}>
          {loadingDashboard ? <Spin size="large" /> : renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainDashboard;
