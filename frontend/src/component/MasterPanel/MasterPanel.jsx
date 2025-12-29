import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Axios for MySQL
import { useNavigate } from "react-router-dom"; 
import Loader from "../Core_Component/Loader/Loader"; 
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; 
import './MasterPanel.css';

const MasterPanel = ({ user }) => { 
  const navigate = useNavigate(); 
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [logs, setLogs] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- 1. Fetch Data (MySQL) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, logRes] = await Promise.all([
        axios.get("http://localhost:5000/api/employees"),
        axios.get("http://localhost:5000/api/logs")
      ]);
      setUsers(userRes.data);
      setLogs(logRes.data);
    } catch (err) {
      showMsg("Data fetch failed", "error");
    } finally {
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. Password Reset (MySQL) ---
  const handlePasswordReset = async (targetId, targetName) => {
    const newPass = window.prompt(`Enter new password for ${targetName}:`);
    if (!newPass || newPass.length < 4) return showMsg("Invalid password", "error");

    setActionLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/admin/reset-password`, {
        targetId,
        newPass,
        adminName: user?.name
      });
      showMsg(`Password for ${targetName} changed!`, "success");
      fetchData(); // Refresh logs and users
    } catch (err) {
      showMsg("Reset Failed", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // --- 3. System Status Update (Role/Block) ---
  const handleSystemUpdate = async (targetId, targetName, field, value) => {
    setActionLoading(true);
    try {
      await axios.put(`http://localhost:5000/api/admin/update-system`, {
        targetId,
        field,
        value,
        adminName: user?.name,
        targetName
      });
      showMsg(`System Updated: ${field.toUpperCase()}`, "success");
      fetchData(); 
    } catch (err) {
      showMsg("Update Error", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.username?.toString().includes(search)
  );

  if (loading) return <Loader />;

  return (
    <div className="master-panel-page">
      {actionLoading && (
        <div className="action-loader-overlay">
          <Loader />
        </div>
      )}

      <div className="master-hero">
        <div className="hero-text">
          <h1>🛡️ Master Admin Control</h1>
          <p>Global system management and security logs</p>
        </div>

        <div className="admin-actions-area" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <input 
            type="text" 
            placeholder="Search System Users..." 
            className="master-search-bar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="master-register-btn" onClick={() => navigate("/employee-add")}>
            + Add New Staff
          </button>
        </div>
      </div>

      <div className="master-main-layout">
        <div className="users-grid-section">
          {filtered.length > 0 ? filtered.map(userItem => (
            <div key={userItem.id} className={`user-control-card ${userItem.isBlocked ? 'is-blocked' : ''}`}>
              <div className="card-header">
                <div className="user-profile-img">
                   {userItem.photo ? <img src={userItem.photo} alt="p" /> : (userItem.name?.charAt(0) || "?")}
                </div>
                <div className="user-basic-info">
                   <h3>{userItem.name}</h3>
                   <span>ID: {userItem.username}</span>
                </div>
                <div className={`role-pill ${userItem.role?.toLowerCase()}`}>{userItem.role}</div>
              </div>

              <div className="control-body">
                <div className="input-group">
                  <label>Assign Security Role</label>
                  <select 
                    value={userItem.role} 
                    onChange={(e) => handleSystemUpdate(userItem.id, userItem.name, 'role', e.target.value)}
                    disabled={actionLoading}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Worker">Worker</option>
                  </select>
                </div>

                <div className="button-actions-group">
                    <button className="reset-pass-btn" onClick={() => handlePasswordReset(userItem.id, userItem.name)}>
                      🔑 Reset Password
                    </button>

                    <button 
                      className={`access-toggle-btn ${userItem.isBlocked ? 'btn-enable' : 'btn-disable'}`}
                      onClick={() => handleSystemUpdate(userItem.id, userItem.name, 'isBlocked', !userItem.isBlocked)}
                      disabled={actionLoading}
                    >
                      {userItem.isBlocked ? '🔓 Restore Access' : '🚫 Terminate Access'}
                    </button>
                </div>
              </div>
            </div>
          )) : <div className="no-data-msg">No users found.</div>}
        </div>

        <div className="activity-logs-sidebar">
          <h3>🕒 Recent Activity</h3>
          <div className="logs-list">
            {logs.slice(0, 15).map((log, i) => (
              <div key={i} className="log-entry">
                <strong>{log.admin_name}</strong>
                <p>{log.action_detail}</p>
                <small>{new Date(log.created_at).toLocaleString()}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default MasterPanel;