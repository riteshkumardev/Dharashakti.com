import React, { useState } from "react";
import axios from "axios"; // Axios for MySQL
import "./Profile.css";
import { useNavigate } from "react-router-dom";

// 🏗️ Core Components
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

export default function Profile({ user, setUser }) {
  // State Initialization
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [photoURL, setPhotoURL] = useState(
    user?.photo || "https://i.imgur.com/6VBx3io.png"
  );
  
  // ⏳ Feedback States
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const navigate = useNavigate();

  // 🔔 Snackbar Helper
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  /* ================= UPDATE PROFILE (NAME & PHONE) ================= */
  const updateProfile = async () => {
    if (!user?.id) return showMsg("User ID not found!", "error");
    
    try {
      setLoading(true);
      const res = await axios.put(`http://localhost:5000/api/profile/update/${user.id}`, {
        name: name,
        phone: phone,
      });

      if (res.data.success) {
        const updatedUser = { ...user, name, phone };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showMsg("✅ Profile updated successfully!", "success");
      }
    } catch (e) {
      showMsg("❌ Update failed: " + (e.response?.data?.message || e.message), "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHANGE PASSWORD ================= */
  const changePassword = async () => {
    if (newPassword.length < 4) {
      return showMsg("Password must be at least 4 characters", "warning");
    }
    
    try {
      setLoading(true);
      const res = await axios.put(`http://localhost:5000/api/profile/password/${user.id}`, {
        password: newPassword,
      });

      if (res.data.success) {
        const updatedUser = { ...user, password: newPassword };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        showMsg("🔐 Password updated!", "success");
        setNewPassword("");
      }
    } catch (e) {
      showMsg("❌ Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= IMAGE UPLOAD (Base64 to MySQL) ================= */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64Photo = reader.result;
      try {
        setLoading(true);
        const res = await axios.put(`http://localhost:5000/api/profile/photo/${user.id}`, {
          photo: base64Photo,
        });

        if (res.data.success) {
          const updatedUser = { ...user, photo: base64Photo };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
          setPhotoURL(base64Photo);
          showMsg("✅ Profile image updated!", "success");
        }
      } catch (err) {
        showMsg("❌ Image upload failed", "error");
      } finally {
        setLoading(false);
      }
    };
  };

  /* ================= LOGOUT ================= */
  const logout = async () => {
    setLoading(true);
    try {
      // Backend par logout time update karna (Optional)
      await axios.post(`http://localhost:5000/api/logout/${user.id}`);
    } catch (e) {
      console.error("Logout log failed");
    } finally {
      localStorage.removeItem("user");
      setUser(null);
      setLoading(false);
      navigate("/login");
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="profile-wrapper">
      <div className="profile-card-3d">
        <div className="profile-img">
          <img src={photoURL} alt="profile" style={{ objectFit: 'cover' }} />
          <label className="img-edit" title="Change Photo">
            📸
            <input type="file" accept="image/*" hidden onChange={handleImageChange} disabled={loading} />
          </label>
        </div>

        <h2 className="profile-title">{user?.role} Profile</h2>

        <div className="field">
          <label>Login ID (Username)</label>
          <input value={user?.username || ""} disabled style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>

        <div className="field">
          <label>Full Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter name" disabled={loading} />
        </div>

        <div className="field">
          <label>Phone Number</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter phone" disabled={loading} />
        </div>

        <button onClick={updateProfile} disabled={loading} className="update-btn">
          {loading ? "Updating..." : "Update Details"}
        </button>

        <div className="divider">Security & Password</div>

        <div className="field">
          <label>New Password</label>
          <input
            type="password"
            placeholder="Min 4 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button onClick={changePassword} disabled={loading || !newPassword}>
          {loading ? "Saving..." : "Change Password"}
        </button>

        <button className="danger" onClick={logout} disabled={loading} style={{ marginTop: '20px' }}>
          {loading ? "Logging out..." : "🔒 Logout from Device"}
        </button>
      </div>

      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
}