import React, { useState, useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Menu, Card, Row, Col, Statistic, Spin, Button, Drawer } from "antd";
import { ShopOutlined, BankOutlined, MobileOutlined, DownloadOutlined, MenuOutlined } from "@ant-design/icons";

import api from "../Api";
import Footer from "../Auth/Footer";
import bg from "../assets/bg.jpg";
import logo from "../assets/logo_meeo.png";

const Homepage = () => {
  const [active, setActive] = useState("home");
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false); // For mobile menu

  useEffect(() => {
    api
      .get("/sections/available-stalls")
      .then((res) => {
        setSections(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const styles = {
    page: { minHeight: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#f4f6f9" },
    heroWrapper: { position: "relative", minHeight: "100vh", background: `url(${bg}) center/cover no-repeat` },
    overlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1 },
    navbar: {
      padding: "18px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "relative",
      zIndex: 10,
      background: "rgba(0,0,0,0.3)",
      borderRadius: 12,
      margin: "20px",
      flexWrap: "wrap",
    },
    brand: { display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 20, fontWeight: 800 },
    menuItem: { color: "#fff", fontWeight: 600, fontSize: 14 },
    menuDesktop: { display: "flex", gap: 20 },
    menuMobileIcon: { fontSize: 24, color: "#fff", cursor: "pointer" },
    hero: { position: "relative", zIndex: 2, minHeight: "calc(100vh - 140px)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "40px 20px", color: "#fff" },
    heroTitle: { fontSize: "clamp(28px, 6vw, 56px)", fontWeight: 900, marginBottom: 20, textShadow: "1px 1px 12px rgba(0,0,0,0.7)" },
    heroSubtitle: { fontSize: "clamp(16px, 3vw, 20px)", maxWidth: 720, lineHeight: 1.6, opacity: 0.95 },
    sectionWrapper: { padding: "60px 20px", background: "#f4f6f9" },
    sectionTitle: { textAlign: "center", fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, color: "#043e54", marginBottom: 12 },
    sectionDesc: { textAlign: "center", maxWidth: 850, margin: "0 auto 60px", fontSize: "clamp(14px, 2.5vw, 18px)", color: "#555" },
    aboutWrapper: { padding: "60px 20px", background: "#f4f6f9", display: "flex", flexDirection: "column", gap: 40, justifyContent: "center", alignItems: "center" },
    aboutCard: { maxWidth: 1000, width: "100%", background: "linear-gradient(145deg, #fff, #e6f0f7)", borderRadius: 20, padding: "30px 20px", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.15)", transition: "transform 0.3s, box-shadow 0.3s" },
    aboutIcon: { fontSize: "clamp(36px, 5vw, 50px)", color: "#043e54", marginBottom: 20 },
    aboutTitle: { fontSize: "clamp(24px, 5vw, 36px)", fontWeight: 800, marginBottom: 20, color: "#043e54" },
    aboutText: { fontSize: "clamp(14px, 2.5vw, 18px)", lineHeight: 1.7, color: "#555" },
    downloadButton: { marginTop: 20, fontSize: 16, padding: "10px 25px", borderRadius: 10, backgroundColor: "#043e54", color: "#fff", border: "none", transition: "all 0.3s" },
  };

  const menuItems = [
    { key: "home", label: "Home" },
    { key: "about", label: "About" },
    { key: "login", label: <RouterLink to="/login">Login</RouterLink> },
  ];

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <div style={active === "home" ? styles.heroWrapper : { background: "#f4f6f9" }}>
        {active === "home" && <div style={styles.overlay}></div>}

        <div style={styles.navbar}>
          <div style={styles.brand}>
            <img src={logo} alt="logo" height={40} />
            MEEO System
          </div>

          {/* Desktop Menu */}
          <div className="desktop-menu" style={styles.menuDesktop}>
            {window.innerWidth > 768 &&
              menuItems.map((item) => (
                <div
                  key={item.key}
                  style={{ ...styles.menuItem, cursor: "pointer" }}
                  onClick={() => setActive(item.key)}
                >
                  {item.label}
                </div>
              ))}
          </div>

          {/* Mobile Hamburger */}
          {window.innerWidth <= 768 && (
            <MenuOutlined style={styles.menuMobileIcon} onClick={() => setDrawerVisible(true)} />
          )}
        </div>

        {/* Mobile Drawer */}
        <Drawer
          title="Menu"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          visible={drawerVisible}
        >
          {menuItems.map((item) => (
            <div
              key={item.key}
              style={{ padding: "12px 0", fontSize: 18 }}
              onClick={() => {
                setActive(item.key);
                setDrawerVisible(false);
              }}
            >
              {item.label}
            </div>
          ))}
        </Drawer>

        {/* HERO CONTENT */}
        {active === "home" && (
          <div style={styles.hero}>
            <h1 style={styles.heroTitle}>Municipal Economic Enterprise Office</h1>
            <p style={styles.heroSubtitle}>
              A centralized platform for General Fund Collection, Stall Rental Monitoring, Vendor Management, and Automated Financial Reporting.
            </p>
          </div>
        )}
      </div>

      {/* AVAILABLE STALLS */}
      {active === "home" && (
        <div style={styles.sectionWrapper}>
          <h2 style={styles.sectionTitle}>Available Stall Monitoring</h2>
          <p style={styles.sectionDesc}>
            Real-time availability of active stalls per section to ensure transparent allocation and efficient enterprise operations.
          </p>

          {loading ? (
            <Spin size="large" style={{ display: "block", margin: "80px auto" }} />
          ) : (
            <Row gutter={[20, 20]} justify="center">
              {sections.map((section) => (
                <Col xs={24} sm={12} md={8} lg={6} key={section.id}>
                  <Card hoverable style={{ borderRadius: 18, textAlign: "center", boxShadow: "0 14px 30px rgba(0,0,0,0.1)" }}>
                    <ShopOutlined style={{ fontSize: 36, color: "#043e54", marginBottom: 12 }} />
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>{section.name}</h3>
                    <Statistic
                      value={section.available_stalls_count}
                      suffix="Available"
                      valueStyle={{ fontSize: 28, fontWeight: 800, color: "#1a8f3c" }}
                    />
                    <div style={{ marginTop: 12, color: "#777" }}>Active stalls ready for rental</div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      )}

      {/* ABOUT PAGE */}
      {active === "about" && (
        <div style={styles.aboutWrapper}>
          <Card style={styles.aboutCard} >
            <BankOutlined style={styles.aboutIcon} />
            <h2 style={styles.aboutTitle}>About the System</h2>
            <p style={styles.aboutText}>
              The Municipal Economic Enterprise Office (MEEO) System streamlines enterprise collection, monitors stall rentals, manages vendors, and automates financial reporting to support transparency, accountability, and operational efficiency.
              <br /><br />
              The system provides real-time updates, reporting dashboards, and a user-friendly interface for administrators and vendors, enhancing municipal economic operations.
            </p>
          </Card>

          <Card style={styles.aboutCard} >
            <MobileOutlined style={styles.aboutIcon} />
            <h2 style={styles.aboutTitle}>Mobile Application</h2>
            <p style={styles.aboutText}>
              Our MEEO mobile application is available for Vendors, Customers, Collectors, and Meat Inspectors. Download the APK to access real-time stall monitoring, collection tracking, vendor management, and inspection reporting directly on your mobile device.
            </p>
            <a href="/apk/app-release.apk" download>
              <Button style={styles.downloadButton} icon={<DownloadOutlined />}>
                Download APK
              </Button>
            </a>
          </Card>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Homepage;
