const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/', (req, res) => {
  res.send("🚀 Dharashakti Backend is Running!");
});

/* ========================= LOGIN ========================= */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const serverSessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);

    try {
        const [rows] = await db.query(
            'SELECT id, name, role, password, isBlocked FROM employees WHERE id = ? AND password = ? LIMIT 1',
            [username, password]
        );

        if (!rows || rows.length === 0) {
            return res.status(401).json({ success: false, message: "❌ Invalid ID or Password" });
        }

        const user = rows[0];

        if (user.isBlocked === 1) {
            return res.status(403).json({ success: false, message: "🚫 Account Blocked by Admin" });
        }

        await db.query('UPDATE employees SET currentSessionId = ? WHERE id = ?', [serverSessionId, user.id]);
        delete user.password;

        res.json({
            success: true,
            message: "✅ Login Successful",
            user: { ...user, currentSessionId: serverSessionId, loginTime: new Date().toISOString() }
        });

    } catch (err) {
        return res.status(500).json({ success: false, message: "⚠ Server / Database Error" });
    }
});


/* ========================= SESSION CHECK ========================= */
app.get('/api/users/session-check/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT currentSessionId, isBlocked FROM employees WHERE id = ?', [id]);

    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      currentSessionId: rows[0].currentSessionId,
      isBlocked: rows[0].isBlocked === 1
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


