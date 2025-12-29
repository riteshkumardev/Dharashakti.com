import React, { useState, useEffect } from 'react';
import './Purchase.css';
import { getDatabase, ref, onValue, remove, update } from "firebase/database";
import { app } from "../../redux/api/firebase/firebase";
import Loader from '../Core_Component/Loader/Loader';

// 👈 role prop add kiya gaya hai
const PurchaseTable = ({ role }) => {
  const db = getDatabase(app);
  
  // 🔐 Permission Check: Sirf Admin aur Accountant edit/delete kar sakte hain
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [purchaseData, setPurchaseData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // --- Edit States ---
  const [editId, setEditId] = useState(null); 
  const [editData, setEditData] = useState({}); 

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

  // ✏️ Edit Start with Guard
  const startEdit = (item) => {
    if (!isAuthorized) {
      alert("Aapko edit karne ki permission nahi hai.");
      return;
    }
    setEditId(item.firebaseId);
    setEditData({ ...item });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Save with Guard
  const handleSave = async () => {
    if (!isAuthorized) return;
    try {
      await update(ref(db, `purchases/${editId}`), editData);
      alert("Update Successful!");
      setEditId(null);
    } catch (err) {
      alert("Error updating: " + err.message);
    }
  };

  // 🗑️ Delete with Guard
  const handleDelete = (id) => {
    if (!isAuthorized) {
      alert("Aapko delete karne ki permission nahi hai.");
      return;
    }
    if (window.confirm("Are you sure you want to delete?")) {
      remove(ref(db, `purchases/${id}`));
    }
  };

  const filteredData = purchaseData.filter(item =>
    item.item?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.remarks?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide">
        <div className="table-header-row">
          <h2 className="table-title">PURCHASE RECORDS</h2>
          <input 
            type="text" 
            placeholder="Search Item..." 
            className="table-search-box"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-responsive-wrapper">
          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>SI</th>
                <th>Date</th>
                <th>Item Name</th>
                <th>Qty</th>
                <th>Unit</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((item, index) => (
                <tr key={item.firebaseId} className={editId === item.firebaseId ? "active-edit" : ""}>
                  <td>{index + 1}</td>
                  <td>{item.date}</td>
                  
                  <td>
                    {editId === item.firebaseId ? 
                      <input name="item" value={editData.item} onChange={handleEditChange} className="edit-input-field" /> 
                      : item.item}
                  </td>
                  <td>
                    {editId === item.firebaseId ? 
                      <input type="number" name="quantity" value={editData.quantity} onChange={handleEditChange} className="edit-input-field small-input" /> 
                      : item.quantity}
                  </td>
                  <td>{item.unit}</td>
                  <td>
                    {editId === item.firebaseId ? 
                      <input name="remarks" value={editData.remarks} onChange={handleEditChange} className="edit-input-field" /> 
                      : item.remarks}
                  </td>

                  <td className="action-btns-cell">
                    {editId === item.firebaseId ? (
                      <>
                        <button className="save-btn-ui" onClick={handleSave}>💾 Save</button>
                        <button className="cancel-btn-ui" onClick={() => setEditId(null)}>✖</button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="row-edit-btn" 
                          onClick={() => startEdit(item)}
                          disabled={!isAuthorized}
                          title={!isAuthorized ? "Permission Required" : "Edit"}
                          style={{ 
                            opacity: isAuthorized ? 1 : 0.5, 
                            cursor: isAuthorized ? "pointer" : "not-allowed" 
                          }}
                        >✏️</button>
                        
                        <button 
                          className="row-delete-btn" 
                          onClick={() => handleDelete(item.firebaseId)}
                          disabled={!isAuthorized}
                          title={!isAuthorized ? "Permission Required" : "Delete"}
                          style={{ 
                            opacity: isAuthorized ? 1 : 0.5, 
                            cursor: isAuthorized ? "pointer" : "not-allowed" 
                          }}
                        >🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PurchaseTable;