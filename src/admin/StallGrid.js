import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  Tooltip,
  Spin,
  Button,
  Input,
  Switch,
  message,
  Tabs,
  Table,
  Drawer,
  Typography,
  Space,
  Divider,
  Modal,Empty 
  
} from "antd";
import { ToolOutlined, PlusOutlined } from "@ant-design/icons";
import api from "../Api";
import "./StallGrid.css";

const { Text } = Typography;
const { TextArea } = Input;

const StallGrid = ({ section, editMode, onAddStall,onRefresh }) => {
  const [stalls, setStalls] = useState(section?.stalls || []);
  const [modalVendor, setModalVendor] = useState(null);
  const [rentedHistory, setRentedHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loadingVendorId, setLoadingVendorId] = useState(null);
  const [vendorCache, setVendorCache] = useState({});
  const [isActive, setIsActive] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [selectedStall, setSelectedStall] = useState(null);
  const [statusLogs, setStatusLogs] = useState([]);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [selectedLogMessage, setSelectedLogMessage] = useState("");
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
const [selectedPaymentHistory, setSelectedPaymentHistory] = useState([]);
const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false);
    const gridRef = useRef(null); 
const primaryButtonStyle = {
  minWidth: 110,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
background: "#5bef44ff", // blue → green
  border: "none",
  color: "#000000ff",
  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.35)",
};

const dangerButtonStyle = {
  minWidth: 120,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 600,
  background: "#ef4444", // strong red
  border: "1px solid #b91c1c",
  color: "#ffffff",
  boxShadow: "0 3px 10px rgba(239,68,68,0.35)",
};

const neutralButtonStyle = {
  minWidth: 100,
  borderRadius: 999,
  padding: "6px 18px",
  fontWeight: 500,
  background: "#f3f4f6", // soft gray
  border: "1px solid #d1d5db",
  color: "#111827",
};

  useEffect(() => {
    setStalls(section?.stalls || []);
  }, [section?.stalls]);

  const fetchVendor = async (stallId) => {
    if (!stallId) return null;
    try {
      setLoadingVendorId(stallId);
      const res = await api.get(`/stall/${stallId}/tenant`);
      const data = res.data;
console.log(res.data)
      const isVacant =
        !data.vendor?.fullname ||
        data.vendor?.fullname === "—" ||
        data.vendor?.fullname === null;

      const formatted = {
        vendor: isVacant
          ? null
          : { fullname: data.vendor?.fullname || "—" },
        stall_number: data.stall_number,
        stall_id: data.stall_id,
        section_name: data.section?.name || "—",
        daily_rent: data.rented?.daily_rent || 0,
        monthly_rent: data.rented?.monthly_rent || 0,
        payment_type: data.payment_type || "—",
        missedDays: data.missed_days || 0,
         nextDueDate: data.next_due_date,
        id: data.id,
        is_active: data.is_active ?? true,
        message: data.message || "",
      };

      setVendorCache((prev) => ({ ...prev, [stallId]: formatted }));
      return formatted;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoadingVendorId(null);
    }
  };

