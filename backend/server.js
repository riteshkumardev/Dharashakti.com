const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();



// server.js ke top par
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/** * ✅ CONFIGURATION & SECURITY 
 * Photo (Base64) upload ke liye 50MB limit zaroori hai.
 */
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

/** * 🏠 ROOT ROUTE
 */
app.get('/', (req, res) => {
  res.send("Dharashakti Backend is Running!");
});

/** * 🔑 AUTHENTICATION & SESSION MANAGEMENT
 */
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const sessionId = Math.random().toString(36).substring(7);

  try {
    const [rows] = await db.query('SELECT * FROM employees WHERE username = ? AND password = ?', [username, password]);
    
    if (rows.length > 0) {
      const user = rows[0];
      if (user.isBlocked) {
        return res.status(403).json({ success: false, message: "Your account is blocked!" });
      }

      await db.query('UPDATE employees SET currentSessionId = ? WHERE id = ?', [sessionId, user.id]);
      
      res.json({ 
        success: true, 
        user: { ...user, currentSessionId: sessionId } 
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid ID or Password" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/users/session-check/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT currentSessionId, isBlocked FROM employees WHERE id = ?', [id]);
    if (rows.length > 0) {
      res.json({ 
        activeSessionId: rows[0].currentSessionId,
        isBlocked: rows[0].isBlocked === 1 
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** * 📝 REGISTRATION & EMPLOYEE CONTROL
 */
app.post('/api/register-admin', async (req, res) => {
  const { name, email, phone, aadhar, password, photo } = req.body;
  const generatedId = Math.floor(10000000 + Math.random() * 90000000).toString();

  try {
    const query = `INSERT INTO employees (name, email, phone, aadhar, username, password, photo, role, isBlocked) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin', 0)`;
    await db.query(query, [name, email, phone, aadhar, generatedId, password, photo]);
    res.json({ success: true, employeeId: generatedId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.sqlMessage || error.message });
  }
});

app.post('/api/employees/register', async (req, res) => {
  const data = req.body;
  let employeeId = Math.floor(10000000 + Math.random() * 90000000).toString();
  const role = (data.designation === "Admin" || data.designation === "Manager") ? data.designation : "Worker";

  try {
    const query = `INSERT INTO employees 
      (username, name, father_name, phone, emergency_phone, aadhar, address, designation, role, joining_date, salary_per_day, bank_name, account_no, ifsc_code, photo, password, isBlocked) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`;
    
    await db.query(query, [
      employeeId, data.name, data.fatherName, data.phone, data.emergencyPhone, 
      data.aadhar, data.address, data.designation, role, data.joiningDate, 
      data.salary, data.bankName, data.accountNo, data.ifscCode, data.photo, data.password
    ]);
    res.json({ success: true, employeeId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, username, role, photo, isBlocked FROM employees');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: "Employee deleted" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** * 📅 ATTENDANCE & PAYROLL
 */
app.post('/api/attendance', async (req, res) => {
  const { employee_id, date, status } = req.body;
  try {
    const query = `INSERT INTO attendance (employee_id, date, status) 
                   VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status)`;
    await db.query(query, [employee_id, date, status]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/attendance/history/:empId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT date, status FROM attendance WHERE employee_id = ? ORDER BY date DESC', [req.params.empId]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/salary/advance', async (req, res) => {
  const { employee_id, amount, type } = req.body;
  const date = new Date().toISOString().split('T')[0];
  try {
    await db.query('INSERT INTO salary_payments (employee_id, amount, date, type) VALUES (?, ?, ?, ?)', [employee_id, amount, date, type]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** * 💰 SALES, PURCHASES & FINANCE
 */
app.get('/api/sales/next-si', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT MAX(si) as lastSi FROM sales');
    res.json({ nextSi: (rows[0].lastSi || 0) + 1 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sales', async (req, res) => {
  const d = req.body;
  try {
    const query = `INSERT INTO sales (date, customer_name, product_name, bill_no, quantity, rate, total_amount, amount_received, payment_due, remarks, bill_due_date, si) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
    await db.query(query, [d.date, d.customerName, d.productName, d.billNo, d.quantity, d.rate, d.totalPrice, d.amountReceived, d.paymentDue, d.remarks, d.billDueDate, d.si]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/finance/profit-loss', async (req, res) => {
  try {
    const [[s], [p], [e]] = await Promise.all([
      db.query('SELECT SUM(total_amount) as total FROM sales'),
      db.query('SELECT SUM(total_amount) as total FROM purchases'),
      db.query('SELECT SUM(amount) as total FROM expenses')
    ]);
    res.json({ 
      sales: Number(s[0].total || 0), 
      purchases: Number(p[0].total || 0), 
      expenses: Number(e[0].total || 0) 
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** * 📊 REPORTS & DASHBOARD
 */
app.get('/api/reports/:category', async (req, res) => {
  const { category } = req.params;
  let q = "";
  if (category === "sales") q = "SELECT * FROM sales ORDER BY date DESC";
  else if (category === "purchases") q = "SELECT * FROM purchases ORDER BY date DESC";
  else if (category === "stock") q = "SELECT * FROM products";
  else return res.status(400).json({ message: "Invalid category" });

  try {
    const [rows] = await db.query(q);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [[s], [p]] = await Promise.all([
      db.query('SELECT COUNT(*) as c FROM sales'),
      db.query('SELECT COUNT(*) as c FROM products')
    ]);
    res.json({ totalSales: s[0].c, totalProducts: p[0].c });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/** * 🛡️ MASTER CONTROL (LOGS & SYSTEM UPDATES)
 */
app.get('/api/logs', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 50');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/update-system', async (req, res) => {
  const { targetId, field, value, adminName, targetName } = req.body;
  try {
    await db.query(`UPDATE employees SET ${field} = ? WHERE id = ?`, [value, targetId]);
    await db.query('INSERT INTO activity_logs (admin_name, action_detail) VALUES (?, ?)', 
      [adminName, `${field.toUpperCase()} updated for ${targetName}`]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// 🚀 SERVER START
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Dharashakti Server running on port ${PORT}`);
});
