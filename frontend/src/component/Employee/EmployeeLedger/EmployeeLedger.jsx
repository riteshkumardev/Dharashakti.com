import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; 
import axios from 'axios';
import 'react-calendar/dist/Calendar.css';
import './EmployeeLedger.css';
import Loader from "../../Core_Component/Loader/Loader";

const EmployeeLedger = ({ role, user }) => {

  const isAuthorized = role === "Admin" || role === "Accountant";
  const isBoss = role === "Admin" || role === "Manager";

  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, halfDay: 0 });
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [fullAttendanceData, setFullAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [fetchingDetail, setFetchingDetail] = useState(false);

  // 👇 ID Mask (UI safe)
  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // 📌 FIX: Fetch All Employees (Ensure array)
  useEffect(() => {
    if (!isBoss) {
      setLoading(false);
      return;
    }
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/employees");

        // 🔥 FIX: ensure employees is always an array
        if (res.data?.employees) setEmployees(res.data.employees);
        else if (Array.isArray(res.data)) setEmployees(res.data);
        else setEmployees([]);

      } catch (err) {
        console.log("Fetch employees error:", err.message);
      }
      finally { setLoading(false); }
    };
    fetchEmployees();
  }, [isBoss]);

  // AUTO LOAD SELF LEDGER FOR STAFF
  useEffect(() => {
    if (!isBoss && user) {
      viewLedger(user);
    }
  }, [isBoss, user]);


  // 📌 VIEW LEDGER (Fetch salary, attendance, payments)
  const viewLedger = async (emp) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);

    try {
      const payRes = await axios.get(`http://localhost:5000/api/salary/payments/${emp.id}`);
      const attRes = await axios.get(`http://localhost:5000/api/attendance/history/${emp.id}`);

      // 🟢 Fix Payments (Always array)
      const payments = Array.isArray(payRes.data?.payments)
        ? payRes.data.payments
        : Array.isArray(payRes.data)
        ? payRes.data
        : [];

      setPaymentHistory(payments);

      // 🟢 Attendance Stats
      let p = 0, a = 0, h = 0, empHistory = {};
      const currentMonth = new Date().getMonth();
      const attData = attRes.data?.attendance || attRes.data || [];

      attData.forEach(rec => {
        const d = new Date(rec.date);
        const dateStr = d.toLocaleDateString('en-CA');
        empHistory[dateStr] = rec.status;

        if (d.getMonth() === currentMonth) {
          if (rec.status === "Present") p++;
          if (rec.status === "Absent") a++;
          if (rec.status === "Half-Day") h++;
        }
      });

      setAttendanceStats({ present: p, absent: a, halfDay: h });
      setFullAttendanceData(empHistory);

    } catch (err) {
      console.log("Ledger fetch error:", err.message);
    }
    finally { setFetchingDetail(false); }
  };


  // 🧮 SALARY / ADVANCE / PAYABLE CALCULATIONS
  const dailyRate = Number(
    selectedEmp?.salary_per_day ||
    selectedEmp?.salary ||
    selectedEmp?.perDaySalary ||
    0
  );

  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const earnedSalary = Math.round(
    (attendanceStats.present * dailyRate) + 
    (attendanceStats.halfDay * (dailyRate / 2))
  );
  const netPayable = earnedSalary - totalAdvance;


  // 💵 SAVE ADVANCE PAYMENT
  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized) return alert("Permission denied!");

    try {
      const res = await axios.post('http://localhost:5000/api/salary/advance', {
        employee_id: selectedEmp.id,
        amount: advanceAmount,
        type: 'Advance'
      });

      if (res.data.success) {
        setAdvanceAmount('');
        alert("✅ Advance Saved!");
        viewLedger(selectedEmp);
      }

    } catch (err) {
      alert("Error Saving Advance: " + err.message);
    }
  };


  const getTileClassName = ({ date }) => {
    const dateStr = date.toLocaleDateString('en-CA');
    if (fullAttendanceData[dateStr] === "Present") return 'cal-present';
    if (fullAttendanceData[dateStr] === "Absent") return 'cal-absent';
    if (fullAttendanceData[dateStr] === "Half-Day") return 'cal-halfday';
    return null;
  };


  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide no-print">
        <h2 className="table-title">
          {isBoss ? "Staff Salary & Attendance Ledger" : "My Payroll Ledger"}
        </h2>
        
        <div className="ledger-main-wrapper">

          {/* LEFT PANEL - EMPLOYEE LIST */}
          {isBoss && (
            <div className="ledger-staff-list">
              <div className="scrollable-box">
                {employees.map(emp => (
                  <div key={emp.id}
                    className={`staff-card-item ${selectedEmp?.id === emp.id ? 'active-ledger' : ''}`}
                    onClick={() => viewLedger(emp)}
                  >
                    <strong>{emp.name}</strong>
                    <div className="masked-id-text">ID: {maskID(emp.empId || emp.username)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* RIGHT PANEL - LEDGER DETAIL */}
          {selectedEmp && (
            <div className={`ledger-detail-view ${!isBoss ? 'full-width-ledger' : ''}`}>
              {fetchingDetail ? (
                <div className="detail-fetch-loader"><Loader /><p>Loading...</p></div>
              ) : (
                <>
                  {/* SUMMARY BAR */}
                  <div className="attendance-summary-bar">
                    <div>Month: <b>{new Date().toLocaleString('default', { month: 'long' })}</b></div>
                    <div className="green">P: <b>{attendanceStats.present}</b></div>
                    <div className="yellow">H: <b>{attendanceStats.halfDay}</b></div>
                    <button className="view-btn-small" onClick={() => setShowCalendar(true)}>📅 View</button>
                    <button className="view-btn-small" style={{background:'#2e7d32',color:'#fff'}} onClick={() => window.print()}>🖨 Print</button>
                  </div>

                  {/* SALARY CARD */}
                  <div className="ledger-stats-row">
                    <div className="stat-pill total-salary">Per Day: <b>₹{dailyRate}</b></div>
                    <div className="stat-pill balance-due">Earned: <b>₹{earnedSalary}</b></div>
                    <div className="stat-pill total-advance">Advance: <b>₹{totalAdvance}</b></div>
                    <div className="stat-pill final-pay">Payable: <b>₹{netPayable}</b></div>
                  </div>

                  {/* SAVE ADVANCE */}
                  {isAuthorized && (
                    <form onSubmit={handlePayment} className="advance-form-grid">
                      <input type="number" placeholder="Enter Amount"
                        value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} required />
                      <button type="submit" className="save-btn-new">Save Advance</button>
                    </form>
                  )}

                  {/* PAYMENT HISTORY */}
                  <table className="modern-sales-table">
                    <thead><tr><th>Date</th><th>Type</th><th>Amount</th></tr></thead>
                    <tbody>
                      {paymentHistory.map(pay => (
                        <tr key={pay.id}>
                          <td>{new Date(pay.date).toLocaleDateString()}</td>
                          <td>{pay.type}</td>
                          <td className="amount-text-red">₹{pay.amount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CALENDAR MODAL */}
      {showCalendar && (
        <div className="cal-modal-overlay">
          <div className="cal-modal-content">
            <h3>History: {selectedEmp?.name}</h3>
            <button className="cal-close-btn" onClick={() => setShowCalendar(false)}>×</button>
            <Calendar tileClassName={getTileClassName} />
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;
