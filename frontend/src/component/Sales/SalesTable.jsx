import React, { useState, useEffect } from "react";
import axios from "axios";
import "./Sales.css";
import Loader from "../Core_Component/Loader/Loader";
import CustomSnackbar from "../Core_Component/Snackbar/CustomSnackbar";

const SalesTable = ({ role }) => {
  const isAuthorized = role === "Admin" || role === "Accountant";

  const [salesList, setSalesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  // 🔔 Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const showMsg = (msg, type = "success") => {
    setSnackbar({ open: true, message: msg, severity: type });
    setTimeout(() => {
      setSnackbar((prev) => ({ ...prev, open: false }));
    }, 2500);
  };

  // 🔄 GET Sales
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/sales");
        setSalesList(res.data.sales || []);
      } catch (e) {
        showMsg("Server Error ❌ Data fetch nahi ho paya", "error");
      }
      setLoading(false);
    };
    fetchSales();
  }, []);

  // ✏️ Edit Start
  const startEdit = (sale) => {
    if (!isAuthorized) return showMsg("Permission Denied ❌", "error");

    setEditId(sale.id);
    setEditData({
      id: sale.id,
      date: sale.date?.substring(0,10),
      billNo: sale.bill_no,
      productName: sale.product_name,
      customerName: sale.customer_name,
      quantity: sale.quantity,
      rate: sale.rate,
      totalPrice: sale.total_amount,
      amountReceived: sale.amount_received,
      paymentDue: sale.payment_due,
      billDueDate: sale.bill_due_date?.substring(0,10),
      remarks: sale.remarks,
    });
  };

  // 🔢 Recalculate values live
  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...editData, [name]: value };

    updated.totalPrice = (Number(updated.quantity) || 0) * (Number(updated.rate) || 0);
    updated.paymentDue = updated.totalPrice - (Number(updated.amountReceived) || 0);

    setEditData(updated);
  };

  // 💾 Save Update
  const handleSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/sales/${editId}`, editData);

      setSalesList(salesList.map((s) => s.id === editId ? {
        ...s,
        date: editData.date,
        bill_no: editData.billNo,
        product_name: editData.productName,
        customer_name: editData.customerName,
        quantity: editData.quantity,
        rate: editData.rate,
        total_amount: editData.totalPrice,
        amount_received: editData.amountReceived,
        payment_due: editData.paymentDue,
        bill_due_date: editData.billDueDate,
        remarks: editData.remarks,
      } : s));

      setEditId(null);
      showMsg("Record Updated Successfully ✔", "success");

    } catch {
      showMsg("Update Failed ❌ Server Error", "error");
    }
  };

  // 🗑 Delete Record
  const handleDelete = async (id) => {
    if (!isAuthorized) return showMsg("Permission Denied ❌", "error");

    try {
      await axios.delete(`http://localhost:5000/api/sales/${id}`);
      setSalesList(salesList.filter((r) => r.id !== id));
      showMsg("Record Deleted 🗑️", "success");
    } catch {
      showMsg("Delete Error ❌", "error");
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <div className="table-container-wide">
        <div className="table-card-wide">
          <h2 className="table-title">SALES RECORDS 📑</h2>

          <table className="modern-sales-table">
            <thead>
              <tr>
                <th>SI</th><th>Date</th><th>Bill</th><th>Product</th><th>Customer</th>
                <th>Qty</th><th>Rate</th><th>Total</th><th>Recv</th><th>Due</th>
                <th>Due Date</th><th>Remark</th><th>Action</th>
              </tr>
            </thead>

            <tbody>
              {salesList.map((sale) => (
                <tr key={sale.id} className={editId === sale.id ? "active-edit" : ""}>
                  
                  <td>{sale.si}</td>

                  <td>
                    {editId === sale.id ? (
                      <input type="date" name="date" value={editData.date} onChange={handleChange}/>
                    ) : sale.date?.substring(0, 10)}
                  </td>

                  <td>{editId === sale.id ? <input name="billNo" value={editData.billNo} onChange={handleChange}/> : sale.bill_no}</td>
                  <td>{editId === sale.id ? <input name="productName" value={editData.productName} onChange={handleChange}/> : sale.product_name}</td>
                  <td>{editId === sale.id ? <input name="customerName" value={editData.customerName} onChange={handleChange}/> : sale.customer_name}</td>
                  <td>{editId === sale.id ? <input name="quantity" type="number" value={editData.quantity} onChange={handleChange}/> : sale.quantity}</td>
                  <td>{editId === sale.id ? <input name="rate" type="number" value={editData.rate} onChange={handleChange}/> : "₹"+sale.rate}</td>
                  <td>₹{editId === sale.id ? editData.totalPrice : sale.total_amount}</td>
                  <td>{editId === sale.id ? <input name="amountReceived" type="number" value={editData.amountReceived} onChange={handleChange}/> : sale.amount_received}</td>
                  <td className="danger-text">₹{editId === sale.id ? editData.paymentDue : sale.payment_due}</td>
                  <td>{editId === sale.id ? <input name="billDueDate" type="date" value={editData.billDueDate} onChange={handleChange}/> : sale.bill_due_date?.substring(0,10)}</td>
                  <td>{editId === sale.id ? <input name="remarks" value={editData.remarks} onChange={handleChange}/> : sale.remarks}</td>

                  <td>
                    {editId === sale.id ? (
                      <>
                        <button onClick={handleSave}>💾</button>
                        <button onClick={() => setEditId(null)}>❌</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(sale)} disabled={!isAuthorized}>✏️</button>
                        <button onClick={() => handleDelete(sale.id)} disabled={!isAuthorized}>🗑️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </div>

      {/* ⭐ Snackbar UI */}
      <CustomSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      />
    </>
  );
};

export default SalesTable;
