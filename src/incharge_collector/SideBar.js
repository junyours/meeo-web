import React, { useState, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FileText,
  User,
  ClipboardList,
} from "lucide-react"; 
import api from "../Api"; // ✅ use your api.js

const styles = {
  sidebar: {
    width: "240px",
    backgroundColor: "#1e293b",
    color: "white",
    padding: "20px 10px",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, sans-serif",
    boxShadow: "2px 0 6px rgba(0,0,0,0.15)",
  },
  sidebarHeader: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "20px",
    textAlign: "center",
  },
  sidebarItem: {
    margin: "6px 0",
    cursor: "pointer",
    padding: "10px 14px",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    transition: "background 0.2s",
  },
  sidebarItemHover: {
    backgroundColor: "#334155",
  },
  submenu: {
    paddingLeft: "16px",
    marginTop: "6px",
  },
  submenuItem: {
    margin: "4px 0",
    cursor: "pointer",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "14px",
    backgroundColor: "rgba(255,255,255,0.05)",
    transition: "background 0.2s",
  },
  submenuItemHover: {
    backgroundColor: "#475569",
  },
};

const Sidebar = ({ onMenuClick }) => {
  const [openMenus, setOpenMenus] = useState({});
  const [collector, setCollector] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/incharge-details");
        setCollector(res.data);
        console.log(res.data)
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const toggleMenu = (key) => {
    setOpenMenus((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleClick = (key) => {
    onMenuClick(key);
  };

  return (
    <div style={styles.sidebar}>
      <div style={styles.sidebarHeader}>📊 Incharge Panel</div>

      {/* ✅ Show Collected Payment ONLY if collector is assigned */}
   {collector && collector.area && collector.Status === "approved" && (
  <>
    <div
      style={{
        ...styles.sidebarItem,
        ...(openMenus.collected ? styles.sidebarItemHover : {}),
      }}
      onClick={() => toggleMenu("collected")}
    >
      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <ClipboardList size={18} /> Collected Payment
      </span>
      {openMenus.collected ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronRight size={16} />
      )}
    </div>

    {openMenus.collected && (
      <div style={styles.submenu}>
        {/* ✅ Only show the collector's assigned area */}
        <div>
          <div
            style={{
              ...styles.sidebarItem,
              ...(openMenus[collector.area] ? styles.sidebarItemHover : {}),
            }}
            onClick={() => toggleMenu(collector.area)}
          >
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Folder size={16} />
              {collector.area.charAt(0).toUpperCase() + collector.area.slice(1)}
            </span>
            {openMenus[collector.area] ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </div>

          {openMenus[collector.area] && (
            <div style={styles.submenu}>
              {["daily", "weekly", "monthly", "yearly"].map((period) => (
                <div
                  key={period}
                  style={styles.submenuItem}
                  onClick={() => handleClick(`${collector.area}-${period}`)}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background =
                      styles.submenuItemHover.backgroundColor)
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background =
                      "rgba(255,255,255,0.05)")
                  }
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )}
  </>
)}


      {/* ✅ Always Visible Menus */}
      <div
        style={styles.sidebarItem}
        onClick={() => handleClick("collection-summary")}
        onMouseOver={(e) =>
          (e.currentTarget.style.background =
            styles.sidebarItemHover.backgroundColor)
        }
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <FileText size={18} /> Collection
      </div>

      <div
        style={styles.sidebarItem}
        onClick={() => handleClick("collects")}
        onMouseOver={(e) =>
          (e.currentTarget.style.background =
            styles.sidebarItemHover.backgroundColor)
        }
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <ClipboardList size={18} /> Collects Payment
      </div>

      <div
        style={styles.sidebarItem}
        onClick={() => handleClick("remittance")}
        onMouseOver={(e) =>
          (e.currentTarget.style.background =
            styles.sidebarItemHover.backgroundColor)
        }
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <ClipboardList size={18} /> Remittance
      </div>
      <div
        style={styles.sidebarItem}
        onClick={() => handleClick("profile")}
        onMouseOver={(e) =>
          (e.currentTarget.style.background =
            styles.sidebarItemHover.backgroundColor)
        }
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <User size={18} /> Profiling
      </div>

      <div
        style={styles.sidebarItem}
        onClick={() => handleClick("report")}
        onMouseOver={(e) =>
          (e.currentTarget.style.background =
            styles.sidebarItemHover.backgroundColor)
        }
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <FileText size={18} /> Collection Reports
      </div>
      <div
  style={styles.sidebarItem}
  onClick={() => handleClick("slaughter-payment")}
  onMouseOver={(e) =>
    (e.currentTarget.style.background =
      styles.sidebarItemHover.backgroundColor)
  }
  onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
>
  <ClipboardList size={18} /> Slaughter Payment
</div>
    </div>
  );
};

export default Sidebar;
