import React, { useState, useEffect } from "react";
import {
  Layout,
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Divider,
} from "antd";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { FiTrendingUp } from "react-icons/fi";
import { FaStore, FaUsers, FaUserTie, FaClipboardList } from "react-icons/fa";

import Sidebar from "./Sidebar";
import SectionManager from "./SectionManager";
import CreateAccount from "./Create_Account";
import AdminApplications from "./ApplicationForm";
import AdminVendorProfiles from "./VendorProfile";
import MarketRegistration from "./MarketRegistration";
import AdminInchargeProfiles from "./InchargeProfile";
import AdminMainProfiles from "./MainCollectorProfile";
import VendorsMissedPayments from "./VendorMissedDay";
import MarketReport from "./MarketReport";
import SlaughterReport from "./SlaughterReport";
import AdminMeatInspectorProfiles from "./MeatInspectorProfile";
import AdminStallChangeRequests from "./AdminStallChangeRequests";
import CollectorReports from "./CollectorReports";
import Reports from "./Reports";
import StallHistory from "./StallHistory";
import UnremittedPayments from "./UnremittedPayments";
import WharfReport from "./WharfReport";
import MotorPoolReport from "./MotorPoolReport";
import AdminRemoveStall from "./AdminRemoveStall";
import TargetsReports from "./TargetsReports";
import LoadingOverlay from "./Loading";
import RenewalRequests from "./RenewalRequest";
import NotificationBell from "./NotificationBell";
import api from "../Api";
import BlocklistedVendors from "./BlockListed";

const { Content, Header } = Layout;
const { Title, Text } = Typography;

const DEPT_COLORS = ["#2563EB", "#22C55E", "#FACC15", "#F97316"]; // refreshed palette

