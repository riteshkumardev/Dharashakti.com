import React, { useState } from 'react';
import axios from 'axios';
import './Emp.css';

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const EmployeeAdd = ({ onEntrySaved }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

const initialFormState = {
  empId: "EMP" + Date.now(),  // 👈 Auto Unique ID Generate
  name: "",
  fatherName: "",
  phone: "",
  emergency: "",
  aadhar: "",
  address: "",
  role: "Worker",
  joinDate: new Date().toISOString().split("T")[0],
  salary: "",
  bankName: "",
  accountNumber: "",
  ifsc: "",
  photo: "",
  password: ""
};
  const [formData, setFormData] = useState(initialFormState);
  console.log(formData,"formData");
  

  const showMsg = (msg, type = "success") =>
    setSnackbar({ open: true, message: msg, severity: type });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 🔥 BUG FIX: Image size check (Max 1MB) to prevent ECONNRESET
    if (file.size > 1024 * 1024) {
      showMsg("⚠️ Photo size must be less than 1MB", "error");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone || !formData.password) {
        showMsg("⚠️ Name, Phone, and Password are required!", "error");
        return;
    }

    setLoading(true);
    console.log("1. Starting Submission. Data payload size:", JSON.stringify(formData).length);

    try {
        // Timeout ko temporary 0 (No timeout) karke dekhte hain
        const res = await axios.post("http://localhost:5000/api/employees", formData, {
            timeout: 0, // 0 matlab unlimited wait karega testing ke liye
            headers: { 'Content-Type': 'application/json' }
        });

        // Agar ye line nahi dikh rahi, toh iska matlab try block fail ho gaya
        console.log("2. Server Response Object:", res);

        if (res.status === 200 || res.status === 201 || res.data.success) {
            console.log("3. Success conditions met.");
            showMsg("🎉 Registered Successfully!", "success");
            setFormData(initialFormState);
            if (e.target) e.target.reset();
            if (onEntrySaved) onEntrySaved();
        } else {
            console.log("4. Response received but status not success:", res.status);
            showMsg(res.data.message || "Registration Failed", "error");
        }
    } catch (err) {
        // 🔥 Yeh block batayega ki console.log(res) kyu nahi chala
        console.error("5. Catch Block Triggered. Error Details:", err);

        let errorMsg = "Registration Failed";
        
        if (err.code === 'ECONNABORTED') {
            errorMsg = "⚠️ Request Timeout: Server response is too slow.";
        } else if (err.response) {
            // Server ne response diya par error code ke sath (e.g., 500)
            console.log("Error Response Data:", err.response.data);
            errorMsg = err.response.data.message || "Server Internal Error";
        } else if (err.request) {
            // Request gayi par server se koi response nahi aaya
            errorMsg = "⚠️ No response from server. Check if Backend is running.";
        } else {
            errorMsg = "⚠️ Error: " + err.message;
        }
        
        showMsg(errorMsg, "error");
    } finally {
        console.log("6. Finally: Turning off loader...");
        setLoading(false);
    }
};
  return (
    <div className="table-card-wide">
      {loading && <Loader />}

      <h2 className="table-title">EMPLOYEE REGISTRATION FORM</h2>

      <form onSubmit={handleSubmit} className="stock-form-grid">
        <div className="input-group">
          <label>Employee Name *</label>
          <input name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div className="input-group">
  <label>Employee ID (Auto Generate)</label>
  <input name="empId" value={formData.empId} readOnly style={{background:"#eee", fontWeight:"bold"}} />
</div>

        <div className="input-group">
          <label>Father's Name</label>
          <input name="fatherName" value={formData.fatherName} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input type="text" name="phone" value={formData.phone} onChange={handleChange} required maxLength="10" />
        </div>

        <div className="input-group">
          <label>Emergency Contact</label>
          <input type="text" name="emergency" value={formData.emergency} onChange={handleChange} maxLength="10" />
        </div>

        <div className="input-group">
          <label>Aadhar Number *</label>
          <input type="text" name="aadhar" value={formData.aadhar} onChange={handleChange} required maxLength="12" />
        </div>

        <div className="input-group">
          <label>Designation *</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Operator">Operator</option>
            <option value="Worker">Worker</option>
            <option value="Driver">Driver</option>
            <option value="Helper">Helper</option>
          </select>
        </div>

        <div className="input-group">
          <label>Joining Date</label>
          <input type="date" name="joinDate" value={formData.joinDate} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Salary *</label>
          <input type="number" name="salary" value={formData.salary} onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>Bank Name</label>
          <input name="bankName" value={formData.bankName} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Account Number</label>
          <input name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>IFSC Code</label>
          <input name="ifsc" value={formData.ifsc} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="input-group">
          <label style={{color:"red", fontWeight:"bold"}}>Login Password *</label>
          <input type="text" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className="input-group span-4">
          <label>Full Address</label>
          <input name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="button-container-full">
          <button className="btn-submit-colored" type="submit" disabled={loading}>
            {loading ? "Registering..." : "✅ REGISTER EMPLOYEE"}
          </button>
        </div>
      </form>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
};

export default EmployeeAdd;