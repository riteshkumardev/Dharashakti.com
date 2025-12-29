import React, { useState } from 'react';
import './Purchase.css';
import { getDatabase, ref, push, set } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const PurchaseForm = ({ onCancel, role }) => {
  const db = getDatabase(app);

  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [formData, setFormData] = useState({
    item: '',
    quantity: '',
    unit: 'kg',
    remarks: ''
  });

  const [loading, setLoading] = useState(false);

  /* 🔔 Snackbar State (Modern Notification) */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Function to trigger Snackbar
  const triggerSnackbar = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const productList = ["Corn", "Corn Greet", "Cattlefeed", "Aatarice", "Rice Greet", "Packing Bag"];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛑 Security Check: Snackbar used instead of alert
    if (!isAuthorized) {
      triggerSnackbar("Unauthorized: Aapko data save karne ki permission nahi hai!", "error");
      return;
    }

    setLoading(true); // 🔄 Start Global Loader

    const purchaseEntry = {
      ...formData,
      quantity: Number(formData.quantity),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().getTime()
    };

    try {
      const purchaseRef = ref(db, "purchases");
      const newEntryRef = push(purchaseRef);
      
      await set(newEntryRef, purchaseEntry);

      // ✅ Success Notification using Snackbar
      triggerSnackbar("✅ Purchase Stock Saved Successfully!", "success");
      
      // Reset Form Fields
      setFormData({ item: '', quantity: '', unit: 'kg', remarks: '' });

    } catch (error) {
      console.error("Firebase Error:", error);
      triggerSnackbar("❌ Data save nahi ho paya. Error: " + error.message, "error");
    } finally {
      // Small delay for professional UI transition
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="table-container-wide">
      {/* 🔄 Global Loader Integration */}
      {loading && <Loader />}

      <div className="table-card-wide no-scroll-card">
        <div className="form-header-row">
          <h2 className="table-title">PURCHASE ENTRY FORM (CLOUD)</h2>
          {!isAuthorized && <span className="locked-badge" style={{color: 'red', fontSize: '12px'}}>🔒 Read Only Mode</span>}
        </div>

        <form onSubmit={handleSubmit} className="purchase-form-grid">
          <div className="input-group">
            <label>Item Name</label>
            <select 
              value={formData.item} 
              onChange={(e) => setFormData({...formData, item: e.target.value})} 
              required
              className="styled-select"
              disabled={loading || !isAuthorized}
            >
              <option value="">-- Select Product --</option>
              {productList.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input 
              type="number" 
              value={formData.quantity} 
              onChange={(e) => setFormData({...formData, quantity: e.target.value})} 
              required 
              placeholder="0.00" 
              disabled={loading || !isAuthorized}
            />
          </div>

          <div className="input-group">
            <label>Unit</label>
            <select 
              value={formData.unit} 
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
              className="styled-select"
              disabled={loading || !isAuthorized}
            >
              <option value="kg">kg</option>
              <option value="Bags">Bags</option>
              <option value="Tons">Tons</option>
              <option value="Pcs">Pcs</option>
            </select>
          </div>

          <div className="input-group">
            <label>Purchase Date</label>
            <input 
              type="text" 
              value={new Date().toISOString().split('T')[0]} 
              readOnly 
              className="readonly-input" 
              style={{backgroundColor: '#f0f0f0'}}
            />
          </div>

          <div className="input-group span-4">
            <label>Remarks / Notes</label>
            <input 
              type="text"
              name="remarks"
              placeholder={isAuthorized ? "Enter purchase details..." : "🔒 Access Restricted"} 
              value={formData.remarks} 
              onChange={(e) => setFormData({...formData, remarks: e.target.value})} 
              disabled={loading || !isAuthorized}
            />
          </div>

          <div className="button-container-full">
            <button type="button" className="btn-reset-3d" onClick={onCancel} disabled={loading}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-submit-colored" 
              disabled={loading || !isAuthorized}
              style={{ 
                opacity: isAuthorized ? 1 : 0.6, 
                cursor: isAuthorized ? "pointer" : "not-allowed" 
              }}
            >
              {loading ? "Saving..." : !isAuthorized ? "🔒 Locked" : "✅ Save Purchase Stock"}
            </button>
          </div>
        </form>
      </div>

      {/* 🔔 MUI CustomSnackbar Integration */}
      <CustomSnackbar 
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default PurchaseForm;