import React, { useState, useEffect } from 'react';
import api from '../Api';

const VendorApplicationForm = () => {
  const [form, setForm] = useState({ business_name: '', section_id: '', stall_ids: [] });
  const [sections, setSections] = useState([]);
  const [stalls, setStalls] = useState([]);
  const [message, setMessage] = useState('');
  const [isDisabled, setIsDisabled] = useState(false);
  const [paymentType, setPaymentType] = useState('monthly');
  const [stallAmounts, setStallAmounts] = useState([]);

  useEffect(() => {
    const fetchSections = async () => {
      const res = await api.get('/sections');
      setSections(res.data.data);
    };

    const fetchApplications = async () => {
      try {
        const res = await api.get('/my-applications');
        const activeApp = res.data.applications.find(app =>
          ['pending', 'approved'].includes(app.status)
        );
        if (activeApp) {
          setIsDisabled(true);
          setMessage(
            activeApp.status === 'approved'
              ? '✅ You already have an approved application.'
              : '⏳ You already submitted an application. Please wait for approval.'
          );

          setForm({
            business_name: activeApp.business_name,
            section_id: activeApp.section_id.toString(),
            stall_ids: [activeApp.stall_id.toString()],
          });

          const selected = res.data.data?.find(s => s.id === activeApp.section_id);
          setStalls(selected ? selected.stalls.filter(st => st.status === 'vacant') : []);
        }
      } catch (error) {
        console.error('Error loading applications', error);
      }
    };

    fetchSections().then(fetchApplications);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDisabled) return;

    try {
      await api.post('/applications', { 
        ...form, 
        payment_type: paymentType 
      });
      setMessage('✅ Application submitted! Wait for admin approval.');
      setForm({ business_name: '', section_id: '', stall_ids: [] });
      setStallAmounts([]);
    } catch {
      setMessage('❌ Failed to submit application.');
    }
  };

  const handleSectionChange = (sectionId) => {
    setForm({ ...form, section_id: sectionId, stall_ids: [] });
    const selected = sections.find((s) => s.id === parseInt(sectionId, 10));
    setStalls(selected ? selected.stalls.filter((st) => st.status === 'vacant') : []);
    setStallAmounts([]);
  };

  

  const handleStallCheckboxChange = (stallId) => {
    const updatedStallIds = form.stall_ids.includes(stallId)
      ? form.stall_ids.filter(id => id !== stallId)
      : [...form.stall_ids, stallId];
    setForm({ ...form, stall_ids: updatedStallIds });

    const section = sections.find(s => s.id === parseInt(form.section_id, 10));
    const stall = stalls.find(st => st.id === parseInt(stallId, 10));


    if (section && stall) {
      let updatedStallAmounts = [...stallAmounts];
      if (updatedStallIds.includes(stallId)) {
        const amount = section.rate_type === 'per_sqm'
          ? (section.rate * stall.size) * (paymentType === 'monthly' ? 30 : 1)
          : section.monthly_rate / (paymentType === 'monthly' ? 1 : 30);
        updatedStallAmounts.push({ stallId, amount });
      } else {
        updatedStallAmounts = updatedStallAmounts.filter(stall => stall.stallId !== stallId);
      }
      setStallAmounts(updatedStallAmounts);
    }
  };

  const getTotalAmount = () => {
    return stallAmounts.reduce((total, stall) => total + stall.amount, 0).toFixed(2);
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>📝 Stall Application</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="Business Name"
          value={form.business_name}
          onChange={(e) => setForm({ ...form, business_name: e.target.value })}
          required
          disabled={isDisabled}
          style={styles.input}
        />

        <select
          value={form.section_id}
          onChange={(e) => handleSectionChange(e.target.value)}
          required
          disabled={isDisabled}
          style={styles.input}
        >
          <option value="">Select Section</option>
          {sections.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {form.section_id && (
          <div style={styles.checkboxGroup}>
            <label style={styles.label}>Available Stalls:</label>
            <div style={styles.stallList}>
              {stalls.length > 0 ? (
                stalls.map((st) => (
                  <label key={st.id} style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      value={st.id}
                      checked={form.stall_ids.includes(st.id.toString())}
                      onChange={() => handleStallCheckboxChange(st.id.toString())}
                      disabled={isDisabled}
                    />
                    Stall #{st.stall_number}
                  </label>
                ))
              ) : (
                <p>No vacant stalls.</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label style={styles.label}>Payment Type: </label>
          <select 
            value={paymentType} 
            onChange={(e) => setPaymentType(e.target.value)} 
            disabled={isDisabled} 
            style={styles.input}
          >
            <option value="monthly">Monthly</option>
            <option value="daily">Daily</option>
          </select>
        </div>

        {stallAmounts.length > 0 && (
          <>
            <h3 style={styles.subheading}>Selected Stalls & Amounts</h3>
            <ul>
              {stallAmounts.map((stall) => (
                <li key={stall.stallId}>
                  Stall #{stalls.find(s => s.id === parseInt(stall.stallId, 10))?.stall_number} 
                  - <strong>₱{stall.amount.toFixed(2)}</strong>
                </li>
              ))}
            </ul>
            <p style={styles.total}><strong>Total ({paymentType}): ₱{getTotalAmount()}</strong></p>
          </>
        )}

        <button 
          type="submit" 
          disabled={isDisabled || form.stall_ids.length === 0}
          style={styles.button}
        >
          Submit Application
        </button>
      </form>

      {message && <p style={styles.message}>{message}</p>}
    </div>
  );
};

const styles = {
  card: {
    background: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxWidth: '600px',
    margin: 'auto',
  },
  heading: { marginBottom: '15px', color: '#2c3e50' },
  subheading: { marginTop: '20px', color: '#34495e' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
  },
  checkboxGroup: { margin: '10px 0' },
  stallList: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  checkboxLabel: { background: '#f8f9fa', padding: '8px 12px', borderRadius: '6px' },
  label: { fontWeight: 'bold', marginBottom: '5px', display: 'block' },
  button: {
    backgroundColor: '#27ae60',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  total: { fontSize: '16px', marginTop: '10px' },
  message: { marginTop: '15px', color: '#e74c3c', fontWeight: 'bold' },
};

export default VendorApplicationForm;
