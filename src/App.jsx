import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from 'react';
import Navbar from "./components/Navbar";

// Pages
import Dashboard from "./pages/Dashboard";
import Services from "./pages/Services";
import Transactions from "./pages/Transactions";
import Reports from "./pages/Reports";
import Receipts from "./pages/Receipts";
import Receipt from './pages/Receipt'; // 👈 Added import
import Login from "./pages/Login";

// Styles
import "./styles/layout.css";
import "./App.css";

// Images
import logo from "./images/logo.jpg";

// ProtectedRoute component
function ProtectedRoute({ children }) {
  const role = localStorage.getItem("userRole");
  return role ? children : <Navigate to="/login" />;
}

// Header Component
function Header() {
  const location = useLocation();
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [showMaintenance, setShowMaintenance] = useState(false);

  useEffect(() => {
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
    <>
      <header className="app-header">
        <div className="header-content">

          {/* Logo and System Name */}
          <div className="header-title">
            <img src={logo} alt="Logo" />
            <h1>Toledo Doctors & Diagnostic Center</h1>
          </div>

          {/* Maintenance Alert Button */}
          <button
            className="maintenance-alert-btn"
            onClick={() => setShowMaintenance(true)}
            title="System Maintenance Information"
          >
            🔔
            <span>Maintenance</span>
          </button>

        </div>
      </header>

      {/* Maintenance Information Modal */}
      {showMaintenance && (
        <div
          className="maintenance-overlay"
          onClick={() => setShowMaintenance(false)}
        >
          <div
            className="maintenance-modal"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="maintenance-header">
              <div>
                <span className="maintenance-icon">🔧</span>
                <h2>System Maintenance Notice</h2>
              </div>

              <button
                className="close-btn"
                onClick={() => setShowMaintenance(false)}
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="maintenance-body">

              <div className="maintenance-warning">
                <strong>🔔 Early Maintenance Notice</strong>
                <p> This is an early reminder that the system's annual maintenance period is approaching. System maintenance is scheduled once every year to help keep the system secure, stable, and operating properly. </p>
                <p> Since the system is approaching its one-year maintenance period, this notice is being provided in advance to allow sufficient time for maintenance arrangements and preparation. </p>
              </div>

              <h3>Why is maintenance needed?</h3>

              <ul>
                <li>
                  🛡️ <strong>Data Safety</strong> – Helps protect important
                  system data from unexpected problems or data loss.
                </li>

                <li>
                  💾 <strong>Database Management</strong> – Helps prevent
                  the database from becoming too large and affecting system
                  performance.
                </li>

                <li>
                  🚀 <strong>System Improvements</strong> – Includes updates,
                  bug fixes, and performance improvements.
                </li>

                <li>
                  🔒 <strong>Security Updates</strong> – Helps keep the system
                  protected against security vulnerabilities.
                </li>

                <li>
                  ⚙️ <strong>Technical Support</strong> – Ensures the system
                  can continue receiving technical maintenance and support.
                </li>
              </ul>

<h3>System Improvements</h3>

<p>
  As part of the system maintenance and improvement process, new
  features may be added to make the system easier and more efficient
  to use.
</p><br></br>

<ul>
  <li>
    🧾 <strong>Receipt History Date Filter</strong> – A date filter will
    be added to the Receipts History section, allowing users to quickly
    find and view receipts within a specific date or date range.
  </li>

  <li>
    🚀 <strong>Performance Improvements</strong> – Improve system
    performance and responsiveness.
  </li>

  <li>
    🛠️ <strong>Bug Fixes</strong> – Resolve existing issues and
    improve system stability.
  </li>

  <li>
    💾 <strong>Database Improvements</strong> – Improve database
    organization, management, and performance.
  </li>
</ul>



              <h3>Maintenance Service</h3>

              <p>
                Regular maintenance helps keep the system stable, secure,
                and operational. Maintenance may include database cleanup,
                backups, security updates, bug fixes, and system improvements.
              </p>

              {/* Deadline */}
              <div className="maintenance-deadline">
                <strong>📅 Maintenance Deadline</strong>

                <p>
                  Please arrange the required system maintenance before
                  the maintenance deadline to avoid possible service
                  interruption.
                </p>

                <div className="deadline-date">
                  December 15, 2026
                </div>
              </div>

              {/* Important Notice */}
              <div className="maintenance-notice">
                <strong>Important Notice</strong>

                <p>
                
<p>
  If maintenance is not arranged by the deadline, system access may
  be temporarily suspended until the required maintenance has been
  completed. This is to prevent potential service interruptions caused
  by database capacity limitations and to ensure the continued
  reliability of the system.,
</p><br></br>

<strong>💰 Annual Maintenance Service Fee</strong>
  <p>
    The annual system maintenance service fee is
    <strong> ₱3,000</strong>.
  </p>



                </p>
              </div>

              <p className="maintenance-contact">
                For maintenance arrangements or questions, please contact
                the system administrator.
              </p>

            </div>

            {/* Modal Footer */}
            <div className="maintenance-footer">
              <button
                className="maintenance-close-btn"
                onClick={() => setShowMaintenance(false)}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

function MainLayout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="app-container">
      <Navbar isMenuOpen={isMenuOpen} onMenuToggle={toggleMenu} />
      <Header />
      <main className="main-content">
        <div className="page-container">{children}</div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><MainLayout><Services /></MainLayout></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><MainLayout><Transactions /></MainLayout></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><MainLayout><Reports /></MainLayout></ProtectedRoute>} />
        <Route path="/receipts" element={<ProtectedRoute><MainLayout><Receipts /></MainLayout></ProtectedRoute>} />

        {/* 👇 New Receipt Route */}
        <Route path="/receipt/:id" element={<ProtectedRoute><Receipt /></ProtectedRoute>} />

        {/* Redirect unknown */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
