// MotorPoolUnremittedPayments.js
import React, { useState, useEffect } from "react";
import api from "../Api";
import LoadingOverlay from "./Loading"; // ✅ shared loader

const MotorPoolUnremittedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/unremitted-payments");
        setPayments(res.data.motorpool);
      } catch (err) {
        console.error(err);
        setError("Failed to load motorpool unremitted payments.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  return (
    <div
      style={{
        overflowX: "auto",
        padding: "20px",
        background: "rgba(255,255,255,0.85)",
        borderRadius: 15,
        boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        position: "relative", // ✅ ensures overlay positioning works
      }}
    >
      <h2
        style={{
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 700,
          color: "#117A65",
        }}
      >
        🚚 MotorPool Unremitted Payments
      </h2>

      {/* Metallic Blue Shine Animation */}
      <style>
        {`
          @keyframes shine {
            0% { background-position: -200px; }
            100% { background-position: 200px; }
          }
          .metallic-header {
            background: linear-gradient(135deg, #1E90FF, #63B8FF, #1E90FF);
            background-size: 400px 100%;
            color: white;
            border: 1px solid #1E90FF;
            border-radius: 4px;
            animation: shine 3s linear infinite;
          }
        `}
      </style>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th className="metallic-header" style={{ padding: 12 }}>Amount</th>
            <th className="metallic-header" style={{ padding: 12 }}>Collection Date</th>
            <th className="metallic-header" style={{ padding: 12 }}>Collector</th>
            <th className="metallic-header" style={{ padding: 12 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && !loading && (
            <tr>
              <td colSpan={4} style={{ textAlign: "center", padding: "15px" }}>
                No unremitted payments found.
              </td>
            </tr>
          )}
          {payments.map((p, index) => (
            <tr
              key={`${p.id}-${index}`}
              style={index % 2 === 0 ? {} : { backgroundColor: "#f9f9f9" }}
            >
              <td style={cellStyle}>
                ₱{Number(p.amount).toLocaleString("en-PH", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td style={cellStyle}>
                {new Date(p.collection_date).toLocaleDateString()}
              </td>
              <td style={cellStyle}>{p.collector}</td>
              <td style={cellStyle}>{p.status || "Pending"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Shared loader */}
      {loading && <LoadingOverlay message="Loading MotorPool Unremitted Payments..." />}
      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
    </div>
  );
};

const cellStyle = { padding: 10 };

export default MotorPoolUnremittedPayments;
