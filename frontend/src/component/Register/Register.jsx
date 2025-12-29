import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Firebase hatakar Axios laya gaya
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
  
  // ⏳ Feedback States
  const [loading, setLoading] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  // 🔔 Snackbar Helper
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- 1. Image to Base64 Converter ---
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // --- 🚀 NODE.JS BACKEND CALL ---
      const response = await axios.post('http://localhost:5000/api/register-admin', formData);

      if (response.data.success) {
        setGeneratedId(response.data.employeeId); // Backend se generate hokar aayi ID
        showMsg("🎉 Admin Registration Successful!", "success");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Registration failed. Try again.";
      showMsg("Error: " + errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-box register-wide">
      {loading && <Loader />}

      <h2>System Admin Registration</h2>
      
      {!generatedId ? (
        <form onSubmit={handleRegister}>
          <div className="reg-grid">
            <input type="text" placeholder="Full Name" onChange={(e)=>setFormData({...formData, name: e.target.value})} required disabled={loading} />
            <input type="email" placeholder="Email Address" onChange={(e)=>setFormData({...formData, email: e.target.value})} required disabled={loading} />
            <input type="number" placeholder="Phone Number" onChange={(e)=>setFormData({...formData, phone: e.target.value})} required disabled={loading} />
            <input type="number" placeholder="Aadhar Number" onChange={(e)=>setFormData({...formData, aadhar: e.target.value})} required disabled={loading} />
            <input type="password" placeholder="Create Password" onChange={(e)=>setFormData({...formData, password: e.target.value})} required disabled={loading} />
            
            <div className="photo-upload">
              <label>Profile Photo:</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} required disabled={loading} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="register-btn-main">
            {loading ? "Generating Secure ID..." : "Register as Admin"}
          </button>
        </form>
      ) : (
        <div className="success-card">
          <h3 style={{color: 'green'}}>Registration Complete!</h3>
          <div className="id-display-box">
            <span>Your Login ID:</span>
            <h1>{generatedId}</h1>
          </div>
          <p>Use this 8-digit ID to login to your dashboard.</p>
          <button onClick={() => navigate("/login")} className="login-now-btn">Go to Login</button>
        </div>
      )}

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