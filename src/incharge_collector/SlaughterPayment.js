import React, { useState, useEffect } from "react";
import api from "../Api";
 // Assuming you have this component

const SlaughterPayment = () => {
  const [formData, setFormData] = useState({
    animals_id: "",
    name: "",
    quantity: "",
    customer_name: "",
    contact_number: "",
  });

  const [kilos, setKilos] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [message, setMessage] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);
  const [liveSummary, setLiveSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const res = await api.get("/animals");
        setAnimals(res.data);
      } catch (err) {
        console.error("Error fetching animals:", err);
        setMessage("Failed to load animals data.");
      }
    };
    fetchAnimals();
  }, []);

  useEffect(() => {
    const qty = parseInt(formData.quantity, 10) || 0;
    setKilos((prev) => {
      const newKilos = [...prev];
      if (qty > newKilos.length) {
        return [...newKilos, ...Array(qty - newKilos.length).fill("")];
      } else if (qty < newKilos.length) {
        return newKilos.slice(0, qty);
      }
      return newKilos;
    });
  }, [formData.quantity]);

  useEffect(() => {
    calculateLiveSummary();
  }, [formData.quantity, kilos, formData.animals_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "quantity") {
      if (value === "" || /^[0-9\b]+$/.test(value)) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleKiloChange = (index, value) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setKilos((prev) => {
        const newKilos = [...prev];
        newKilos[index] = value;
        return newKilos;
      });
    }
  };

  const selectedAnimal = animals.find((a) => a.id.toString() === formData.animals_id);
  const selectedAnimalType = selectedAnimal?.animal_type.toLowerCase() || "";
  const fixedRate = parseFloat(selectedAnimal?.fixed_rate) || 0;

  const getAnimalSummary = (kilo) => {
    const weight = parseFloat(kilo);
    if (!weight || weight <= 0) return null;

    if (selectedAnimalType === "hog" || selectedAnimalType === "pig") {
      const excess = weight > 78 ? weight - 78 : 0;
      const fee = excess * 3.2;
      return { weight, excess, fee };
    }

    if (selectedAnimalType === "cow") {
      const excess = weight > 112 ? weight - 112 : 0;
      const fee = excess * 4.0;
      return { weight, excess, fee };
    }

    if (selectedAnimalType === "carabeef") {
      const excess = weight > 112 ? weight - 112 : 0;
      const fee = excess * 4.5;
      return { weight, excess, fee };
    }

    if (selectedAnimalType === "goat") {
      return { weight, excess: 0, fee: fixedRate };
    }

    return { weight, excess: 0, fee: 0 };
  };

  const calculateLiveSummary = () => {
    const qty = parseInt(formData.quantity, 10) || 0;
    const parsedKilos = kilos.map((k) => parseFloat(k)).filter((k) => !isNaN(k) && k > 0);
    const totalKilos = parsedKilos.reduce((acc, val) => acc + val, 0);

    let totalExcess = 0;
    let slaughter_fee = 0;

    parsedKilos.forEach((kilo) => {
      const summary = getAnimalSummary(kilo);
      if (summary) {
        totalExcess += summary.excess || 0;
        slaughter_fee += summary.fee || 0;
      }
    });

    let ante_mortem = 0;
    let permit_to_slh = 0;
    let coral_fee = 0;

    if (["hog", "pig"].includes(selectedAnimalType)) {
      ante_mortem = qty * 20;
      permit_to_slh = qty * 5;
      coral_fee = qty * 10;
    } else if (selectedAnimalType === "cow") {
      ante_mortem = qty * 40;
      permit_to_slh = qty * 10;
      coral_fee = qty * 20;
    } else if (selectedAnimalType === "carabeef") {
      ante_mortem = qty * 40;
      permit_to_slh = qty * 10;
      coral_fee = qty * 20;
    } else if (selectedAnimalType === "goat") {
      ante_mortem = qty * 20;
      permit_to_slh = qty * 5;
      coral_fee = qty * 10;
    } else {
      ante_mortem = qty * 20;
      permit_to_slh = 0;
      coral_fee = qty * 10;
    }

    const post_mortem = totalKilos * 0.5;
    const base_fee_total = fixedRate * qty;

    const total =
      slaughter_fee +
      ante_mortem +
      post_mortem +
      permit_to_slh +
      coral_fee +
      (selectedAnimalType === "goat" ? 0 : base_fee_total);

    setLiveSummary({
      totalKilos,
      totalExcess,
      slaughter_fee,
      ante_mortem,
      post_mortem,
      permit_to_slh,
      coral_fee,
      base_fee_total,
      total,
    });
  };

  const isFormValid = () => {
    const qty = parseInt(formData.quantity, 10);
    return (
      formData.animals_id &&
      formData.name.trim() &&
      qty > 0 &&
      kilos.length === qty &&
      kilos.every((k) => k && !isNaN(parseFloat(k)) && parseFloat(k) > 0) &&
      formData.customer_name.trim() &&
      formData.contact_number.trim()
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid()) {
      setMessage("Please fill in all fields correctly.");
      return;
    }

    setMessage("");
    setPaymentResult(null);
    setLoading(true);

    const totalKilos = kilos.reduce((acc, k) => acc + (parseFloat(k) || 0), 0);

    try {
      const payload = {
        animals_id: formData.animals_id,
        name: formData.name.trim(),
        quantity: parseInt(formData.quantity, 10),
        kls: totalKilos,
        per_kilos: kilos.map((k) => parseFloat(k) || 0),
        customer_name: formData.customer_name.trim(),
        contact_number: formData.contact_number.trim(),
      };

      const res = await api.post("/slaughter-payments", payload);

      setMessage(res.data.message || "Payment saved successfully!");
      setPaymentResult({
        ...res.data.data,
        fixed_rate: res.data.fixed_rate,
        base_fee_total: res.data.base_fee_total,
        excess_fee: res.data.excess_fee,
      });

      setFormData({
        animals_id: "",
        name: "",
        quantity: "",
        customer_name: "",
        contact_number: "",
      });
      setKilos([]);
      setLiveSummary(null);
    } catch (error) {
      console.error("Error saving payment:", error);
      setMessage("Error saving payment!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white shadow-lg rounded-lg mt-10">
      <h2 className="text-2xl font-bold text-center mb-6">Slaughter Payment Form</h2>

      {message && (
        <div
          className={`mb-4 p-3 text-center rounded ${
            message.toLowerCase().includes("success")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Select Animal</label>
          <select
            name="animals_id"
            value={formData.animals_id}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          >
            <option value="">-- Select an Animal --</option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name} ({animal.animal_type})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Animal Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Per-animal kilo inputs with summary */}
   {kilos.map((kilo, idx) => {
  const summary = getAnimalSummary(kilo);
  const showSummary = selectedAnimalType !== "goat" && summary;

  return (
    <div key={idx} className="col-span-2 md:col-span-1 bg-gray-50 p-4 rounded border border-gray-200 mb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex-1">
        <label className="block text-sm font-medium mb-1">
          Kilos for Animal #{idx + 1}
        </label>
        <input
          type="number"
          name={`kilo_${idx}`}
          value={kilo}
          onChange={(e) => handleKiloChange(idx, e.target.value)}
          min="0"
          step="0.01"
          className="w-full border px-3 py-2 rounded"
        />
      </div>

      {showSummary && (
        <div className="text-sm text-gray-700 md:w-48 bg-white p-2 rounded shadow">
          <p><strong>Entered Weight:</strong> {summary.weight.toFixed(2)} kg</p>
          <p><strong>Excess:</strong> {summary.excess.toFixed(2)} kg</p>
          <p><strong>Extra Slaughter Fee:</strong> ₱{summary.fee.toFixed(2)}</p>
        </div>
      )}
    </div>
  );
})}


        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Customer Name</label>
          <input
            type="text"
            name="customer_name"
            value={formData.customer_name}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Contact Number</label>
          <input
            type="text"
            name="contact_number"
            value={formData.contact_number}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        <div className="col-span-2 flex justify-center">
          <button
            type="submit"
            disabled={!isFormValid() || loading}
            className={`px-6 py-2 mt-4 font-semibold rounded ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white"
            }`}
          >
            {loading ? "Processing..." : "Submit Payment"}
          </button>
        </div>
      </form>

      {/* Live Summary */}
      {liveSummary && (
        <div className="mt-8 border-t pt-4">
          <h3 className="text-lg font-bold mb-2">Live Payment Summary</h3>
          <ul className="space-y-1 text-sm">
            <li>Total Kilos: {liveSummary.totalKilos.toFixed(2)}</li>
            <li>Total Excess: {liveSummary.totalExcess.toFixed(2)}</li>
            <li>Slaughter Fee: ₱{liveSummary.slaughter_fee.toFixed(2)}</li>
            <li>Ante Mortem Fee: ₱{liveSummary.ante_mortem.toFixed(2)}</li>
            <li>Post Mortem Fee: ₱{liveSummary.post_mortem.toFixed(2)}</li>
            <li>Permit to SLH: ₱{liveSummary.permit_to_slh.toFixed(2)}</li>
            <li>Coral Fee: ₱{liveSummary.coral_fee.toFixed(2)}</li>
            <li>Base Fee Total: ₱{liveSummary.base_fee_total.toFixed(2)}</li>
            <li className="font-bold text-lg mt-2">
              Grand Total: ₱{liveSummary.total.toFixed(2)}
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SlaughterPayment;
