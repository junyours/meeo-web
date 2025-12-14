import React, { useState, useEffect } from "react";
import axios from "axios";
import SlaughterPayment from "./SlaughterPayment"; // Adjust path if needed
import api from "../Api";

const CollectorPayments = () => {
  const [assignedTo, setAssignedTo] = useState(null);
  const [stalls, setStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // ✅ Fetch assignment and stalls (if market)
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/collector/info", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });

        setAssignedTo(res.data.assigned_to); // 'market' or 'slaughter'

        if (res.data.assigned_to === "market") {
          const stallRes = await api.get("/collector/stalls");
          setStalls(stallRes.data.stalls || []);
        }
      } catch (err) {
        console.error("Failed to fetch assignment", err);
        setError("Failed to fetch assignment info.");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, []);

  const handleSelectVendor = (vendor, vendorStalls) => {
    const notCollectable = vendorStalls.every(
      (stall) => stall.rented?.is_collectable === false
    );

    if (notCollectable) {
      alert("Payment for this vendor has already been collected.");
      return;
    }

    setSelectedVendor({ vendor, stalls: vendorStalls });

    const paymentTypeFromApp =
      vendorStalls[0].rented.application?.payment_type || "daily";

    const totalAmount = vendorStalls.reduce((sum, stall) => {
      if (paymentTypeFromApp === "daily") {
        return sum + parseFloat(stall.rented.daily_rent || 0);
      } else {
        return sum + parseFloat(stall.rented.monthly_rent || 0);
      }
    }, 0);

    setAmount(totalAmount);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    try {
      const paymentTypeFromApp =
        selectedVendor.stalls[0].rented.application?.payment_type || "daily";

      for (const stall of selectedVendor.stalls) {
        await api.post("/collectPayment", {
          rented_id: stall.rented.id,
          payment_type: paymentTypeFromApp,
          amount:
            paymentTypeFromApp === "daily"
              ? stall.rented.daily_rent
              : stall.rented.monthly_rent,
          payment_date: paymentDate,
        });
      }

      alert("Payment recorded successfully!");
      setSelectedVendor(null);

      // Refresh stall data
      const res = await api.get("/collector/stalls");
      setStalls(res.data.stalls || []);
    } catch (err) {
      console.error(err);
      alert("Failed to record payment.");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  // If assigned to slaughter, show slaughter form
  if (assignedTo === "slaughter") {
    return <SlaughterPayment />;
  }

  if (!assignedTo) {
    return <p style={{ color: "red" }}>You are not assigned to any area.</p>;
  }

  // Group stalls by vendor name
  const groupedByVendor = stalls.reduce((acc, stall) => {
    if (!stall.rented) return acc;
    const vendorName = stall.rented.application?.vendor?.fullname || "Unknown Vendor";
    acc[vendorName] = acc[vendorName] || [];
    acc[vendorName].push(stall);
    return acc;
  }, {});

  return (
    <div className="stall-grid">
      <h2>Market Stall Collection</h2>

      {!selectedVendor ? (
        Object.entries(groupedByVendor).map(([vendorName, vendorStalls]) => {
          const allNotCollectable = vendorStalls.every(
            (s) => s.rented?.is_collectable === false
          );

          return (
            <div key={vendorName} style={{ marginBottom: "30px" }}>
              <h3>Vendor: {vendorName}</h3>
              <div className="stall-row" style={{ flexWrap: "wrap" }}>
                {vendorStalls.map((stall, index) => {
                  const disabled = stall.rented?.is_collectable === false;
                  return (
                    <div
                      key={`stall-${stall.id || index}`}
                      className="stall-cell occupied"
                      style={{
                        width: "80px",
                        height: "80px",
                        backgroundColor: disabled ? "#6c757d" : "#dc3545",
                        color: "white",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        margin: "5px",
                        fontWeight: "bold",
                        borderRadius: "4px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                        cursor: disabled ? "not-allowed" : "pointer",
                      }}
                      title={`Stall #${stall.stall_number}`}
                      onClick={() => {
                        if (!allNotCollectable)
                          handleSelectVendor(vendorName, vendorStalls);
                      }}
                    >
                      #{stall.stall_number}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      ) : (
        <form onSubmit={handleSubmitPayment} className="payment-form">
          <h3>
            Collect Payment for {selectedVendor.vendor} (
            {selectedVendor.stalls.map((s) => s.stall_number).join(", ")})
          </h3>

          <div style={{ marginBottom: "10px" }}>
            <strong>Payment Type:</strong>{" "}
            {selectedVendor.stalls[0].rented.application?.payment_type || "daily"}
            <br />
            <strong>Total Stalls:</strong> {selectedVendor.stalls.length}
          </div>

          <input
            type="number"
            value={amount}
            readOnly
            style={{ marginBottom: "10px" }}
          />

          <input
            type="date"
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            style={{ marginBottom: "10px" }}
          />

          <div>
            <button type="submit">Confirm Payment</button>
            <button
              type="button"
              onClick={() => setSelectedVendor(null)}
              style={{ marginLeft: "10px" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CollectorPayments;
