import React, { useState, useEffect } from "react";
import axios from "axios"; // Firebase hatakar Axios laya gaya
import Loader from "../Core_Component/Loader/Loader"; 
import "./ProfitLoss.css";

const ProfitLoss = () => {
  const [data, setData] = useState({ sales: 0, purchases: 0, expenses: 0 });
  const [loading, setLoading] = useState(true);

  // --- 🚀 Fetch Financial Data (MySQL) ---
  const fetchFinancials = async () => {
    setLoading(true);
    try {
      // Hum backend se ek single response mein teeno totals mangwayenge
      const res = await axios.get("http://localhost:5000/api/finance/profit-loss");
      setData(res.data);
    } catch (error) {
      console.error("Error fetching profit/loss data:", error);
    } finally {
      // Artificial delay for smooth feel
      setTimeout(() => setLoading(false), 800);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  const totalOut = data.purchases + data.expenses;
  const netProfit = data.sales - totalOut;

  if (loading) return <Loader />;

  return (
    <div className="pl-container">
      <div className="pl-header">
        <h3>📊 Financial Analytics (Live Database)</h3>
      </div>

      <div className="pl-table-wrapper">
        <table className="pl-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Category</th>
              <th className="text-right">Amount (₹)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Sales Revenue</td>
              <td><span className="badge inc">Income</span></td>
              <td className="text-right amount-plus">+{data.sales.toLocaleString()}</td>
              <td>✅ Realized</td>
            </tr>
            <tr>
              <td>Inventory Purchases</td>
              <td><span className="badge exp">Purchase</span></td>
              <td className="text-right amount-minus">-{data.purchases.toLocaleString()}</td>
              <td>📦 Outgoing</td>
            </tr>
            <tr>
              <td>Daily Operational Expenses</td>
              <td><span className="badge exp">Expense</span></td>
              <td className="text-right amount-minus">-{data.expenses.toLocaleString()}</td>
              <td>💸 Paid</td>
            </tr>

            <tr className="final-row">
              <td colSpan="2"><strong>NET SETTLEMENT (Profit/Loss)</strong></td>
              <td className={`text-right total-final ${netProfit >= 0 ? 'pos' : 'neg'}`}>
                ₹{netProfit.toLocaleString()}
              </td>
              <td><strong>{netProfit >= 0 ? "🚀 PROFIT" : "⚠️ LOSS"}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProfitLoss;