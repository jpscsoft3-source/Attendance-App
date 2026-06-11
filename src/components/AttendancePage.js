
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  limit,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import "./AttendancePage.css";

export default function AttendancePage() {
  const [employeeID, setEmployeeID] = useState("");
const [employeeData, setEmployeeData] = useState({ name: "NA", Role: "NA" });
const [employeeSalary, setEmployeeSalary] = useState(0); // ✅ Add this
const [submitting, setSubmitting] = useState(false);
const [message, setMessage] = useState("");
const [lastStatus, setLastStatus] = useState(null);
const [currentTime, setCurrentTime] = useState(formatTime());
const [isManager, setIsManager] = useState(false);
const [todayDocId, setTodayDocId] = useState(null);
const [selectedSection, setSelectedSection] = useState("");
const [dailyAttendance, setDailyAttendance] = useState([]);
const [monthlySummary, setMonthlySummary] = useState([]);
const [showSalary, setShowSalary] = useState(false);
const [salaryDetails, setSalaryDetails] = useState(null);
const [location, setLocation] = useState(null);
const [address, setAddress] = useState("");
const [empID, setEmpID] = useState("");
const [todayAttendance, setTodayAttendance] = useState(null);

  const navigate = useNavigate();

  // Format time
  function formatTime(date = new Date()) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  }
  const offices = [
  {
    name: "JPSCUBE Engineers, Shah Industrial Estate-2, Kotambi, Vadodara",
    lat: 22.41009108171941,
    lon: 73.30118368566995
  },
  {
    name: "ECS Industries Pvt. Ltd. - 1 (Medium Voltage Division), Makarpura GIDC, Vadodara",
    lat: 22.24859941335464,
    lon: 73.17827168033016
  }
];

const officeRadius = 50; // meters

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(formatTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
useEffect(() => {
  if (!navigator.geolocation) return;

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      setLocation({
        lat,
        lon,
        mapLink: `https://www.google.com/maps?q=${lat},${lon}`
      });

      let matchedOffice = null;

      for (let office of offices) {
        const distance = getDistance(lat, lon, office.lat, office.lon);

        if (distance <= officeRadius) {
          matchedOffice = office.name;
          break;
        }
      }

      if (matchedOffice) {
        setAddress(matchedOffice);
      } else {
        setAddress(`(Latitude: ${lat}, Longitude: ${lon})`);
      }
    },
    (error) => {
      console.error("Location error:", error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );

  // cleanup when component unmounts
  return () => navigator.geolocation.clearWatch(watchId);

}, []);

useEffect(() => {
  if (!empID) return;

  const now = new Date();
  fetchDailyAttendance(empID, now.getFullYear(), now.getMonth());
}, [empID]);

  useEffect(() => {
    const fetchEmployeeData = async () => {
      const username = localStorage.getItem("username");
      if (!username) {
        setMessage("❌ No user logged in.");
        return;
      }

      try {
        const q = query(collection(db, "Users"), where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
        const docSnap = querySnapshot.docs[0];

        setEmployeeID(docSnap.id);   // existing
        setEmpID(docSnap.id);        // ✅ ADD THIS LINE

        const data = docSnap.data();

          setEmployeeData({
            name: data.Name || "NA",
            Role: data.Role || "NA",
          });
          setEmployeeSalary(data.salary || 0); // ✅ save salary

          setIsManager(data.Role === "manager");
          fetchTodayAttendance(docSnap.id);
          fetchDailyAttendance(docSnap.id);
          fetchMonthlySummary(docSnap.id);
        } else {
          setMessage("⚠️ User not found. Displaying fallback info.");
          setEmployeeData({ name: "NA", Role: "NA" });
        }
      } catch (err) {
        console.error("Error fetching employee:", err);
        setMessage("❌ Error fetching employee data.");
        setEmployeeData({ name: "NA", Role: "NA" });
      }
    };

    fetchEmployeeData();
  }, []);

  
  // Fetch today's attendance
  const fetchTodayAttendance = async (empID) => {
    try {
      const todayDate = new Date().toLocaleDateString();
      const q = query(
        collection(db, "attendance"),
        where("employee_id", "==", empID),
        where("date", "==", todayDate),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setTodayDocId(docSnap.id);
        const data = docSnap.data();

setTodayAttendance(data); // ✅ store today's attendance

setLastStatus(
  `In: ${data.in_time || "❌ Not Marked"}, Out: ${data.out_time || "❌ Not Marked"}`
);
      } else {
        setTodayDocId(null);
      }
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
    }
  };

  const fetchDailyAttendance = async (empID, year, month) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("employee_id", "==", empID)
    );

    const snapshot = await getDocs(q);

    if (!snapshot.empty) {

      const startOfMonth = new Date(year, month, 1);
      const startOfNextMonth = new Date(year, month + 1, 1);

      const records = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();

          const timestamp = data.timestamp?.toDate
            ? data.timestamp.toDate()
            : new Date(data.timestamp || 0);

          let status = "pending";
          if (data.statusIn && data.statusOut) {
            status =
              data.statusIn === "approved" && data.statusOut === "approved"
                ? "approved"
                : "pending";
          } else if (data.status) {
            status = data.status;
          }

          return {
            date: data.date || "NA",
            in_time: data.in_time || "❌ Not Marked",
            out_time: data.out_time || "❌ Not Marked",
            status,
            timestamp,
          };
        })
        .filter(
          (rec) =>
            rec.timestamp >= startOfMonth &&
            rec.timestamp < startOfNextMonth
        )
        .sort((a, b) => b.timestamp - a.timestamp);

      setDailyAttendance(records);
    }
  } catch (err) {
    console.error("Error fetching daily attendance:", err);
  }
};
const hasInTime =
  todayAttendance?.in_time && todayAttendance?.in_time !== "WeeklyOff";

