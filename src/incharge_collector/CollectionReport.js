import React, { useState } from "react";
import api from "../Api"; // axios instance

const CollectionReport = () => {
  const [period, setPeriod] = useState("daily");
  const [data, setData] = useState({ payments: [], total: 0 });

  const fetchReport = async (selectedPeriod) => {
    setPeriod(selectedPeriod);
    try {
      const res = await api.get(`/reports/${selectedPeriod}`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching report:", err);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Collection Report</h2>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {["daily", "weekly", "monthly", "yearly"].map((p) => (
          <button
            key={p}
            onClick={() => fetchReport(p)}
            className={`px-4 py-2 rounded ${
              period === p ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* Report Table */}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Vendor</th>
            <th className="border px-2 py-1">Stall</th>
            <th className="border px-2 py-1">Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.payments.length > 0 ? (
            data.payments.map((p) => (
              <tr key={p.id}>
                <td className="border px-2 py-1">{p.payment_date}</td>
                <td className="border px-2 py-1">{p.vendor?.fullname}</td>
                <td className="border px-2 py-1">{p.rented?.stall?.stall_number}</td>
                <td className="border px-2 py-1 text-right">{p.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="border px-2 py-1 text-center" colSpan="4">
                No payments found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Total */}
      <div className="mt-4 font-bold text-right">
        Total: {data.total}
      </div>
    </div>
  );
};

export default CollectionReport;
