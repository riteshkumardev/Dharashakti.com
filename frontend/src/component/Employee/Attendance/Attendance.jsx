import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Attendanc.css';
import Loader from '../../Core_Component/Loader/Loader';

const Attendance = ({ role }) => {
  const userRole = role?.toLowerCase();
  const isAuthorized = userRole === "admin" || userRole === "accountant" || userRole === "manager";

  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(null); // Track which row is being updated

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length <= 4 ? strID : "XXXX" + strID.slice(-4);
  };

  // --- 1. Fetch All Employees ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/employees");
        // Ensure data is an array
        setEmployees(Array.isArray(res.data.employees) ? res.data.employees : (res.data || []));
      } catch (err) {
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  // --- 2. Fetch Attendance for Selected Date ---
  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/attendance/${date}`);
        console.log(res,"http://localhost:5000/api/attendance");
        
        const attObj = {};
        // Backend should return array of attendance records for that day
        const data = res.data.attendance || res.data;
        if (Array.isArray(data)) {
          data.forEach(item => {
            attObj[item.employee_id] = item;
          });
        }
        setAttendance(attObj);
      } catch (err) {
        console.error("Error fetching attendance:", err);
      }
    };
    fetchAttendance();
  }, [date]);

  // --- 3. Mark Attendance ---
  const markAttendance = async (empId, status) => {
    if (!isAuthorized) {
      alert("Aapko attendance mark karne ki permission nahi hai.");
      return;
    }

    setSubmitting(empId); // Disable buttons for this row while processing
    try {
      const response = await axios.post("http://localhost:5000/api/attendance", {
        employee_id: empId,
        date: date,
        status: status
      });
console.log(response,"response");

      if (response.data.success) {
        // Update local state immediately
        setAttendance(prev => ({
          ...prev,
          [empId]: { ...prev[empId], status: status }
        }));
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(null);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchTerm = search.toLowerCase();
    return (
      emp.name?.toLowerCase().includes(searchTerm) || 
      emp.empId?.toString().includes(searchTerm) ||
      emp.username?.toString().includes(searchTerm)
    );
  });
// Nayi Temporary Line (sirf check karne ke liye):

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <div>
            <h2 className="table-title">DAILY ATTENDANCE</h2>
            <p className={`status-info ${isAuthorized ? 'text-blue' : 'text-red'}`}>
              {isAuthorized 
                ? "Hazri lagane ke liye P, A, ya H dabayein" 
                : "⚠️ View Only: Access Restricted."}
            </p>
          </div>
          
          <div className="filters-group">
            <input 
              type="text" 
              placeholder="Search Name or ID..." 
              className="table-search-box"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input 
              type="date" 
              className="table-search-box date-picker" 
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
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => {
               
                  
                  const currentStatus = attendance[emp.empId]?.status;
                  const isRowSubmitting = submitting === emp.empId;
                  
                  return (
                    <tr key={emp.empId} className={isRowSubmitting ? "row-processing" : ""}>
                      <td className="emp-id-cell">
                        {emp.username ? maskID(emp.username) : (emp.empId || 'NEW')}
                      </td>
                      <td>
                        <div className="emp-profile-circle">
                          {emp.photo ? 
                            <img src={emp.photo} alt="profile" /> : 
                            <div className="placeholder-avatar">{emp.name?.charAt(0).toUpperCase()}</div>
                          }
                        </div>
                      </td>
                      <td className="cust-name-cell">
                        <div className="emp-name-text">{emp.name}</div>
                        <div className="emp-role-text">{emp.role}</div>
                      </td>
                      <td>
                        <span className={`status-badge-pill ${
                          currentStatus === 'Present' ? 'success-bg' : 
                          currentStatus === 'Absent' ? 'null-bg' : 
                          currentStatus === 'Half-Day' ? 'warning-bg' : 'pending-bg'}`}>
                          {currentStatus || 'Not Marked'}
                        </span>
                      </td>
                      <td className="action-btns-cell">
                        <div className="attendance-btn-group">
                          <button 
                            className={`attendance-btn p-btn ${currentStatus === 'Present' ? 'active' : ''}`} 
                            onClick={() => markAttendance(emp.empId, 'Present')} 
                            disabled={!isAuthorized || isRowSubmitting}
                          >P</button>
                          <button 
                            className={`attendance-btna a-btn ${currentStatus === 'Absent' ? 'active' : ''}`} 
                            onClick={() => markAttendance(emp.empId, 'Absent')} 
                            disabled={!isAuthorized || isRowSubmitting}
                          >A</button>
                          <button 
                            className={`attendance-btn h-btn ${currentStatus === 'Half-Day' ? 'active' : ''}`} 
                            onClick={() => markAttendance(emp.empId, 'Half-Day')} 
                            disabled={!isAuthorized || isRowSubmitting}
                          >H</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="no-data-cell">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;