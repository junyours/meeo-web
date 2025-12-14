import React, { useEffect, useState } from "react";
import api from "../Api";

const CollectorRemittance = () => {
  const [todayPayments, setTodayPayments] = useState({ daily: 0, monthly: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch today’s collection summary
        const res = await api.get("/collection-summary");
        setTodayPayments({
          daily: Object.values(res.data.daily_breakdown || {}).reduce((a, b) => a + b, 0),
          monthly: res.data.estimated_collection.monthly_total || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get("/remittance-history");
        setHistory(res.data.data || []);
      } catch (err) {
        console.error("Failed to fetch remittance history", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const handleRemit = async (type) => {
    try {
      // Now we do NOT send remitted_by; backend will get collector ID from auth user
      const res = await api.post("/remit-collection", {
        remit_type: type,
        amount: type === "daily" ? todayPayments.daily : todayPayments.monthly,
        received_by: null, // still initially null
      });

      setMessage(res.data.message);
    } catch (err) {
      console.error(err);
      setMessage("Failed to remit collection.");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Collector Remittance</h2>

      <p>Today's Collections:</p>
      <ul>
        <li>Daily Collection: ₱{todayPayments.daily.toFixed(2)}</li>
        <li>Monthly Collection: ₱{todayPayments.monthly.toFixed(2)}</li>
      </ul>

      <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => handleRemit("daily")}
          style={{ padding: "10px", backgroundColor: "#28a745", color: "white", borderRadius: "6px" }}
        >
          Remit Daily Collection
        </button>
        <button
          onClick={() => handleRemit("monthly")}
          style={{ padding: "10px", backgroundColor: "#007bff", color: "white", borderRadius: "6px" }}
        >
          Remit Monthly Collection
        </button>
      </div>

      {message && <p style={{ marginTop: "20px", fontWeight: "bold" }}>{message}</p>}

      <h3 style={{ marginTop: "40px" }}>Remittance History</h3>
      {loadingHistory ? (
        <p>Loading history...</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#f2f2f2" }}>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Date</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Type</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Amount</th>
              <th style={{ border: "1px solid #ddd", padding: "8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", padding: "8px" }}>
                  No remittance records found.
                </td>
              </tr>
            ) : (
              history.map((remit) => (
                <tr key={remit.id}>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {new Date(remit.remit_date).toLocaleDateString()}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {remit.remit_type}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    ₱{Number(remit.amount).toFixed(2)}
                  </td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>
                    {remit.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CollectorRemittance;
