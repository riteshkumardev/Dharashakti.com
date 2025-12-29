import React, { useState, useEffect } from "react";
import axios from "axios"; // Axios for MySQL
import "./Sales.css";

// 🏗️ Core Components Import
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const SalesEntry = ({ role }) => {
  // 🔐 Permission Check
  const isAuthorized = role === "Admin" || role === "Accountant";

  const initialState = {
    date: new Date().toISOString().split("T")[0],
    customerName: "",
    productName: "",
    billNo: "",
    quantity: "",
    rate: "",
    totalPrice: 0,
    amountReceived: "",
    paymentDue: 0,
    remarks: "",
    billDueDate: "",
  };

  const [formData, setFormData] = useState(initialState);
  const [nextSi, setNextSi] = useState(1);
  const [loading, setLoading] = useState(false);

  /* 🔔 Snackbar State */
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // 1️⃣ Fetch Next SI No (MySQL API)
  const fetchNextSi = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/sales/next-si");
      setNextSi(res.data.nextSi);
    } catch (err) {
      console.error("SI Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchNextSi();
  }, []);

  // 2️⃣ Live Calculations
  useEffect(() => {
    const total = (Number(formData.quantity) || 0) * (Number(formData.rate) || 0);
    const due = total - (Number(formData.amountReceived) || 0);

    let calculatedDueDate = "";
    if (formData.date) {
      const d = new Date(formData.date);
      d.setDate(d.getDate() + 15);
      calculatedDueDate = d.toISOString().split("T")[0];
    }

    setFormData((prev) => ({
      ...prev,
      totalPrice: total,
      paymentDue: due,
      billDueDate: calculatedDueDate,
    }));
  }, [formData.quantity, formData.rate, formData.amountReceived, formData.date]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => {
    setFormData(initialState);
    if (isAuthorized) showMsg("Form cleared", "info");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthorized) {
      showMsg("Unauthorized: Permission Denied!", "error");
      return;
    }

    setLoading(true);

    try {
      // --- 🚀 NODE.JS BACKEND CALL ---
      const response = await axios.post('http://localhost:5000/api/sales', {
        ...formData,
        si: nextSi
      });

      if (response.data.success) {
        showMsg(`Sale Saved! SI No: ${nextSi} | Due: ${formData.billDueDate}`, "success");
        handleReset();
        fetchNextSi(); // Refresh SI for next entry
      }
    } catch (error) {
      showMsg("Data save nahi ho paya. " + (error.response?.data?.message || ""), "error");
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  return (
    <div className="sales-container">
      {loading && <Loader />}

      <div className="sales-card-wide">
        <div className="form-header-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="form-title">Sales Entry (Local Database)</h2>

          <div style={{ display: "flex", gap: "10px" }}>
            <div className="si-badge">SI No: {nextSi}</div>
            <div className="due-badge">Due: {formData.billDueDate}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sales-form-grid">
          <div className="input-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Product Name</label>
            <select name="productName" value={formData.productName} onChange={handleChange} required disabled={loading || !isAuthorized}>
              <option value="">Select Product</option>
              <option value="Corn Grit">Corn Grit</option>
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
            <label>Customer Name</label>
            <input name="customerName" value={formData.customerName} onChange={handleChange} required disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Quantity (Kg/MT)</label>
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group">
            <label>Rate (₹)</label>
            <input type="number" name="rate" value={formData.rate} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Total Price (₹)</label>
            <input value={formData.totalPrice} readOnly style={{backgroundColor: '#f9f9f9'}} />
          </div>

          <div className="input-group">
            <label>Amount Received (₹)</label>
            <input type="number" name="amountReceived" value={formData.amountReceived} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="input-group readonly-group">
            <label>Payment Due (₹)</label>
            <input value={formData.paymentDue} readOnly style={{color: 'red', fontWeight: 'bold'}} />
          </div>

          <div className="input-group span-2">
            <label>Remarks</label>
            <input name="remarks" value={formData.remarks} onChange={handleChange} disabled={loading || !isAuthorized} />
          </div>

          <div className="button-container-full">
            <button type="button" onClick={handleReset} className="btn-reset-3d" disabled={loading || !isAuthorized}>
              Reset
            </button>
            <button type="submit" className="btn-submit-colored" disabled={loading || !isAuthorized}>
              {loading ? "Saving..." : !isAuthorized ? "🔒 Read Only" : "✅ Save Sale"}
            </button>
          </div>
        </form>
      </div>

      <CustomSnackbar
        open={snackbar.open} 
        message={snackbar.message} 
        severity={snackbar.severity} 
        onClose={() => setSnackbar({ ...snackbar, open: false })} 
      />
    </div>
  );
};

export default SalesEntry;