import React, { useState } from "react";
import { Layout, Menu, Button, Tooltip, Divider, Modal } from "antd";
import {
  HomeOutlined,
  UserOutlined,
  DollarCircleOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  LogoutOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

const Sidebar = ({ activeView, onMenuClick, isCollapsed, setIsCollapsed, onLogout }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const menuItems = [
    { label: "Home", icon: <HomeOutlined />, key: "overview" },
    { label: "Profiling", icon: <UserOutlined />, key: "profile" },
    { label: "Remittance Payment", icon: <DollarCircleOutlined />, key: "remittance" },
    { label: "Remittance Report", icon: <DollarCircleOutlined />, key: "reports" },
  ];

  const showLogoutConfirm = () => setIsModalVisible(true);
  const handleCancel = () => setIsModalVisible(false);
  const handleConfirmLogout = () => {
    setIsModalVisible(false);
    onLogout();
  };

  return (
    <>
      <Sider
        collapsible
        collapsed={isCollapsed}
        onCollapse={(value) => setIsCollapsed(value)}
        width={250}
        trigger={null}
        style={{
          background: "linear-gradient(180deg, #0077B6 0%, #00B4D8 100%)",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          display: "flex",
          flexDirection: "column",
          boxShadow: "4px 0 10px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* === Top Section === */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "space-between",
              padding: "15px",
            }}
          >
            {!isCollapsed && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src="/logo_Opol.png"
                  alt="logo"
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  }}
                />
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#fff",
                    letterSpacing: "0.5px",
                  }}
                >
                  STAFF PANEL
                </span>
              </div>
            )}

            <Tooltip title={isCollapsed ? "Expand" : "Collapse"}>
              <Button
                type="text"
                icon={
                  isCollapsed ? (
                    <MenuUnfoldOutlined style={{ color: "#fff", fontSize: "18px" }} />
                  ) : (
                    <MenuFoldOutlined style={{ color: "#fff", fontSize: "18px" }} />
                  )
                }
                onClick={() => setIsCollapsed(!isCollapsed)}
              />
            </Tooltip>
          </div>

          <Divider style={{ borderColor: "rgba(255,255,255,0.3)", margin: "8px 0" }} />

          {/* Menu Items */}
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[activeView]}
            onClick={({ key }) => onMenuClick(key)}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
            }))}
            style={{
              background: "transparent",
              color: "#fff",
              fontWeight: "500",
            }}
          />
        </div>

        {/* === Footer Section (Logout Button) === */}
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
            type="text"
            icon={<LogoutOutlined />}
            onClick={showLogoutConfirm}
            block
            style={{
              color: "#fff",
              background: "linear-gradient(90deg, #ef4444, #dc2626)",
              border: "none",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: isCollapsed ? "center" : "flex-start",
              padding: "10px 15px",
              borderRadius: "8px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "linear-gradient(90deg, #dc2626, #b91c1c)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "linear-gradient(90deg, #ef4444, #dc2626)";
            }}
          >
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </Sider>

      {/* === Logout Confirmation Modal === */}
      <Modal
        centered
        open={isModalVisible}
        onCancel={handleCancel}
        onOk={handleConfirmLogout}
        okText="Yes, Logout"
        cancelText="Cancel"
        closable={false}
        okButtonProps={{
          style: {
            backgroundColor: "#0077B6",
            borderColor: "#0077B6",
            fontWeight: "500",
          },
        }}
        cancelButtonProps={{
          style: { fontWeight: "500" },
        }}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600" }}>
            <ExclamationCircleOutlined style={{ color: "#faad14" }} />
            Confirm Logout
          </span>
        }
      >
        <p style={{ fontSize: "15px", color: "#333" }}>
          Are you sure you want to log out of your account?
        </p>
      </Modal>
    </>
  );
};

export default Sidebar;
