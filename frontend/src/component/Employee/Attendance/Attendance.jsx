import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Axios import kiya
import './Attendanc.css';
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({ role }) => {
  // Role checking (Case insensitive)
  const userRole = role?.toLowerCase();
  const isAuthorized = userRole === "admin" || userRole === "accountant" || userRole === "manager";

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ID mask helper
  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    if (strID.length <= 4) return strID;
    return "XXXX" + strID.slice(-4);
  };

  // --- 1. Fetch All Employees (MySQL) ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/employees");
        setEmployees(res.data);
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // --- 2. Fetch Attendance for Selected Date (MySQL) ---
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/attendance/${date}`);
        // Data ko ek object mein convert karna taaki UI par lookup easy ho: { empId: {status: 'Present'} }
        const attObj = {};
        res.data.forEach(item => {
          attObj[item.employee_id] = item;
        });
        setAttendance(attObj);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    };
    fetchAttendance();
  }, [date]);

  // --- 3. Mark Attendance (MySQL) ---
  const markAttendance = async (empId, status) => {
    if (!isAuthorized) {
      alert("Aapko attendance mark karne ki permission nahi hai.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/attendance", {
        employee_id: empId,
        date: date,
        status: status
      });

      if (response.data.success) {
        // UI ko turant update karne ke liye local state update karein
        setAttendance(prev => ({
          ...prev,
          [empId]: { status: status }
        }));
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchTerm) || 
      emp.username?.toString().includes(searchTerm) // 'username' hamari 8-digit ID hai
    );
  });

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">DAILY ATTENDANCE</h2>
            <p style={{fontSize: '12px', color: '#666', margin: 0}}>
              {isAuthorized 
                ? "Hazri lagane ke liye P, A, ya H dabayein" 
                : "⚠️ View Only: Access Restricted."}
            </p>
          </div>
          
          <div className="btn-group-row" style={{gap: '12px'}}>
            <input 
              type="text" 
              placeholder="Search Name or ID..." 
              className="table-search-box"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input 
              type="date" 
              className="table-search-box" 
              value={date} 
              max={new Date().toISOString().split('T')[0]} 
              onChange={(e) => setDate(e.target.value)} 
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Current Status</th>
                <th style={{textAlign: 'center'}}>Mark Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => {
                const currentStatus = attendance[emp.id]?.status;
                
                return (
                  <tr key={emp.id}>
                    <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                      {emp.username ? maskID(emp.username) : 'NEW'}
                    </td>
                    <td>
                      <div className="emp-profile-circle">
                        {emp.photo ? <img src={emp.photo} alt="profile" /> : <div className="placeholder-avatar">{emp.name?.charAt(0)}</div>}
                      </div>
                    </td>
                    <td className="cust-name-cell">
                      <div style={{fontWeight: '600'}}>{emp.name}</div>
                      <div style={{fontSize: '11px', color: '#888'}}>{emp.role}</div>
                    </td>
                    <td>
                      <span className={`status-badge-pill ${currentStatus === 'Present' ? 'success-bg' : currentStatus === 'Absent' ? 'null-bg' : 'warning-bg'}`}>
                        {currentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="action-btns-cell" style={{textAlign: 'center'}}>
                      <div className="btn-group-row" style={{justifyContent: 'center', gap: '8px'}}>
                        <button className={`save-btn-ui ${currentStatus === 'Present' ? 'active-p' : ''}`} onClick={() => markAttendance(emp.id, 'Present')} disabled={!isAuthorized}>P</button>
                        <button className={`row-delete-btn ${currentStatus === 'Absent' ? 'active-a' : ''}`} onClick={() => markAttendance(emp.id, 'Absent')} disabled={!isAuthorized}>A</button>
                        <button className={`ledger-btn-ui ${currentStatus === 'Half-Day' ? 'active-h' : ''}`} onClick={() => markAttendance(emp.id, 'Half-Day')} disabled={!isAuthorized}>H</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;