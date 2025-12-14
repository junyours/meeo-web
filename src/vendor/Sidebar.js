import React, { useState } from 'react';

const styles = {
  sidebar: {
    width: '220px',
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px 15px',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: 'Segoe UI, sans-serif',
    boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
  },
  sidebarItem: {
    margin: '8px 0',
    cursor: 'pointer',
    padding: '10px 14px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    transition: 'all 0.3s ease',
  },
  sidebarItemHover: {
    backgroundColor: '#34495e',
    transform: 'translateX(4px)',
  },
  header: {
    fontSize: '18px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textAlign: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.2)',
    paddingBottom: '10px',
  },
};

const Sidebar = ({ onMenuClick }) => {
  const [hovered, setHovered] = useState(null);

  const items = [
    { key: 'Profile', label: '👤 Profiling' },
    { key: 'Rented', label: '📦 Rented Stalls' },
    { key: 'Payment', label: '💳 Payment History' },
    { key: 'application-letter', label: '📝 Application Letter' },
    { key: 'Status', label: '📄 Application Status' },
  ];

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>Vendor Menu</div>
      {items.map((item) => (
        <div
          key={item.key}
          onClick={() => onMenuClick(item.key)}
          style={{
            ...styles.sidebarItem,
            ...(hovered === item.key ? styles.sidebarItemHover : {}),
          }}
          onMouseEnter={() => setHovered(item.key)}
          onMouseLeave={() => setHovered(null)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
