import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Loader from "./Core_Component/Loader/Loader"; 
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar"; 
import "../App.css";

function Login({ setUser }) {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, total: 0 });
  const [userCaptcha, setUserCaptcha] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "error" });

  const navigate = useNavigate();

  const showMsg = (msg, type = "error") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const refreshCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    setCaptcha({ num1: n1, num2: n2, total: n1 + n2 });
    setUserCaptcha(""); 
  };

  useEffect(() => {
    refreshCaptcha();
    const savedUser = localStorage.getItem("user");
    if (savedUser) navigate("/", { replace: true });
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (parseInt(userCaptcha) !== captcha.total) {
      showMsg("❌ Invalid Captcha. Try again!", "error");
      refreshCaptcha();
      return;
    }

    const cleanEmp = empId.trim();
    if (!cleanEmp) return showMsg("⚠️ Employee ID Required!");

    setLoading(true);

    try {
      // 🔥 Backend ke hisaab se field fix ki
      const response = await axios.post("http://localhost:5000/api/login", {
        empId: cleanEmp,  // IMPORTANT FIX
        password: password
      }, { timeout: 10000 });

      if (response.data.success) {
        const userData = response.data.user;

        const finalUser = {
          ...userData,
          currentSessionId: userData.currentSessionId,
          loginTime: new Date().toISOString(),
        };

        localStorage.setItem("user", JSON.stringify(finalUser));
        setUser(finalUser);
        setLoading(false);

        showMsg("✅ Login Successful!", "success");
        navigate("/", { replace: true });
      }

    } catch (err) {
      const errorMsg = err.response?.data?.message || "⚠️ Server Connection Error";
      showMsg(errorMsg, "error");
      refreshCaptcha();
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="login-box">
      <h2>Dharashakti Login</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="input-group">
          <label>Employee ID</label>
          <input
            type="text"
            placeholder="Enter Employee ID"
            value={empId}
            onChange={(e) => setEmpId(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="captcha-container">
          <label>Verify Captcha</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{
              background: "#eee",
              padding: "6px 12px",
              borderRadius: "6px",
              fontWeight: "bold",
              fontSize: "1.2rem"
            }}>
              {captcha.num1} + {captcha.num2} = ?
            </div>
            <button type="button" onClick={refreshCaptcha} disabled={loading}>🔄</button>
          </div>
          <input
            type="number"
            placeholder="Answer"
            value={userCaptcha}
            onChange={(e) => setUserCaptcha(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Login Now"}
        </button>

      </form>

      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </div>
  );
}

export default Login;