const fetchPaymentDetails = async (rentedId) => {
  try {
    setLoadingPaymentHistory(true);
    const res = await api.get(`/rented/${rentedId}/payments`);

    // Convert object to array if needed
    let payments = res.data;
    if (!Array.isArray(payments)) {
      payments = Object.values(payments);
    }

    // Sort by payment_date descending (latest first)
    payments.sort((a, b) => {
      const dateA = new Date(a.payment_date);
      const dateB = new Date(b.payment_date);
      return dateB - dateA; // latest first
    });

    setSelectedPaymentHistory(payments);
    setPaymentModalVisible(true);
        setShowModal(false);
  } catch (err) {
    console.error("Fetch payment error:", err.response || err);
    message.error("Failed to fetch payment details");
  } finally {
    setLoadingPaymentHistory(false);
  }
};



  const fmtDate = (date) => {
    if (!date) return "-";
    if (date === "Present") return "Present";
    return new Date(date).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const fetchRentedHistory = async (stallId) => {
    try {
      const res = await api.get(`/stall/${stallId}`);
      setRentedHistory(res.data.history || []);
      console.log(res.data.history)
    } catch (err) {
      console.error(err);
      setRentedHistory([]);
    }
  };

  const fetchStatusLogs = async (stallId) => {
    try {
      const res = await api.get(`/stall/${stallId}/status-logs`);
      setStatusLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setStatusLogs([]);
    }
  };

  const handleStallClick = async (stall) => {
    if (!stall) return;

    setShowModal(false);
    setSelectedStall(null);
    setModalVendor(null);
    setStatusLogs([]);
    setMessageText("");

    if (editMode && !stall.id) {
      onAddStall(section.id, stall.row, stall.col);
      return;
    }

    const normalizedStatus = (stall.status || "").toLowerCase();
    if (
      ![
        "occupied",
        "paid",
        "paid_today",
        "missed",
        "vacant",
        "inactive",
      ].includes(normalizedStatus)
    )
      return;

    const data = await fetchVendor(stall.id);
    await fetchRentedHistory(stall.id);
    await fetchStatusLogs(stall.id);

    setModalVendor(
      normalizedStatus === "vacant" ? { ...data, vendor: null } : data
    );
    setIsActive(data?.is_active ?? true);
    setSelectedStall(stall.id);
    setShowModal(true);
  };

  const handleRemoveVendor = async () => {
    if (!modalVendor?.stall_id) return;

    if (
      window.confirm(
        `Are you sure you want to remove the vendor from Stall #${modalVendor.stall_number}?`
      )
    ) {
      try {
        await api.post(`/stall/${modalVendor.stall_id}/remove-vendor`);
        message.success(
          `Vendor removed from Stall #${modalVendor.stall_number}`
        );

        const updated = await fetchVendor(modalVendor.stall_id);
        await fetchRentedHistory(modalVendor.stall_id);
        await fetchStatusLogs(modalVendor.stall_id);

        if (updated) {
          setModalVendor({ ...updated, vendor: null });
        }

        setStalls((prev) =>
          prev.map((s) =>
            s.id === modalVendor.stall_id ? { ...s, status: "vacant" } : s
          )
        );
      } catch (err) {
        console.error(err);
        message.error("Failed to remove vendor from stall.");
      }
    }
  };

  const handleToggleActive = async () => {
    if (!modalVendor) return;
    try {
      await api.put(`/stall/${modalVendor.stall_id}/toggle-active`, {
        is_active: isActive,
        message: messageText,
      });
      message.success(
        `Stall #${modalVendor.stall_number} marked as ${
          isActive ? "Active" : "Inactive"
        }`
      );

      await fetchStatusLogs(modalVendor.stall_id);

      setVendorCache((prev) => ({
        ...prev,
        [modalVendor.stall_id]: {
          ...prev[modalVendor.stall_id],
          is_active: isActive,
          message: messageText,
        },
      }));

      setShowModal(false);
      setMessageText("");
       onRefresh?.();
    } catch (err) {
      console.error(err);
      message.error("Failed to update stall status");
    }
  };

  const fmtMoney = (v) =>
    v === null || v === undefined || isNaN(Number(v))
      ? "₱0.00"
      : `₱${Number(v).toLocaleString("en-PH", {
          minimumFractionDigits: 2,
        })}`;

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "vacant":
        return "#09ff00ff";
      case "occupied":
        return "#ff0000ff";
      case "missed":
        return "#fffb00ff";
      case "paid":
      case "paid_today":
        return "#00c8ffff";
      case "inactive":
        return "#808080ff";
      default:
        return "#894141ff";
    }
  };

  // Responsive grid: use CSS grid with auto-fit and minmax for adaptive stalls size.
  const renderGrid = () => {
    const rows = Math.max(
      1,
      section?.row_count ||
        (stalls.length > 0
          ? Math.max(...stalls.map((s) => s.row_position || 1))
          : 1)
    );
    const cols = Math.max(
      1,
      section?.column_count ||
        (stalls.length > 0
          ? Math.max(...stalls.map((s) => s.column_position || 1))
          : 1)
    );

    const totalStalls = rows * cols;

    // Create grid cells for all stalls or empty slots
    const gridCells = Array.from({ length: totalStalls }, (_, index) => {
      const r = Math.floor(index / cols) + 1;
      const c = (index % cols) + 1;
      const stall = stalls.find(
        (s) => s.row_position === r && s.column_position === c
      );
      return { stall, row: r, col: c };
    });

    return (
      <div
        ref={gridRef}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(auto-fit, minmax(60px, 1fr))`,
          gap: "8px",
          width: "100%",
          maxWidth: cols * 80,
          margin: "0 auto",
        }}
      >
        {gridCells.map(({ stall, row, col }) => {
          const color = stall ? getStatusColor(stall.status) : "#f0f0f0ff";
          const stallNumber = stall ? `#${stall.stall_number}` : "";
          const isSelected = selectedStall === stall?.id;

          return (
            <Tooltip
              key={stall?.id || `${row}-${col}`}
              title={stallNumber || (editMode && !stall?.id ? "Add Stall" : "")}
            >
              <Card
                hoverable={!!stall}
                style={{
                  backgroundColor: color,
                  width: "100%",
                  aspectRatio: "1 / 1",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  border: isSelected ? "2px solid #1890ff" : "1px solid #d9d9d9",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  borderRadius: 8,
                  boxSizing: "border-box",
                }}
                onClick={() => handleStallClick(stall || { row, col })}
                bodyStyle={{ padding: 0 }}
              >
                {loadingVendorId === stall?.id ? (
                  <Spin size="small" />
                ) : stall?.status === "inactive" ? (
                  <ToolOutlined style={{ fontSize: "1.5rem" }} />
                ) : stallNumber || (editMode && !stall?.id ? <PlusOutlined /> : "")}
              </Card>
            </Tooltip>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{ padding: 16, overflowX: "auto" }}>
      {renderGrid()}

<Drawer
  title={
    modalVendor ? (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <Text strong style={{ fontSize: 18 }}>
            Stall #{modalVendor.stall_number}
          </Text>
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {modalVendor.section_name || "No section"} • ID:{" "}
              {modalVendor.stall_id}
            </Text>
          </div>
        </div>
        {modalVendor.vendor && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              backgroundColor: isActive ? "#f6ffed" : "#fff1f0",
              border: `1px solid ${isActive ? "#b7eb8f" : "#ffa39e"}`,
              fontSize: 12,
              fontWeight: 600,
              color: isActive ? "#389e0d" : "#cf1322",
            }}
          >
            {isActive ? "Active" : "Inactive"}
          </div>
        )}
      </div>
    ) : (
      ""
    )
  }
  placement="right"
  width={520}
  onClose={() => setShowModal(false)}
  open={showModal}
  destroyOnClose
  bodyStyle={{
    padding: 20,
    background:
      "linear-gradient(135deg, #f5f7fa 0%, #f9fafb 40%, #ffffff 100%)",
  }}
