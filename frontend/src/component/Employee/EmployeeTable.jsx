import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Firebase hatakar Axios laya gaya
import { useNavigate } from "react-router-dom";
import Loader from '../Core_Component/Loader/Loader';
import './Emp.css';

const EmployeeTable = ({ role }) => { 
  // 🔐 Permission Check (Case-insensitive)
  const userRole = role?.toLowerCase();
  const isAuthorized = userRole === "admin" || userRole === "accountant";

  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null); // MySQL ID use hoga
  const [editData, setEditData] = useState({});
  const navigate = useNavigate();

  // --- 1. Fetch All Employees (MySQL) ---
 const fetchEmployees = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/employees");
    
    // FIX: res.data pura object hai, hame res.data.employees array chahiye
    if (res.data && res.data.employees) {
      // Array ko reverse karein taaki naya employee upar dikhe
      setEmployees([...res.data.employees].reverse()); 
    }
  } catch (err) {
    console.error("Error fetching employees:", err);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchEmployees();
  }, []);
     
  const startEdit = (emp) => {
    if (!isAuthorized) {
      alert("Unauthorized: Aapko edit karne ki permission nahi hai.");
      return;
    }
    setEditId(emp.id); // MySQL Auto-increment ID
    setEditData({ ...emp });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };
  

  const handleNavigate = (path) => {
    navigate(path);
  };

// --- 2. Save Updated Employee (MySQL) ---
const handleSave = async () => {
    if (!isAuthorized) return;

    setLoading(true); // Spinner ON karein

    try {
        // Timeout 30 seconds rakha hai taaki agar network slow ho toh application hang na ho
        const res = await axios.put(`http://localhost:5000/api/employees/${editId}`, editData, {
            timeout: 30000
        });

        if (res.data.success) {
            alert("🎉 " + res.data.message);
            setEditId(null);
            fetchEmployees(); // List ko refresh karein
        }
    } catch (err) {
        console.error("Update Error:", err);
        alert("⚠️ Update Failed: " + (err.response?.data?.message || "Server not responding"));
    } finally {
        setLoading(false); // Spinner OFF (Har haal mein chalega)
    }
};

// --- 3. Delete Employee (MySQL) ---
const handleDelete = async (id) => {
    if (!isAuthorized) {
        alert("Unauthorized: Aapko delete karne ki permission nahi hai.");
        return;
    }

    if (window.confirm("Are you sure you want to delete this employee?")) {
        setLoading(true); // Spinner ON

        try {
            const res = await axios.delete(`http://localhost:5000/api/employees/${id}`);

            if (res.data.success) {
                alert("🗑️ Employee deleted successfully!");
                fetchEmployees(); // List refresh karein
            }
        } catch (err) {
            console.error("Delete Error:", err);
            alert("⚠️ Delete failed: " + (err.response?.data?.message || "Server error"));
        } finally {
            setLoading(false); // Spinner OFF
        }
    }
};
  const filtered = employees.filter(emp => 
    emp.name?.toLowerCase().includes(search.toLowerCase()) || 
    emp.aadhar?.includes(search) ||
    emp.username?.toString().includes(search) // 'username' hamari 8-digit ID hai
  );

 console.log(filtered,"http://localhost:5000/api/employees");

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">EMPLOYEE DIRECTORY</h2>
          <div className="search-wrapper">
            <input 
              type="text" 
              placeholder="Search ID, Name or Aadhar..." 
              className="table-search-box"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Emp ID</th>
                <th>Photo</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, index) => (
                <tr key={emp.id} className={editId === emp.id ? "active-edit-row" : ""}>
                  <td>{index + 1}</td>
                  
                  <td style={{fontWeight: 'bold', color: '#2563eb'}}>
                    {emp.id}
                  </td>

                  <td>
                    <div className="emp-profile-circle">
                      {emp.photo ? (
                        <img src={emp.photo} alt="Profile" />
                      ) : (
                        <div className="placeholder-avatar">
                          {emp.name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="cust-name-cell">
                    {editId === emp.id ? 
                      <input name="name" value={editData.name} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.name}
                  </td>
                  
                  <td>
                    {editId === emp.id ? 
                      <input name="phone" value={editData.phone} onChange={handleEditChange} className="edit-input-field" /> 
                      : emp.phone}
                  </td>

                  <td className="action-btns-cell">
                    {editId === emp.id ? (
                      <div className="btn-group-row">
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </div>
                    ) : (
                      <div className="btn-group-row">
                        <button 
                          className="row-edit-btn" 
                          onClick={() => startEdit(emp)} 
                          disabled={!isAuthorized}
                          style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                        >✏️</button>

                        <button 
                          className="row-delete-btn" 
                          onClick={() => handleDelete(emp.id)} 
                          disabled={!isAuthorized}
                          style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                        >🗑️</button>

                        <button 
                          className="ledger-btn-ui" 
                          onClick={() => handleNavigate("/staff-ledger")}
                        >👁️</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="no-records-box">
              {search ? `No results found for "${search}"` : "No employees registered yet."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeTable;