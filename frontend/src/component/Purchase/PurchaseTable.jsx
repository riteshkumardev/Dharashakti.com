import React, { useState, useEffect } from 'react';
import './Purchase.css';
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Loader from '../Core_Component/Loader/Loader';
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar"; // ⭐ Snackbar Added

const PurchaseTable = ({ role }) => {
  const db = getDatabase(app);
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // ⭐ Snackbar State
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type="success") => {
    setSnackbar({ open:true, message:msg, severity:type });
    setTimeout(() => setSnackbar(s=>({...s, open:false})), 2500);
  };

  // 🚀 Fetch data Firebase
  useEffect(() => {
    const purchaseRef = ref(db, "purchases");
    const unsubscribe = onValue(purchaseRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.keys(data).map((key) => ({
          firebaseId: key,
          ...data[key],
        }));
        setPurchaseData(list.reverse());
      } else {
        setPurchaseData([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // ✏ Edit Start
  const startEdit = (item) => {
    if (!isAuthorized) return showMsg("❌ Aapko permission nahi hai","error");
    setEditId(item.firebaseId);
    setEditData({ ...item });
  };

  // Edit Input Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // 💾 Save Update
  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      await update(ref(db, `purchases/${editId}`), editData);
      showMsg("✔ Update Successful!");
      setEditId(null);
    } catch (err) {
      showMsg("❌ Update Failed!", "error");
    }
  };

  // 🗑 Delete Record
  const handleDelete = async (id) => {
    if (!isAuthorized) return showMsg("❌ Permission Denied","error");
    remove(ref(db, `purchases/${id}`));
    showMsg("🗑️ Deleted Successfully!");
  };

  const filteredData = purchaseData.filter(item =>
    item.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <div className="table-header-row">
            <h2 className="table-title">PURCHASE RECORDS 📦</h2>
            <input 
              type="text"
              placeholder="Search..."
              className="table-search-box"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-responsive-wrapper">
            <table className="modern-sales-table">
              <thead>
                <tr>
                  <th>SI</th><th>Date</th><th>Item</th><th>Qty</th>
                  <th>Unit</th><th>Remarks</th><th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item.firebaseId} className={editId === item.firebaseId ? "active-edit-row" : ""}>

                    <td>{index + 1}</td>
                    <td>{item.date}</td>

                    <td>
                      {editId === item.firebaseId
                        ? <input name="item" value={editData.item} onChange={handleEditChange} className="edit-input-field"/>
                        : item.item
                      }
                    </td>

                    <td>
                      {editId === item.firebaseId
                        ? <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input"/>
                        : item.quantity
                      }
                    </td>

                    <td>{item.unit}</td>

                    <td>
                      {editId === item.firebaseId
                        ? <input name="remarks" value={editData.remarks} onChange={handleEditChange} className="edit-input-field"/>
                        : item.remarks
                      }
                    </td>

                    <td>
                      {editId === item.firebaseId ? (
                        <>
                          <button className="save-btn-ui" onClick={handleSave}>💾</button>
                          <button className="cancel-btn-ui" onClick={() => setEditId(null)}>❌</button>
                        </>
                      ) : (
                        <>
                          <button className="row-edit-btn" disabled={!isAuthorized} onClick={() => startEdit(item)}>✏️</button>
                          <button className="row-delete-btn" disabled={!isAuthorized} onClick={() => handleDelete(item.firebaseId)}>🗑️</button>
                        </>
                      )}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>

            {filteredData.length === 0 && (
              <div className="no-records-box">No records found...</div>
            )}
          </div>
        </div>
      </div>

      {/* ⭐ Snackbar */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({...snackbar, open:false})}
      />
    </>
  );
};

export default PurchaseTable;
