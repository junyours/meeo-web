import React, { useState } from 'react';
import Sidebar from './SideBar';
import CollectorPayments from './CollectsPayment';
import InchargeProfile from './Incharge_Details';
import CollectionSummary from './CollectionSummary';
import CollectionReport from './CollectionReport';
import CollectorRemittance from './Remittance';
import SlaughterPayment from './SlaughterPayment';

const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    fontFamily: 'Arial, sans-serif',
  },
  contentArea: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  topbar: {
    backgroundColor: '#34495e',
    color: 'white',
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mainContent: {
    padding: '20px',
    backgroundColor: '#ecf0f1',
    flexGrow: 1,
    overflowY: 'auto',
  },
  logoutButton: {
    fontSize: '14px',
    padding: '8px 16px',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

const InchargeDashboard = () => {
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
    
      case 'market-permit':
        return <p>Collections</p>;
        case 'collects':
        return <CollectorPayments />;
        case 'profile':
          return <InchargeProfile />;
          case 'collection-summary':
            return <CollectionSummary />;
            case 'report':
              return <CollectionReport />;
              case 'remittance':
                return <CollectorRemittance />;
                case 'slaughter-payment':
                  return <SlaughterPayment />;
      default:
        return (
          <div>
            <h2>Welcome, Incharge Name!</h2>
            <p>Select an option from the sidebar.</p>
          </div>
        );
    }
  };

  return (
    <div style={styles.container}>
      <Sidebar onMenuClick={setActiveView} />
      <div style={styles.contentArea}>
        <div style={styles.topbar}>
          <div>Incharge Dashboard</div>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
        <div style={styles.mainContent}>{renderContent()}</div>
      </div>
    </div>
  );
};

export default InchargeDashboard;
