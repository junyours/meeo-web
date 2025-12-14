import React, { useEffect, useState } from "react";
import api from "../Api";

const VendorApplicationStatus = () => {
  const [groupedApplications, setGroupedApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchApplications = async () => {
    try {
      const res = await api.get("/my-applications");
      const apps = res.data.applications || [];

      // Group by business name
      const grouped = Object.values(
        apps.reduce((acc, app) => {
          const key = app.business_name;
          if (!acc[key]) {
            acc[key] = {
              id: app.id,
              business_name: app.business_name,
              section: app.section?.name || "N/A",
              stalls: [],
              status: app.status,
              created_at: app.created_at,
            };
          }
          acc[key].stalls.push(app.stall?.stall_number || "N/A");
          return acc;
        }, {})
      );

      setGroupedApplications(grouped);
    } catch (err) {
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  if (loading) return <p>Loading your applications...</p>;
  if (groupedApplications.length === 0)
    return <p>You have no stall applications yet.</p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>📄 My Applications</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Business Name</th>
            <th style={styles.th}>Section</th>
            <th style={styles.th}>Stall Number(s)</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Date Applied</th>
          </tr>
        </thead>
        <tbody>
          {groupedApplications.map((app) => (
            <tr key={app.id} style={styles.row}>
              <td style={styles.td}>{app.business_name}</td>
              <td style={styles.td}>{app.section}</td>
              <td style={styles.td}>{app.stalls.join(", ")}</td>
              <td style={styles.td}>
                <span style={{ ...styles.badge, ...getStatusStyle(app.status) }}>
                  {app.status}
                </span>
              </td>
              <td style={styles.td}>
                {new Date(app.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Styling
const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  heading: { marginBottom: "20px", color: "#2c3e50" },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "14px",
  },
  th: {
    background: "#2c3e50",
    color: "white",
    padding: "12px",
    textAlign: "center",
  },
  td: {
    padding: "10px",
    textAlign: "center",
    borderBottom: "1px solid #eee",
  },
  row: {
    transition: "background 0.2s ease",
  },
  badge: {
    padding: "4px 10px",
    borderRadius: "8px",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
};

const getStatusStyle = (status) => {
  switch (status) {
    case "approved":
      return { background: "#d4edda", color: "#155724" };
    case "rejected":
      return { background: "#f8d7da", color: "#721c24" };
    default:
      return { background: "#fff3cd", color: "#856404" };
  }
};

export default VendorApplicationStatus;
