import React, { useState, useEffect } from "react";
import api from "../Api";
import LoadingOverlay from "./Loading"; // ✅ shared loader

const MarketUnremittedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.get("/admin/unremitted-payments");
        setPayments(res.data.market);
      } catch (err) {
        console.error(err);
        setError("Failed to load market unremitted payments.");
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
        position: "relative",
      }}
    >
      <h2
        style={{
          marginBottom: 20,
          fontSize: 24,
          fontWeight: 700,
          color: "#1B4F72",
        }}
      >
        💰 Market Unremitted Payments
      </h2>

      {/* Metallic header shine */}
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

      <table
        style={{ width: "100%", minWidth: 800, borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th className="metallic-header" style={{ padding: 12 }}>Vendor</th>
            <th className="metallic-header" style={{ padding: 12 }}>Stall #</th>
            <th className="metallic-header" style={{ padding: 12 }}>Payment Type</th>
            <th className="metallic-header" style={{ padding: 12 }}>Collector</th>
            <th className="metallic-header" style={{ padding: 12 }}>Amount Collected</th>
            <th className="metallic-header" style={{ padding: 12 }}>Collection Date</th>
            <th className="metallic-header" style={{ padding: 12 }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ textAlign: "center", padding: "15px" }}>
                No unremitted payments found.
              </td>
            </tr>
          )}
          {payments.map((p, index) => (
            <tr
              key={`${p.id}-${index}`}
              style={index % 2 === 0 ? {} : { backgroundColor: "#f9f9f9" }}
            >
              <td style={{ padding: 10 }}>{p.vendor_name}</td>
              <td style={{ padding: 10 }}>{p.stall_number}</td>
              <td style={{ padding: 10 }}>{p.payment_type}</td>
              <td style={{ padding: 10 }}>{p.collector}</td>
              <td style={{ padding: 10 }}>
                ₱{Number(p.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </td>
              <td style={{ padding: 10 }}>
                {new Date(p.collection_date).toLocaleDateString()}
              </td>
              <td style={{ padding: 10 }}>{p.status || "Pending"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ✅ Use shared loading overlay */}
      {loading && <LoadingOverlay message="Fetching unremitted payments..." />}
    </div>
  );
};

export default MarketUnremittedPayments;
