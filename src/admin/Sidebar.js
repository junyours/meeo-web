import React, { useState, useEffect } from "react";
import {
  Layout,
  Menu,
  Modal,
  Button,
  Badge,
  Typography,
} from "antd";
import {
  HomeOutlined,
  ShopOutlined,
  BarChartOutlined,
  UserOutlined,
  TeamOutlined,
  KeyOutlined,
  FileTextOutlined,
  CarOutlined,
  FileDoneOutlined,
  PieChartOutlined,
  LogoutOutlined,
  AppstoreOutlined,
  SettingOutlined,
  ApartmentOutlined,
  LineChartOutlined,
  SwapOutlined,
  FileSearchOutlined,
  MenuOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import api from "../Api";

const { Sider } = Layout;
const { Title } = Typography;

const Sidebar = ({ isCollapsed, setIsCollapsed, onMenuClick, activeView }) => {
  const [logoutModal, setLogoutModal] = useState(false);
  const [openMenus, setOpenMenus] = useState([]);
  const [profileCounts, setProfileCounts] = useState({
    vendor: 0,
    mainCollector: 0,
    incharge: 0,
    meatInspector: 0,
  });

  const primaryColor = "#1B4F72";
  const hoverColor = "#2874a6";
  const selectedColor = "#154360";
  const logoutColor = "#ff0022ff";


  useEffect(() => {
    api
      .get("/sidebar-data")
      .then((res) => {
        setProfileCounts({
          vendor: res.data.vendorCount,
          mainCollector: res.data.mainCollectorCount,
          incharge: res.data.inchargeCount,
          meatInspector: res.data.meatInspectorCount,
        });
      })
      .catch((err) => console.error(err));
  }, []);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
      localStorage.removeItem("authToken");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  };

  const handleOpenChange = (keys) => {
    const latestOpenKey = keys.find((key) => !openMenus.includes(key));
    setOpenMenus(latestOpenKey ? [latestOpenKey] : []);
  };

  const menuItems = [
    {
      key: "dashboard",
      icon: <HomeOutlined />,
      label: "Dashboard",
    },
    {
      key: "market",
      icon: <ShopOutlined />,
      label: "Market Management",
      children: [
        { key: "market-section-stalls", label: "Section & Stall Management", icon: <AppstoreOutlined /> },
        { key: "market-registration", label: "Market Registration", icon: <FileTextOutlined /> },
        { key: "renewal", label: "Market Registration Renewal", icon: <FileTextOutlined /> },

        { key: "market-vendor-applications", label: "Vendor Applications", icon: <FileDoneOutlined /> },
        { key: "vendor-payments", label: "Vendor Missed Payments", icon: <FileDoneOutlined /> },
        { key: "remove-stall", label: "Vendor Remove Stall Request", icon: <FileDoneOutlined /> },
        { key: "market-stall-change", label: "Stall Change Requests", icon: <SwapOutlined /> },
        { key: "block-listed", label: "Block Listed Vendors", icon: <SwapOutlined /> },

      ],
    },
    {
      key: "remittance",
      icon: <BarChartOutlined />,
      label: "Payment Remittance",
      children: [
        { key: "market-remittance", label: "Market Payment Remittance", icon: <FileTextOutlined /> },
        { key: "slaughter-remittance", label: "Slaughterhouse Payment Remittance", icon: <FileTextOutlined /> },
        { key: "motorpool-remittance", label: "Motorpool Payment Remittance", icon: <CarOutlined /> },
        { key: "wharf-remittance", label: "Wharf Payment Remittance", icon: <ApartmentOutlined /> },
      ],
    },
    {
      key: "user-management",
      icon: <TeamOutlined />,
      label: "User Management",
      children: [
        {
          key: "vendor-accounts",
          label: (
            <>
              Vendor Accounts{" "}
              <Badge count={profileCounts.vendor} size="small" style={{ backgroundColor: "#faad14", marginLeft: 8 }} />
            </>
          ),
          icon: <UserOutlined />,
        },
        {
          key: "incharge-accounts",
          label: (
            <>
              In-Charge Accounts{" "}
              <Badge count={profileCounts.incharge} size="small" style={{ backgroundColor: "#faad14", marginLeft: 8 }} />
            </>
          ),
          icon: <SettingOutlined />,
        },
        {
          key: "collector-accounts",
          label: (
            <>
              Main Collector Accounts{" "}
              <Badge count={profileCounts.mainCollector} size="small" style={{ backgroundColor: "#faad14", marginLeft: 8 }} />
            </>
          ),
          icon: <PieChartOutlined />,
        },
        {
          key: "meat-inspector-accounts",
          label: (
            <>
              Meat Inspector Accounts{" "}
              <Badge count={profileCounts.meatInspector} size="small" style={{ backgroundColor: "#faad14", marginLeft: 8 }} />
            </>
          ),
          icon: <KeyOutlined />,
        },
        {
          key: "create-account",
          label: "Create New Account",
          icon: <KeyOutlined />,
        },
      ],
    },
    {
      key: "reports",
      icon: <FileSearchOutlined />,
      label: "Reports & Analytics",
      children: [
        { key: "target", label: "Target Report", icon: <LineChartOutlined /> },
        { key: "department", label: "Department Reports", icon: <FileTextOutlined /> },
        { key: "collector", label: "Collector Reports", icon: <FileTextOutlined /> },
        { key: "stall", label: "Stall History", icon: <FileTextOutlined /> },
        { key: "unremitted", label: "Unremitted Payments", icon: <FileTextOutlined /> },
      ],
    },
  ];

  const renderMenuItems = (items) =>
    items.map((item) => {
      if (item.children) {
        return {
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: renderMenuItems(item.children),
        };
      }
      return {
        key: item.key,
        icon: item.icon,
        label: item.label,
        onClick: () => onMenuClick(item.key),
      };
    });

  return (
    <>
      <Sider
        width={260}
        collapsedWidth={80}
        collapsed={isCollapsed}
        theme="dark"
        style={{
          height: "100vh",
          position: "fixed",
          left: 0,
          top: 0,
          background: primaryColor,
          boxShadow: "4px 0 12px rgba(0,0,0,0.15)",
          zIndex: 10,
          transition: "all 0.3s ease",
        }}
      >
        {/* --- Header with Burger --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          {!isCollapsed && (
            <Title level={5} style={{ color: "#fff", margin: 0, display: "flex", alignItems: "center" }}>
              <img
                src="/logo_Opol.png"
                alt="logo"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  marginRight: 8,
                }}
              />
              ADMIN PANEL
            </Title>
          )}

          <Button
            type="text"
            icon={isCollapsed ? <MenuOutlined /> : <CloseOutlined />}
            onClick={() => setIsCollapsed((prev) => !prev)}
            style={{
              color: "#fff",
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
              background: "transparent",
            }}
          />
        </div>

        {/* --- Menu --- */}
        <Menu
          mode="inline"
          theme="white"
          selectedKeys={[activeView]}
          openKeys={isCollapsed ? [] : openMenus}
          onOpenChange={handleOpenChange}
          items={renderMenuItems(menuItems)}
          style={{
            borderRight: 0,
            marginTop: 10,
            paddingBottom: "60px",
            background: primaryColor,
            color: "#fff",
          }}
        />

        {/* --- Logout --- */}
        <div
          style={{
            marginTop: "auto",
            padding: "16px",
            borderTop: "1px solid rgba(255,255,255,0.15)",
            position: "absolute",
            bottom: 0,
            width: "100%",
          }}
        >
          <Button
            type="primary"
            style={{
              backgroundColor: logoutColor,
              borderColor: selectedColor,
              color: "#fff",
              fontWeight: "bold",
            }}
            icon={<LogoutOutlined />}
            block
            onClick={() => setLogoutModal(true)}
          >
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </Sider>

      {/* --- Logout Modal --- */}
      <Modal
        title="Confirm Logout"
        open={logoutModal}
        onOk={handleLogout}
        onCancel={() => setLogoutModal(false)}
        okText="Yes, Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <p>Are you sure you want to logout?</p>
      </Modal>

      {/* --- Additional CSS for hover/selected menu items --- */}
      <style>
        {`
          .ant-menu-dark .ant-menu-item-selected {
            background-color: ${selectedColor} !important;
          }
          .ant-menu-dark .ant-menu-item:hover {
            background-color: ${hoverColor} !important;
          }
          .ant-menu-dark .ant-menu-submenu-title:hover {
            background-color: ${hoverColor} !important;
          }
        `}
      </style>
    </>
  );
};

export default Sidebar;
