import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DashboardSidebar.css";

const DashboardSidebar = ({ closeSidebar }) => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(null);

  // LocalStorage se user ka data aur role nikalna
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role?.toLowerCase() || "staff";

  const handleNavigate = (path) => {
    navigate(path);
    if (closeSidebar) closeSidebar();
  };

  const toggleMenu = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  const getTitleStyle = (menuName) => ({
    cursor: "pointer",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 15px",
    borderRadius: "10px",
    transition: "all 0.3s ease",
    background: openMenu === menuName ? "rgba(255, 255, 255, 0.15)" : "transparent",
    marginBottom: "8px",
    fontWeight: "600",
    border: openMenu === menuName ? "1px solid rgba(255, 255, 255, 0.2)" : "1px solid transparent",
    color: openMenu === menuName ? "#fff" : "rgba(255, 255, 255, 0.8)",
  });

  return (
    <div className="dashboard-sidebar" style={{ padding: "15px", overflowY: "auto", height: "100%" }}>
      
      {/* 🟢 SALES & BILLING (Admin & Manager) */}
      {(role === "admin" || role === "manager") && (
        <div className="sidebar-section">
          <div style={getTitleStyle("sales")} onClick={() => toggleMenu("sales")}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📊</span> Sales & Billing
            </span>
            <span>{openMenu === "sales" ? "▲" : "▼"}</span>
          </div>
          {openMenu === "sales" && (
            <ul className="sidebar-list">
              <li onClick={() => handleNavigate("/sales-entry")}>➤ Sales Entry</li>
              <li onClick={() => handleNavigate("/sales-table")}>➤ Sales Table</li>
            </ul>
          )}
        </div>
      )}

      {/* 🔵 INVENTORY (Admin & Manager) */}
      {(role === "admin" || role === "manager") && (
        <div className="sidebar-section">
          <div style={getTitleStyle("stock")} onClick={() => toggleMenu("stock")}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>📦</span> Inventory
            </span>
            <span>{openMenu === "stock" ? "▲" : "▼"}</span>
          </div>
          {openMenu === "stock" && (
            <ul className="sidebar-list">
              <li onClick={() => handleNavigate("/stock-management")}>➤ Stock View</li>
              <li onClick={() => handleNavigate("/stock-add")}>➤ Add New Stock</li>
              <li onClick={() => handleNavigate("/purchase-form")}>➤ Purchase Entry</li>
              <li onClick={() => handleNavigate("/purchase-table")}>➤ Purchase Table</li>
            </ul>
          )}
        </div>
      )}

      {/* 🟠 STAFF CONTROL (All Users - Internal Filter) */}
      <div className="sidebar-section">
        <div style={getTitleStyle("staff")} onClick={() => toggleMenu("staff")}>
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>👥</span> Staff Control
          </span>
          <span>{openMenu === "staff" ? "▲" : "▼"}</span>
        </div>
        {openMenu === "staff" && (
          <ul className="sidebar-list">
            {role === "admin" && <li onClick={() => handleNavigate("/employee-add")}>➤ Add Employee</li>}
            {(role === "admin" || role === "manager") && <li onClick={() => handleNavigate("/employee-table")}>➤ Employee List</li>}
            <li onClick={() => handleNavigate("/attendance")}>➤ Attendance</li>
            <li onClick={() => handleNavigate("/staff-ledger")}>➤ My Ledger</li>
          </ul>
        )}
      </div>

      {/* 🔴 FINANCE (Admin Only) */}
      {role === "admin" && (
        <div className="sidebar-section">
          <div style={getTitleStyle("finance")} onClick={() => toggleMenu("finance")}>
            <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "18px" }}>💰</span> Finance Reports
            </span>
            <span>{openMenu === "finance" ? "▲" : "▼"}</span>
          </div>
          {openMenu === "finance" && (
            <ul className="sidebar-list">
              <li onClick={() => handleNavigate("/expenses")}>➤ Expenses</li>
              <li onClick={() => handleNavigate("/profit-loss")}>➤ Profit & Loss</li>
              <li onClick={() => handleNavigate("/Reports_Printing")}>➤ Reports & Printing</li>
            </ul>
          )}
        </div>
      )}

      <hr style={{ opacity: 0.2, margin: "20px 0" }} />

      {/* 🚪 LOGOUT BUTTON */}
      <div className="sidebar-section">
        <div 
          className="sidebar-title logout-item" 
          style={{ ...getTitleStyle("logout"), color: "#ff4d4d" }} 
          onClick={handleLogout}
        >
          <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "18px" }}>🚪</span> Logout Session
          </span>
        </div>
      </div>

    </div>
  );
};

export default DashboardSidebar;