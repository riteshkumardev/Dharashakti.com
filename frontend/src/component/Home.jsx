import React, { useState, useEffect } from "react";
import axios from "axios"; // Firebase ki jagah Axios
import Loader from "./Core_Component/Loader/Loader"; 
import "../App.css";

const Home = ({ user }) => {
  // 📊 States
  const [stats, setStats] = useState({ sales: 0, stock: 0 });
  const [loading, setLoading] = useState(true);

  // 🛡️ Helper: ID Masking
  const maskID = (id) => {
    if (!id) return "--------";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // --- 🚀 Fetch Dashboard Stats (MySQL) ---
  const fetchDashboardStats = async () => {
    try {
      // Backend API call jo sales aur products table ka count degi
      const res = await axios.get("http://localhost:5000/api/dashboard/stats");
      setStats({
        sales: res.data.totalSales,
        stock: res.data.totalProducts
      });
    } catch (error) {
      console.error("Dashboard stats fetch failed:", error);
    } finally {
      // Artificial delay for smooth feel
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    
    // Optional: Har 1 minute mein data auto-refresh karein
    const interval = setInterval(fetchDashboardStats, 60000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="home-container">
      
      {/* 🚀 Floating Profile Card */}
      <div className="floating-profile-card">
        <div className="mini-info">
          <h4>{user?.name || "User Name"}</h4>
          <p className="emp-id-tag">ID: {maskID(user?.username || user?.empId)}</p>
          <span className="badge">{user?.role || 'Staff'}</span>
        </div>
        <div className="avatar-box">
          {user?.photo ? (
            <img src={user.photo} alt="User" />
          ) : (
            <div className="letter-avatar">{user?.name?.charAt(0) || "U"}</div>
          )}
        </div>
      </div>

      {/* Hero Welcome Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Welcome, <span className="highlight">{user?.name || "Guest"}</span></h1>
          <p>Your business dashboard is now synced live with Local MySQL Database.</p>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="features">
        <div className="feature-card">
          <div className="card-icon">📈</div>
          <h3>Total Sales</h3>
          <p className="stat-number">{stats.sales}</p>
          <small>Total Invoices Generated</small>
        </div>
        
        <div className="feature-card">
          <div className="card-icon">📦</div>
          <h3>Product Types</h3>
          <p className="stat-number">{stats.stock}</p>
          <small>Active Inventory Items</small>
        </div>

        <div className="feature-card">
          <div className="card-icon">👤</div>
          <h3>Access Level</h3>
          <p className="stat-number" style={{ fontSize: '20px' }}>{user?.role}</p>
          <small>System Role</small>
        </div>
      </section>
  
    </div>
  );
};

export default Home;