/* ========================= DASHBOARD STATS ========================= */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [sales] = await db.query("SELECT COUNT(*) AS totalSales FROM sales");
    const [due] = await db.query("SELECT SUM(payment_due) AS totalDue FROM sales");
    const [products] = await db.query("SELECT COUNT(*) AS totalProducts FROM products");
    const [employees] = await db.query("SELECT COUNT(*) AS totalEmployees FROM employees");

    res.json({
      success: true,
      totalSales: sales[0].totalSales || 0,
      totalDue: due[0].totalDue || 0,
      totalProducts: products[0].totalProducts || 0,
      totalEmployees: employees[0].totalEmployees || 0,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


/* ========================= SALES ========================= */
app.get('/api/sales/next-si', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT MAX(si) AS lastSi FROM sales");
    res.json({ success: true, nextSi: (rows[0].lastSi || 0) + 1 });
  } catch {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get('/api/sales', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM sales ORDER BY id DESC");
    res.json({ success: true, sales: rows });
  } catch {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

app.post('/api/sales', async (req, res) => {
  const d = req.body;

  try {
    const query = `
      INSERT INTO sales 
      (date, customer_name, product_name, bill_no, quantity, rate, total_amount, amount_received, payment_due, remarks, bill_due_date, si) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await db.query(query, [
      d.date, 
      d.customerName, 
      d.productName, 
      d.billNo, 
      d.quantity, 
      d.rate, 
      d.totalPrice, 
      d.amountReceived, 
      d.paymentDue, 
      d.remarks, 
      d.billDueDate, 
      d.si
    ]);

    res.json({ success: true, message: "Sale saved successfully!" });

  } catch (err) {
    console.error("SQL Error:", err);
    res.status(500).json({ success: false, message: "Database error: " + err.message });
  }
});
        

app.put("/api/sales/:id", async (req, res) => {
  const { id } = req.params;

  const {
    date, billNo, productName, customerName,
    quantity, rate, totalPrice, amountReceived,
    paymentDue, billDueDate, remarks
  } = req.body;

  try {
    const sql = `
      UPDATE sales SET 
        date = ?, 
        bill_no = ?, 
        product_name = ?, 
        customer_name = ?, 
        quantity = ?, 
        rate = ?, 
        total_amount = ?, 
        amount_received = ?, 
        payment_due = ?, 
        bill_due_date = ?, 
        remarks = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      date, billNo, productName, customerName,
      quantity, rate, totalPrice, amountReceived,
      paymentDue, billDueDate, remarks, id
    ]);

    res.json({ success: true, message: "Sale Updated Successfully!" });

  } catch (err) {
    console.error("UPDATE ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});


app.delete("/api/sales/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM sales WHERE id=?", [req.params.id]);
    res.json({ success: true, message: "Record Deleted" });
  } catch {
    res.status(500).json({ success: false, message: "Delete Failed" });
  }
});


/* ========================= STOCKS ========================= */
// 📌 ADD STOCK (INSERT NEW STOCK)
// 📌 GET STOCK LIST (FINAL)
app.get("/api/stocks", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM stocks ORDER BY id DESC");
    return res.json({ success: true, stock: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/stocks", async (req, res) => {
  const {
    date,
    supplierName,
    productName, // this will insert as "item"
    billNo,
    quantity,
    rate,
    totalAmount,
    paidAmount,
    balanceAmount,
    remarks,
    unit // optional (dropdown se aayega)
  } = req.body;

  try {
    const sql = `
      INSERT INTO stocks 
      (date, supplierName, item, billNo, quantity, rate, totalAmount, paidAmount, balanceAmount, remarks, updatedDate, unit)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    await db.query(sql, [
      date,
      supplierName,
      productName, // 👈 item column me jaayega
      billNo,
      quantity,
      rate,
      totalAmount,
      paidAmount,
      balanceAmount,
      remarks,
      new Date().toISOString().split("T")[0], // updatedDate
      unit || "kg" // default agar kuch na bheje
    ]);

    return res.json({
      success: true,
      message: "📦 Stock Added Successfully!"
    });

  } catch (error) {
    console.error("❌ Stock Insert Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});


app.put("/api/stocks/:id", async (req, res) => {
  const { id } = req.params;
  const d = req.body;
  try {
    await db.query(`
      UPDATE stocks SET item=?, quantity=?, unit=?, remarks=?, updatedDate=? WHERE id=?
    `, [d.item, d.quantity, d.unit, d.remarks, d.updatedDate, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete("/api/stocks/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM stocks WHERE id=?", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


/* ========================= PURCHASES ========================= */
app.post("/api/purchases", async (req, res) => {
  const {
    date, supplierName, productName, billNo,
    quantity, rate, totalAmount, paidAmount,
    balanceAmount, remarks
  } = req.body;

  try {
    await db.query(`
      INSERT INTO purchases (date, supplierName, productName, billNo, quantity, rate, totalAmount, paidAmount, balanceAmount, remarks)
      VALUES (?,?,?,?,?,?,?,?,?,?)
    `, [date, supplierName, productName, billNo, quantity,
        rate, totalAmount, paidAmount, balanceAmount, remarks]);

    res.json({ success: true, message: "Purchase Saved Successfully!" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});


/* ========================= SERVER START ========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Dharashakti Server running on port ${PORT}`);
});




// EMPLOYEE REGISTER API
app.post("/api/employee/register", async (req, res) => {
  const { name, phone, role } = req.body;
  if (!name || !phone || !role) {
    return res.status(400).json({success:false, message:"Required fields missing: name, phone, role"});
  }

  const employeeId = Math.floor(10000000 + Math.random() * 90000000);
  await db.query(
    "INSERT INTO employees (employee_id, name, phone, role) VALUES (?,?,?,?)",
    [employeeId, name, phone, role]
  );

  res.json({ success: true, employeeId });
});











// EMPLOYEE LIST API
app.get("/api/employees", async (req, res) => {
  const db = require("./db");

  try {
    const [rows] = await db.query("SELECT * FROM employees ORDER BY id DESC");
    res.json({ success: true, employees: rows });
  } catch (err) {
    console.error("Fetch Employee Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/users/status/:id", async (req, res) => {
  const db = require("./db");
  const userId = req.params.id;

  try {
    const [rows] = await db.query(
      "SELECT employee_id, name, role FROM admins WHERE employee_id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: rows[0],
      status: "active"
    });

  } catch (err) {
    console.error("Status Check Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
})

