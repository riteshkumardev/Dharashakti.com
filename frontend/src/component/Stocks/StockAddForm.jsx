import React, { useState } from "react";
import { getDatabase, ref, push } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockAddForm = ({ role }) => {
  const db = getDatabase(app);

  // 🔐 Permission Guard
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    itemName: "",
    billNo: "",
    quantity: "",
    rate: "",
    totalAmount: 0,
    paidAmount: "",
    balanceAmount: 0,
    remarks: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(false);

  /* 🔔 Snackbar State (Modern Notification) */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // Helper to trigger Snackbar
  const triggerMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedData = { ...formData, [name]: value };

    // 🔢 Auto Calculation Logic (Original)
    if (name === "quantity" || name === "rate" || name === "paidAmount") {
      const total = (Number(updatedData.quantity) || 0) * (Number(updatedData.rate) || 0);
      const balance = total - (Number(updatedData.paidAmount) || 0);
      updatedData.totalAmount = total;
      updatedData.balanceAmount = balance;
    }
    setFormData(updatedData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // 🛑 Logic Guard
    if (!isAuthorized) {
      triggerMsg("Denied: Aapko purchase entry karne ki permission nahi hai.", "error");
      return;
    }

    setLoading(true); // 🔄 Global Loader Start
    try {
      const purchaseRef = ref(db, "purchases");
      await push(purchaseRef, { ...formData, timestamp: Date.now() });
      
      triggerMsg("✅ Purchase record saved successfully!", "success");
      setFormData(initialState);
    } catch (error) {
      triggerMsg("❌ Error: Data save nahi ho saka.", "error");
    } finally {
      // 500ms delay for smooth UI feel
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="sales-container">
      {/* 🔄 Global Loader Overlay */}
      {loading && <Loader />}

      <div className="sales-card-wide">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="form-title">Purchase Entry</h2>
            {!isAuthorized && <span style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>🔒 READ ONLY</span>}
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Supplier Name</label>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div>

          {/* <div className="input-group">
            <label>Item Name</label>
            <input name="itemName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div> */}
            <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized}>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
              <option value="Corn Grit (3mm)">Corn Grit (3mm)</option>
              <option value="Cattle Feed">Cattle Feed</option>
              <option value="Rice Grit">Rice Grit</option>
              <option value="Corn Flour">Corn Flour</option>
            </select>
          </div>

          <div className="input-group">
            <label>Bill No</label>
            <input name="billNo" value={formData.billNo} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Rate</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Amount (₹)</label>
            <input value={formData.totalAmount} readOnly style={{ background: '#f0f0f0' }} />
          </div>

          <div className="input-group">
            <label>Paid Amount (₹)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Balance (₹)</label>
            <input value={formData.balanceAmount} readOnly style={{ background: '#fff0f0', color: 'red', fontWeight: 'bold' }} />
          </div>

          <div className="button-container-full">
            <button 
              type="submit" 
              className="btn-submit-colored" 
              disabled={loading || !isAuthorized}
              style={{ opacity: isAuthorized ? 1 : 0.6, cursor: isAuthorized ? 'pointer' : 'not-allowed' }}
            >
              {loading ? "Saving Data..." : !isAuthorized ? "🔒 Read Only Mode" : "✅ Save Purchase"}
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

export default StockAddForm;