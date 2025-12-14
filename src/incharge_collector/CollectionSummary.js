import React, { useEffect, useState } from "react";
import api from "../Api";
import "../assets/css.css";

const CollectionSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await api.get("/collection-summary");
        setSummary(res.data);
        console.log(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load collection summary.");
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  if (loading) return <p>Loading collection summary...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!summary) return <p>No data available.</p>;

  const weekDays = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

  const weeklyTotal = weekDays.reduce(
    (sum, day) => sum + (summary.daily_breakdown[day] || 0),
    0
  );

  return (
    <div className="collection-summary">
      <h2>
        Collector Daily Collection Summary{" "}
        <span style={{ fontSize: "16px", fontWeight: "normal" }}>
          ({summary.date})
        </span>
      </h2>

      <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>
        {/* Estimated Collection */}
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#28a745",
            color: "white",
            flex: 1,
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          <h3>Estimated Collection</h3>
          <p style={{ fontSize: "18px", margin: "6px 0" }}>
            Daily Total: <strong>₱{Number(summary.estimated_collection.daily_total).toFixed(2)}</strong>
          </p>
          <p style={{ fontSize: "18px", margin: "6px 0" }}>
            Monthly Total: <strong>₱{Number(summary.estimated_collection.monthly_total).toFixed(2)}</strong>
          </p>
          <hr style={{ border: "1px solid rgba(255,255,255,0.3)" }} />
          <p style={{ fontSize: "20px", fontWeight: "bold", marginTop: "10px" }}>
            Grand Total: ₱{Number(summary.estimated_collection.grand_total).toFixed(2)}
          </p>
        </div>

        {/* Actual Collection */}
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            backgroundColor: "#007bff",
            color: "white",
            flex: 1,
            boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
          }}
        >
          <h3>Actual Collection (Today)</h3>
          <p style={{ fontSize: "26px", fontWeight: "bold", margin: "10px 0" }}>
            ₱{Number(summary.actual_collection).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Daily Breakdown Table (always visible) */}
      {summary.daily_breakdown && (
        <div style={{ marginTop: "30px" }}>
          <h3>This Week’s Daily Collection</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ backgroundColor: "#f1f1f1" }}>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Day</th>
                <th style={{ padding: "10px", border: "1px solid #ddd" }}>Amount Collected</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day, idx) => (
                <tr key={idx}>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>{day}</td>
                  <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                    ₱{Number(summary.daily_breakdown[day] || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: "#f9f9f9", fontWeight: "bold" }}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>Weekly Total</td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  ₱{Number(weeklyTotal).toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default CollectionSummary;
