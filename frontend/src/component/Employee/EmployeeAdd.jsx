import React, { useState } from 'react';
import axios from 'axios';
import './Emp.css';

import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const EmployeeAdd = ({ onEntrySaved }) => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    phone: "",
    emergencyPhone: "",
    aadhar: "",
    address: "",
    designation: "Worker", 
    joiningDate: new Date().toISOString().split("T")[0],
    salary: "",
    bankName: "",
    accountNo: "",
    ifscCode: "",
    photo: "",
    password: "" 
  });

  const showMsg = (msg, type = "success") =>
    setSnackbar({ open: true, message: msg, severity: type });

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
    reader.readAsDataURL(file);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // 🚀 FINAL WORKING SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    // REQUIRED FIELD CHECK
    if (!formData.name || !formData.phone || !formData.designation || !formData.password) {
      return showMsg("⚠️ Required fields: Name, Phone, Role, Password", "error");
    }

    setLoading(true);

    const payload = {
      employee_name: formData.name,
      father_name: formData.fatherName,
      phone: formData.phone,
      emergency_contact: formData.emergencyPhone,
      aadhar: formData.aadhar,
      address: formData.address,
      role: formData.designation,
      joining_date: formData.joiningDate,
      salary: formData.salary,
      bank_name: formData.bankName,
      account_no: formData.accountNo,
      ifsc_code: formData.ifscCode,
      password: formData.password,
      photo: formData.photo
    };

    try {
      const res = await axios.post("http://localhost:5000/api/employee/register", payload);
      
      if (res.data.success) {
        showMsg(`🎉 Employee Registered | Login ID: ${res.data.employeeId}`, "success");

        if (onEntrySaved) onEntrySaved();

        // Reset
        setFormData({
          name: "", fatherName: "", phone: "", emergencyPhone: "",
          aadhar: "", address: "", designation: "Worker",
          joiningDate: new Date().toISOString().split("T")[0],
          salary: "", bankName: "", accountNo: "", ifscCode: "", photo: "",
          password: ""
        });
      }
    } catch (err) {
      showMsg(err.response?.data?.message || "Registration Failed", "error");
    } finally {
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
          <label>Father's Name</label>
          <input name="fatherName" value={formData.fatherName} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Phone Number *</label>
          <input type="number" name="phone" value={formData.phone} onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>Emergency Contact</label>
          <input type="number" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Aadhar Number *</label>
          <input type="number" name="aadhar" value={formData.aadhar} onChange={handleChange} required />
        </div>

        <div className="input-group">
          <label>Designation *</label>
          <select name="designation" value={formData.designation} onChange={handleChange}>
            <option>Manager</option><option>Operator</option><option>Worker</option>
            <option>Driver</option><option>Helper</option><option>Admin</option>
          </select>
        </div>

        <div className="input-group">
          <label>Joining Date</label>
          <input type="date" name="joiningDate" value={formData.joiningDate} onChange={handleChange} />
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
          <input name="accountNo" value={formData.accountNo} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>IFSC Code</label>
          <input name="ifscCode" value={formData.ifscCode} onChange={handleChange} />
        </div>

        <div className="input-group">
          <label>Profile Photo</label>
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
        </div>

        <div className="input-group">
          <label style={{color:"red",fontWeight:"bold"}}>Login Password *</label>
          <input type="text" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <div className="input-group span-4">
          <label>Full Address</label>
          <input name="address" value={formData.address} onChange={handleChange} />
        </div>

        <div className="button-container-full">
          <button className="btn-submit-colored" disabled={loading}>
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