>
  {modalVendor && (
    <>
      <Tabs
        defaultActiveKey="1"
        type="card"
        tabBarGutter={16}
        tabBarStyle={{
          marginBottom: 16,
          fontWeight: 500,
        }}
        items={[
          modalVendor.vendor && {
            key: "1",
            label: "Details",
            children: (
              <>
                {!isActive && (
                  <Card
                    type="inner"
                    style={{
                      marginBottom: 16,
                      background:
                        "linear-gradient(135deg,#fff1f0 0,#fff0f6 100%)",
                      border: "1px solid #ffccc7",
                      borderRadius: 10,
                      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
                    }}
                  >
                    <Space align="start">
                      <ToolOutlined
                        style={{ fontSize: 20, color: "#ff4d4f" }}
                      />
                      <div>
                        <Text
                          strong
                          style={{ fontSize: 15, color: "#cf1322" }}
                        >
                          Under Maintenance
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 13 }}>
                          {modalVendor.message ||
                            "This stall is temporarily unavailable."}
                        </Text>
                      </div>
                    </Space>
                  </Card>
                )}

                <Card
                  size="small"
                  style={{
                    borderRadius: 12,
                    border: "none",
                    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
                    marginBottom: 16,
                  }}
                  bodyStyle={{ padding: 16 }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      rowGap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Vendor</Text>
                      <Text strong>{modalVendor.vendor.fullname}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Section</Text>
                      <Text>{modalVendor.section_name}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Payment Type</Text>
                      <Text>{modalVendor.payment_type}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      
                      <Text type="secondary">Daily Rent</Text>
                      <Text strong>{fmtMoney(modalVendor.daily_rent)}</Text>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Text type="secondary">Next Due Date</Text>
                     <Text strong>
    {modalVendor.nextDueDate
      ? fmtDate(modalVendor.nextDueDate)
      : "No due date yet"}
  </Text>
                    </div>

                    {modalVendor.missedDays > 0 && (
                      <>
                        <Divider style={{ margin: "8px 0" }} />
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">Missed Days</Text>
                          <Text strong>{modalVendor.missedDays}</Text>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Text type="secondary">Total Missed Amount</Text>
                          <Text strong style={{ color: "#fa541c" }}>
                            {fmtMoney(
                              modalVendor.daily_rent * modalVendor.missedDays
                            )}
                          </Text>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              </>
            ),
          },

          // 📌 Rented History Tab – professional & one-row layout
         {
  key: "2",
  label: "Rented History",
  children: (
    <Card
      size="small"
      style={{
        borderRadius: 14,
        border: "1px solid #edf0f5",
        background: "#ffffff",
        boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
      }}
      bodyStyle={{ padding: 16 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 15 }}>
            Rented History
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Track all previous rentals, balances, and missed days for this stall.
          </Text>
        </div>
      </div>

      <Table
        dataSource={rentedHistory}
        rowKey={(record, idx) => idx}
        pagination={false}
        size="small"
        bordered={false}
        scroll={{ x: true }}
        style={{
          borderRadius: 10,
          overflow: "hidden",
        }}
        rowClassName={(_, index) =>
          index % 2 === 0 ? "row-light" : "row-default"
        }
        columns={[
          {
            title: "Vendor",
            dataIndex: "vendor_name",
            render: (text) => (
              <Text
                strong
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 13,
                }}
              >
                {text}
              </Text>
            ),
          },
          {
            title: "Rent Period",
            render: (_, record) => (
              <Text
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 12,
                }}
              >
                {fmtDate(record.start_date)} – {fmtDate(record.end_date)}
              </Text>
            ),
          },
          {
            title: "Daily Rent",
            dataIndex: "daily_rent",
            render: (value) => (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: "#1890ff",
                    opacity: 0.8,
                  }}
                />
                <Text
                  strong
                  style={{
                    color: "#1890ff",
                    fontSize: 13,
                  }}
                >
                  {fmtMoney(value)}
                </Text>
              </span>
            ),
          },
          {
            title: "Missed Days",
            dataIndex: "missed_days",
            render: (value) => (
              <Text
                style={{
                  whiteSpace: "nowrap",
                  fontSize: 12,
                }}
              >
                {value ?? 0} day(s)
              </Text>
            ),
          },
          {
            title: "Remaining Balance",
            dataIndex: "remaining_balance",
            render: (value) => (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    backgroundColor: "#fff2e8",
                    border: "1px solid #ffd8bf",
                    fontSize: 11,
                    color: "#fa541c",
                    fontWeight: 600,
                  }}
                >
                  {fmtMoney(value)}
                </span>
              </span>
            ),
          },
          
          {
            title: "Actions",
            fixed: "center",
            width: 130,
            render: (_, record) => (
              <Button
                type="text"
                onClick={() => fetchPaymentDetails(record.id)}
            style={{
        padding: "4px 12px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background:
          "#186af7ff", // HCI-friendly
        color: "#ffffff",
        boxShadow: "0 4px 12px rgba(37,99,235,0.35)",
        border: "none",
      }}
              >
                View Payments
              </Button>
            ),
          },
        ]}
      />
    </Card>
  ),
},


          // 📌 Status Logs Tab
        // Status Logs Tab
{
  key: "3",
  label: "Status Logs",
  children: (
    <>
      <Card
  size="small"
  style={{
    borderRadius: 12,
    border: "none",
    boxShadow: "0 4px 16px rgba(15,23,42,0.06)",
  }}
  bodyStyle={{ padding: 12 }}
>
  {statusLogs.length === 0 ? (
    <Empty
      description="No status messages found"
      style={{ padding: 40 }}
    />
  ) : (
    <Table
      dataSource={statusLogs.map((log, idx) => ({
        key: idx,
        status: log.is_active ? "Active" : "Inactive",
        message: log.message || "",
        created_at: fmtDate(log.created_at),
      }))}
      pagination={false}
      size="small"
      bordered={false}
      columns={[
        {
          title: "Status",
          dataIndex: "status",
          render: (text) => (
            <Text
              style={{
                color: text === "Active" ? "#52c41a" : "#ff4d4f",
                fontWeight: 600,
              }}
            >
              {text}
            </Text>
          ),
        },
        {
          title: "Message",
          render: (_, record) => (
            <Button
              type="link"
              style={{
                padding: "2px 10px",
                borderRadius: 999,
                border: "1px solid #0ed7fb",
                background: "linear-gradient(135deg,#e6faff 0,#f5feff 100%)",
                fontSize: 12,
                fontWeight: 600,
              }}
              onClick={() => {
                setSelectedLogMessage(
                  record.message && record.message.trim() !== ""
                    ? record.message
                    : "No message provided."
                );
                setMessageModalVisible(true);
              }}
            >
              View Message
            </Button>
          ),
        },
        { title: "Changed At", dataIndex: "created_at" },
      ]}
    />
  )}
</Card>


      <Modal
        title="Stall Status Message"
        open={messageModalVisible}
        onCancel={() => setMessageModalVisible(false)}
        footer={[
          <Button
            key="close"
            type="primary"
            onClick={() => setMessageModalVisible(false)}
          >
            Close
          </Button>,
        ]}
        centered
      >
        <Text
          style={{
            display: "block",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {selectedLogMessage || "No message provided."}
        </Text>
      </Modal>
    </>
  ),
},

        ].filter(Boolean)}
      />

      <Divider style={{ margin: "16px 0" }} />

      {/* Footer: Status toggle & actions */}
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Card
          size="small"
          style={{
            borderRadius: 12,
            border: "none",
            boxShadow: "0 4px 12px rgba(15,23,42,0.05)",
          }}
          bodyStyle={{ padding: 12 }}
        >
          <Space
            align="center"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <div>
              <Text strong>Stall Status</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                Toggle to mark this stall as active or inactive
              </Text>
            </div>
            <Switch
              checked={isActive}
              onChange={setIsActive}
              checkedChildren="Active"
              unCheckedChildren="Inactive"
            />
          </Space>
        </Card>

        <TextArea
          rows={4}
          placeholder="Leave a note about this status change..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          style={{
            borderRadius: 10,
            fontSize: 14,
            padding: 12,
            backgroundColor: "#ffffff",
            boxShadow: "0 2px 8px rgba(15,23,42,0.06)",
          }}
        />

        <Space
          style={{
            display: "flex",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {modalVendor?.vendor?.fullname && (
            <Button
              danger
              onClick={handleRemoveVendor}
                           style={dangerButtonStyle }

            >
              Remove Vendor
            </Button>
          )}
          <Space>
            <Button
              onClick={() => setShowModal(false)}
                 style={neutralButtonStyle}

            >
              Close
            </Button>
            <Button
              type="primary"
              onClick={handleToggleActive}
               style={primaryButtonStyle}
            >
              Save Changes
            </Button>
          </Space>
        </Space>
      </Space>
    </>
  )}
