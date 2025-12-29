import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios"; // Firebase ki jagah axios
import "../App.css";
import dharasakti from "../component/dharasakti.png";
import DashboardSidebar from "./Dashboard/DashboardSidebar";

export default function Navbar({ user, setUser }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const navigate = useNavigate();

  // 🔓 FORCE LOGOUT (SESSION HIJACK / BLOCK CASE)
  const forceLogout = (reason) => {
    if (reason) alert(reason);
    localStorage.removeItem("user");
    setUser(null);
    setShowSidebar(false);
    navigate("/login");
  };

  // 🔐 SESSION CHECKER (Periodic Polling)
  useEffect(() => {
    // Agar user nahi hai ya koi local ID nahi hai toh skip karein
    if (!user?.id || !user?.currentSessionId) return;

    const checkSessionStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/users/session-check/${user.id}`);
        
        // Agar backend se mili session ID match nahi karti
        if (response.data.activeSessionId && response.data.activeSessionId !== user.currentSessionId) {
          forceLogout("⚠️ This ID was logged in on another device.");
        }
        
        // Agar user block ho gaya ho
        if (response.data.isBlocked) {
          forceLogout("🚫 Your account has been blocked by Admin.");
        }
      } catch (error) {
        console.error("Session check failed", error);
      }
    };

    // Har 30 second me check karega
    const interval = setInterval(checkSessionStatus, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      {/* 🔷 NAVBAR */}
      <nav className="navbar">
        {/* LEFT */}
        <div className="nav-left">
          {user ? (
            <div
              className="sidebar-trigger"
              onClick={() => setShowSidebar(true)}
              style={{ cursor: "pointer" }}
            >
              ☰ <span className="dash-text">Dashboard</span>
            </div>
          ) : (
            <img
              src={dharasakti}
              alt="Logo"
              className="logo"
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
            />
          )}
        </div>

        {/* CENTER */}
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>

          {user?.role === "Admin" && (
            <li>
              <Link
                to="/master-panel"
                style={{ color: "#fbbf24", fontWeight: "bold" }}
              >
                🛡️ Master Control
              </Link>
            </li>
          )}
        </ul>

        {/* RIGHT */}
        <div className="nav-right">
          {user ? (
            <div
              className="nav-profile"
              onClick={() => navigate("/profile")}
              title="My Profile"
              style={{ cursor: "pointer" }}
            >
              <img
                src={
                  user.photo || // MySQL me hum photo column use kar rahe hain
                  "https://i.imgur.com/6VBx3io.png"
                }
                alt="profile"
              />
            </div>
          ) : (
            <button
              className="nav-btn login"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {/* 🔷 SIDEBAR OVERLAY */}
      <div
        className={`sidebar-overlay ${showSidebar ? "active" : ""}`}
        onClick={() => setShowSidebar(false)}
      >
        <div
          className="sidebar-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="sidebar-header">
            <h3 className="DharashaktiH3">Dharashakti</h3>
            <button
              className="close-btn"
              onClick={() => setShowSidebar(false)}
            >
              ✖
            </button>
          </div>

          <DashboardSidebar
            closeSidebar={() => setShowSidebar(false)}
          />
        </div>
      </div>
    </>
  );
}