import React, { useEffect, useState } from "react";
import { Badge, Dropdown, message, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import api from "../Api";

const NotificationBell = ({ onNotificationClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(5);
  const [open, setOpen] = useState(false);
  const [seeMoreLoading, setSeeMoreLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/notifications");
      setNotifications(data || []);
      setVisibleCount(5);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.is_read) {
        await api.post(`/admin/notifications/${notif.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, is_read: 1 } : n))
        );
      }

      if (onNotificationClick) {
        let targetView = "dashboard";
        switch (notif.title) {
          case "New Application Form":
            targetView = "market-vendor-applications";
            break;
          case "New Vendor Profiling":
            targetView = "vendor-accounts";
            break;
          case "Stall Removal Request":
            targetView = "remove-stall";
            break;
          case "Stall Change Request":
            targetView = "market-stall-change";
            break;
          default:
            targetView = "dashboard";
        }

        onNotificationClick(targetView, notif.vendor_id);
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to mark notification as read");
    }
  };

  const visibleNotifications = notifications.slice(0, visibleCount);

  const notifItems = visibleNotifications.length
    ? visibleNotifications.map((notif) => ({
        key: notif.id,
        label: (
          <div
            onClick={() => handleNotificationClick(notif)}
            style={{
              cursor: "pointer",
              backgroundColor: notif.is_read ? "#fff" : "#e6f7ff",
              padding: "10px 14px",
              borderRadius: 8,
              boxShadow: notif.is_read
                ? "none"
                : "0 2px 8px rgba(0, 0, 0, 0.08)",
              marginBottom: 6,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#f0faff")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = notif.is_read
                ? "#fff"
                : "#e6f7ff")
            }
          >
            <strong>{notif.title}</strong>
            <div style={{ fontSize: 12, color: "#555" }}>{notif.message}</div>
          </div>
        ),
      }))
    : [
        {
          key: "none",
          label: (
            <div
              style={{
                textAlign: "center",
                color: "#888",
                padding: 12,
              }}
            >
              No notifications
            </div>
          ),
          disabled: true,
        },
      ];

  const hasMore = notifications.length > visibleCount;

  const items = [
    ...notifItems,
    ...(hasMore
      ? [
          {
            key: "see-more",
            label: (
              <div
                style={{
                  textAlign: "center",
                  padding: "10px 0",
                  cursor: seeMoreLoading ? "default" : "pointer",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  color: "#0061cf",
                }}
                onClick={(e) => {
                  if (seeMoreLoading) return;
                  e.preventDefault();
                  e.stopPropagation();
                  setSeeMoreLoading(true);
                  setOpen(true);
                  setTimeout(() => {
                    setVisibleCount((prev) => prev + 5);
                    setSeeMoreLoading(false);
                  }, 1500);
                }}
              >
                {seeMoreLoading && <Spin size="small" />}
                <span>{seeMoreLoading ? "Loading..." : "See more"}</span>
              </div>
            ),
          },
        ]
      : []),
  ];

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Dropdown
      menu={{
        items,
        overlayStyle: {
          minWidth: 280,
          borderRadius: 12,
          padding: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          background: "#fff",
        },
      }}
      placement="bottomRight"
      arrow
      trigger={["click"]}
      open={open}
      onOpenChange={(nextOpen) => setOpen(nextOpen)}
    >
      <Badge count={unreadCount} offset={[0, 0]}>
        <BellOutlined
          style={{
            fontSize: 24,
            color: "#fff",
            cursor: "pointer",
            transition: "all 0.2s",
          }}
          onClick={() => setOpen((prev) => !prev)}
        />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
