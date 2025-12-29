import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import axios from 'axios'; // Firebase ki jagah Axios
import './AttendancePopup.css';

const AttendancePopup = ({ employeeId, onClose }) => {
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // MySQL se us specific employee ki puri history fetch karein
    const fetchAttendanceHistory = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/attendance/history/${employeeId}`);
        
        const filteredData = {};
        // MySQL data format: [{ date: "2025-12-01", status: "Present" }, ...]
        res.data.forEach(record => {
          // Date format ko "YYYY-MM-DD" mein normalize karein
          const dateStr = record.date.split('T')[0]; 
          filteredData[dateStr] = record.status;
        });
        
        setAttendanceData(filteredData);
      } catch (err) {
        console.error("History fetch failed:", err);
      } finally {
        setLoading(false);
      }
    };

    if (employeeId) {
      fetchAttendanceHistory();
    }
  }, [employeeId]);

  // Calendar ke tiles ko color karne ka function (CSS classes same rahengi)
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // Locale handling ke liye date string generator
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      const dateStr = localDate.toISOString().split('T')[0];

      if (attendanceData[dateStr] === 'Present') return 'bg-success'; // Green
      if (attendanceData[dateStr] === 'Absent') return 'bg-danger';  // Red
      if (attendanceData[dateStr] === 'Half-Day') return 'bg-warning'; // Yellow
    }
  };

  return (
    <div className="attendance-modal-overlay">
      <div className="attendance-modal-content">
        <div className="modal-header">
          <h3>📅 Attendance History</h3>
          <p style={{fontSize: '12px', color: '#666'}}>Employee ID: {employeeId}</p>
          <button onClick={onClose} className="close-btn">&times;</button>
        </div>
        
        <div className="calendar-container">
          {loading ? (
            <p>Loading History...</p>
          ) : (
            <Calendar tileClassName={tileClassName} />
          )}
        </div>

        <div className="legend">
          <span className="dot green"></span> Present 
          <span className="dot red"></span> Absent
          <span className="dot yellow"></span> Half-Day
        </div>
      </div>
    </div>
  );
};

export default AttendancePopup;