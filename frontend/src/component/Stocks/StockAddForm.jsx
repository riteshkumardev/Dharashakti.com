import React, { useState } from "react";
import axios from "axios";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const StockAddForm = ({ role }) => {

  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    supplierName: "",
    productName: "",
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

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const triggerMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 📌 Input Update + Auto Calculation
  const handleChange = (e) => {
    const { name, value } = e.target;
    const update = { ...formData, [name]: value };

    if (name === "quantity" || name === "rate" || name === "paidAmount") {
      const total = (Number(update.quantity) || 0) * (Number(update.rate) || 0);
      const balance = total - (Number(update.paidAmount) || 0);
      update.totalAmount = total;
      update.balanceAmount = balance;
    }

    setFormData(update);
  };

  // 📌 Submit Purchase → MySQL
  const handleSubmit = async (e) => {
    console.log(e,"Submit Purchase → MySQL");
    
    e.preventDefault();

    if (!isAuthorized) {
      return triggerMsg("❌ Permission Denied. Admin/Accountant only.", "error");
    }

    setLoading(true);

    try {
       await axios.post("http://localhost:5000/api/stocks", formData);
      triggerMsg("✅ Purchase saved successfully!");
      setFormData(initialState);
    } catch (error) {
      triggerMsg("❌ Server error: Data save nahi hua", "error");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="sales-container">
      {loading && <Loader />}

      <div className="sales-card-wide">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 className="form-title">Stock Entry</h2>
          {!isAuthorized && <span style={{ color: 'red', fontSize:'12px' }}>🔒 READ ONLY</span>}
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">

          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized}/>
          </div>

          <div className="input-group">
            <label>Supplier Name</label>
            <input name="supplierName" value={formData.supplierName} onChange={handleChange} required disabled={!isAuthorized}/>
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={!isAuthorized}>
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
            <input name="billNo" value={formData.billNo} onChange={handleChange} required disabled={!isAuthorized}/>
          </div>

          <div className="input-group">
            <label>Quantity</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={!isAuthorized}/>
          </div>

          <div className="input-group">
            <label>Rate</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} disabled={!isAuthorized}/>
          </div>

          <div className="input-group readonly-group">
            <label>Total Amount (₹)</label>
            <input value={formData.totalAmount} readOnly style={{background:'#f0f0f0'}}/>
          </div>

          <div className="input-group">
            <label>Paid Amount (₹)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} disabled={!isAuthorized}/>
          </div>

          <div className="input-group readonly-group">
            <label>Balance (₹)</label>
            <input value={formData.balanceAmount} readOnly style={{background:'#ffe6e6', color:'red', fontWeight:'bold'}}/>
          </div>

          <div className="button-container-full">
            <button type="submit" className="btn-submit-colored" disabled={!isAuthorized}>
              {loading ? "Saving..." : "💾 Save Purchase"}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar 
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({...snackbar, open:false})}
      />
    </div>
  );
};

export default StockAddForm;
