import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

  /* ==============================
      🔄 Fetch employees + logs
     ============================== */
  const fetchData = async () => {
    setLoading(true);
    try {
      const [userRes, logRes] = await Promise.all([
        axios.get("http://localhost:5000/api/employees"),
        axios.get("http://localhost:5000/api/logs")
      ]);

      setUsers(userRes.data.employees || userRes.data);
      setLogs(logRes.data.logs || logRes.data);

    } catch (err) {
      showMsg("❌ Failed to fetch users/logs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);


  /* ==============================
      🔐 Reset Password (FRONTEND)
     ============================== */
const handlePasswordReset = async (empId, name) => {
  const newPass = prompt(`Enter new password for ${name}:`);
  if (!newPass || newPass.length < 4) return showMsg("❌ Password must be 4+ characters", "error");

  try {
    const res = await axios.put("http://localhost:5000/api/admin/reset-password", {
      empId,
      newPass,
      adminName: user?.name,
    });

    if (res.data.success) {
      showMsg("🔑 Password updated!", "success");
      fetchData();
    } else {
      showMsg(res.data.message || "Failed!", "error");
    }
  } catch (error) {
    console.log("FRONTEND ERROR:", error.response?.data || error);
    showMsg("❌ Password reset failed! Check server.", "error");
  }
};


  /* ==============================
      ⚙️ Block / Role Update
     ============================== */
  const handleSystemUpdate = async (empId, name, field, value) => {
    setActionLoading(true);
    try {
      await axios.put("http://localhost:5000/api/admin/update-system", {
        empId,
        field,
        value,
        adminName: user?.name,
        targetName: name
      });

      showMsg("⚙️ User Updated Successfully!", "success");
      fetchData();

    } catch {
      showMsg("❌ Update Failed", "error");
    } finally {
      setActionLoading(false);
    }
  };


  /* ==============================
      🔍 Search Filter
     ============================== */
  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.empId?.toString().includes(search)
  );


  if (loading) return <Loader />;

  return (
    <div className="master-panel-page">

      {actionLoading && <div className="action-loader-overlay"><Loader /></div>}

      <div className="master-hero">
        <div className="hero-text">
          <h1>🛡️ Master Admin Control</h1>
          <p>Manage Staff, Roles, Security & System Access</p>
        </div>

        <div className="admin-actions-area">
          <input
            type="text"
            placeholder="Search by Name / EMP ID..."
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
          {filtered.length > 0 ? filtered.map(emp => (
            <div key={emp.empId} className={`user-control-card ${emp.isBlocked ? 'is-blocked' : ''}`}>

              <div className="card-header">
                <div className="user-profile-img">
                  {emp.photo ? <img src={emp.photo} alt="profile" /> : emp.name?.charAt(0)}
                </div>
                <div className="user-basic-info">
                  <h3>{emp.name}</h3>
                  <span>EMP-ID: {emp.empId}</span>
                </div>
                <div className={`role-pill ${emp.role?.toLowerCase()}`}>{emp.role}</div>
              </div>

              <div className="control-body">

                <div className="input-group">
                  <label>Role Access Level</label>
                  <select
                    value={emp.role}
                    onChange={(e) => handleSystemUpdate(emp.empId, emp.name, "role", e.target.value)}
                  >
                    <option>Admin</option>
                    <option>Manager</option>
                    <option>Worker</option>
                  </select>
                </div>

                <div className="button-actions-group">
                  <button className="reset-pass-btn"
                    onClick={() => handlePasswordReset(emp.empId, emp.name)}>
                    🔑 Reset Password
                  </button>

                  <button className={`access-toggle-btn ${emp.isBlocked ? 'btn-enable' : 'btn-disable'}`}
                    onClick={() => handleSystemUpdate(emp.empId, emp.name, "isBlocked", !emp.isBlocked)}>
                    {emp.isBlocked ? "🔓 Restore Access" : "🚫 Block Access"}
                  </button>
                </div>

              </div>
            </div>
          )) : <div className="no-data-msg">No user found...</div>}
        </div>

        <div className="activity-logs-sidebar">
          <h3>🕒 Recent Actions</h3>
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
