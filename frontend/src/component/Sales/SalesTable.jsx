import React, { useState, useEffect } from "react";
import "./Sales.css";
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Loader from "../Core_Component/Loader/Loader";
import Alert from "../Core_Component/Alert/Alert";

const SalesTable = ({ role }) => { // 👈 role prop add kiya gaya hai
  const db = getDatabase(app);
  
  // 🔐 Permission Check: Sirf Admin aur Accountant edit/delete kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("All");
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [sortBy, setSortBy] = useState("dateNewest");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  /* 🔔 Alert State */
  const [alertData, setAlertData] = useState({
    show: false,
    title: "",
    message: "",
  });

  const showAlert = (title, message) => {
    setAlertData({ show: true, title, message });
  };

  const closeAlert = () => {
    setAlertData((prev) => ({ ...prev, show: false }));
  };

  // 1️⃣ Fetch Data (Unchanged)
  useEffect(() => {
    const salesRef = ref(db, "sales");
    const unsubscribe = onValue(salesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setSalesList(list);
      } else {
        setSalesList([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // 2️⃣ Auto Calculation in Edit Mode (Unchanged)
  useEffect(() => {
    if (editId) {
      const total = (Number(editData.quantity) || 0) * (Number(editData.rate) || 0);
      const due = total - (Number(editData.amountReceived) || 0);
      setEditData((prev) => ({ ...prev, totalPrice: total, paymentDue: due }));
    }
  }, [editData.quantity, editData.rate, editData.amountReceived, editId]);

  // 3️⃣ Filter & Sort Logic (Unchanged)
  const getProcessedList = () => {
    let list = salesList.filter((s) => {
      const matchesSearch =
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.billNo?.toLowerCase().includes(search.toLowerCase());
      const matchesProduct =
        selectedProduct === "All" || s.productName === selectedProduct;
      return matchesSearch && matchesProduct;
    });

    list.sort((a, b) => {
      if (sortBy === "dateNewest") return new Date(b.date) - new Date(a.date);
      if (sortBy === "dateOldest") return new Date(a.date) - new Date(b.date);
      if (sortBy === "billAsc") return a.billNo.localeCompare(b.billNo, undefined, { numeric: true });
      if (sortBy === "billDesc") return b.billNo.localeCompare(a.billNo, undefined, { numeric: true });
      return 0;
    });
    return list;
  };

  const processedList = getProcessedList();
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = processedList.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(processedList.length / rowsPerPage);

  // 4️⃣ Actions with Permission Guard
  const handleDelete = (id) => {
    if (!isAuthorized) {
      showAlert("Denied ❌", "Aapke paas delete karne ki permission nahi hai.");
      return;
    }
    remove(ref(db, `sales/${id}`))
      .then(() => showAlert("Deleted 🗑️", "Record successfully delete ho gaya."))
      .catch((err) => showAlert("Error ❌", "Delete nahi ho paya."));
  };

  const handleSave = () => {
    if (!isAuthorized) return;
    update(ref(db), { [`/sales/${editId}`]: editData })
      .then(() => {
        showAlert("Updated! ✅", "Record update kar diya gaya hai.");
        setEditId(null);
      })
      .catch((err) => showAlert("Error ❌", "Update fail ho gaya."));
  };

  const startEdit = (sale) => {
    if (!isAuthorized) {
      showAlert("Denied ❌", "Aapke paas edit karne ki permission nahi hai.");
      return;
    }
    setEditId(sale.id);
    setEditData({ ...sale });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-flex">
            <h2 className="table-title">SALES RECORDS</h2>
            <div className="table-controls-row">
              {/* Filter controls unchanged */}
              <select className="table-select-custom" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="dateNewest">Newest Date</option>
                <option value="dateOldest">Oldest Date</option>
                <option value="billAsc">Bill No (Low to High)</option>
                <option value="billDesc">Bill No (High to Low)</option>
              </select>

              <select className="table-select-custom" value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setCurrentPage(1); }}>
                <option value="All">All Products</option>
                <option value="Corn Grit">Corn Grit</option>
                <option value="Cattle Feed">Cattle Feed</option>
                <option value="Rice Grit">Rice Grit</option>
                <option value="Corn Flour">Corn Flour</option>
              </select>

              <div className="search-input-wrapper">
                <input
                  className="table-search-input"
                  placeholder="Search Customer/Bill..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Bill No</th>
                  <th>Product</th>
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Received</th>
                  <th>Due</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.map((sale) => (
                  <tr key={sale.id} className={editId === sale.id ? "active-edit" : ""}>
                    {/* Inline edit logic remains same */}
                    <td>{editId === sale.id ? <input type="date" name="date" value={editData.date} onChange={handleEditChange} className="edit-input-field" /> : sale.date}</td>
                    <td>{editId === sale.id ? <input name="billNo" value={editData.billNo} onChange={handleEditChange} className="edit-input-field" /> : <span className="bill-tag">{sale.billNo}</span>}</td>
                    <td>
                      {editId === sale.id ? (
                        <select name="productName" value={editData.productName} onChange={handleEditChange} className="edit-input-field">
                          <option value="Corn Grit">Corn Grit</option>
                          <option value="Cattle Feed">Cattle Feed</option>
                          <option value="Rice Grit">Rice Grit</option>
                          <option value="Corn Flour">Corn Flour</option>
                        </select>
                      ) : <strong>{sale.productName}</strong>}
                    </td>
                    <td>{editId === sale.id ? <input name="customerName" value={editData.customerName} onChange={handleEditChange} className="edit-input-field" /> : sale.customerName}</td>
                    <td>{editId === sale.id ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> : sale.quantity}</td>
                    <td>₹{sale.rate}</td>
                    <td className="bold-cell">₹{editId === sale.id ? editData.totalPrice : sale.totalPrice}</td>
                    <td>₹{editId === sale.id ? <input type="number" name="amountReceived" value={editData.amountReceived} onChange={handleEditChange} className="edit-input-field small-input" /> : sale.amountReceived}</td>
                    <td className="danger-text">₹{editId === sale.id ? editData.paymentDue : sale.paymentDue}</td>
                    <td>{editId === sale.id ? <input type="date" name="billDueDate" value={editData.billDueDate} onChange={handleEditChange} className="edit-input-field" /> : sale.billDueDate}</td>
                    
                    <td className="action-btns-cell">
                      {editId === sale.id ? (
                        <>
                          <button className="save-btn-ui" onClick={handleSave}>💾</button>
                          <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                        </>
                      ) : (
                        <>
                          <button 
                            className="row-edit-btn" 
                            onClick={() => startEdit(sale)}
                            disabled={!isAuthorized}
                            title={!isAuthorized ? "No Edit Permission" : "Edit Record"}
                            style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                          >✏️</button>
                          
                          <button 
                            className="row-delete-btn" 
                            onClick={() => handleDelete(sale.id)}
                            disabled={!isAuthorized}
                            title={!isAuthorized ? "No Delete Permission" : "Delete Record"}
                            style={{ opacity: isAuthorized ? 1 : 0.5, cursor: isAuthorized ? "pointer" : "not-allowed" }}
                          >🗑️</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => prev - 1)} className="pg-btn">◀ Prev</button>
            <span className="pg-info">Page {currentPage} of {totalPages || 1}</span>
            <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((prev) => prev + 1)} className="pg-btn">Next ▶</button>
          </div>
        </div>
      </div>

      <Alert
        show={alertData.show}
        title={alertData.title}
        message={alertData.message}
        onClose={closeAlert}
      />
    </>
  );
};

export default SalesTable;