import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Firebase ki jagah Axios
import './ExpenseManager.css';

// 🏗️ Core Components Import
import Loader from "../../Core_Component/Loader/Loader";
import CustomSnackbar from "../../Core_Component/Snackbar/CustomSnackbar";

const ExpenseManager = ({ role }) => {
  // 🔐 Permission Check (Case-insensitive)
  const userRole = role?.toLowerCase();
  const isAuthorized = userRole === "admin" || userRole === "accountant";

  const [allExpenses, setAllExpenses] = useState([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [showHistory, setShowHistory] = useState(false); 

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({ category: 'Khana-Pina', amount: '', detail: '' });

  // ⏳ Feedback States
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // 🔔 Snackbar Helper
  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
  };

  // --- 1. Fetch Expenses (MySQL) ---
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:5000/api/expenses");
      const data = res.data;
      
      setAllExpenses(data);
      
      // Calculate Total
      const total = data.reduce((sum, exp) => sum + Number(exp.amount), 0);
      setGrandTotal(total);
    } catch (error) {
      showMsg("Data fetch karne mein dikkat aayi", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  // --- 2. Submit Expense (MySQL) ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthorized) {
      showMsg("Unauthorized: Aapko expense add karne ki permission nahi hai.", "error");
      return;
    }

    if(!formData.amount) {
        showMsg("Please enter amount", "warning");
        return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/expenses", {
        category: formData.category,
        amount: formData.amount,
        description: formData.detail,
        expense_date: selectedDate
      });

      if (response.data.success) {
        setFormData({ category: 'Khana-Pina', amount: '', detail: '' });
        showMsg("✅ Expense Saved Successfully!", "success");
        fetchExpenses(); // List refresh karein
      }
    } catch (error) { 
      showMsg("Error: " + (error.response?.data?.message || error.message), "error"); 
    } finally {
      setLoading(false);
    }
  };

  if (loading && allExpenses.length === 0) return <Loader />;

  return (
    <div className="expense-fixed-container">
      {loading && <Loader />}

      <div className="expense-top-section">
        <div className="table-header-row">
          <h2 className="table-title">COMPANY EXPENSES</h2>
          <div className="grand-total-badge">
             <small>Grand Total</small>
             <span>₹{grandTotal}</span>
          </div>
        </div>

        <div className={`expense-form-card ${!isAuthorized ? 'form-locked' : ''}`}>
          {!isAuthorized && (
            <p style={{ color: '#d32f2f', fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
              🔒 Read Only Mode: Sirf Admin entries kar sakte hain.
            </p>
          )}
          <form onSubmit={handleSubmit} className="expense-compact-form">
            <div className="form-row">
              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => setSelectedDate(e.target.value)} 
                  disabled={!isAuthorized || loading}
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  disabled={!isAuthorized || loading}
                >
                  <option value="Khana-Pina">Khana-Pina</option>
                  <option value="Dawai">Dawai</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div className="input-group">
                <label>Amount (₹)</label>
                <input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})} 
                  placeholder="0" 
                  required 
                  disabled={!isAuthorized || loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="input-group full-width">
                <label>Details</label>
                <input 
                  type="text" 
                  value={formData.detail} 
                  onChange={e => setFormData({...formData, detail: e.target.value})} 
                  placeholder={isAuthorized ? "Ex: Staff Lunch, Petrol..." : "🔒 Access Restricted"} 
                  disabled={!isAuthorized || loading}
                />
              </div>
              <button 
                type="submit" 
                className="save-expense-btn"
                disabled={!isAuthorized || loading}
                style={{ opacity: isAuthorized ? 1 : 0.6 }}
              >
                {loading ? "SAVING..." : (isAuthorized ? "SAVE EXPENSE" : "🔒 LOCKED")}
              </button>
            </div>
          </form>
        </div>

        <button className="toggle-history-btn" onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? "⬆ Hide History" : "⬇ Show History List"}
        </button>
      </div>

      {showHistory && (
        <div className="expense-history-scroll">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Details</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {allExpenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{new Date(exp.expense_date).toLocaleDateString()}</td>
                    <td><span className="unit-badge">{exp.category}</span></td>
                    <td>{exp.description}</td>
                    <td className="amount-red">₹{exp.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
};

export default ExpenseManager;