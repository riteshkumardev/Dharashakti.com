import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Register.css";

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    aadhar: "",
    password: "",
    photo: ""
  });

  // ⏳ UI States
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  // 🔔 Snackbar Trigger
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 📸 Convert image to Base64
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setFormData({ ...formData, photo: reader.result });
    reader.readAsDataURL(file);
  };

  // 🚀 Register Function (Final Fixed)
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.name || !formData.phone || !formData.designation) {
    return showMsg("Required fields missing: name, phone, role", "error");
  }

  const payload = {
    name: formData.name,
    phone: formData.phone,
    role: formData.designation, // role fix
    fatherName: formData.fatherName,
    emergency: formData.emergency,
    aadhar: formData.aadhar,
    salary: formData.salary,
    bankName: formData.bankName,
    accountNumber: formData.accountNumber,
    ifsc: formData.ifsc,
    joinDate: formData.joinDate,
    address: formData.address,
    password: formData.password,
    photo: formData.photo || null,
  };

  try {
    const res = await axios.post("http://localhost:5000/api/employee/register", payload);

    if (res.data.success) {
      showMsg(`Employee Added! Login ID: ${res.data.employeeId}`, "success");
    } else {
      showMsg(res.data.message, "error");
    }

  } catch (err) {
    showMsg(err.response?.data?.message || "Registration Error", "error");
  }
};



  return (
    <div className="login-box register-wide">
      {loading && <Loader />}

      <h2>System Admin Registration</h2>

      {/* When ID not generated, show form */}
      {!generatedId ? (
        <form onSubmit={handleSubmit}>
          <div className="reg-grid">
            <input type="text" placeholder="Full Name"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required disabled={loading}
            />
            <input type="email" placeholder="Email Address"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required disabled={loading}
            />
            <input type="number" placeholder="Phone Number"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required disabled={loading}
            />
            <input type="number" placeholder="Aadhar Number"
              onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
              required disabled={loading}
            />
            <input type="password" placeholder="Create Password"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required disabled={loading}
            />

            <div className="photo-upload">
              <label>Profile Photo:</label>
              <input type="file" accept="image/*"
                onChange={handlePhotoChange}
                required disabled={loading}
              />
            </div>
          </div>

          <button type="submit" className="register-btn-main" disabled={loading}>
            {loading ? "Generating Secure ID..." : "Register as Admin"}
          </button>
        </form>
      ) : (
        // When ID generated, show success card
        <div className="success-card">
          <h3 style={{ color: 'green' }}>Registration Complete!</h3>
          <div className="id-display-box">
            <span>Your Login ID:</span>
            <h1>{generatedId}</h1>
          </div>
          <p>Use this ID to login to your dashboard.</p>
          <button className="login-now-btn" onClick={() => navigate("/login")}>
            Go to Login
          </button>
        </div>
      )}

      {/* Snackbar Message */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
}

export default Register;