const AdminDashboard = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [stats, setStats] = useState({
    rentedStalls: 0,
    availableStalls: 0,
    vendors: 0,
    incharges: 0,
    main: 0,
    meat: 0,
  });
  const [departmentTotals, setDepartmentTotals] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

   const primaryColor = "#1B4F72";

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/dashboard-stats");
        setStats(data);
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchDepartmentReports = async () => {
      try {
        setLoading(true);
        const currentYear = new Date().getFullYear();
        const [marketRes, wharfRes, motorRes, slaughterRes] =
          await Promise.all([
            api.get(`/reports/market?year=${currentYear}`),
            api.get(`/reports/wharf?year=${currentYear}`),
            api.get(`/reports/motorpool?year=${currentYear}`),
            api.get(`/slaughter-report?year=${currentYear}`),
          ]);

        const months = wharfRes.data.months.map((month, i) => ({
          month: month.month,
          Wharf: month.days.reduce((sum, d) => sum + d.total_amount, 0),
          Motorpool:
            motorRes.data.months[i]?.days.reduce(
              (sum, d) => sum + d.total_amount,
              0
            ) || 0,
          Market:
            marketRes.data.months[i]?.days.reduce(
              (sum, d) => sum + d.total_amount,
              0
            ) || 0,
          Slaughter:
            slaughterRes.data.months[i]?.days.reduce(
              (sum, d) => sum + d.total_amount,
              0
            ) || 0,
        }));

        setDepartmentTotals([
          {
            name: "Wharf",
            value: months.reduce((a, b) => a + b.Wharf, 0) || 1,
          },
          {
            name: "Motorpool",
            value: months.reduce((a, b) => a + b.Motorpool, 0) || 1,
          },
          {
            name: "Market",
            value: months.reduce((a, b) => a + b.Market, 0) || 1,
          },
          {
            name: "Slaughter",
            value: months.reduce((a, b) => a + b.Slaughter, 0) || 1,
          },
        ]);

        setMonthlyTrend(months);
      } catch (err) {
        console.error(err);
        setDepartmentTotals([]);
        setMonthlyTrend([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDepartmentReports();
  }, []);

  // --- UI components ---

  const StatCard = ({ title, value, icon, color, targetView }) => (
    <Card
      hoverable
      onClick={() => targetView && setActiveView(targetView)}
      style={{
        borderRadius: 16,
        border: "1px solid #e5e7eb",
        boxShadow: "0 6px 14px rgba(15,23,42,0.05)",
        cursor: targetView ? "pointer" : "default",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
      bodyStyle={{ padding: 16 }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-1px)";
        e.currentTarget.style.boxShadow = "0 10px 20px rgba(15,23,42,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 6px 14px rgba(15,23,42,0.05)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            background: color + "15",
            color: color,
            borderRadius: 14,
            padding: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <Text
            type="secondary"
            style={{
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: 0.6,
            }}
          >
            {title}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text
              strong
              style={{
                fontSize: 18,
                color: "#0f172a",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </Text>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderDashboard = () => (
    <div style={{ padding: "12px 8px" }}>
      {/* Page heading */}
      <div
        style={{
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <Title
          level={3}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 0,
            color: primaryColor,
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: "999px",
              background:
                "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(16,185,129,0.12))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FiTrendingUp />
          </span>
          Admin Dashboard Overview
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          System analytics, collection summaries, and account overview.
        </Text>
      </div>

      {/* Stat cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Available Stalls"
            value={stats.availableStalls}
            icon={<FaStore />}
            color="#22c55e"
            targetView="market-section-stalls"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Rented Stalls"
            value={stats.rentedStalls}
            icon={<FaStore />}
            color="#ef4444"
            targetView="market-section-stalls"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Vendors"
            value={stats.vendors}
            icon={<FaUsers />}
            color="#3b82f6"
            targetView="vendor-accounts"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Incharges"
            value={stats.incharges}
            icon={<FaUserTie />}
            color="#8b5cf6"
            targetView="incharge-accounts"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Main Collector"
            value={stats.main}
            icon={<FaClipboardList />}
            color="#eab308"
            targetView="collector-accounts"
          />
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <StatCard
            title="Meat Inspector"
            value={stats.meat}
            icon={<FaUserTie />}
            color="#f97316"
            targetView="meat-inspector-accounts"
          />
        </Col>
      </Row>

      <Divider style={{ margin: "18px 0" }} />

      {/* Charts */}
      <Row gutter={[20, 20]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Department Collection</span>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Current Year Summary
                </Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            {loading ? (
              <div
                style={{
                  height: 240,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={departmentTotals}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    innerRadius={55}
                    minAngle={5}
                    label={({ name, value }) =>
                      `${name}: ₱${Number(value).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  >
                    {departmentTotals.map((entry, idx) => (
                      <Cell
                        key={idx}
                        fill={DEPT_COLORS[idx % DEPT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) =>
                      `₱${Number(val).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Monthly Collection Trend</span>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Wharf, Motorpool, Market, Slaughter
                </Text>
              </div>
            }
            bordered={false}
            style={{
              borderRadius: 16,
              boxShadow: "0 8px 18px rgba(15,23,42,0.06)",
            }}
            bodyStyle={{ padding: 16 }}
          >
            {loading ? (
              <div
                style={{
                  height: 240,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Spin />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis
                    width={90}
                    tickFormatter={(val) =>
                      `₱${Number(val).toLocaleString(undefined, {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      })}`
                    }
                  />
                  <Tooltip
                    formatter={(val) =>
                      `₱${Number(val).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`
                    }
                  />
                  <Legend />
                  <Bar dataKey="Wharf" fill="#2563EB" />
                  <Bar dataKey="Motorpool" fill="#22C55E" />
                  <Bar dataKey="Market" fill="#FACC15" />
                  <Bar dataKey="Slaughter" fill="#F97316" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "market-section-stalls":
        return <SectionManager />;
      case "market-registration":
        return <MarketRegistration />;
      case "market-vendor-applications":
        return <AdminApplications />;
      case "market-stall-change":
        return <AdminStallChangeRequests />;
      case "market-remittance":
        return <MarketReport />;
      case "renewal":
        return <RenewalRequests />;

      case "slaughter-remittance":
        return <SlaughterReport />;
      case "motorpool-remittance":
        return <MotorPoolReport />;
      case "wharf-remittance":
        return <WharfReport />;
      case "unremitted":
        return <UnremittedPayments />;
      case "vendor-accounts":
        return <AdminVendorProfiles />;
      case "incharge-accounts":
        return <AdminInchargeProfiles />;
      case "collector-accounts":
        return <AdminMainProfiles />;
      case "meat-inspector-accounts":
        return <AdminMeatInspectorProfiles />;
      case "create-account":
        return <CreateAccount />;
      case "target":
        return <TargetsReports />;
      case "department":
        return <Reports />;
      case "collector":
        return <CollectorReports />;
      case "remove-stall":
        return <AdminRemoveStall />;
      case "vendor-payments":
        return <VendorsMissedPayments />;
      case "stall":
        return <StallHistory />;
        case "block-listed":
          return <BlocklistedVendors />;
      default:
        return renderDashboard();
    }
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #e5ecf5 0%, #f3f4f6 40%, #ffffff 100%)",
      }}
    >
      <Sidebar
        onMenuClick={setActiveView}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />

      <Layout
        style={{
          marginLeft: isSidebarCollapsed ? 80 : 250,
          transition: "margin-left 0.2s ease",
        }}
      >
      <Header
  style={{
    background: "#0f172a",
    backgroundImage:
      "linear-gradient(90deg, rgba(37,99,235,0.95), rgba(16,185,129,0.92))",
    color: "#fff",
    padding: "10px 24px",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: "0 0 14px 14px",
    boxShadow: "0 3px 10px rgba(15,23,42,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid rgba(255,255,255,0.15)",
  }}
>
  {/* Left: Logo + Title */}
  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
    <img
      src="/logo_meeo.png"
      alt="logo"
      style={{
        width: 40,
        height: 40,
        borderRadius: "999px",
        border: "2px solid rgba(255,255,255,0.6)",
        objectFit: "cover",
      }}
    />

    {/* Title + Subtitle stacked neatly */}
    <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
      <span
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: 0.3,
        }}
      >
        Admin Dashboard
      </span>
      <span
        style={{
          fontSize: 12,
          opacity: 0.85,
          fontWeight: 400,
        }}
      >
        Municipal Economic Enterprise Office
      </span>
    </div>
  </div>

  {/* Right: small “session” / notifications area */}
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 16,
    }}
  >
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        fontSize: 11,
        lineHeight: 1.3,
      }}
    >
      <span style={{ opacity: 0.9 }}>Signed in as</span>
      <span style={{ fontWeight: 500 }}>Administrator</span>
    </div>

    <NotificationBell
      onNotificationClick={(targetView) => {
        setActiveView(targetView);
      }}
    />
  </div>
</Header>



        <Content style={{ padding: 20 }}>{renderContent()}</Content>
      </Layout>

      {loading && <LoadingOverlay message="Loading Dashboard..." />}
    </Layout>
  );
};

export default AdminDashboard;
