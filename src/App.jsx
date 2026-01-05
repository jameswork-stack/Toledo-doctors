import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Receipts from "./pages/Receipts";
import Login from "./pages/Login";

// Styles
import "./styles/layout.css";
import "./App.css";

//images
import logo from "./images/logo.jpg";


// ProtectedRoute component
function ProtectedRoute({ children }) {
  const role = localStorage.getItem("userRole"); // from login
  return role ? children : <Navigate to="/login" />;
}

// Header Component
function Header({ onMenuToggle }) {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');

  useEffect(() => {
    // Update page title based on route
    const path = location.pathname;
    const titles = {
      '/': 'Dashboard',
      '/dashboard': 'Dashboard',
      '/services': 'Services',
      '/transactions': 'Transactions',
      '/reports': 'Reports',
      '/receipts': 'Receipts'
    };
    
    setPageTitle(titles[path] || 'Dashboard');
  }, [location]);

  return (
    <header className="app-header">
      <div className="header-content">
        <img src={logo} alt="Logo" style={{ width: "50px"}} />
        <h1>Toledo Doctors & Diagnostic Center</h1>
      </div>
    </header>
  );
}

// Main layout component
function MainLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="app-container">
      <Navbar isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <Header onMenuToggle={toggleMenu} />
      <main className="main-content">
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/services"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Services />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Transactions />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Reports />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/receipts"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Receipts />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
