import React, { useState } from 'react';
import Sidebar from './Sidebar';
import VendorApplicationForm from './ApplicationForm';
import VendorProfile from './VendorProfile';
import RentedStalls from './RentedStalls';
import VendorApplicationStatus from './VendorApplicationStatus';
import VendorPaymentHistory from './VendorPaymentHistory';

const VendorDashboard = () => {
  const [activeView, setActiveView] = useState('welcome');

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://127.0.0.1:8000/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        localStorage.removeItem('authToken');
        alert('Logged out successfully!');
        window.location.href = '/';
      } else {
        const data = await response.json();
        alert(`Logout failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('Network error during logout.');
    }
  };

  const renderContent = () => {
    switch (activeView) {
      case 'Profile': return <VendorProfile />;
      case 'Rented': return <RentedStalls />;
      case 'application-letter': return <VendorApplicationForm />;
      case 'Status': return <VendorApplicationStatus />;
      case 'Payment': return <VendorPaymentHistory />;
      default:
        return (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <h2>👋 Welcome, Vendor!</h2>
      
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar onMenuClick={setActiveView} />
      <div style={styles.contentArea}>
        <div style={styles.topbar}>
          <div style={styles.logo}>🏬 Vendor Dashboard</div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <div style={styles.mainContent}>{renderContent()}</div>
      </div>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  contentArea: { flexGrow: 1, display: 'flex', flexDirection: 'column' },
  topbar: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: { fontWeight: 'bold', fontSize: '18px' },
  mainContent: {
    padding: '20px',
    backgroundColor: '#f4f6f7',
    flexGrow: 1,
    overflowY: 'auto',
  },
  logoutButton: {
    fontSize: '14px',
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};

export default VendorDashboard;
