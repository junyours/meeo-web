import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Card,
  Tag,
  Typography,
  message,
  Space,
  Divider,
  DatePicker,
} from "antd";
import {
  FileDoneOutlined,
  EyeOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import SignatureCanvas from "react-signature-canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import api from "../Api";
import LoadingOverlay from "./Loading";

const { Title, Text } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const MarketRegistration = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [signature, setSignature] = useState(null);
  const [validationError, setValidationError] = useState("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [setDateRange] = useState([]);
  const [pendingFilter, setPendingFilter] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const sigCanvas = useRef(null);
  const certificateRef = useRef(null);
  const tableRef = useRef(null);
  const logo = `${process.env.PUBLIC_URL}/logo_Opol.png`;

  const buttonStyle = {
    backgroundColor: "#1B4F72",
    borderColor: "#1B4F72",
    color: "#fff",
    fontWeight: "bold",
  };

  const secondaryButtonStyle = {
    backgroundColor: "#e3f2fd",
    borderColor: "#90caf9",
    color: "#1B4F72",
    fontWeight: "bold",
  };

  // Fetch approved applications
  const fetchApplications = (startDate = null, endDate = null) => {
    setLoading(true);
    api
      .get("/approved", {
        params: {
          status: "approved",
          start_date: startDate,
          end_date: endDate,
        },
      })
      .then((res) => {
        const grouped = Object.values(
          res.data.reduce((acc, app) => {
            const groupKey = app.business_name || `app-${app.id}`;
            if (!acc[groupKey]) {
              acc[groupKey] = {
                id: app.id,
                vendor: app.vendor,
                business_name: app.business_name,
                section: app.section,
                stalls: app.stall_details?.map((s) => s.stall_number) || [],
                hasRegistration: app.market_registration !== null,
                market_registration: app.market_registration,
              };
            }
            return acc;
          }, {})
        );

        // Sort so newest applications appear first
        grouped.sort((a, b) => b.id - a.id);

        setApplications(grouped);
      })
      .catch(() => message.error("Error fetching approved applications"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDateChange = (dates) => {
    setPendingFilter(dates || []);
  };

  const handleApplyFilter = () => {
    if (pendingFilter && pendingFilter.length === 2) {
      const [start, end] = pendingFilter;
      setDateRange(pendingFilter);
      fetchApplications(start.format("YYYY-MM-DD"), end.format("YYYY-MM-DD"));
    } else {
      setDateRange([]);
      fetchApplications();
    }
  };

  const handleGiveRegistration = (app) => {
    setSelectedApp(app);
    setSignature(null);
    setShowSignaturePad(false);
    setValidationError("");
    setModalVisible(true);
      fetchApplications();

  };

  const handleViewCertification = (app) => {
    setLoading(true);
    api
      .get(`/market-registrations/${app.id}`)
      .then((res) => {
        setSelectedApp({
          ...app,
          registration: res.data.registration,
        });
        setSignature(res.data.registration?.signature || null);
        setShowSignaturePad(false);
        setModalVisible(true);
      })
      .catch(() => message.error("Failed to load certification"))
      .finally(() => setLoading(false));
  };

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      setValidationError("Please draw your signature before saving.");
      return;
    }
    setSignature(sigCanvas.current.getCanvas().toDataURL("image/png"));
    setShowSignaturePad(false);
    setValidationError("");
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setValidationError("");
  };

  const showConfirm = () => {
    confirm({
      title: "Confirm Registration",
      icon: <ExclamationCircleOutlined />,
      content: signature
        ? "Are you sure this is your signature?"
        : "Issue certification without signature?",
      okText: "Yes, Confirm",
      cancelText: "Cancel",
      onOk() {
        confirmRegistration();
      },
    });
  };

  const confirmRegistration = () => {
    setActionLoading(selectedApp.id);
    api
      .post(`/market-registrations/${selectedApp.id}`, {
        signature: signature || null,
      })
      .then(() => {
        message.success("Market registration issued successfully!");
        setApplications((prev) =>
          prev.map((app) =>
            app.id === selectedApp.id ? { ...app, hasRegistration: true } : app
          )
        );
        setModalVisible(false);
      })
      .catch(() => message.error("Error issuing registration"))
      .finally(() => {
        setActionLoading(null);
        setSelectedApp(null);
      });
  };

  // Certificate PDF
  const handleDownloadPDF = async () => {
    const input = certificateRef.current;
    if (!input) return;
    const canvas = await html2canvas(input, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save(`Certification_${selectedApp.business_name}.pdf`);
  };

  const handleDownloadTablePDF = (type = "all") => {
    const doc = new jsPDF("p", "pt", "a4");
    const start = (currentPage - 1) * pageSize;
    const dataToPrint =
      type === "page" ? applications.slice(start, start + pageSize) : applications;

    const rows = dataToPrint.map((app) => [
      app.vendor?.fullname || "N/A",
      app.business_name || "N/A",
      app.section?.name || "N/A",
      app.stalls.join(", ") || "None",
      app.market_registration?.date_issued
        ? new Date(app.market_registration.date_issued).toLocaleDateString(
            "en-US",
            { year: "numeric", month: "long", day: "numeric" }
          )
        : "Not Issued",
    ]);

    autoTable(doc, {
      head: [["Full Name", "Business Name", "Section", "Stalls", "Date Issued"]],
      body: rows,
      startY: 50,
      theme: "grid",
      styles: {
        fontSize: 11,
        cellPadding: 6,
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      alternateRowStyles: {
        fillColor: [255, 255, 255],
      },
    });

    doc.text("Market Registration Report", doc.internal.pageSize.getWidth() / 2, 30, {
      align: "center",
    });

    doc.save("Market_Registration_Report.pdf");
  };

  const columns = [
    {
      title: "Full Name",
      dataIndex: ["vendor", "fullname"],
      key: "fullname",
      render: (text) => <Text strong>{text || "N/A"}</Text>,
    },
    {
      title: "Business Name",
      dataIndex: "business_name",
      key: "business_name",
    },
    {
      title: "Section",
      dataIndex: ["section", "name"],
      key: "section",
      render: (text) => <Tag color="blue">{text || "N/A"}</Tag>,
    },
    {
      title: "Stalls",
      dataIndex: "stalls",
      key: "stalls",
      render: (stalls) => <Tag color="geekblue">{stalls.join(", ") || "None"}</Tag>,
    },
    {
      title: "Date Issued",
      key: "date_issued",
      render: (_, record) =>
        record.market_registration?.date_issued ? (
          <Tag color="green">
            {new Date(record.market_registration.date_issued).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}
          </Tag>
        ) : (
          <Tag color="default">Not Issued</Tag>
        ),
    },
    {
      title: "Registration Status",
      key: "status",
      render: (_, record) => (
        <Space>
          {record.hasRegistration ? (
            <Button
              icon={<EyeOutlined />}
              onClick={() => handleViewCertification(record)}
              style={secondaryButtonStyle}
            >
              View Certification
            </Button>
          ) : actionLoading === record.id ? (
            <Tag color="orange">Issuing...</Tag>
          ) : (
            <Button
              icon={<FileDoneOutlined />}
              onClick={() => handleGiveRegistration(record)}
              style={buttonStyle}
            >
              Give Certification
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderModalContent = () => {
    if (!selectedApp) return null;
    const isViewMode = !!selectedApp.registration;
    const reg = {
      vendor: selectedApp.vendor,
      business_name: selectedApp.business_name,
      stalls: selectedApp.stalls,
      section: selectedApp.section,
      registration: {
        date_issued: isViewMode
          ? new Date(selectedApp.registration.date_issued)
          : new Date(),
        expiry_date: isViewMode
          ? new Date(selectedApp.registration.expiry_date)
          : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      },
    };
    const options = { year: "numeric", month: "long", day: "numeric" };

    return (
      <div
        ref={certificateRef}
        style={{
          backgroundColor: "#fff",
          padding: "50px 60px",
          border: "3px solid #1B4F72",
          borderRadius: "12px",
          boxShadow: "0 5px 25px rgba(0,0,0,0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={logo}
          alt="Watermark"
          style={{
            position: "absolute",
            opacity: 0.08,
            width: "80%",
            left: "10%",
            top: "30%",
            zIndex: 0,
          }}
        />

        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <img src={logo} alt="Logo" width={100} />
          <Title level={3} style={{ marginTop: 10, color: "#1B4F72" }}>
            MUNICIPALITY OF OPOL
          </Title>
          <Text style={{ fontSize: 14 }}>
            <i>MUNICIPAL ECONOMIC ENTERPRISE OFFICE</i>
          </Text>
          <Divider style={{ borderColor: "#1B4F72", margin: "10px auto" }} />
          <Title level={4} style={{ color: "#1B4F72", letterSpacing: 1 }}>
            CERTIFICATE OF MARKET REGISTRATION
          </Title>
        </div>

        <div
          style={{
            textAlign: "justify",
            fontSize: 15,
            lineHeight: 1.8,
            marginTop: 20,
            position: "relative",
            zIndex: 1,
          }}
        >
          <p>
            This is to certify that <b>{reg.vendor?.fullname}</b> of business
            name <b>{reg.business_name}</b>, residing at Zone{" "}
            <b>{reg.vendor?.address}</b>, is a legitimate stall holder #
            <b>{reg.stalls.join(", ")}</b> located at the{" "}
            <b>{reg.section?.name}</b> Section of the Opol Public Market. As per
            records, he/she has no outstanding obligations with this office.
          </p>

          <p style={{ marginTop: 20 }}>
            Issued this{" "}
            <b>
              {new Date(reg.registration.date_issued).toLocaleDateString(
                "en-US",
                options
              )}
            </b>{" "}
            and valid until{" "}
            <b>
              {new Date(reg.registration.expiry_date).toLocaleDateString(
                "en-US",
                options
              )}
            </b>{" "}
            for Business Permit purposes.
          </p>
        </div>

        <div
          style={{
            textAlign: "center",
            marginTop: 80,
            position: "relative",
            zIndex: 2,
          }}
        >
          {signature && !showSignaturePad ? (
            <>
              <img
                src={signature}
                alt="Signature"
                style={{
                  width: 220,
                  height: 60,
                  objectFit: "contain",
                  borderBottom: "1px solid #000",
                }}
              />
              {!isViewMode && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => setShowSignaturePad(true)}
                  style={{ color: "#1B4F72", fontWeight: "bold" }}
                >
                  Edit Signature
                </Button>
              )}
            </>
          ) : showSignaturePad && !isViewMode ? (
            <>
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{
                  width: 250,
                  height: 60,
                  style: { border: "1px solid #ccc", marginTop: 10 },
                }}
              />
              <div style={{ marginTop: 10 }}>
                <Button type="primary" onClick={saveSignature} style={buttonStyle}>
                  Save
                </Button>
                <Button
                  onClick={clearSignature}
                  style={{ ...secondaryButtonStyle, marginLeft: 8 }}
                >
                  Clear
                </Button>
              </div>
            </>
          ) : (
            !isViewMode && (
              <Button type="primary" onClick={() => setShowSignaturePad(true)} style={buttonStyle}>
                Add Signature
              </Button>
            )
          )}

          {validationError && (
            <p style={{ color: "red", marginTop: 10 }}>{validationError}</p>
          )}

          <div style={{ marginTop: 60 }}>
            <b style={{ fontSize: 16, color: "#1B4F72" }}>
              ARIEL BRIAN Y. ORTIGOZA
            </b>
            <div style={{ fontSize: 13 }}>MEEO-designate</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card
      style={{
        padding: 20,
        borderRadius: 16,
        background: "linear-gradient(145deg, #ffffff, #f3f7fb)",
        boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
      }}
    >
      {loading && <LoadingOverlay message="Loading..." />}

      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <Title level={3} style={{ color: "#1B4F72", margin: 0 }}>
          Market Registration
        </Title>
 
        <Space>
          <RangePicker
            value={pendingFilter}
            format="YYYY-MM-DD"
            onChange={handleDateChange}
          />
          <Button type="primary" onClick={handleApplyFilter} style={buttonStyle}>
            Display Filtered Data
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleDownloadTablePDF("all")}
            style={secondaryButtonStyle}
          >
            Print All
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={() => handleDownloadTablePDF("page")}
            style={secondaryButtonStyle}
          >
            Print Current Page
          </Button>
        </Space>
        
      </Space>
 <Text type="secondary" style={{ fontSize: 14 }}>
      Review approved market applications, issue or view market registration 
      certificates, and download reports. Use the filters to refine the list 
      by date range.
    </Text>
      <Table
        dataSource={applications}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: pageSize,
          showTotal: (total) => `Total ${total} approved applications`,
          onChange: (page, size) => {
            setCurrentPage(page);
            setPageSize(size);
          },
        }}
        bordered
        style={{ borderRadius: 12, overflow: "hidden" }}
        ref={tableRef}
      />

      <Modal
        open={modalVisible}
        width={800}
        centered
        style={{ top: 20 }}
        bodyStyle={{
          maxHeight: "80vh",
          overflowY: "auto",
          padding: 0,
          background: "#f9f9f9",
        }}
        onCancel={() => setModalVisible(false)}
        footer={
          selectedApp && !selectedApp.registration ? (
            <Space style={{ justifyContent: "center", width: "100%", padding: 16 }}>
              <Button type="primary" onClick={showConfirm} style={buttonStyle}>
                Confirm
              </Button>
              <Button
                onClick={() => setModalVisible(false)}
                style={secondaryButtonStyle}
              >
                Cancel
              </Button>
            </Space>
          ) : (
            <Space style={{ justifyContent: "center", width: "100%", padding: 16 }}>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
                style={buttonStyle}
              >
                Download PDF
              </Button>
              <Button
                onClick={() => setModalVisible(false)}
                style={secondaryButtonStyle}
              >
                Close
              </Button>
            </Space>
          )
        }
      >
        {renderModalContent()}
      </Modal>
    </Card>
  );
};

export default MarketRegistration;
