import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import "./WorkerLinkPage.css";

const WorkerLinkPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const empId = params.get("empId");
  const name = params.get("name");

  const [gujName, setGujName] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [salaryDetails, setSalaryDetails] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (name) {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=gu&dt=t&q=${encodeURIComponent(
        name
      )}`;
      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data && data[0] && data[0][0] && data[0][0][0]) {
            setGujName(data[0][0][0]);
          }
        })
        .catch((err) => console.error("Translation error:", err));
    }
  }, [name]);

  const date = currentTime.toLocaleDateString("en-GB");
  const time = currentTime.toLocaleTimeString("en-GB");
  const formatTime = () => currentTime.toLocaleTimeString("en-GB");

 const handleSubmitAttendance = async () => {
  if (!empId || submitting) return;

  setSubmitting(true);

  try {
    const todayDate = date;
    const currentTimeStr = formatTime();

    const q = query(
      collection(db, "attendance"),
      where("employee_id", "==", empId),
      where("date", "==", todayDate)
    );

    const snap = await getDocs(q);

    // =========================
    // FIRST ENTRY = IN TIME
    // =========================
    if (snap.empty) {
      const cleanDate = todayDate.replace(/\//g, "-");

      // ONLY ONE DOCUMENT PER DAY
      const docId = `${empId}_${cleanDate}`;

      const todayRef = doc(db, "attendance", docId);

      await setDoc(todayRef, {
        employee_id: empId,
        name: name,
        date: todayDate,

        in_time: currentTimeStr,
        out_time: null,

        statusIn: "pending",
        statusOut: "pending",

        timestamp: serverTimestamp(),
      });

      alert("✅ In Time submitted successfully!");
    }

    // =========================
    // SECOND ENTRY = OUT TIME
    // =========================
    else {
      const existingDoc = snap.docs[0];
      const existingData = existingDoc.data();

      // OUT TIME NOT MARKED YET
      if (!existingData.out_time) {
        const todayRef = doc(db, "attendance", existingDoc.id);

        await setDoc(
          todayRef,
          {
            out_time: currentTimeStr,
            statusOut: "pending",
          },
          { merge: true }
        );

        alert("✅ Out Time submitted successfully!");
      }

      // BOTH ALREADY MARKED
      else {
        alert("⚠️ Attendance already completed today!");
      }
    }
  } catch (err) {
    console.error("Error submitting attendance:", err);
    alert("❌ Error submitting attendance!");
  }

  setSubmitting(false);
};

  // Calculate salary dynamically
  // const handleSalaryCalculator = async () => {
  //   try {
  //     // 1️⃣ Get base salary
  //     const qUser = query(
  //       collection(db, "Users"),
  //       where("username", "==", empId)
  //     );
  //     const snapUser = await getDocs(qUser);
  //     if (snapUser.empty) {
  //       alert("Salary not found for this employee!");
  //       return;
  //     }
  //     const userData = snapUser.docs[0].data();
  //     const totalSalary = parseFloat(userData.salary);

  //     // 2️⃣ Get all attendance records
  //     const qAttendance = query(
  //       collection(db, "attendance"),
  //       where("employee_id", "==", empId)
  //     );
  //     const snapAttendance = await getDocs(qAttendance);

  //     // Filter approved attendance
  //     const approvedRecords = snapAttendance.docs.filter((doc) => {
  //       const data = doc.data();
  //       return data.statusIn === "approved" && data.statusOut === "approved";
  //     });

  //     const presentDays = approvedRecords.length;

  //     // 3️⃣ Total days in month (or total days in attendance)
  //     const totalDays = snapAttendance.size > 0 ? snapAttendance.size : 30;

  //     // 4️⃣ Sundays (you can calculate dynamically or set manually)
  //     // 3️⃣ Total days in current month
  //         const now = new Date();
  //         const year = now.getFullYear();
  //         const month = now.getMonth(); // 0-indexed
  //         const totalMonthDays = new Date(year, month + 1, 0).getDate();

  //         // 4️⃣ Per day salary
  //         const perDaySalary = totalSalary / totalMonthDays;

  //         // 5️⃣ Effective days
  //         const sundays = 4; // you can calculate dynamically if needed
  //         const effectiveDays = presentDays + sundays;

  //         // 6️⃣ Final salary
  //         const finalSalary = (perDaySalary * effectiveDays).toFixed(2);


  //     setSalaryDetails({
  //       month: new Date().toLocaleString("default", { month: "long" }),
  //       totalSalary,
  //       totalDays,
  //       sundays,
  //       present: presentDays,
  //       effectiveDays,
  //       perDaySalary: perDaySalary.toFixed(2),
  //       finalSalary,
  //     });

  //     setShowSalary(true);
  //   } catch (err) {
  //     console.error("Error calculating salary:", err);
  //     alert("❌ Error calculating salary!");
  //   }
  // };

  return (
    <div className="worker-page-container">
      <div className="worker-card">
        <h2 className="worker-card-title">Worker/Helper Attendance</h2>

        <div className="worker-info">
          <p>
            <span className="label">Name:</span> {name}
          </p>

          {gujName && (
            <p className="guj-name">
              <span className="label">ગુજરાતી નામ:</span> {gujName}
            </p>
          )}

          <p>
            <span className="label">Employee ID:</span> {empId}
          </p>
          <p>
            <span className="label">Date:</span> {date}
          </p>
          <p>
            <span className="label">Time:</span> {time}
          </p>
        </div>

        <div className="worker-actions">
          <button
            className="btn-submit"
            onClick={handleSubmitAttendance}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Attendance"}
          </button>
          {/* <button className="btn-salary" onClick={handleSalaryCalculator}>
            Show Salary
          </button> */}
        </div>
      </div>

      {/* Salary Modal */}
      {showSalary && salaryDetails && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h2>💰 Salary Calculation</h2>
            <p>
              <b>Month:</b> {salaryDetails.month}
            </p>
            <p>
              <b>Total Salary (Fixed):</b> ₹{salaryDetails.totalSalary}
            </p>
            <p>
              <b>Total Days:</b> {salaryDetails.totalDays}
            </p>
            <p>
              <b>Sundays:</b> {salaryDetails.sundays}</p>
            <p>
              <b>Present Days:</b> {salaryDetails.present}
            </p>
            <p>
              <b>Effective Days (Present + Sundays):</b>{" "}
              {salaryDetails.effectiveDays}
            </p>
            <p>
              <b>Per Day Salary:</b> ₹{salaryDetails.perDaySalary}
            </p>
            <h3>✅ Final In-hand Salary: ₹{salaryDetails.finalSalary}</h3>
            <button onClick={() => setShowSalary(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerLinkPage;
