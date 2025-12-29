import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar'; 
import axios from 'axios'; // Axios for MySQL
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

  const maskID = (id) => {
    if (!id) return "---";
    const strID = id.toString();
    return strID.length > 4 ? "XXXX" + strID.slice(-4) : strID;
  };

  // --- 1. Fetch All Employees (MySQL) ---
  useEffect(() => {
    if (!isBoss) {
      setLoading(false);
      return;
    }
    const fetchEmployees = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/employees");
        setEmployees(res.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchEmployees();
  }, [isBoss]);

  // --- 2. Auto-load self ledger for staff ---
  useEffect(() => {
    if (!isBoss && user) {
      viewLedger(user);
    }
  }, [isBoss, user]);

  // --- 3. View Specific Ledger Logic ---
  const viewLedger = async (emp) => {
    setFetchingDetail(true);
    setSelectedEmp(emp);
    
    try {
      // Fetch Payment/Advance History
      const payRes = await axios.get(`http://localhost:5000/api/salary/payments/${emp.id}`);
      setPaymentHistory(payRes.data);

      // Fetch Attendance Stats & History
      const attRes = await axios.get(`http://localhost:5000/api/attendance/history/${emp.id}`);
      
      let p = 0, a = 0, h = 0;
      let empHistory = {};
      const currentMonth = new Date().getMonth();

      attRes.data.forEach(rec => {
        const d = new Date(rec.date);
        const dateStr = d.toLocaleDateString('en-CA');
        empHistory[dateStr] = rec.status;

        if (d.getMonth() === currentMonth) {
          if (rec.status === "Present") p++;
          else if (rec.status === "Absent") a++;
          else if (rec.status === "Half-Day") h++;
        }
      });

      setAttendanceStats({ present: p, absent: a, halfDay: h });
      setFullAttendanceData(empHistory);

    } catch (err) { console.error("Ledger Fetch Error:", err); }
    finally { setFetchingDetail(false); }
  };

  const getTileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateStr = date.toLocaleDateString('en-CA'); 
      if (fullAttendanceData[dateStr] === "Present") return 'cal-present';
      if (fullAttendanceData[dateStr] === "Absent") return 'cal-absent';
      if (fullAttendanceData[dateStr] === "Half-Day") return 'cal-halfday';
    }
    return null;
  };

  // --- Financial Calculations (Interlinked) ---
  const totalAdvance = paymentHistory.reduce((sum, p) => sum + Number(p.amount), 0);
  const dailyRate = selectedEmp ? Number(selectedEmp.salary_per_day || 0) : 0;
  // Calculation: (Present * Full Rate) + (Half Day * Half Rate)
  const earnedSalary = Math.round((attendanceStats.present * dailyRate) + (attendanceStats.halfDay * (dailyRate / 2)));
  const netPayable = earnedSalary - totalAdvance;

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!isAuthorized) { alert("Permission denied!"); return; }
    
    try {
      const res = await axios.post('http://localhost:5000/api/salary/advance', {
        employee_id: selectedEmp.id,
        amount: advanceAmount,
        type: 'Advance'
      });

      if (res.data.success) {
        setAdvanceAmount('');
        alert("✅ Advance Added!");
        viewLedger(selectedEmp); // Refresh data
      }
    } catch (err) { alert("Error: " + err.message); }
  };

  if (loading) return <Loader />;

  return (
    <div className="table-container-wide">
      <div className="table-card-wide no-print">
        <h2 className="table-title">
            {isBoss ? "Staff Salary & Attendance Ledger" : "My Payroll Ledger"}
        </h2>
        
        <div className="ledger-main-wrapper">
          {isBoss && (
            <div className="ledger-staff-list">
              <div className="scrollable-box">
                {employees.map(emp => (
                  <div key={emp.id} className={`staff-card-item ${selectedEmp?.id === emp.id ? 'active-ledger' : ''}`} onClick={() => viewLedger(emp)}>
                    <div className="staff-info-mini">
                        <strong>{emp.name}</strong>
                        <div className="masked-id-text">ID: {maskID(emp.username)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedEmp && (
            <div className={`ledger-detail-view ${!isBoss ? 'full-width-ledger' : ''}`}>
              {fetchingDetail ? (
                <div className="detail-fetch-loader"><Loader /><p>Fetching Data...</p></div>
              ) : (
                <>
                  <div className="attendance-summary-bar">
                    <div className="summary-item">Month: <b>{new Date().toLocaleString('default', { month: 'long' })}</b></div>
                    <div className="summary-item green">Present: <b>{attendanceStats.present}</b></div>
                    <div className="summary-item yellow">Half: <b>{attendanceStats.halfDay}</b></div>
                    <button className="view-btn-small" onClick={() => setShowCalendar(true)}>👁️ History</button>
                    <button className="view-btn-small" style={{background: '#2e7d32', color: 'white'}} onClick={() => window.print()}>🖨️ Print</button>
                  </div>

                  <div className="ledger-stats-row">
                    <div className="stat-pill total-salary">Per Day <b>₹{dailyRate}</b></div>
                    <div className="stat-pill balance-due">Earned <b>₹{earnedSalary}</b></div>
                    <div className="stat-pill total-advance">Advance <b>₹{totalAdvance}</b></div>
                    <div className="stat-pill final-pay">Payable <b>₹{netPayable}</b></div>
                  </div>

                  {isAuthorized && (
                    <div className="advance-entry-box">
                       <form onSubmit={handlePayment} className="advance-form-grid">
                          <input type="number" placeholder="Enter Amount" value={advanceAmount} onChange={(e)=>setAdvanceAmount(e.target.value)} required />
                          <button type="submit" className="save-btn-new">SAVE ADVANCE</button>
                       </form>
                    </div>
                  )}

                  <div className="ledger-table-container">
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
                  </div>
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
            <div className="cal-modal-header">
              <h3>History: {selectedEmp.name}</h3>
              <button className="cal-close-btn" onClick={() => setShowCalendar(false)}>&times;</button>
            </div>
            <div className="cal-body">
              <Calendar tileClassName={getTileClassName} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLedger;