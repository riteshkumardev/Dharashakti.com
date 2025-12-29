import React, { useState, useEffect } from "react";
import axios from 'axios';
import { useNavigate } from "react-router-dom";
import Loader from "./Core_Component/Loader/Loader"; 
import CustomSnackbar from "./Core_Component/Snackbar/CustomSnackbar"; 
import "../App.css";

function Login({ setUser }) {
  const [employeeId, setEmployeeId] = useState("");
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
      showMsg("❌ Invalid Captcha. Please solve again.", "error");
      refreshCaptcha();
      return;
    }

    const cleanId = employeeId.trim();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        username: cleanId, 
        password: password
      }, { timeout: 10000 }); // 10 Sec timeout

      if (response.data.success) {
        const userData = response.data.user;
        const sessionId = userData.currentSessionId; // Backend synced ID

        setTimeout(() => {
          const finalUser = {
            ...userData,
            currentSessionId: sessionId,
            loginTime: new Date().toISOString()
          };

          localStorage.setItem("user", JSON.stringify(finalUser));
          setUser(finalUser);
          setLoading(false); 
          navigate("/", { replace: true });
        }, 800);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Connection Error. Is Backend running?";
      showMsg("❌ " + errorMsg, "error");
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
            placeholder="Enter 8-Digit ID"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            maxLength="8"
            inputMode="numeric"
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

        <div className="captcha-container" style={{ marginBottom: "15px" }}>
          <label>Verify Captcha</label>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              background: "#eee",
              padding: "4px 8px",
              borderRadius: "4px",
              fontWeight: "bold",
              width: "80%",
              fontSize: "1.2rem",
              userSelect: "none",
              color: "#333"
            }}>
              {captcha.num1} + {captcha.num2} = ?
            </div>
            <button 
              type="button" 
              onClick={refreshCaptcha} 
              disabled={loading}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", width: "20%" }}
            >
              🔄
            </button>
          </div>
          <input
            type="number"
            placeholder="Result"
            value={userCaptcha}
            onChange={(e) => setUserCaptcha(e.target.value)}
            required
            disabled={loading}
            style={{ marginTop: "10px" }}
          />
        </div>

        <button type="submit" disabled={loading} style={{ marginTop: "10px" }}>
          {loading ? "Verifying Access..." : "Login Now"}
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