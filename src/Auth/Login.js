import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock } from 'react-icons/fa';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { Layout, Typography, Divider, Space } from 'antd';
import api from '../Api';
import logo from '../assets/logo_meeo.png';
import bg from '../assets/bg.jpg';

const { Footer } = Layout;
const { Text, Link } = Typography;

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: '' });
  };

  const validateForm = () => {
    const errors = {};
    if (!form.username.trim()) errors.username = 'Username is required';
    if (!form.password.trim()) errors.password = 'Password is required';
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const response = await api.post('/login', form);
      const userData = response.data.user;
      const authToken = response.data.token;

      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userRole', JSON.stringify(userData.role));
      localStorage.setItem('userId', userData.id);

      if (userData.role.includes('incharge_collector') && userData.collector_id) {
        localStorage.setItem('collectorId', userData.collector_id);
      }

      const rolePaths = {
        admin: '/admin/dashboard',
        vendor: '/vendor/dashboard',
        incharge_collector: '/incharge_collector/dashboard',
        main_collector: '/main_collector/dashboard',
        collector_staff: '/collector_staff/dashboard',
      };

      navigate(rolePaths[userData.role] || '/');
    } catch {
      setError('Login failed. Please check your credentials.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  useEffect(() => {
    setLoaded(true);
    const role = JSON.parse(localStorage.getItem('userRole'));
    const token = localStorage.getItem('authToken');
    if (!role || !token) return;

    const rolePaths = {
      admin: '/admin/dashboard',
      vendor: '/vendor/dashboard',
      incharge_collector: '/incharge_collector/dashboard',
      main_collector: '/main_collector/dashboard',
      collector_staff: '/collector_staff/dashboard',
    };

    if (['/', '/login'].includes(location.pathname)) {
      setTimeout(() => {
        navigate(rolePaths[role] || '/', { replace: true });
      }, 100);
    }
  }, [location.pathname, navigate]);

  // --- STYLES ---
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    fontFamily: 'Inter, Segoe UI, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  };

  const bgStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `url(${bg}) center center / cover no-repeat`,
    filter: 'blur(8px) brightness(0.6)',
    zIndex: -2,
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: -1,
  };

  const cardWrapperStyle = {
    width: '100%',
    maxWidth: '900px',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '20px',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(20px)',
    flexDirection: 'row',
    border: '1px solid rgba(255,255,255,0.15)',
    transition: 'all 0.3s ease',
    animation: shake ? 'shake 0.5s' : '',
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
  };

  const formContainerStyle = {
    flex: 1,
    padding: '60px 50px',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  };

  const logoContainerStyle = {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  };

  const logoStyle = {
    maxWidth: '100%',
    maxHeight: '260px',
    objectFit: 'contain',
  };

  const titleStyle = {
    fontSize: '32px',
    marginBottom: '15px',
    fontWeight: '800',
    color: '#fff',
    textShadow: '1px 1px 4px rgba(0,0,0,0.6)',
  };

  const subtitleStyle = {
    fontSize: '16px',
    marginBottom: '40px',
    color: '#ddd',
    lineHeight: '1.6',
  };

  const inputContainerStyle = {
    position: 'relative',
    marginBottom: '5px',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: '12px',
    padding: '12px 15px',
    border: '1px solid rgba(255,255,255,0.25)',
  };

  const iconStyle = {
    color: '#ccc',
    fontSize: '18px',
    marginRight: '10px',
  };

  const inputStyle = {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#fff',
  };

  const togglePasswordStyle = {
    fontSize: '18px',
    color: '#ccc',
    cursor: 'pointer',
  };

  const buttonStyle = {
    padding: '16px',
    width: '100%',
    background: 'linear-gradient(135deg, #4e54c8 0%, #8f94fb 100%)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: '700',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '15px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
  };

  const fieldErrorStyle = {
    color: '#ff6b6b',
    fontSize: '12px',
    marginBottom: '10px',
    marginTop: '2px',
  };

  const errorStyle = {
    color: '#ff6b6b',
    fontSize: '14px',
    marginTop: '10px',
  };

  // Footer style
  const footerStyle = {
    textAlign: 'center',
    color: '#aaa',
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(6px)',
    borderTop: '1px solid rgba(255,255,255,0.15)',
    padding: '20px',
    fontSize: '14px',
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <div style={containerStyle}>
        <div style={bgStyle}></div>
        <div style={overlayStyle}></div>

        <div style={cardWrapperStyle}>
          <div style={formContainerStyle}>
            <h2 style={titleStyle}>MEEO Login</h2>
            <p style={subtitleStyle}>
              Enterprise Collection of General Fund and Monitoring of Stall Rental Fee <br />
              <strong>Municipal Economic Enterprise Office</strong>
            </p>

            <form onSubmit={handleSubmit}>
              <div style={inputContainerStyle}>
                <FaEnvelope style={iconStyle} />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Username"
                  style={inputStyle}
                />
              </div>
              {fieldErrors.username && <div style={fieldErrorStyle}>{fieldErrors.username}</div>}

              <div style={inputContainerStyle}>
                <FaLock style={iconStyle} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  style={inputStyle}
                />
                <span onClick={() => setShowPassword(!showPassword)} style={togglePasswordStyle}>
                  {showPassword ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
                </span>
              </div>
              {fieldErrors.password && <div style={fieldErrorStyle}>{fieldErrors.password}</div>}

              <button
                type="submit"
                style={buttonStyle}
                onMouseOver={(e) => (e.target.style.transform = 'scale(1.03)')}
                onMouseOut={(e) => (e.target.style.transform = 'scale(1)')}
              >
                Log In
              </button>

              {error && <p style={errorStyle}>{error}</p>}
            </form>
          </div>

          <div style={logoContainerStyle}>
            <img src={logo} alt="MEEO Logo" style={logoStyle} />
          </div>
        </div>
      </div>

      {/* FOOTER SECTION */}
      <Footer style={footerStyle}>
        <Space direction="vertical" size={5} align="center">
          <Text type="secondary">
            © {new Date().getFullYear()} Municipal Economic Enterprise Office | Version 1.0.0
          </Text>
          <Divider style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,0.1)' }} />
          <Text style={{ color: '#ccc' }}>
            Developed by{" "}
            <a href="https://www.facebook.com/ronnie1016" target="_blank" rel="noreferrer">
              Ronnie Flores
            </a>
            ,{" "}
            <a href="https://www.facebook.com/izheykhedoq420" target="_blank" rel="noreferrer">
              Jon Brey Lastimosa
            </a>
            ,{" "}
            <a href="https://www.facebook.com/profile.php?id=61583017889860" target="_blank" rel="noreferrer">
            Nathaniel Aba
            </a>{" "}
            and{" "}
            <a href="https://www.facebook.com/dean.franncis.quimanhan" target="_blank" rel="noreferrer">
              Dean Francis Quimanhan
            </a>
          </Text>
        </Space>
      </Footer>

      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-10px); }
            80% { transform: translateX(10px); }
            100% { transform: translateX(0); }
          }
          @media (max-width: 768px) {
            div[style*='flex-direction: row'] {
              flex-direction: column !important;
            }
          }
        `}
      </style>
    </Layout>
  );
};

export default Login;