const hasOutTime =
  todayAttendance?.out_time && todayAttendance?.out_time !== "WeeklyOff";

const isWeeklyOffToday =
  todayAttendance?.in_time === "WeeklyOff" ||
  todayAttendance?.out_time === "WeeklyOff";
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
  // Fetch monthly summary
  const fetchMonthlySummary = async (empID) => {
  try {
    const q = query(collection(db, "attendance"), where("employee_id", "==", empID));
    const snap = await getDocs(q);
    const allAttendance = snap.docs.map((doc) => doc.data());

    const grouped = {};

    allAttendance.forEach((record) => {
      if (!record.timestamp) return;

      const attDate = record.timestamp.toDate
        ? record.timestamp.toDate()
        : new Date(record.timestamp);
      if (isNaN(attDate.getTime())) return;

      // Determine status
      let status = "pending";
      if (record.statusIn && record.statusOut) {
        status =
          record.statusIn === "approved" && record.statusOut === "approved"
            ? "approved"
            : "pending";
      } else if (record.status) {
        status = record.status;
      }

      const monthKey = attDate.toLocaleString("default", { month: "long", year: "numeric" });

      if (!grouped[monthKey]) {
        grouped[monthKey] = {
          month: monthKey,
          totalDays: new Date(attDate.getFullYear(), attDate.getMonth() + 1, 0).getDate(),
          sundays: 0,
          present: 0,
          halfDays: 0,
          absent: 0,
        };
      }

      // Count attendance statuses based on computed status
      if (status === "approved") grouped[monthKey].present += 1;
      else if (status === "disapproved") grouped[monthKey].absent += 1;
      else if (status === "halfday") grouped[monthKey].halfDays += 1;
    });

    // Count Sundays for each month
    Object.keys(grouped).forEach((key) => {
      const { totalDays } = grouped[key];
      const [monthName, year] = key.split(" ");
      const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

      let sundayCount = 0;
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, monthIndex, day);
        if (d.getDay() === 0) sundayCount++;
      }
      grouped[key].sundays = sundayCount;
    });

    // Sort months chronologically
    const sortedSummary = Object.values(grouped).sort((a, b) => {
      const [monthA, yearA] = a.month.split(" ");
      const [monthB, yearB] = b.month.split(" ");
      return new Date(`${monthA} 1, ${yearA}`) - new Date(`${monthB} 1, ${yearB}`);
    });

    setMonthlySummary(sortedSummary);
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
  }
};


