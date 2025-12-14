import React, { useEffect, useState } from "react";
import api from "../Api";

const VendorPaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get("/vendor/payments");
        setPayments(response.data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch payment history.");
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrint = (payment) => {
    const receiptWindow = window.open("", "_blank", "width=400,height=600");
    receiptWindow.document.write(`
      <html>
        <head><title>Receipt #${payment.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="text-align:center;">Payment Receipt</h2>
          <p><strong>Receipt ID:</strong> ${payment.id}</p>
          <p><strong>Stall #:</strong> ${payment.stall_number}</p>
          <p><strong>Type:</strong> ${payment.payment_type}</p>
          <p><strong>Amount:</strong> ₱${parseFloat(payment.amount).toFixed(2)}</p>
          <p><strong>Date:</strong> ${formatDate(payment.payment_date)}</p>
          <p><strong>Collected By:</strong> ${payment.collected_by}</p>
          <hr />
          <p style="text-align:center;">Thank you for your payment!</p>
          <script>window.print();</script>
        </body>
      </html>
    `);
    receiptWindow.document.close();
  };

  if (loading) return <p>Loading payment history...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (payments.length === 0)
    return <p style={{ color: "#555", fontStyle: "italic" }}>
      No payment records found.
    </p>;

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>💳 Payment History</h2>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Stall #</th>
            <th style={styles.th}>Type</th>
            <th style={styles.th}>Amount</th>
            <th style={styles.th}>Collected By</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td style={styles.td}>{formatDate(payment.payment_date)}</td>
              <td style={styles.td}>{payment.stall_number}</td>
              <td style={styles.td}>{payment.payment_type}</td>
              <td style={styles.td}>₱{parseFloat(payment.amount).toFixed(2)}</td>
              <td style={styles.td}>{payment.collected_by}</td>
              <td style={styles.td}>
                <button style={styles.printBtn} onClick={() => handlePrint(payment)}>
                  🖨 Print
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#fff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
  },
  heading: { marginBottom: "20px", color: "#2c3e50" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    background: "#2c3e50",
    color: "white",
    padding: "10px",
    textAlign: "center",
  },
  td: {
    borderBottom: "1px solid #eee",
    padding: "10px",
    textAlign: "center",
  },
  printBtn: {
    background: "#3498db",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    transition: "0.2s",
  },
};

export default VendorPaymentHistory;
