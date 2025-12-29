import React, { useState, useEffect } from 'react';
import "./Stock.css";
import axios from "axios";
import Alert from "../Core_Component/Alert/Alert"; 
import Loader from '../Core_Component/Loader/Loader';

const StockTable = ({ role }) => {

  const isAuthorized = role === "Admin" || role === "Accountant";

  const [stocks, setStocks] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [alertData, setAlertData] = useState({
    show: false, title: "", message: "", type: "info",
  });

  const showAlert = (title, message) =>
    setAlertData({ show: true, title, message });

  const closeAlert = () =>
    setAlertData((prev) => ({ ...prev, show: false }));

  // 🚀 FETCH STOCK LIST (MYSQL)
  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/stocks");
        console.log(res,"res Stock table data");
        
      setStocks(res.data.stock || []);
        setLoading(false);
      } catch (error) {
        console.error("Stock fetch error:", error);
        setLoading(false);
      }
    };
    fetchStock();
  }, []);



  // ✏️ START EDIT
  const startEdit = (stock) => {
    if (!isAuthorized) return showAlert("Denied ❌","Aapke paas edit karne ki permission nahi hai.");
    setEditId(stock.id);
    setEditData({ ...stock });
  };

  // 🔄 INPUT CHANGE
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // 💾 SAVE UPDATE (MYSQL PUT)
  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      await axios.put(`http://localhost:5000/api/stocks/${editId}`, {
        ...editData,
        quantity: Number(editData.quantity),
        updatedDate: new Date().toISOString().split("T")[0]
      });
      showAlert("Updated ✅", "Stock updated successfully.");
      setEditId(null);

      // UI Refresh
      setStocks(stocks.map(s => s.id === editId ? editData : s));
    } catch (err) {
      showAlert("Error ❌", "Update failed: " + err.message);
    }
  };

  // 🗑 DELETE STOCK (MYSQL DELETE)
  const handleDelete = async (id) => {
    if (!isAuthorized) return showAlert("Denied ❌","Permission nahi hai.");
    try {
      await axios.delete(`http://localhost:5000/api/stocks/${id}`);
      showAlert("Deleted 🗑️", "Stock item removed.");
      setStocks(stocks.filter(s => s.id !== id));
    } catch (err) {
      showAlert("Error ❌", "Delete fail: " + err.message);
    }
  };

  const filteredStocks = stocks.filter(s =>
    s.item?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-row">
            <h2 className="table-title">STOCK INVENTORY</h2>
            <div className="search-wrapper">
              <input
                className="table-search-box"
                placeholder="Search Item Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>SI</th><th>Item</th><th>Qty</th><th>Unit</th>
                  <th>Updated</th><th>Remarks</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock, i) => {
                  const editing = editId === stock.id;
                  const low = stock.quantity < 50;

                  return (
                    <tr key={stock.id} className={editing ? "active-edit-row" : low ? "low-stock-bg" : ""}>
                      <td>{i + 1}</td>

                      <td>
                        {editing ? (
                          <input name="item" value={editData.item} onChange={handleEditChange} />
                        ) : stock.item}
                      </td>

                      <td>
                        {editing ? (
                          <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange}/>
                        ) : <strong>{stock.quantity}</strong>}
                      </td>

                      <td>
                        {editing ? (
                          <select name="unit" value={editData.unit} onChange={handleEditChange}>
                            <option>kg</option><option>Bags</option><option>Pcs</option><option>Tons</option>
                          </select>
                        ) : stock.unit}
                      </td>

                      <td>{stock.updatedDate}</td>

                      <td>{editing ? (
                        <input name="remarks" value={editData.remarks} onChange={handleEditChange}/>
                      ) : stock.remarks}</td>

                      <td>
                        <span className={stock.quantity <= 0 ? "null-bg" : low ? "warning-bg" : "success-bg"}>
                          {stock.quantity <= 0 ? "Out of Stock" : low ? "Low" : "Available"}
                        </span>
                      </td>

                      <td>
                        {editing ? (
                          <>
                            <button onClick={handleSave}>💾 Save</button>
                            <button onClick={() => setEditId(null)}>✖</button>
                          </>
                        ) : (
                          <>
                            <button disabled={!isAuthorized} onClick={() => startEdit(stock)}>✏️</button>
                            <button disabled={!isAuthorized} onClick={() => handleDelete(stock.id)}>🗑️</button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredStocks.length === 0 && <div className="no-records-box">No Stock Data Found.</div>}
          </div>
        </div>
      </div>

      <Alert {...alertData} onClose={closeAlert} />
    </>
  );
};

export default StockTable;