</Drawer>
<Modal
  title={null}
  open={paymentModalVisible}
  onCancel={() => setPaymentModalVisible(false)}
  footer={null}
  width={860}
  centered
  bodyStyle={{
    padding: 0,
    background:
      "linear-gradient(135deg, #f4f6fb 0%, #f9fafb 40%, #ffffff 100%)",
    borderRadius: 18,
    overflow: "hidden",
  }}
>
  <div
    style={{
      padding: "18px 22px 12px",
      borderBottom: "1px solid #edf0f5",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}
  >
    <div>
      <Text strong style={{ fontSize: 18 }}>
        Payment Details
      </Text>
      <br />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Review all payments made for this rent record, including missed and
        advance days.
      </Text>
    </div>

    {/* Small summary chips */}
    {selectedPaymentHistory && selectedPaymentHistory.length > 0 && (
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "#e6f4ff",
            border: "1px solid #91caff",
            fontSize: 11,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              marginRight: 6,
            }}
          >
            Total Payments:
          </span>
          {selectedPaymentHistory.length}
        </div>
        <div
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            background: "#f6ffed",
            border: "1px solid #b7eb8f",
            fontSize: 11,
          }}
        >
          <span
            style={{
              fontWeight: 600,
              marginRight: 6,
            }}
          >
            Latest:
          </span>
          {fmtDate(selectedPaymentHistory[0]?.payment_date)}
        </div>
      </div>
    )}
  </div>

  <div
    style={{
      maxHeight: 420,
      overflow: "auto",
      padding: 16,
    }}
  >
    {loadingPaymentHistory ? (
      <div style={{ padding: "40px 0", textAlign: "center" }}>
        <Spin size="large" />
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Loading payment records…
          </Text>
        </div>
      </div>
    ) : selectedPaymentHistory.length === 0 ? (
      <Card
        size="small"
        style={{
          borderRadius: 14,
          border: "1px dashed #d9d9d9",
          background: "#fafafa",
        }}
        bodyStyle={{ padding: 24, textAlign: "center" }}
      >
        <Empty
          description={
            <span style={{ color: "#8c8c8c" }}>
              No payment records found for this rent history.
            </span>
          }
        />
      </Card>
    ) : (
      <Card
        size="small"
        style={{
          borderRadius: 14,
          border: "1px solid #edf0f5",
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          background: "#ffffff",
        }}
        bodyStyle={{ padding: 12 }}
      >
        <Table
          dataSource={selectedPaymentHistory}
          rowKey={(record, idx) => idx}
          pagination={false}
          size="small"
          bordered={false}
          scroll={{ x: true }}
          style={{ borderRadius: 10, overflow: "hidden" }}
          rowClassName={(_, index) =>
            index % 2 === 0 ? "row-light" : "row-default"
          }
          columns={[
            {
              title: "Type",
              dataIndex: "payment_type",
              render: (text) => (
                <span
                  style={{
                    padding: "3px 10px",
                    borderRadius: 999,
                    background:
                      "linear-gradient(135deg,#e6f4ff 0,#f0f5ff 100%)",
                    border: "1px solid #bae0ff",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {text}
                </span>
              ),
            },
            {
              title: "Collector",
              dataIndex: "collector",
              render: (text) => (
                <Text style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  {text || "-"}
                </Text>
              ),
            },
            {
              title: "Amount",
              dataIndex: "amount",
              align: "right",
              render: (value) => (
                <Text
                  strong
                  style={{
                    color: "#1677ff",
                    whiteSpace: "nowrap",
                    fontSize: 13,
                  }}
                >
                  {fmtMoney(value)}
                </Text>
              ),
            },
            {
              title: "Payment Date",
              dataIndex: "payment_date",
              render: (date) => (
                <Text style={{ whiteSpace: "nowrap", fontSize: 12 }}>
                  {fmtDate(date)}
                </Text>
              ),
            },
            {
              title: "Missed Days",
              dataIndex: "missed_days",
              align: "center",
              render: (value) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#fff7e6",
                    border: "1px solid #ffe7ba",
                    fontSize: 11,
                    minWidth: 40,
                  }}
                >
                  {value ?? 0}
                </span>
              ),
            },
            {
              title: "Advance Days",
              dataIndex: "advance_days",
              align: "center",
              render: (value) => (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "2px 8px",
                    borderRadius: 999,
                    background: "#f6ffed",
                    border: "1px solid #b7eb8f",
                    fontSize: 11,
                    minWidth: 40,
                  }}
                >
                  {value ?? 0}
                </span>
              ),
            },
            {
              title: "Status",
              dataIndex: "status",
              render: (text) => {
                const lower = (text || "").toLowerCase();
                let color = "#595959";
                let bg = "#f5f5f5";
                if (lower === "collected") {
                  color = "#389e0d";
                  bg = "#f6ffed";
                } else if (lower === "remitted") {
                  color = "#0958d9";
                  bg = "#e6f4ff";
                }
                return (
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 999,
                      backgroundColor: bg,
                      color,
                      fontWeight: 600,
                      fontSize: 12,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {text}
                  </span>
                );
              },
            },
          ]}
        />
      </Card>
    )}
  </div>

  <div
    style={{
      padding: "10px 18px 14px",
      borderTop: "1px solid #edf0f5",
      display: "flex",
      justifyContent: "flex-end",
      gap: 10,
      background: "#ffffff",
    }}
  >
    <Button
      onClick={() => setPaymentModalVisible(false)}
      style={{
        borderRadius: 999,
        padding: "6px 16px",
        fontWeight: 500,
      }}
    >
      Close
    </Button>
  </div>
</Modal>



    </div>
  );
};

export default StallGrid;
