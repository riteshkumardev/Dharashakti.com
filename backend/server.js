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
    const { empId, password } = req.body;
    const serverSessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 10);

    try {
        // 👇 Correct Table + Correct Fields
        const [rows] = await db.query(
            `SELECT empId, name, role, password, isBlocked 
             FROM employee_register 
             WHERE empId = ? AND password = ? LIMIT 1`,
            [empId, password]
        );

        // ❌ Invalid Login (Wrong ID or Password)
        if (!rows || rows.length === 0) {
            return res.status(401).json({ success: false, message: "❌ Invalid EmpID or Password" });
        }

        const user = rows[0];

        // 🚫 Blocked Account Check
        if (user.isBlocked === 1) {
            return res.status(403).json({ success: false, message: "🚫 Account Blocked by Admin" });
        }

        // 🟢 Save Session
        await db.query(
            "UPDATE employee_register SET currentSessionId = ? WHERE empId = ?",
            [serverSessionId, user.empId]
        );

        // Sensitive data remove
        delete user.password;

        return res.status(200).json({
            success: true,
            message: "✅ Login Successful",
            user: {
                ...user,
                currentSessionId: serverSessionId,
                loginTime: new Date().toISOString()
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ success: false, message: "⚠ Server / Database Error" });
    }
});



/* ========================= SESSION CHECK ========================= */
app.get('/api/users/status/:empId', async (req, res) => {
  const { empId } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT currentSessionId, isBlocked FROM employee_register WHERE empId = ?',
      [empId]
    );

    if (rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    res.json({
      success: true,
      isBlocked: rows[0].isBlocked === 1,
      currentSessionId: rows[0].currentSessionId
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


/* ========================= DASHBOARD STATS ========================= */
/* ========================= DASHBOARD STATS ========================= */
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [sales] = await db.query("SELECT COUNT(*) AS totalSales FROM sales");
    const [due] = await db.query("SELECT SUM(payment_due) AS totalDue FROM sales");
    const [products] = await db.query("SELECT COUNT(*) AS totalProducts FROM products");
    const [employees] = await db.query("SELECT COUNT(*) AS totalEmployees FROM employee_register");

    res.json({
      success: true,
      totalSales: sales[0]?.totalSales || 0,
      totalDue: due[0]?.totalDue || 0,
      totalProducts: products[0]?.totalProducts || 0,
      totalEmployees: employees[0]?.totalEmployees || 0,
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


// server.js mein ye confirm karein
app.use(express.json({ limit: '50mb' })); // Limit ko thoda aur badha dein 50mb safe hai
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.post("/api/employees", (req, res) => {
    const data = req.body;

    const sql = `INSERT INTO employee_register 
    (empId, name, fatherName, phone, emergency, aadhar, address, role, joinDate, salary, bankName, accountNumber, ifsc, photo, password)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        data.empId, data.name, data.fatherName,
        data.phone, data.emergency, data.aadhar,
        data.address, data.role, data.joinDate,
        data.salary, data.bankName, data.accountNumber,
        data.ifsc, data.photo || null, data.password
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.log("MySQL Error:", err);

            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ success: false, message: "⚠️ Duplicate empId or phone number!" });
            }

            return res.status(500).json({ success: false, message: err.message });
        }

        return res.status(201).json({
            success: true,
            message: "🎉 Employee Registered Successfully!",
            insertedEmpId: data.empId
        });
    });
});



// 🚀 UPDATE EMPLOYEE API
app.put('/api/employees/:id', (req, res) => {
    const employeeId = req.params.id; // URL se ID lein
    const {
        name, phone, role, fatherName, emergency, aadhar, 
        salary, bankName, accountNumber, ifsc, joinDate, 
        address, password, photo
    } = req.body;

    const sql = `UPDATE employee_register SET 
        name = ?, phone = ?, role = ?, fatherName = ?, emergency = ?, 
        aadhar = ?, salary = ?, bankName = ?, accountNumber = ?, 
        ifsc = ?, joinDate = ?, address = ?, password = ?, photo = ? 
        WHERE id = ?`;

    const values = [
        name, phone, role, fatherName || null, emergency || null, 
        aadhar || null, salary || 0, bankName || null, 
        accountNumber || null, ifsc || null, joinDate || null, 
        address || null, password, photo || null, 
        employeeId
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error("Update Error:", err);
            return res.status(500).json({ success: false, message: "Database Update Failed: " + err.message });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.status(200).json({ success: true, message: "Employee updated successfully!" });
    });
});

// 🚀 REGISTER API (With Unique ID Return)



// 🚀 DELETE EMPLOYEE API
app.delete('/api/employees/:id', (req, res) => {
    const id = req.params.id;

    const sql = "DELETE FROM employee_register WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("DB Delete Error:", err);
            return res.status(500).json({ success: false, message: "Database Error: " + err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found." });
        }

        res.json({ success: true, message: "Employee deleted successfully!" });
    });
});
//////////////////////////////////////////////////




// EMPLOYEE LIST API - Sahi table name 'employee_register' use karein
// server.js mein ise check karein
app.get("/api/employees", async (req, res) => {
  try {
    // Sahi table 'employee_register' use karein
    const [rows] = await db.query("SELECT * FROM employee_register ORDER BY id DESC");
    res.json({ success: true, employees: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/api/users/session",(req,res)=>{
  return res.json({ login:false });
});








// 1. Selected Date ki attendance fetch karne ka route
app.get('/api/attendance/:date', (req, res) => {
    const selectedDate = req.params.date;
    const sql = "SELECT * FROM attendance WHERE date = ?";
    
    db.query(sql, [selectedDate], (err, result) => {
        if (err) {
            console.error("Fetch Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json(result); // Ye frontend ko data bhejega
    });
});

// 2. Attendance mark karne ka route
app.post('/api/attendance', (req, res) => {
    const { employee_id, date, status } = req.body;

    // ON DUPLICATE KEY UPDATE: Agar hazri pehle se hai toh update hogi, nahi toh nayi banegi
    const sql = `INSERT INTO attendance (employee_id, date, status) 
                 VALUES (?, ?, ?) 
                 ON DUPLICATE KEY UPDATE status = VALUES(status)`;

    db.query(sql, [employee_id, date, status], (err, result) => {
        if (err) {
            console.error("Post Error:", err);
            return res.status(500).json({ success: false, message: err.message });
        }
        res.status(200).json({ success: true, message: "Attendance Marked!" });
    });
});


////////////// profile photo ////////////////
app.put("/api/profile/update/:empId", async (req, res) => {
  const { empId } = req.params;
  const { name, phone } = req.body;

  try {
    const [update] = await db.query(
      "UPDATE employee_register SET name=?, phone=? WHERE empId=?",
      [name, phone, empId]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Ye hi Snackbar chalu karega 👇
    return res.status(200).json({
      success: true,
      message: "Profile Updated Successfully!"
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message
    });
  }
});





/* ================= CHANGE PASSWORD ================= */
app.put('/api/profile/password/:empId', async (req, res) => {
  const { empId } = req.params;
  const { password } = req.body;

  if (!password || password.length < 4) {
    return res.status(400).json({ success: false, message: "Password must be 4+ characters" });
  }

  try {
    const [result] = await db.query(
      "UPDATE employee_register SET password = ? WHERE empId = ?",
      [password, empId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "User not found!" });
    }

    return res.json({
      success: true,
      message: "🔐 Password updated successfully!"
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
});

app.post("/api/logout/:empId", async (req, res) => {
  const { empId } = req.params;

  try {
    await db.query(
      "UPDATE employee_register SET currentSessionId = NULL WHERE empId = ?",
      [empId]
    );

    res.json({ success: true, message: "🔒 Logged out successfully!" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});
app.get("/api/profile/:empId", async (req, res) => {
  const { empId } = req.params;

  try {
    const [rows] = await db.query(
      "SELECT empId, name, phone, role, photo FROM employee_register WHERE empId = ? LIMIT 1",
      [empId]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user: rows[0] });

  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error", error: err.message });
  }
});
app.post("/api/verify-lock", async (req, res) => {
  const { empId, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT password FROM employee_register WHERE empId = ? LIMIT 1",
      [empId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Password match check
    if (rows[0].password === password) {
      return res.json({ success: true });
    }

    return res.json({ success: false, message: "Wrong password" });

  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});




//////////////////////////////master/////////////////////
app.put("/api/admin/reset-password", async (req, res) => {
  const { empId, newPass, adminName } = req.body;

  if (!empId || !newPass) 
    return res.status(400).json({ success: false, message: "Missing fields" });

  try {
    await db.query("UPDATE employee_register SET password = ? WHERE empId = ?", [newPass, empId]);

    await db.query("INSERT INTO logs (admin_name, action_detail) VALUES (?, ?)",
      [adminName, `Password Reset for EMP: ${empId}`]);

    res.json({ success: true, message: "Password updated" });
  } 
  catch (error) {
    res.status(500).json({ success: false, message: "Error updating password" });
  }
});




// ================== EMPLOYEE LIST ==================

// ================= GET SYSTEM LOGS =================
app.get("/api/logs", async (req, res) => {
  try {
    const [logs] = await db.query("SELECT * FROM system_logs ORDER BY id DESC LIMIT 50");
    res.json(logs);
  } catch (error) {
    res.status(500).json({ success: false, message: "Logs Fetch Error" });
  }
});

app.get('/api/employees', async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM employee_register");

    return res.json(rows); // 👈 JSON fix — Important
  } catch (err) {
    res.status(500).json({ error: "Database error", details: err });
  }
});



// ================= RESET PASSWORD =================

// ================= ADMIN - UPDATE SYSTEM =================
// 🔧 UPDATE ROLE / BLOCK / UNBLOCK
app.put("/api/admin/update-system", async (req, res) => {
  const { empId, field, value, adminName, targetName } = req.body;

  if (!empId || !field) {
    return res.status(400).json({ success: false, message: "Missing Fields" });
  }

  try {
    // Update field in DB
    await db.query(
      `UPDATE employee_register SET ${field} = ? WHERE empId = ?`,
      [value, empId]
    );

    // Save logs
    await db.query(
      "INSERT INTO system_logs (admin_name, action_detail) VALUES (?, ?)",
      [adminName, `${field.toUpperCase()} updated for ${targetName}`]
    );

    return res.json({ success: true, message: "Update Success" });

  } catch (err) {
    console.log("UPDATE ERROR:", err);
    return res.status(500).json({ success: false, message: "Server Error" });
  }
});
