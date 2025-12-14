import React from 'react';
import { HashRouter  as Router, Routes, Route } from 'react-router-dom';

// import SectionManager from './admin/SectionManager';
import PrivateRoute from './Auth/PrivateRoute';
import Login from './Auth/Login';
import AdminDashboard from './admin/Dashboard';
import VendorDashboard from './vendor/VendorDashboard';
import InchargeDashboard from './incharge_collector/Dashboard';
import MainDashboard from './main_collector/Dashboard';
import Homepage from './Auth/Homepage';

// import Dashboard from './components/Dashboard';

function App() {
  return (
    <div className="App">
      <Router basename="/">
        <Routes>
      <Route path="/" element={<Homepage />} />

          <Route path="/login" element={<Login />} />

        

          <Route
            path="/admin/dashboard"
            element={
              <PrivateRoute>
                <AdminDashboard />
              </PrivateRoute>
            }
          />


             <Route
            path="/vendor/dashboard"
            element={
              <PrivateRoute>
                <VendorDashboard />
              </PrivateRoute>
            }
          />

         

            <Route
            path="/incharge_collector/dashboard"
            element={
              <PrivateRoute>
                <InchargeDashboard />
              </PrivateRoute>
            }
          />

             <Route
            path="/main_collector/dashboard"
            element={
              <PrivateRoute>
                <MainDashboard />
              </PrivateRoute>
            }
          />

            
           
            
        
        </Routes>
      </Router>
    </div>
  );
}

export default App;