const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };
// ✅ MARK IN TIME (only once per day)
// ✅ MARK IN TIME
const handleMarkIn = async () => {
  if (!employeeData || submitting) return;
  setSubmitting(true);

  try {
    const todayDate = new Date().toLocaleDateString("en-GB"); // 08/08/2025
    const inTime = formatTime();
    const safeEmpId = employeeID || "NA";

    // ✅ Check if already marked In today
    const q = query(
      collection(db, "attendance"),
      where("employee_id", "==", safeEmpId),
      where("date", "==", todayDate)
    );

    const snap = await getDocs(q);
    if (!snap.empty) {
      alert("⚠️ You have already marked In today!");
      setSubmitting(false);
      return;
    }

    const cleanDate = todayDate.replace(/\//g, "-");
    const docId = `${safeEmpId}_${cleanDate}`;
    const todayRef = doc(db, "attendance", docId);

    await setDoc(todayRef, {
  employee_id: safeEmpId,
  name: employeeData.name,
  date: todayDate,

  in_time: inTime,
  out_time: null,

  statusIn: "pending",
  statusOut: null,

  // ✅ In Time Location
  in_address: address || "Unknown Location",
  in_latitude: location?.lat || null,
  in_longitude: location?.lon || null,

  // Out location empty initially
  

  timestamp: serverTimestamp(),
});

    setTodayDocId(docId);
    setLastStatus(`In: ${inTime}, Out: ❌ Not Marked`);
    alert(`✅ In Time marked successfully at ${inTime}!`);

    const now = new Date();
    fetchDailyAttendance(employeeID, now.getFullYear(), now.getMonth());
    fetchMonthlySummary(employeeID);
  } catch (err) {
    console.error("Error marking In Time:", err);
    setMessage("❌ Error marking In Time.");
  }

  setSubmitting(false);
};



// ✅ MARK OUT TIME (only once per day)
const handleMarkOut = async () => {
  if (!employeeData || submitting) return;
  setSubmitting(true);

  try {
    const outTime = formatTime();
    const safeEmpId = employeeID || "NA";
    const todayDate = new Date().toLocaleDateString("en-GB");
    let targetDocId = todayDocId;
    let targetDocData = null;

    // 🔎 If we already have docId, fetch its data
    if (targetDocId) {
      const docRef = doc(db, "attendance", targetDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        targetDocData = snap.data();
      }
    }

    // 🔎 If no docId or fetch failed, query latest open record
    if (!targetDocData) {
      const q = query(
        collection(db, "attendance"),
        where("employee_id", "==", safeEmpId),
        where("date", "==", todayDate),
        orderBy("timestamp", "desc"),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        targetDocId = snap.docs[0].id;
        targetDocData = snap.docs[0].data();
      }
    }

    // ⛔ If still no record found
    if (!targetDocData) {
      setMessage("⛔ No open In Time found. Please Mark In first.");
      setSubmitting(false);
      return;
    }

    // ⛔ If Out already marked, block
    if (targetDocData.out_time) {
      alert("⚠️ You have already marked Out today!");
      setSubmitting(false);
      return;
    }

    // ✅ Update with Out Time + statusOut
    const todayRef = doc(db, "attendance", targetDocId);
   await updateDoc(todayRef, {
    out_time: outTime,
    statusOut: "pending",

    // ✅ Out Time Location
    out_address: address || "Unknown Location",
    out_latitude: location?.lat || null,
    out_longitude: location?.lon || null,
  });

    setMessage("✅ Out Time marked successfully.");
    setLastStatus((prev) =>
      prev ? prev.replace("Out: ❌ Not Marked", `Out: ${outTime}`) : `Out: ${outTime}`
    );
    alert(`✅ Out Time marked successfully at ${outTime}!`);

    const now = new Date();
fetchDailyAttendance(employeeID, now.getFullYear(), now.getMonth());
    fetchMonthlySummary(employeeID);
  } catch (err) {
    console.error("Error marking Out Time:", err);
    setMessage("❌ Error marking Out Time.");
  }

  setSubmitting(false);
};
function getInTimeColor(inTime, index, records) {
  if (!inTime || inTime.includes("❌")) return "black";

  const time = new Date(`1970-01-01 ${inTime}`);

  const greenLimit = new Date("1970-01-01 09:10:00");
  const yellowLimit = new Date("1970-01-01 09:15:00");

  if (time < greenLimit) return "green";
  if (time > yellowLimit) return "red";

  // Sort records ascending for counting (1 → 30)
  const sortedRecords = [...records].sort((a, b) => a.timestamp - b.timestamp);

  let yellowCount = 0;

  for (let i = 0; i < sortedRecords.length; i++) {
    const t = new Date(`1970-01-01 ${sortedRecords[i].in_time}`);

    if (t >= greenLimit && t <= yellowLimit) {
      yellowCount++;

      if (sortedRecords[i].in_time === inTime) {
        return yellowCount <= 2 ? "orange" : "red";
      }
    }
  }

  return "orange";
}
const handleWeeklyOff = async () => {
  if (!employeeData || submitting) return;
  setSubmitting(true);

  try {
    const todayDate = new Date().toLocaleDateString("en-GB");
    const currentTime = formatTime();
    const safeEmpId = employeeID || "NA";

    // ✅ Check if attendance already exists today
    const q = query(
      collection(db, "attendance"),
      where("employee_id", "==", safeEmpId),
      where("date", "==", todayDate)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      alert("⚠️ Attendance already marked today!");
      setSubmitting(false);
      return;
    }

    // 🔑 Create unique document ID
    const cleanDate = todayDate.replace(/\//g, "-");
    const cleanTime = currentTime.replace(/:/g, "-").replace(/ /g, "");
    const docId = `${safeEmpId}_${cleanDate}_WO_${cleanTime}`;

    const todayRef = doc(db, "attendance", docId);

    await setDoc(todayRef, {
  employee_id: safeEmpId,
  name: employeeData.name,
  date: todayDate,

  in_time: "WeeklyOff",
  out_time: "WeeklyOff",

  statusIn: "pending",
  statusOut: "pending",

  weeklyOffRequested: true,
  weekly_off_time: currentTime,

  timestamp: serverTimestamp(),
});

    setTodayDocId(docId);
    setLastStatus(`📅 Weekly Off marked at ${currentTime}`);

    alert(`✅ Weekly Off marked successfully at ${currentTime}!`);

    const now = new Date();
    fetchDailyAttendance(employeeID, now.getFullYear(), now.getMonth());
    fetchMonthlySummary(employeeID);

  } catch (err) {
    console.error("Error marking Weekly Off:", err);
    setMessage("❌ Error marking Weekly Off.");
  }

  setSubmitting(false);
};




//   const handleSalaryCalculator = () => {
//   if (monthlySummary.length === 0) {
//     alert("No monthly summary available!");
//     return;
//   }
//   if (!employeeSalary) {
//     alert("Salary not found for this employee!");
//     return;
//   }

//   // Get last completed month (second-to-last in array)
//   const lastMonthIndex = monthlySummary.length - 2; 
//   if (lastMonthIndex < 0) {
//     alert("No previous month data available!");
//     return;
//   }
//   const lastMonthData = monthlySummary[lastMonthIndex];

//   const totalSalary = employeeSalary; // DB salary
//   const perDaySalary = totalSalary / lastMonthData.totalDays;
//   const effectiveDays = lastMonthData.present + lastMonthData.sundays;
//   const finalSalary = (perDaySalary * effectiveDays).toFixed(2);

//   setSalaryDetails({
//     ...lastMonthData,
//     totalSalary,
//     perDaySalary: perDaySalary.toFixed(2),
//     effectiveDays,
//     finalSalary,
//   });
//   setShowSalary(true);
// };
//for disable the salary button
// const today = new Date();
// const currentDay = today.getDate();

// Check if current day is between 2 and 9 (inclusive)
// const isSalaryWindowOpen = currentDay >= 1 && currentDay <= 5;



  return (
    <div className="attendance-wrapper">
      <div className="logout-container">
            <button
            className="logout-button"
            onClick={() => {
              if (window.confirm("Are you sure you want to logout?")) {
                handleLogout();
              }
            }}
          >
            Logout
          </button>

          </div>
      <div className="attendance-container">
        <div className="attendance-header">
          <h2>📍 Attendance Panel</h2>
          {isManager && (
            <button className="btn-admin" onClick={() => navigate("/AdminPanel")}>
              🛡️ Go to Admin Panel
            </button>
          )}
        </div>
        

        

  <div className="attendance-card">
    <label><strong>📌 Choose Section:</strong></label>
    <select
  className="btn-submit"
  onChange={(e) => setSelectedSection(e.target.value)}
  value={selectedSection}
>
  <option value="">-- Select --</option>

  <option value="in" disabled={isWeeklyOffToday || hasInTime}>
    ✅ In Time
  </option>

  <option value="out" disabled={isWeeklyOffToday || hasOutTime}>
    🚪 Out Time
  </option>

  <option value="weeklyoff" disabled={hasInTime || hasOutTime}>
    📅 Weekly Off
  </option>
</select>
  </div>

  {selectedSection && (
    <div className="attendance-card">
      <p><strong>👤 Name:</strong> {employeeData.name}</p>
      <p><strong>🎓 Designation :</strong> {employeeData.Role}</p>
      <p><strong>📅 Date:</strong> {new Date().toLocaleDateString()}</p>
      <p><strong>🕒 Time:</strong> {currentTime}</p>

      {lastStatus && (
        <p><strong>📌 Today’s Status:</strong> {lastStatus}</p>
      )}

      {/* Hide Location & Address when Weekly Off */}
      {location && selectedSection !== "weeklyoff" && (
        <>
          

          <p>
            <strong>🏠 Address:</strong> {address || "Fetching address..."}
          </p>
        </>
      )}
    </div>
  )}

  {selectedSection === "in" && (
    <div className="attendance-card">
      <h3>✅ Mark In Time</h3>
      <button
        onClick={handleMarkIn}
        disabled={submitting}
        className="btn-submit"
      >
        {submitting ? "Submitting..." : "Submit In Time"}
      </button>
    </div>
  )}

  {selectedSection === "out" && (
    <div className="attendance-card">
      <h3>🚪 Mark Out Time</h3>
      <button
        onClick={handleMarkOut}
        disabled={submitting}
        className="btn-submit"
      >
        {submitting ? "Submitting..." : "Submit Out Time"}
      </button>
    </div>
  )}

  {selectedSection === "weeklyoff" && (
    <div className="attendance-card">
      <h3>📅 Mark Weekly Off</h3>
      <button
        onClick={handleWeeklyOff}
        disabled={submitting}
        className="btn-submit"
      >
        {submitting ? "Submitting..." : "Submit Weekly Off"}
      </button>
    </div>
  )}

</div>

      {/* Dynamic Attendance Summary Table */}
      <div className="attendance-summary">
        <h2>📊 Attendance Summary</h2>
        <table className="summary-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Total Days</th>
              <th>Sundays</th>
              <th>Present</th>
              <th>Half Days</th>
              <th>Absent</th>
            </tr>
          </thead>
          <tbody>
  {monthlySummary.length === 0 ? (
    <tr>
      <td colSpan="6" style={{ textAlign: "center" }}>
        No summary available
      </td>
    </tr>
  ) : (
    monthlySummary.map((row, idx) => (
      <tr
  key={idx}
  style={{ cursor: "pointer" }}
  onClick={() => {
    const [monthName, year] = row.month.split(" ");
    const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();

    fetchDailyAttendance(empID, Number(year), monthIndex);
  }}
>
        <td>{row.month}</td>
        <td>{row.totalDays}</td>
        <td>{row.sundays}</td>
        <td>{row.present}</td>
        <td>{row.halfDays}</td>
        <td>{row.absent}</td>
      </tr>
    ))
  )}
</tbody>
        </table>

        {/* <button className="salary-btn" onClick={handleSalaryCalculator} disabled={!isSalaryWindowOpen}
        style={{
        opacity: isSalaryWindowOpen ? 1 : 0.5,
        cursor: isSalaryWindowOpen ? "pointer" : "not-allowed",
      }}>
        💰 Salary Calculator
      </button> */}
      </div>
       {/* Salary Popup */}
      {/* {showSalary && salaryDetails && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>💰 Salary Calculation</h2>
            <p><b>Month:</b> {salaryDetails.month}</p>
            <p><b>Total Salary (Fixed):</b> ₹{salaryDetails.totalSalary}</p>
            <p><b>Total Days:</b> {salaryDetails.totalDays}</p>
            <p><b>Sundays:</b> {salaryDetails.sundays}</p>
            <p><b>Present Days:</b> {salaryDetails.present}</p>
            <p><b>Effective Days (Present + Sundays):</b> {salaryDetails.effectiveDays}</p>
            <p><b>Per Day Salary:</b> ₹{salaryDetails.perDaySalary}</p>
            <h3>✅ Final In-hand Salary: ₹{salaryDetails.finalSalary}</h3>
            <button onClick={() => setShowSalary(false)}>Close</button>
          </div>
        </div>
      )} */}

      {/* Dynamic Daily Attendance Table */}
      <div className="attendance-details">
        <h2>📅 Daily Attendance</h2>
        <table className="details-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>In Time</th>
              <th>Out Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dailyAttendance.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>No records found</td>
              </tr>
            ) : (
              dailyAttendance.map((rec, index) => (
                <tr key={index}>
                  <td>{rec.date}</td>
                  <td
  style={{
    color: getInTimeColor(rec.in_time, index, dailyAttendance),
    fontWeight: "bold"
  }}
>
  {rec.in_time}
</td>
                  <td>{rec.out_time}</td>
                  <td>{rec.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
