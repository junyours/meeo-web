import React from "react";
import { Layout, Row, Col, Typography } from "antd";
import {
  FacebookOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BankOutlined,
} from "@ant-design/icons";
import "./Footer.css";

const { Footer: AntFooter } = Layout;
const { Text, Title } = Typography;

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <AntFooter className="footer-modern">
      <div className="footer-container">
        <Row gutter={[32, 32]}>
          {/* LEFT COLUMN */}
          <Col xs={24} md={8}>
            <Title level={4} className="footer-title">
              <BankOutlined /> Municipal Economic Enterprise Office
            </Title>

            <Text className="footer-text">
              An integrated management platform designed for the collection of
              General Funds, monitoring of stall rentals, vendor administration,
              and automated financial reporting — ensuring transparency,
              accountability, and efficient public service delivery.
            </Text>

            <div className="social-icons">
              <a
                href="https://www.facebook.com/menro.lguopol/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
              >
                <FacebookOutlined />
              </a>
              <a
                href="mailto:menro.lguopol@gmail.com"
                aria-label="Email"
              >
                <MailOutlined />
              </a>
              <a
                href="tel:+639268889359"
                aria-label="Phone"
              >
                <PhoneOutlined />
              </a>
            </div>
          </Col>

          {/* MIDDLE COLUMN */}
          <Col xs={24} md={8}>
            <Title level={5} className="footer-subtitle">
              System Modules
            </Title>
            <ul className="footer-links">
              <li><a href="/">Dashboard</a></li>
              <li><a href="/collections">General Fund Collection</a></li>
              <li><a href="/stalls">Stall Rental Monitoring</a></li>
              <li><a href="/vendors">Vendor Management</a></li>
              <li><a href="/reports">Reports & Analytics</a></li>
            </ul>
          </Col>

          {/* RIGHT COLUMN */}
          <Col xs={24} md={8}>
            <Title level={5} className="footer-subtitle">
              Office Contact Information
            </Title>
            <ul className="footer-contact">
              <li>
                <EnvironmentOutlined />
                <span> Poblacion, Opol, Misamis Oriental</span>
              </li>

              <li>
                <PhoneOutlined />
                <a href="tel:+639267779359"> +63 926 777 9359</a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* FOOTER BOTTOM */}
       {/* FOOTER BOTTOM */}
<div className="footer-bottom">
  <Text className="copyright-text">
    © {currentYear}{" "}
    <span className="brand-name">
      Municipal Enterprise Management System
    </span>
    . All rights reserved.
  </Text>

  <Text className="credits-text">
    System developed by{" "}
    <a href="https://www.facebook.com/ronnie1016" target="_blank" rel="noreferrer">
      Ronnie Flores
    </a>,{" "}
    <a href="https://www.facebook.com/izheykhedoq420" target="_blank" rel="noreferrer">
      Jon Brey Lastimosa
    </a>,{" "}
    <a href="https://www.facebook.com/profile.php?id=61583017889860" target="_blank" rel="noreferrer">
      Nathaniel Aba
    </a>{" "}
    and{" "}
    <a href="https://www.facebook.com/dean.franncis.quimanhan" target="_blank" rel="noreferrer">
      Dean Francis Quimanhan
    </a>
  </Text>
</div>

      </div>
    </AntFooter>
  );
};

export default Footer;
