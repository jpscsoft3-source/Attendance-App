import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { useNavigate } from 'react-router-dom'; // at the top of your file
// import * as XLSX from "xlsx";
// import { saveAs } from "file-saver";

import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  setDoc,addDoc,onSnapshot,deleteDoc,getDoc,orderBy,serverTimestamp
} from "firebase/firestore";
import "./AdminPanel.css";
import { toast } from "react-toastify"; // ✅ Toastify for feedback
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf"; //pdf
import autoTable from "jspdf-autotable"; // 👈 this line is required for pdf
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Helmet } from "react-helmet";
import { CheckCircle } from "lucide-react"; // ✅ Lucide icon (available in shadcn/ui)
import bcrypt from 'bcryptjs'; 

export default function AdminPanel() {
  const [dateRange, setDateRange] = useState(null); // keep track of filter range
  const [searchDate, setSearchDate] = useState("");
  const [searchEmpID, setSearchEmpID] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [filteredStats, setFilteredStats] = useState(null);
  const [dateSearchResults, setDateSearchResults] = useState([]);
  const [filterPopup, setFilterPopup] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [allUsers, setAllUsers] = useState([]);
  const [summaryHeading, setSummaryHeading] = useState("📄 Employee Summary (Last 30 Days)");
  const [searchUser, setSearchUser] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [customFromDate, setCustomFromDate] = useState("");
  const [customToDate, setCustomToDate] = useState("");
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [adminName, setAdminName] = useState('');
  const [showAbsentModal, setShowAbsentModal] = useState(false);
const [eligibleUsers, setEligibleUsers] = useState([]);
const [selectedAbsentDates, setSelectedAbsentDates] = useState({});
const [showPresentModal, setShowPresentModal] = useState(false);
const [showPasswordEditModal, setShowPasswordEditModal] = useState(false);
const [selectedUser, setSelectedUser] = useState(null);
const [newPassword, setNewPassword] = useState("");
const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
const [selectedPresentDates, setSelectedPresentDates] = useState({});
const [selectedEmployee, setSelectedEmployee] = useState(null);
const [attendanceHistory, setAttendanceHistory] = useState([]);
const [showHistoryModal, setShowHistoryModal] = useState(false);
const [selectedEmployeeName, setSelectedEmployeeName] = useState('');
const [deleteModal, setDeleteModal] = useState(false);
const [deleteEmpId, setDeleteEmpId] = useState("");
const [empToDelete, setEmpToDelete] = useState(null);
const [showEditModal, setShowEditModal] = useState(false);
const [editEmployee, setEditEmployee] = useState(null);
const [showSalaryModal, setShowSalaryModal] = useState(false);
const [searchEmpId, setSearchEmpId] = useState("");
const [salaryDetails, setSalaryDetails] = useState(null);
const [loadingSalary, setLoadingSalary] = useState(false);
const [salaryError, setSalaryError] = useState("");
const [otpSent, setOtpSent] = useState(false);
const [enteredOtp, setEnteredOtp] = useState("");
const [showOtpModal, setShowOtpModal] = useState(false);
const [suggestions, setSuggestions] = useState([]);
const [downloadModal, setDownloadModal] = useState(false);
const [selectedEmployees, setSelectedEmployees] = useState([]);
const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
const [showNoteModal, setShowNoteModal] = useState(false);
const [noteText, setNoteText] = useState("");
const [selectedRecord, setSelectedRecord] = useState(null);  
const navigate = useNavigate(); // inside your component


  const [newEmp, setNewEmp] = useState({
    empId: '',
    Name: '',
    username: "", 
    // email: '',
    password: '',
    Role: '',
    SubDesignation: '',
    responsible :'',
    salary: '',
  });

  // const fetchAttendance = async () => {
  //   const q = query(collection(db, "attendance"), where("status", "==", "pending"));
  //   const snapshot = await getDocs(q);
  //   setAttendanceData(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
  // };

const fetchAttendance = async () => {
  // 🔥 Fetch all documents from attendance collection
  const querySnapshot = await getDocs(collection(db, "attendance"));

  const allData = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  // ✅ Filter manually for pending requests
  const pendingData = allData.filter(
    (entry) => entry.statusIn === "pending" || entry.statusOut === "pending"
  );

  // ✅ Sort by timestamp descending
  pendingData.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());

  setAttendanceData(pendingData);
};




const toggleEmployee = (empId) => {
  setSelectedEmployees((prev) =>
    prev.includes(empId)
      ? prev.filter((id) => id !== empId)
      : [...prev, empId]
  );
};
const handleSelectAll = () => {
  const allIds = employeeStats.map((emp) => emp.id);
  setSelectedEmployees(allIds);
};
const handleClearSelection = () => {
  setSelectedEmployees([]);
};
const fetchEmployeeStats = async (startDate, endDate, label = "") => {
  const empSnap = await getDocs(collection(db, "Users"));

  // ✅ Exclude Managers
  const empList = empSnap.docs
    .map(doc => ({
      id: doc.id.trim().toUpperCase(),
      ...doc.data()
    }))
    .filter(emp => emp.responsible?.toLowerCase() !== "manager");

  const attendanceSnap = await getDocs(collection(db, "attendance"));
  const allAttendance = attendanceSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  const summary = empList.map(emp => {
    const empRecords = allAttendance.filter(a => {
      const attDate = a.timestamp?.toDate?.();
      return (
        a.employee_id?.trim().toUpperCase() === emp.id &&
        attDate &&
        attDate >= startDate &&
        attDate <= endDate
      );
    });

    // ✅ Calculate Present / Absent counts
    const totalPresent = empRecords.filter(
  (r) =>
    r.statusIn === "approved" &&
    r.statusOut === "approved" &&
    r.in_time !== "WeeklyOff"
).length;

 const totalAbsent = empRecords.filter(
  (r) =>
    r.statusIn === "disapproved" &&
    r.statusOut === "disapproved" &&
    r.in_time !== "WeeklyOff"
).length;
    const latestInRecord = empRecords
      .filter(r => r.in_time)
      .sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate())[0];

    // ✅ Special rule for Worker/Helper — OutStatus should always be "--"
    const isWorkerHelper = emp.responsible?.toLowerCase() === "worker/helper";

    return {
      id: emp.id,
      Name: emp.Name || "N/A",
      Role: emp.Role || "N/A",
      subRole: emp.SubDesignation || "—",
      responsible: emp.responsible || "—",
      weeklyOff: emp.weeklyOff || "—",   // ✅ NEW
      present: totalPresent,
      absent: totalAbsent,

      inTime: latestInRecord?.in_time || "—",
      approveDateIn: latestInRecord?.approved_at_in?.toDate
        ? latestInRecord.approved_at_in.toDate().toLocaleDateString()
        : "—",
      approvedByIn: latestInRecord?.approvedByIn || "—",

      outTime: latestInRecord?.out_time || "—",
      approveDateOut: latestInRecord?.approved_at_out?.toDate
        ? latestInRecord.approved_at_out.toDate().toLocaleDateString()
        : "—",
      approvedByOut: latestInRecord?.approvedByOut || "—",

      inStatus: latestInRecord?.statusIn || "—",

      // ✅ Override Out Status for Worker/Helper
      outStatus: isWorkerHelper
        ? "—"
        : latestInRecord?.approvedByOut
        ? (latestInRecord?.statusOut || latestInRecord?.status || "—")
        : "—",

      salary: emp.salary || "—",
      password: emp.password || "—"
    };
  });

  setEmployeeStats(summary);
  setFilteredStats(null);
  setDateSearchResults([]);
  setSummaryHeading(`📄 Employee Summary (${label})`);
};

//new one




const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };


  const fetchAllUsers = async () => {
  try {
    const snap = await getDocs(collection(db, "Users"));

    const users = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setAllUsers(users);
    setFilteredUsers(users);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};

const handleUserSearch = (value) => {
  setSearchUser(value);

  const filtered = allUsers.filter(
    (user) =>
      user.Name?.toLowerCase().includes(value.toLowerCase()) ||
      user.id?.toLowerCase().includes(value.toLowerCase()) ||
      user.responsible?.toLowerCase().includes(value.toLowerCase())
  );

  setFilteredUsers(filtered);
};

const fetchAttendanceStats = async () => {
  const updatedStats = await Promise.all(
    employeeStats.map(async (emp) => {
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("employee_id", "==", emp.id)
      );
      const snap = await getDocs(attendanceQuery);

      let present = 0;
      let absent = 0;
      let latestApproval = null;

      snap.forEach(doc => {
        const data = doc.data();
        const status = data.status;
        const approver = data.approvedBy || "N/A";
        const timestamp = data.timestamp?.toDate?.() || new Date(0); // fallback if timestamp is missing

        if (status === "approved") present++;
        if (status === "disapproved") absent++;

        // Track latest approval entry
        if (!latestApproval || timestamp > latestApproval.timestamp) {
          latestApproval = {
            name: approver,
            status,
            timestamp
          };
        }
      });

      return {
        ...emp,
        present,
        absent,
        approvedBy: latestApproval
          ? `${latestApproval.name} (${latestApproval.status})`
          : "—"
      };
    })
  );

  setEmployeeStats(updatedStats);
};
 


const handleMarkAbsent = async () => {
  const approvedByIn = localStorage.getItem("employeeName") || "Admin";
  const approvedByOut = localStorage.getItem("employeeName") || "Admin";
  const updatedStats = await Promise.all(
    employeeStats.map(async (emp) => {
      const selectedDate = selectedAbsentDates[emp.id];
      if (!selectedDate) return emp;

      // ✅ Format date and time
      const dateObj = new Date(selectedDate);
      const formattedDate = dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const formattedTime = dateObj.toLocaleTimeString("en-GB"); // HH:MM:SS

      try {
        // ❌ Delete any "approved" attendance for the same date (user + admin records)
        const approvedQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("date", "==", formattedDate),
          where("status", "==", "approved")
        );
        const approvedSnap = await getDocs(approvedQuery);
        approvedSnap.forEach(async (doc) => await deleteDoc(doc.ref));

        // 🔍 Check if already marked absent
        const absentQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("date", "==", formattedDate),
          where("status", "==", "disapproved")
        );
        const snapshot = await getDocs(absentQuery);

        if (snapshot.empty) {
          // ✅ Use employee ID + date as document ID for easier searching
          const docId = `${emp.id}_${formattedDate.replace(/\//g, '-')}`;

          await setDoc(doc(db, "attendance", docId), {
                employee_id: emp.id,
                name: emp.Name,
                status: "disapproved",
                approvedByIn,
                approvedByOut,
                date: formattedDate,      // DD/MM/YYYY (attendance date)
                time: formattedTime,      // HH:MM:SS
                statusIn: "disapproved",
                statusOut: "disapproved",
                timestamp: new Date(),    // original attendance timestamp
                approved_at_in: new Date(),  // 🔹 approval date for In
                approved_at_out: new Date()  // 🔹 approval date for Out
              });

        } else {
          toast.info(`${emp.Name} is already marked absent on ${formattedDate}`);
        }

        // 🔢 Update total absent count
        const allAbsentQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("status", "==", "disapproved")
        );
        const allAbsentSnap = await getDocs(allAbsentQuery);
        const totalAbsent = allAbsentSnap.size;

        return {
          ...emp,
          absent: totalAbsent,
          approvedByIn,
          approvedByOut
        };
      } catch (error) {
        console.error(`🔥 Error handling absent for ${emp.id}:`, error);
        return emp;
      }
    })
  );

  await fetchAttendanceStats();
    alert("✅ Mark Absent process completed successfully!");

  setShowAbsentModal(false);
  setSelectedAbsentDates({});
};
const handleDownloadSelected = async () => {

  if (selectedEmployees.length === 0) {
    alert("Please select at least one employee.");
    return;
  }

  if (!fromDate || !toDate) {
    alert("Please select From and To date.");
    return;
  }

  try {

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);

    const attendanceSnap = await getDocs(collection(db, "attendance"));
    const attendanceData = attendanceSnap.docs.map(doc => doc.data());

    const workbook = XLSX.utils.book_new();

    // Function to generate all dates between range
    const getDatesBetween = (start, end) => {
      const dates = [];
      let current = new Date(start);

      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return dates;
    };

    for (const empId of selectedEmployees) {

      const emp = employeeStats.find(e => e.id === empId);
      const empName = emp?.Name || empId;

      // Fetch employee weekly off
      const userSnap = await getDocs(
        query(collection(db, "Users"), where("username", "==", empId))
      );

      let weeklyOffDay = null;

      if (!userSnap.empty) {
        weeklyOffDay = userSnap.docs[0].data().weeklyOff;
      }

      const empRecords = attendanceData
        .filter(a => {

          const attDate = a.timestamp?.toDate?.();

          return (
            a.employee_id === empId &&
            attDate &&
            attDate >= startDate &&
            attDate <= endDate
          );

        })
        .sort((a, b) => {
          const dateA = a.timestamp?.toDate?.() || new Date(0);
          const dateB = b.timestamp?.toDate?.() || new Date(0);
          return dateA - dateB;
        });

      const allDates = getDatesBetween(startDate, endDate);

    const sheetData = allDates.map(date => {

  const record = empRecords.find(r => {
    const attDate = r.timestamp?.toDate?.();
    return attDate && attDate.toDateString() === date.toDateString();
  });

  const dateStr = date.toLocaleDateString("en-GB");

  // PRESENT
  if (record) {
    return {
      Date: record.date || dateStr,
      Attendance: "P",
      "In Time": record.in_time || "—",
      "Out Time": record.out_time || "—",
      "Approved By (In)": record.approvedByIn || "—",
      "Approved By (Out)": record.approvedByOut || "—",
      "In Location": record.in_address || "—",
      "Out Location": record.out_address || "—"
    };
  }

  const dayName = date.toLocaleDateString("en-US", {
    weekday: "long"
  });

  // WEEKLY OFF
  if (weeklyOffDay && dayName === weeklyOffDay) {
    return {
      Date: dateStr,
      Attendance: "WO",
      "In Time": "Weekly Off",
      "Out Time": "Weekly Off",
      "Approved By (In)": "—",
      "Approved By (Out)": "—",
      "In Location": "—",
      "Out Location": "—"
    };
  }

  // ABSENT
  return {
    Date: dateStr,
    Attendance: "A",
    "In Time": "Leave",
    "Out Time": "Leave",
    "Approved By (In)": "—",
    "Approved By (Out)": "—",
    "In Location": "—",
    "Out Location": "—"
  };

});


// ================= SUMMARY =================

let presentCount = 0;
let absentCount = 0;
let weeklyOffCount = 0;

sheetData.forEach(row => {
  if (row.Attendance === "P") {
    presentCount++;
  } else if (row.Attendance === "A") {
    absentCount++;
  } else if (row.Attendance === "WO") {
    weeklyOffCount++;
  }
});

sheetData.push({});
sheetData.push({
  Date: "Present",
  Attendance: presentCount
});

sheetData.push({
  Date: "Absent",
  Attendance: absentCount
});

sheetData.push({
  Date: "Week Off",
  Attendance: weeklyOffCount
});

sheetData.push({
  Date: "Total",
  Attendance:
    presentCount +
    absentCount +
    weeklyOffCount
});
      const worksheet = XLSX.utils.json_to_sheet(sheetData);
      

          worksheet["!cols"] = [
        { wch: 10 }, // Date
        { wch: 10 }, // Attendance
        { wch: 12 }, // In Time
        { wch: 12 }, // Out Time
        { wch: 18 }, // Approved By In
        { wch: 18 }, // Approved By Out
        { wch: 60 }, // In Location
        { wch: 60 }  // Out Location
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        empName.substring(0, 31)
      );

    }

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(blob, `Attendance_${fromDate}_to_${toDate}.xlsx`);

  } catch (error) {

    console.error("Download Error:", error);
    alert("Error generating attendance file.");

  }

};
const handleSearchChange = async (e) => {
  const value = e.target.value.trim();
  setDeleteEmpId(value);

  if (value.length < 2) {
    setSuggestions([]);
    return;
  }

  try {
    // Search employees whose ID OR Name starts with typed value (case-insensitive)
    const usersRef = collection(db, "Users");
    const snapshot = await getDocs(usersRef);

    const allUsers = snapshot.docs.map(doc => ({
      empId: doc.id,
      ...doc.data()
    }));

    const filtered = allUsers.filter(emp =>
      emp.empId?.toLowerCase().startsWith(value.toLowerCase()) ||
      emp.Name?.toLowerCase().startsWith(value.toLowerCase())
    );

    setSuggestions(filtered.slice(0, 5)); // show max 5
  } catch (error) {
    console.error("🔥 Error fetching suggestions:", error);
  }
};

const handleSelectSuggestion = (emp) => {
  setDeleteEmpId(emp.empId);
  setEmpToDelete(emp);
  setSuggestions([]);
};

const fetchEmployeeDetails = async () => {
  if (!deleteEmpId.trim()) {
    alert("⚠️ Please enter an Employee ID or Name");
    return;
  }

  try {
    const usersRef = collection(db, "Users");
    const snapshot = await getDocs(usersRef);
    const allUsers = snapshot.docs.map(doc => ({
      empId: doc.id,
      ...doc.data()
    }));

    // Match by ID or Name
    const found = allUsers.find(
      emp =>
        emp.empId.toLowerCase() === deleteEmpId.toLowerCase() ||
        emp.Name.toLowerCase() === deleteEmpId.toLowerCase()
    );

    if (found) {
      setEmpToDelete(found);
    } else {
      alert("❌ No employee found with that ID or Name");
      setEmpToDelete(null);
    }
  } catch (error) {
    console.error("🔥 Error fetching employee:", error);
  }
};
const handleDeleteEmployee = async () => {
  if (!deleteEmpId.trim()) return;

  if (!window.confirm(`Are you sure you want to delete ${empToDelete.Name}?`)) return;

  try {

    const empId = deleteEmpId.trim().toUpperCase();

    // ✅ Delete all attendance records first
    const attendanceQuery = query(
      collection(db, "attendance"),
      where("employee_id", "==", empId)
    );

    const attendanceSnap = await getDocs(attendanceQuery);

    for (const attendanceDoc of attendanceSnap.docs) {
      await deleteDoc(attendanceDoc.ref);
    }

    // ✅ Delete user
    await deleteDoc(doc(db, "Users", empId));

    alert("✅ Employee and attendance history deleted successfully!");

    setDeleteEmpId("");
    setEmpToDelete(null);
    setDeleteModal(false);

    fetchEmployeeStats(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      new Date(),
      "Last 30 Days"
    );

  } catch (error) {
    console.error("🔥 Error deleting employee:", error);
    alert("❌ Failed to Remove employee");
  }
};


// Function to generate prefix based on role
// Generate prefix based on role
const getRolePrefix = (role) => {
  if (!role) return "";

  switch (role.toLowerCase()) {
    case "employee":
      return "EMP";
    case "supervisor":
      return "SUP";
    case "manager":
      return "MAN";
    case "worker/helper":
      return "WRK";
    case "intern":
      return "INT";
    default:
      return "";
  }
};

const getEmployeeWeeklyOffCount = (weeklyOffDay, startDate, endDate) => {

  if (!weeklyOffDay) return 0;

  const daysMap = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6
  };

  const offDayIndex = daysMap[weeklyOffDay.toLowerCase()];
  if (offDayIndex === undefined) return 0;

  let count = 0;
  let current = new Date(startDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate =
    endDate > today ? today : endDate;

 while (current <= lastDate) {

    if (current.getDay() === offDayIndex) {
      count++;
    }

    current.setDate(current.getDate() + 1);
  }

  return count;
};
const handleRoleChange = async (roleValue) => {
  // First update role in state
  setNewEmp((prev) => ({ ...prev, responsible: roleValue }));

  const prefix = getRolePrefix(roleValue);
  if (!prefix) return;

  try {
    // Get all existing employee docs
    const querySnapshot = await getDocs(collection(db, "Users"));
    const docIds = querySnapshot.docs
      .map((doc) => doc.id)
      .filter((id) => id.startsWith(prefix));

    // Find highest number already used
    let maxNumber = 0;
    docIds.forEach((id) => {
      const numPart = parseInt(id.replace(prefix, ""), 10);
      if (!isNaN(numPart) && numPart > maxNumber) {
        maxNumber = numPart;
      }
    });

    const nextNumber = String(maxNumber + 1).padStart(3, "0");
    const generatedId = `${prefix}${nextNumber}`;

    // Update both empId & username automatically
    setNewEmp((prev) => ({
      ...prev,
      empId: generatedId,
      username: generatedId, // ✅ username same as empId
    }));
  } catch (error) {
    console.error("Error generating Employee ID:", error);
  }
};
const handleMarkPresent = async () => {
  const approvedByIn = localStorage.getItem("employeeName") || "Admin";
  const approvedByOut = localStorage.getItem("employeeName") || "Admin";

  const updatedStats = await Promise.all(
    employeeStats.map(async (emp) => {
      const selectedDate = selectedPresentDates[emp.id];
      if (!selectedDate) return emp;

      // ✅ Format date and time
      const dateObj = new Date(selectedDate);
      const formattedDate = dateObj.toLocaleDateString("en-GB"); // DD/MM/YYYY
      const formattedTime = dateObj.toLocaleTimeString("en-GB"); // HH:MM:SS

      try {
        // 🔹 STEP 1: Delete any "disapproved" record for the same day
        const absentQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("date", "==", formattedDate),
          where("status", "==", "disapproved")
        );
        const absentSnap = await getDocs(absentQuery);
        for (const doc of absentSnap.docs) {
          await deleteDoc(doc.ref);
        }

        // 🔹 STEP 2: Check if any attendance (manual or automatic) already exists
        const existingQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("date", "==", formattedDate)
        );
        const existingSnap = await getDocs(existingQuery);

        if (!existingSnap.empty) {
          // ✅ Update existing record (manual or automatic)
          const existingDoc = existingSnap.docs[0];
          await updateDoc(existingDoc.ref, {
            status: "approved",
            approvedByIn,
            approvedByOut,
            time: formattedTime,
            statusIn: "approved",
            statusOut: "approved",
            approved_at_in: new Date(),
            approved_at_out: new Date(),
            timestamp: new Date(),
          });

          console.log(`✅ Updated existing record for ${emp.Name} (${formattedDate})`);
          toast.info(`${emp.Name} is updated as present on ${formattedDate}`);
          
        } else {
          // 🚀 Create a new record (if none exists)
          const docId = `${emp.id}_${formattedDate.replace(/\//g, '-')}`;
          await setDoc(doc(db, "attendance", docId), {
            employee_id: emp.id,
            name: emp.Name,
            status: "approved",
            approvedByIn,
            approvedByOut,
            statusIn: "approved",
            statusOut: "approved",
            date: formattedDate,
            time: formattedTime,
            timestamp: new Date(),
            approved_at_in: new Date(),
            approved_at_out: new Date(),
          });

          console.log(`🟢 Created new present record for ${emp.Name} (${formattedDate})`);
          alert("✅ Mark Present process completed successfully!");
        }

        // 🔹 STEP 3: Recalculate total present count
        const allPresentQuery = query(
          collection(db, "attendance"),
          where("employee_id", "==", emp.id),
          where("status", "==", "approved")
        );
        const allPresentSnap = await getDocs(allPresentQuery);
        const totalPresent = allPresentSnap.size;

        return {
          ...emp,
          present: totalPresent,
          approvedByIn,
          approvedByOut,
        };
      } catch (error) {
        console.error(`🔥 Error marking present for ${emp.id}:`, error);
        return emp;
      }
    })
  );

  // 🔹 STEP 4: Refresh data and cleanup UI
  await fetchAttendanceStats();
  
  setShowPresentModal(false);
  setSelectedPresentDates({});
};






// const fetchAttendanceHistory = async (empId) => {
//   try {
//     const q = query(
//       collection(db, "attendance"),
//       where("empId", "==", empId)
//     );
//     const snapshot = await getDocs(q);
//     const history = snapshot.docs.map(doc => doc.data());
//     setAttendanceHistory(history);
//   } catch (error) {
//     console.error("Failed to fetch attendance history", error);
//   }
// };


// addd new onw
//19/10/2025  4:30pm
  const handleFilterSearch = (option) => {
  const now = new Date();
  let startDate, endDate, label;

  switch (option) {
    case "last_day": {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      startDate = new Date(yesterday.setHours(0, 0, 0, 0));
      endDate = new Date(yesterday.setHours(23, 59, 59, 999));
      label = "Last Day";
      break;
    }

    case "last_week": {
      const day = now.getDay();
      const lastSunday = new Date(now);
      lastSunday.setDate(now.getDate() - day);
      lastSunday.setHours(0, 0, 0, 0);

      const lastMonday = new Date(lastSunday);
      lastMonday.setDate(lastSunday.getDate() - 6);

      startDate = lastMonday;
      endDate = new Date(lastSunday.setHours(23, 59, 59, 999));
      label = "Last Week";
      break;
    }

    case "last_month": {
      const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = new Date(firstDayLastMonth.setHours(0, 0, 0, 0));
      endDate = new Date(lastDayLastMonth.setHours(23, 59, 59, 999));
      label = "Last Month";
      break;
    }

    case "last_3_months": {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = new Date(firstDay.setHours(0, 0, 0, 0));
      endDate = new Date(lastDay.setHours(23, 59, 59, 999));
      label = "Last 3 Months";
      break;
    }

    case "last_6_months": {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = new Date(firstDay.setHours(0, 0, 0, 0));
      endDate = new Date(lastDay.setHours(23, 59, 59, 999));
      label = "Last 6 Months";
      break;
    }

    case "current_fy": {
      const fyStartYear = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
      startDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // Apr 1
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // today
      label = "Current Financial Year";
      break;
    }

    case "last_fy": {
      const fyStartYear = now.getMonth() < 3 ? now.getFullYear() - 2 : now.getFullYear() - 1;
      startDate = new Date(fyStartYear, 3, 1, 0, 0, 0, 0); // Apr 1 of last FY
      endDate = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999); // Mar 31
      label = "Last Financial Year";
      break;
    }

    default:
      return;
  }

  setDateRange({ startDate, endDate, label });

  

  fetchEmployeeStats(startDate, endDate, label);
  setFilterPopup(false);
  setShowCustomRange(false);
};

// ✅ Get total days between two dates (inclusive)
const getTotalDaysInRange = (startDate, endDate) => {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor((endDate - startDate) / oneDay) + 1;
};

// ✅ Get total paid holidays = Sundays + Fixed Festival Dates
const getTotalPaidHolidaysInRange = (startDate, endDate) => {
  let holidays = 0;
  const current = new Date(startDate);

  // Count Sundays
  while (current <= endDate) {
    if (current.getDay() === 0) holidays++;
    current.setDate(current.getDate() + 1);
  }

  // Fixed national holidays
  const festivalDates = [
    { month: 0, day: 26 },  // 26 Jan
    { month: 7, day: 15 },  // 15 Aug
  ];

  const yearSpan = [];
  for (let year = startDate.getFullYear(); year <= endDate.getFullYear(); year++) {
    yearSpan.push(year);
  }

  yearSpan.forEach((year) => {
    festivalDates.forEach((f) => {
      const holiday = new Date(year, f.month, f.day);
      if (holiday >= startDate && holiday <= endDate) {
        holidays++;
      }
    });
  });

  return holidays;
};


  const handleCustomRangeSearch = () => {
  if (!customFromDate || !customToDate) {
    alert("⚠️ Please select both From and To dates.");
    return;
  }

  // parse YYYY-MM-DD into local Date (avoids UTC parsing issues)
  const [fromY, fromM, fromD] = customFromDate.split("-").map(Number);
  const [toY, toM, toD] = customToDate.split("-").map(Number);

  const from = new Date(fromY, fromM - 1, fromD, 0, 0, 0, 0);               // local 00:00:00
  const to = new Date(toY, toM - 1, toD, 23, 59, 59, 999);                 // local 23:59:59.999

  setDateRange({
    startDate: from,
    endDate: to,
    label: `Custom Range (${customFromDate} → ${customToDate})`,
  });

  fetchEmployeeStats(from, to, `Custom Range (${customFromDate} → ${customToDate})`);
  
  setFilterPopup(false);
  setShowCustomRange(false);
};



  const handleAddEmployee = async () => {
const { empId, Name, Role, username, password, mobile, salary, SubDesignation, responsible, weeklyOff } = newEmp;

  // Determine roles
  const isWorkerOrIntern =
    responsible?.toLowerCase() === "worker/helper";

  const isWI =
    responsible?.toLowerCase() === "worker/helper" ||
    responsible?.toLowerCase() === "intern";

  // ✅ Conditional validation
  if (!empId || !Name || !username || !mobile) {
    alert("⚠️ Please fill all required fields.");
    return;
  }

  // Designation is required only if not Intern or Worker/Helper
  if (!isWorkerOrIntern && !Role) {
    alert("⚠️ Please enter Designation.");
    return;
  }

  // Password required only for roles that have login
  if (!isWorkerOrIntern && !password) {
    alert("⚠️ Please enter Password.");
    return;
  }

  // SubDesignation only required for non-worker/helper and non-intern
  if (!isWI && !SubDesignation) {
    alert("⚠️ Please enter Sub-Designation.");
    return;
  }

  const userDoc = {
  Name,
  username,
  mobile,
  responsible,
  empId: empId.trim().toUpperCase(),
  weeklyOff: weeklyOff || ""   // ✅ NEW
};

  // Add fields conditionally
  if (!isWorkerOrIntern) {
    userDoc.Role = Role;
   const hashedPassword = await bcrypt.hash(password, 10);
    userDoc.password = hashedPassword;
    userDoc.SubDesignation = SubDesignation;
  } else {
    // Intern or Worker/Helper
    userDoc.Role = Role || responsible; // optional fallback
  }

  if (salary) {
    userDoc.salary = salary;
  }

  try {
    await setDoc(doc(db, "Users", empId.trim().toUpperCase()), userDoc);

    alert("✅ Employee added to Collection!");
    setNewEmp({
      empId: "",
      Name: "",
      Role: "",
      SubDesignation: "",
      responsible: "",
      username: "",
      password: "",
      mobile: "",
      salary: "",
      weeklyOff: ""   // ✅ NEW
    });
    setAddModal(false);

    // Refresh stats
    fetchEmployeeStats(
      new Date(new Date().setDate(new Date().getDate() - 30)),
      new Date(),
      "Last 30 Days"
    );
  } catch (error) {
    alert("❌ Failed to add employee.");
    console.error(error);
  }
};


// ✅ Fetch Employee Attendance History
const handleRowClick = async (emp) => {
  try {
    const q = query(
      collection(db, "attendance"),
      where("employee_id", "==", emp.id)
    );
    const snapshot = await getDocs(q);

    let data = snapshot.docs.map((doc) => {
      const d = doc.data();


      // Format approval timestamps
      const approvalDateTimeIn =
        d.approved_at_in?.toDate?.().toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }) || "—";

      const approvalDateTimeOut =
        d.approved_at_out?.toDate?.().toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        }) || "—";

      return {id: doc.id,...d, approvalDateTimeIn, approvalDateTimeOut };
    });

    // ✅ Filter by date range (or default to current month)
    const { startDate, endDate } = dateRange || getCurrentMonthRange();

    data = data.filter((record) => {
  if (!record.date) return false;
  const [day, month, year] = record.date.split("/").map(Number);
  const recordDate = new Date(year, month - 1, day);
  return recordDate >= startDate && recordDate <= endDate;
});

// ==========================================
// Build complete history including Weekly Off
// ==========================================

const finalHistory = [];

let current = new Date(startDate);


const today = new Date();
today.setHours(0, 0, 0, 0);

const maxDate = new Date(
  Math.min(endDate.getTime(), today.getTime())
);

while (current <= maxDate) {

  const dateStr = current.toLocaleDateString("en-GB");

  // Attendance exists?
  const record = data.find(r => r.date === dateStr);

  if (record) {

    finalHistory.push(record);

  } else {

    const dayName = current.toLocaleDateString("en-US", {
      weekday: "long"
    });

    if (dayName === emp.weeklyOff) {

      finalHistory.push({
        date: dateStr,
        in_time: "Weekly Off",
        out_time: "Weekly Off",
        isWeeklyOff: true
      });

    }

  }

  current.setDate(current.getDate() + 1);
}

setAttendanceHistory(finalHistory);
    setSelectedEmployeeName(emp.Name);
    setShowHistoryModal(true);
  } catch (error) {
    console.error("Error fetching history:", error);
  }
};




const getCurrentMonthRange = () => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0); // 1st of this month
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999); // last day of this month
  return { startDate, endDate, label: "Current Month" };
};

const handleClearFilters = () => {
  setSearchDate("");
  setSearchEmpID("");
  setFilteredStats(null);
  setDateSearchResults([]);

  setDateRange(null); // <-- IMPORTANT
  
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // 1st day of current month

  setSummaryHeading(`📄 Employee Summary (${startOfMonth.toLocaleDateString()} to ${today.toLocaleDateString()})`);

  fetchEmployeeStats(startOfMonth, today, "Current Month");
};

const handleOpenAbsentModal = async () => {
  const empSnap = await getDocs(collection(db, "Users"));
  const filteredUsers = empSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => user.responsible?.toLowerCase() !== "manager"); // exclude managers

  setEligibleUsers(filteredUsers);
  setShowAbsentModal(true);
};

const handleOpenPresentModal = async () => {
  const empSnap = await getDocs(collection(db, "Users"));
  const filteredUsers = empSnap.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter(user => user.responsible?.toLowerCase() !== "manager"); // exclude managers

  setEligibleUsers(filteredUsers);
  setShowPresentModal(true);
};




  const handleSearch = async () => {
  const empIDInput = searchEmpID.trim().toUpperCase();
  const dateInput = searchDate.trim();

  if (!empIDInput && !dateInput) {
    setFilteredStats(null);
    setDateSearchResults([]);
    setSummaryHeading("📄 Employee Summary");
    return;
  }

  // Load employee metadata
  const empSnap = await getDocs(collection(db, "Users"));
  const empMap = {};
  empSnap.docs.forEach(doc => {
    const emp = doc.data();
    empMap[doc.id.trim().toUpperCase()] = {
  Name: emp.Name || "N/A",
  Role: emp.Role || "N/A"
};

  });

  // -----------------------
  // CASE 1: EmpID + Date
  // -----------------------
  if (empIDInput && dateInput) {
    const selectedDate = new Date(dateInput);
    const formattedDate = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;

    if (!empMap[empIDInput]) {
      alert(`❌ No Employee Found with ID: ${searchEmpID}`);
      return;
    }

    const attendanceSnap = await getDocs(collection(db, "attendance"));
    const filteredAttendance = attendanceSnap.docs
      .map(doc => doc.data())
      .filter(entry =>
        entry.employee_id?.trim().toUpperCase() === empIDInput &&
        entry.date === formattedDate
      );

    if (filteredAttendance.length > 0) {
      const enriched = filteredAttendance.map(entry => ({
        id: empIDInput,
        Name: empMap[empIDInput].Name,
        Role: empMap[empIDInput].Role,
        timein: entry.in_time || "N/A",
        timeout: entry.out_time || "N/A"
      }));

      setDateSearchResults(enriched);
      setFilteredStats(null);
      setSummaryHeading(`📄 Attendance for ${empIDInput} on ${formattedDate}`);
    } else {
      alert(`❌ No Attendance Found for ${empIDInput} on ${formattedDate}`);
      setDateSearchResults([]);
      setFilteredStats(null);
      setSummaryHeading(`📄 No Attendance Found for ${empIDInput} on ${formattedDate}`);
    }
    return;
  }

  // -----------------------
  // CASE 2: EmpID Only
  // -----------------------
  if (empIDInput) {
    const result = employeeStats.find(
      (emp) => emp.id.trim().toUpperCase() === empIDInput
    );
    if (result) {
      setFilteredStats([result]);
      setDateSearchResults([]);
      setSummaryHeading(`📄 Employee Summary for ${empIDInput}`);
      setSearchDate("");
    } else {
      alert(`❌ No Employee Found with ID: ${searchEmpID}`);
      setFilteredStats(null);
      setDateSearchResults([]);
      setSummaryHeading("📄 Employee Summary");
    }
    return;
  }

  // -----------------------
  // CASE 3: Date Only
  // -----------------------
  if (dateInput) {
  const selectedDate = new Date(dateInput);
  const formattedDate = `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`;

  const attendanceSnap = await getDocs(collection(db, "attendance"));
  const filtered = attendanceSnap.docs
    .map(doc => doc.data())
    .filter((entry) => entry.date === formattedDate);

  if (filtered.length === 0) {
    alert(`❌ No attendance recorded on ${formattedDate}`);
    setDateSearchResults([]);
    setFilteredStats(null);
    setSummaryHeading("📄 No Attendance Found");
        setSearchDate(""); // ✅ Clear date input

    return;
  }

  const enriched = filtered.map(entry => {
    const id = entry.employee_id?.trim().toUpperCase();
    const empInfo = empMap[id] || { Name: "N/A", Role: "N/A" };
    return {
      id: id,
      Name: empInfo.Name,
      Role: empInfo.Role,
      timein: entry.in_time || "N/A",
      timeout: entry.out_time || "N/A"
    };
  });

  setDateSearchResults(enriched);
  setFilteredStats(null);
  setSummaryHeading(`📄 Attendance on ${formattedDate}`);
  setSearchDate("");

  return;
}
};


    useEffect(() => {
  const storedName = localStorage.getItem('employeeName') || 'Admin';
  setAdminName(storedName);
  
   fetchAllUsers();

  const q = query(collection(db, "attendance"), where("status", "==", "pending"));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const updatedData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setAttendanceData(updatedData);
  });

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  fetchEmployeeStats(startOfMonth, today, "Current Month");

  return () => unsubscribe();
}, []);
useEffect(() => {
  const storedName = localStorage.getItem('employeeName') || 'Admin';
  setAdminName(storedName);

  // 🔥 Real-time snapshot, no where filter, just fetch all
  const unsubscribe = onSnapshot(collection(db, "attendance"), (snapshot) => {
    const allData = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // ✅ Filter pending data here as well
    const pendingData = allData.filter(
      (entry) => entry.statusIn === "pending" || entry.statusOut === "pending"
    );

    setAttendanceData(pendingData);
  });

  // ✅ Fetch employee stats
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  fetchEmployeeStats(startOfMonth, today, "Current Month");

  return () => unsubscribe();
}, []);

useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1.0";
    document.head.appendChild(meta);

    return () => {
      document.head.removeChild(meta);
    };
  }, []);
const handleSaveEdit = async (emp) => {
  try {
    const userRef = doc(db, "Users", emp.id);

    await updateDoc(userRef, {
      Name: emp.Name,
      Role: emp.Role,
      salary: emp.salary || 0,
      SubDesignation: emp.subRole,
      responsible: emp.responsible,
      weeklyOff: emp.weeklyOff || ""
    });

    // Refresh Current Month data
    const today = new Date();
    const startOfMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    );

    await fetchEmployeeStats(
      startOfMonth,
      today,
      "Current Month"
    );

    setShowEditModal(false);
    alert("✅ Employee updated successfully!");

  } catch (error) {
    console.error("Error updating employee:", error);
    alert("❌ Failed to update employee.");
  }
};
const handleDownloadEmployeeList = async () => {
  try {
    const snap = await getDocs(collection(db, "Users"));

    // ✅ Filter employees (exclude managers)
    const employees = snap.docs
      .map(doc => doc.data())
      .filter(emp => emp.Role?.toLowerCase() !== "manager");

    if (employees.length === 0) {
      alert("No employees found!");
      return;
    }

    // ✅ Convert employees to JSON for Excel
    const worksheetData = employees.map(emp => ({
      ID: emp.username || "",
      Name: emp.Name || "",
      Designation: emp.Role || "",
      SubDesignation: emp.SubDesignation || "",
      Role: emp.responsible || "",
      Username: emp.username || "",
      Password: emp.password || "",
      salary: emp.salary || ""
    }));

    // ✅ Create worksheet & workbook
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // ✅ Export Excel
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(data, "EmployeeList.xlsx");
  } catch (err) {
    console.error("Error downloading employee list:", err);
    alert("Failed to generate employee list!");
  }
};
// ✅ Get total days in current month
const getTotalDaysInMonth = (date = new Date()) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

// ✅ Get total Sundays in current month
const getTotalSundaysInMonth = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = getTotalDaysInMonth(date);

  let sundays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay(); // 0 = Sunday
    if (day === 0) sundays++;
  }
  return sundays;
};
const handleSendOtp = async () => {
  const cleanNumber = newEmp.mobile.replace("+91", ""); // Remove any +91 prefix
  if (cleanNumber.length !== 10) {
    alert("Please enter a valid 10-digit mobile number");
    return;
  }

const phone = cleanNumber; // Option 2

  try {
    const res = await fetch("https://otp-message-16.onrender.com/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });

    const data = await res.json();
    if (data.success) {
      alert("OTP sent to mobile.");
      setOtpSent(true);
      setShowOtpModal(true);

      // Store verificationId for later verification
      localStorage.setItem("verificationId", data.verificationId);
    } else {
      alert("Failed to send OTP.");
      console.error("Send OTP error:", data);
    }
  } catch (err) {
    console.error(err);
    alert("Error sending OTP.");
  }
};

// Verify OTP
const handleVerifyOtp = async () => {
  const cleanNumber = newEmp.mobile.replace("+91", "");
const phone = cleanNumber; // Option 2
  const verificationId = localStorage.getItem("verificationId");

  if (!verificationId) {
    alert("OTP verificationId missing. Please request a new OTP.");
    return;
  }

  try {
    const res = await fetch("https://otp-message-16.onrender.com/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp: enteredOtp, verificationId }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Mobile number verified ✅");
      setNewEmp((prev) => ({ ...prev, mobileVerified: true }));
      setShowOtpModal(false);

    } else {
      alert("Invalid OTP");
      console.error("Verify OTP error:", data);
    }
  } catch (err) {
    console.error(err);
    alert("OTP verification failed");
  }
};
//for disable the salary button
const today = new Date();
const currentDay = today.getDate();

// Check if current day is between 2 and 9 (inclusive)
const isSalaryWindowOpen = currentDay >= 1 && currentDay <= 7;


  return (
    
    // <div className="admin-container">
    // <h2 className="admin-welcome">👋 Welcome, {adminName}</h2>
    
    <div className="admin-container">
      <button
        className="back-button"
        onClick={() => navigate(-1)} // go back to previous page
      >
        ⬅️ Back
      </button>
      <h1 className="admin-title">👋 Welcome, {adminName}</h1>
      <h2 className="admin-header">🛡️ Admin Panel</h2>

      <div className="admin-filters">
        <input
          type="date"
          value={searchDate}
          onChange={(e) => setSearchDate(e.target.value)}
          className="admin-input"
        />
        <input
          type="text"
          placeholder="Enter Employee ID"
          value={searchEmpID}
          onChange={(e) => setSearchEmpID(e.target.value)}
          className="admin-input"
        />
        <button className="admin-button" onClick={handleSearch}>🔍 Search</button>
        <button className="admin-button mt-2 ml-2" onClick={handleOpenAbsentModal}>
  📌 Mark Absent
</button>
<button className="admin-button mt-2 ml-2" onClick={handleOpenPresentModal}>
  ✅ Mark Present
</button>

<button
  className="admin-button mt-2 ml-2 password-btn"
  onClick={async () => {
    await fetchAllUsers();
    setShowChangePasswordModal(true);
  }}
>
  Change Password
</button>


{/* for popup  */}


{showChangePasswordModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>User Details</h2>

      {/* Search Box */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
          gap: "10px",
        }}
      >
        <input
          type="text"
          placeholder="Search User..."
          value={searchUser}
          onChange={(e) => handleUserSearch(e.target.value)}
          className="admin-input"
        />
      </div>

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Sr.No</th>
              <th>Real Name</th>
              <th>UserName</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((emp, index) => (
              <tr key={emp.id}>
                <td>{index + 1}</td>
                <td>{emp.Name}</td>
                <td>{emp.id}</td>
                <td>{emp.responsible}</td>

                <td>
                  <button
                    className="edit-btn"
                    onClick={() => {
                      setSelectedUser(emp);
                      setNewPassword("");
                      setShowPasswordEditModal(true);
                    }}
                  >
                    Change
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showPasswordEditModal && selectedUser && (
  <div className="modal-overlay">
    <div className="modal-box password-modal">
      <h2>
        User Details : {selectedUser.Name}
      </h2>

      <div className="form-row">
        <label>User Name</label>

        <input
          type="text"
          value={selectedUser.id}
          onChange={(e) =>
            setSelectedUser({
              ...selectedUser,
              id: e.target.value,
            })
          }
          className="admin-input"
        />
      </div>

<div className="form-row">
  <label>New Password</label>

  <input
    type="password"
    placeholder="Enter New Password"
    value={newPassword}
    onChange={(e) => setNewPassword(e.target.value)}
    className="admin-input"
  />
</div>

<div className="form-row">
  <label>Role</label>

  <select
    className="admin-input"
    value={selectedUser.responsible}
    onChange={(e) =>
      setSelectedUser({
        ...selectedUser,
        responsible: e.target.value,
      })
    }
  >
    <option value="">Select Role</option>
    <option value="Employee">Employee</option>
    <option value="Supervisor">Supervisor</option>
    <option value="Manager">Manager</option>
    <option value="Worker/Helper">Worker/Helper</option>
    <option value="Intern">Intern</option>
  </select>
</div>

      <div className="modal-actions">
        <button
          className="admin-button"
          onClick={() => {
            setShowPasswordEditModal(false);
            setSelectedUser(null);
            setNewPassword("");
          }}
        >
          Cancel
        </button>

        <button
          className="admin-button"
          onClick={async () => {
            try {
              const oldId = selectedUser.id;

              if (!oldId) {
                alert("User not found!");
                return;
              }

              // ✅ Fetch old user data
              const oldUserRef = doc(db, "Users", oldId);
              const oldUserSnap = await getDoc(oldUserRef);

              if (!oldUserSnap.exists()) {
                alert("User document not found!");
                return;
              }

              const oldData = oldUserSnap.data();

              // ✅ Hash new password if entered
              let updatedPassword = oldData.password;

              if (newPassword.trim() !== "") {
                updatedPassword = await bcrypt.hash(newPassword, 10);
              }

              // ✅ New updated user object
              const updatedUser = {
                ...oldData,
                username: selectedUser.id,
                responsible: selectedUser.responsible,
                password: updatedPassword,
              };

              // ✅ If username changed → create new doc + delete old doc
              if (oldId !== selectedUser.id) {
                await setDoc(doc(db, "Users", selectedUser.id), updatedUser);
                await deleteDoc(doc(db, "Users", oldId));
              } else {
                // ✅ Normal update
                await updateDoc(oldUserRef, updatedUser);
              }

              alert("✅ User updated successfully!");

              await fetchAllUsers();

              setShowPasswordEditModal(false);
              setNewPassword("");
              setSelectedUser(null);

              // Refresh table
              fetchEmployeeStats(
                new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                new Date(),
                "Current Month"
              );

            } catch (error) {
              console.error("Update Error:", error);
              alert("❌ Failed to update user");
            }
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

      <button
        className="admin-button mt-2"
        onClick={() => setShowChangePasswordModal(false)}
      >
        ✖ Close
      </button>
    </div>
  </div>
)}
      </div>
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
<p className="app-version">Version 2.1.0</p>

</div>

      

      <div className="table-container">
        <h3 className="table-heading">
          {summaryHeading}
          <button  className="filter-button" onClick={() => setFilterPopup(true)}>⚙️</button>
            <button className="clear-button" onClick={handleClearFilters}>🧹 Clear</button>

        </h3>

       
          <div className="table-scroll">
        {dateSearchResults.length > 0 ? (
  <table className="admin-table">
    <thead>
      <tr>
        <th>Emp. ID</th>
        <th>Name</th>
        <th>Designation</th>
        <th>In Time</th>
        <th>Out Time</th>
      </tr>
    </thead>
    <tbody>
      {dateSearchResults.map((entry, index) => (
        <tr key={index}>
          <td>{entry.id}</td>
          <td>{entry.Name}</td>
          <td>{entry.Role}</td>
          <td>{entry.timein}</td>
          <td>{entry.timeout}</td>
        </tr>
      ))}
    </tbody>
  </table>
) : (
  <table className="admin-table">
    <thead>
      <tr>
        <th>Emp. ID</th>
        <th>Name</th>
        <th>Designation</th>
        <th>Sub-Designation</th>
        <th>Role</th>
        <th>Total Days</th>
        <th>Weekly Off (Uptill now)</th>
        <th>Total Present</th>
        <th>Total Absent</th>
        <th>In Time</th>
        <th>Approved By (In)</th>
        <th>Out Time</th>
        <th>Approved By (Out)</th>
        <th>Approve Date</th>
        {/* <th>Salary</th> */}
        {/* ✅ Conditional Link column */}
        {employeeStats.some(emp => emp.responsible?.toLowerCase() === "worker/helper") && (
          <th>Actions</th>
        )}
        <th>Link</th>
      </tr>
    </thead>

    <tbody>
      {(filteredStats || employeeStats).map((emp) => (
        <tr key={emp.id} onClick={() => handleRowClick(emp)} style={{ cursor: "pointer" }}>
          <td>{emp.id}</td>
          <td>{emp.Name}</td>
          <td>{emp.Role}</td>
          <td>{emp.subRole || "—"}</td>
          <td>{emp.responsible}</td>

          <td>
            {dateRange?.startDate && dateRange?.endDate
              ? getTotalDaysInRange(dateRange.startDate, dateRange.endDate)
              : getTotalDaysInRange(
                  new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                  new Date()
                )}
          </td>
          <td>
            {getEmployeeWeeklyOffCount(
              emp.weeklyOff,
              dateRange?.startDate
                ? dateRange.startDate
                : new Date(new Date().getFullYear(), new Date().getMonth(), 1),

              dateRange?.endDate
                ? dateRange.endDate
                : new Date()
            )}
          </td>

          <td>{emp.present}</td>
          <td>{emp.absent}</td>
          <td>{emp.inTime || "—"}</td>
          <td>{emp.approvedByIn} ({emp.inStatus})</td>
          <td>{emp.outTime || "—"}</td>
          <td>{emp.approvedByOut} ({emp.outStatus})</td>
          <td>{emp.approveDateOut || "—"}</td>
          {/* <td>{emp.salary ? `₹${emp.salary}` : "—"}</td> */}

          <td>
            <button
              className="edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setEditEmployee(emp);
                setShowEditModal(true);
              }}
            >
              ✏️ Edit
            </button>
          </td>

           {emp.responsible?.toLowerCase() === "worker/helper" && (
              <td>
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation();

                    // Generate link with employee info as query parameters
                    const link = `${window.location.origin}/worker-link?empId=${emp.id}&name=${encodeURIComponent(emp.Name)}`;

                    // Copy link to clipboard
                    navigator.clipboard.writeText(link)
                      .then(() => {
                        alert("🔗 Link copied to clipboard! You can share or paste it later.");
                      })
                      .catch((err) => console.error("Failed to copy: ", err));
                  }}
                >
                  🔗 Link
                </button>
              </td>
            )}



        </tr>
      ))}
    </tbody>
  </table>
)}

        </div>
      </div>

      {filterPopup && (
  <div className="popup-overlay">
    <div className="popup-box horizontal-filter">
      <h3>📊 Select Filter</h3>
      <div className="filter-content">
        {/* Predefined Filters */}
        <div className="predefined-filters">
          {[
            { key: "last_day", label: "Last Day" },
            { key: "last_week", label: "Last Week" },
            { key: "last_month", label: "Last Month" },
            { key: "last_3_months", label: "Last 3 Months" },
            { key: "last_6_months", label: "Last 6 Months" },
            { key: "current_fy", label: "Current Financial Year" },
            { key: "last_fy", label: "Last Financial Year" },
          ].map(opt => (
            <button
              key={opt.key}
              className="admin-button mb-2"
              onClick={() => handleFilterSearch(opt.key)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Date Range Section */}
        <div className="date-range-section">
          <h4>📅 Date Range Search</h4>
          <label>From:</label>
          <input
            type="date"
            value={customFromDate}
            onChange={(e) => setCustomFromDate(e.target.value)}
          />
          <label>To:</label>
          <input
            type="date"
            value={customToDate}
            onChange={(e) => setCustomToDate(e.target.value)}
          />
          <button className="admin-button mt-2" onClick={handleCustomRangeSearch}>
            🔍 Search
          </button>
          

        </div>
      </div>
      <button onClick={() => setFilterPopup(false)} className="admin-button mt-2">
        ✖ Close
      </button>
    </div>
  </div>
)}


 <div className="bottom-buttons">
  <button className="btn-action" onClick={handleDownloadEmployeeList}>
    ⬇️ Download Employee List
  </button>

  <button className="btn-action" onClick={() => setShowModal(true)}>✅ Show Approvals</button>
  <button className="btn-action" onClick={() => setAddModal(true)}>➕ Add Employee</button>
  <button className="btn-action" onClick={() => setDeleteModal(true)}>🗑 Remove Employee</button>
<button
  className="btn-action"
  onClick={() => setDownloadModal(true)}
>
  📥 Download Attendance
</button>{/* 
  <button
  className="admin-button mt-2"
  // onClick={handleDownloadAttendance}
>
  📥 Download Attendance
</button> */}

  {/* <button
      className="btn-action"
      onClick={() => setShowSalaryModal(true)}
      disabled={!isSalaryWindowOpen}
      style={{
        opacity: isSalaryWindowOpen ? 1 : 0.5,
        cursor: isSalaryWindowOpen ? "pointer" : "not-allowed",
      }}
    >
      💰 Show Salary
    </button> */}
    </div>



      {addModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>➕ Add New Employee</h2>

      {/* Role Dropdown */}
      <select
        value={newEmp.responsible || ""}
        onChange={(e) => handleRoleChange(e.target.value)}
        className="admin-input mb-4"
      >
        <option value="">Select Role</option>
        <option value="Employee">Employee</option>
        <option value="Supervisor">Supervisor</option>
        <option value="Manager">Manager</option>
        <option value="Worker/Helper">Worker/Helper</option>
        <option value="Intern">Intern</option>
      </select>

      {/* Employee ID */}
      <input
        type="text"
        placeholder="Employee ID"
        value={newEmp.empId}
        onChange={(e) => setNewEmp({ ...newEmp, empId: e.target.value })}
        className="admin-input mb-2"
      />

      {/* Name */}
      <input
        type="text"
        placeholder="Name"
        value={newEmp.Name}
        onChange={(e) => setNewEmp({ ...newEmp, Name: e.target.value })}
        className="admin-input mb-2"
      />

      {/* Username */}
      <input
        type="text"
        placeholder="Username"
        value={newEmp.username || ""}
        onChange={(e) => setNewEmp({ ...newEmp, username: e.target.value })}
        className="admin-input mb-2"
      />

      {/* ✅ Password — hide for Worker/Helper */}
      {newEmp.responsible?.toLowerCase() !== "worker/helper" && (
        <input
          type="password"
          placeholder="Password"
          value={newEmp.password || ""}
          onChange={(e) => setNewEmp({ ...newEmp, password: e.target.value })}
          className="admin-input mb-2"
        />
      )}

      {/* Mobile Number */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Mobile Number"
          value={newEmp.mobile}
          onChange={(e) => {
            let value = e.target.value.trim();
            value = value.replace(/[^0-9]/g, "");
            if (value.length > 10) value = value.slice(0, 10);
            setNewEmp({ ...newEmp, mobile: value });
          }}
          className="admin-input pr-10"
          disabled={newEmp.mobileVerified}
        />

        {newEmp.responsible?.toLowerCase() === "manager" && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
            onClick={handleSendOtp}
          >
            ✅
          </button>
        )}
      </div>

      {/* Designation */}
      <input
        type="text"
        placeholder="Designation"
        value={newEmp.Role}
        onChange={(e) => setNewEmp({ ...newEmp, Role: e.target.value })}
        className="admin-input mb-4"
      />

      {/* ✅ Sub-Designation — hide for Worker/Helper */}
      {newEmp.responsible?.toLowerCase() !== "worker/helper" &&
        newEmp.responsible?.toLowerCase() !== "intern" && (
        <input
          type="text"
          placeholder="Sub-Designation"
          value={newEmp.SubDesignation}
          onChange={(e) => setNewEmp({ ...newEmp, SubDesignation: e.target.value })}
          className="admin-input mb-4"
        />
      )}
      {/* Weekly Off */}
      {/* <label>Weekly Off</label> */}
      <select
        value={newEmp.weeklyOff || ""}
        onChange={(e) => setNewEmp({ ...newEmp, weeklyOff: e.target.value })}
        className="admin-input mb-4"
      >
        <option value="">Select Weekly Off</option>
        <option value="Sunday">Sunday</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
      </select>

      {/* Salary */}
      {/* <input
        type="number"
        placeholder="Salary"
        value={newEmp.salary || ""}
        onChange={(e) => setNewEmp({ ...newEmp, salary: e.target.value })}
        className="admin-input mb-4"
      /> */}

      {/* Buttons */}
      <button className="admin-button" onClick={handleAddEmployee}>Submit</button>
      <button className="admin-button mt-2" onClick={() => setAddModal(false)}>✖ Close</button>
    </div>
  </div>
)}



        <div className="table-scroll">
    {showModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>📝 Pending Approvals</h2>

      {attendanceData.filter(entry => entry.statusIn === "pending" || entry.statusOut === "pending").length === 0 ? (
        <p className="no-data-text">No pending attendance found.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Emp. ID</th>
              <th>Name</th>
              <th>Date</th>
              <th>In Time</th>
              <th>Out Time</th>
              <th>In Location</th>
              <th>Out Location</th>
              <th>Status (In/Out)</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attendanceData
              .filter(entry => entry.statusIn === "pending" || entry.statusOut === "pending")
              .map((entry) => (
                <tr key={entry.id}>
                <td>{entry.employee_id}</td>
                <td>{entry.name}</td>
                <td>{entry.date}</td>
                <td>{entry.in_time || "❌ Not Marked"}</td>
                <td>{entry.out_time || "❌ Not Marked"}</td>

                <td>
                  {entry.in_address === "Outside Company Location" || entry.in_address === "Unknown Location"
                    ? `${entry.in_latitude || "-"}, ${entry.in_longitude || "-"}`
                    : entry.in_address || "—"}
                </td>

                <td>
                  {entry.out_address === "Outside Company Location" || entry.out_address === "Unknown Location"
                    ? `${entry.out_latitude || "-"}, ${entry.out_longitude || "-"}`
                    : entry.out_address || "—"}
                </td>
                  
                  <td>
                    <span className={entry.statusIn === "pending" ? "badge-pending" : "badge-approved"}>
                      In: {entry.statusIn || "N/A"}
                    </span>
                    {" | "}
                    <span className={entry.statusOut === "pending" ? "badge-pending" : "badge-approved"}>
                      Out: {entry.statusOut || "N/A"}
                    </span>
                  </td>
                  <td>
                    {/* ✅ APPROVE BUTTON */}
                    <button
  disabled={processingId === entry.id}
  onClick={async () => {
    if (processingId) return;
    setProcessingId(entry.id);

    const adminName = localStorage.getItem("employeeName") || "Admin";
    const updatePayload = {};

    try {
      // ✅ Fetch the employee role/responsible first
      const userSnap = await getDocs(
        query(collection(db, "Users"), where("username", "==", entry.employee_id))
      );
      let responsible = "";
      if (!userSnap.empty) {
        responsible = userSnap.docs[0].data().responsible || "";
      }

      // ✅ Determine ApprovedBy name
      const approverName = responsible === "Worker/Helper" ? "—" : adminName;

      // ✅ Approve both if both pending
      if (entry.statusIn === "pending") {
        updatePayload.statusIn = "approved";
        updatePayload.approvedByIn = adminName;
        updatePayload.approved_at_in = serverTimestamp();
      }
      if (entry.statusOut === "pending") {
        updatePayload.statusOut = "approved";
        updatePayload.approvedByOut = approverName;
        updatePayload.approved_at_out = serverTimestamp();
      }

      // ✅ Update Firestore
      await updateDoc(doc(db, "attendance", entry.id), updatePayload);

      // ✅ Update local state
      const updatedAttendanceData = attendanceData.map((a) =>
        a.id === entry.id ? { ...a, ...updatePayload } : a
      );
      const empRecords = updatedAttendanceData.filter(
        (a) => a.employee_id === entry.employee_id
      );

      const totalPresent = empRecords.filter(
        (r) => r.statusIn === "approved" && r.statusOut === "approved"
      ).length;
      const totalAbsent = empRecords.filter(
        (r) => r.statusIn === "disapproved" && r.statusOut === "disapproved"
      ).length;

      setEmployeeStats((prevStats) =>
        prevStats.map((emp) =>
          emp.id === entry.employee_id
            ? { ...emp, present: totalPresent, absent: totalAbsent }
            : emp
        )
      );
    } catch (err) {
      console.error("Error approving:", err);
    } finally {
      setTimeout(() => setProcessingId(null), 100);
    }
  }}
>
  {processingId === entry.id ? "Processing..." : "✅"}
</button>


                    {/* ❌ DISAPPROVE BUTTON */}
                    <button
                      disabled={processingId === entry.id}
                      onClick={async () => {
                        if (processingId) return;
                        setProcessingId(entry.id);

                        const adminName = localStorage.getItem("employeeName") || "Admin";
                        const updatePayload = {};

                        // ❌ Disapprove both if both are pending
                        if (entry.statusIn === "pending") {
                          updatePayload.statusIn = "disapproved";
                          updatePayload.approvedByIn = adminName;
                          updatePayload.approved_at_in = serverTimestamp();
                        }
                        if (entry.statusOut === "pending") {
                          updatePayload.statusOut = "disapproved";
                          updatePayload.approvedByOut = adminName;
                          updatePayload.approved_at_out = serverTimestamp();
                        }

                        try {
                          await updateDoc(doc(db, "attendance", entry.id), updatePayload);
                          await fetchAttendance();
                         const empRecords = attendanceData.filter(a => a.employee_id === entry.employee_id);
                          const totalPresent = empRecords.filter(r => r.statusIn === "approved" && r.statusOut === "approved").length;
                          const totalAbsent = empRecords.filter(r => r.statusIn === "disapproved" && r.statusOut === "disapproved").length;
                          setEmployeeStats(prevStats =>
                          prevStats.map(emp =>
                            emp.id === entry.employee_id
                              ? { ...emp, present: totalPresent, absent: totalAbsent }
                              : emp
                          )
                        );
                        } finally {
                          setTimeout(() => setProcessingId(null), 100);
                        }
                      }}
                    >
                      {processingId === entry.id ? "Processing..." : "❌"}
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      <button className="admin-button mt-2" onClick={() => setShowModal(false)}>
        ✖ Close
      </button>
    </div>
  </div>
)}

{downloadModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <div>
          <label>From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="admin-input"
          />
        </div>

        <div>
          <label>To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="admin-input"
          />
        </div>
      </div>
      <h2>📥 Select Employees</h2>

      <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: "10px" }}>
        <table className="admin-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ width: "60px", textAlign: "center" }}>Select</th>
              <th>Employee ID</th>
              <th>Name</th>
            </tr>
          </thead>

          <tbody>
            {employeeStats.map((emp) => (
              <tr key={emp.id}>
                <td style={{ textAlign: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                  />
                </td>

                <td>{emp.id}</td>
                <td>{emp.Name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="modal-actions" style={{ marginTop: "15px" }}>
        <button className="admin-button"   onClick={handleDownloadSelected}
>
          ⬇ Download
        </button>

        <button className="admin-button" onClick={handleClearSelection}>
          🧹 Clear
        </button>

        <button className="admin-button" onClick={handleSelectAll}>
          ✔ Select All
        </button>

        <button
          className="admin-button"
          onClick={() => setDownloadModal(false)}
        >
          ✖ Close
        </button>
      </div>
    </div>
  </div>
)}
{showHistoryModal && (
  <div className="attendance-history-overlay">
    <div className="attendance-history-box">
      <div className="attendance-history-header">
        <h3>Attendance History for {selectedEmployeeName}</h3>
        <button
          className="attendance-history-close"
          onClick={() => setShowHistoryModal(false)}
        >
          Close
        </button>
      </div>

      <div className="attendance-history-table-container">
        <table className="attendance-history-table">
          <thead>
          <tr>
            <th>Date</th>
            <th>Status In</th>
            <th>Approved By (In)</th>
            <th>In Time</th>
            <th>In Location</th>   {/* NEW */}
            <th>Status Out</th>
            <th>Approved By (Out)</th>
            <th>Out Time</th>
            <th>Out Location</th>  {/* NEW */}
            <th>Approval Date</th>
            <th>Note</th>   {/* NEW */}

          </tr>
        </thead>
          <tbody>
            {attendanceHistory
              .slice()
              .sort((a, b) => {
                const [dayA, monthA, yearA] = a.date.split("/").map(Number);
                const [dayB, monthB, yearB] = b.date.split("/").map(Number);
                return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
              })
              .map((record, idx) => {
                // ✅ Apply row color based on approval
                const rowClass =
                record.isWeeklyOff
                  ? "row-weeklyoff"
                  : record.statusOut === "approved"
                  ? "row-approved"
                  : record.statusOut === "pending"
                  ? "row-pending"
                  : "row-rejected";

              return (
                <tr key={idx} className={rowClass}>
                  <td>{record.date || "—"}</td>
                  <td>{record.statusIn || "—"}</td>
                  <td>{record.approvedByIn || "—"}</td>
                  <td>{record.in_time || "—"}</td>

                  {/* ✅ In Location */}
                  <td>
                    {record.in_address === "Outside Company Location" ||
                    record.in_address === "Unknown Location"
                      ? `${record.in_latitude || "-"}, ${record.in_longitude || "-"}`
                      : record.in_address || "—"}
                  </td>

                  <td>{record.statusOut || "—"}</td>
                  <td>{record.approvedByOut || "—"}</td>
                  <td>{record.out_time || "—"}</td>

                  {/* ✅ Out Location */}
                  <td>
                    {record.out_address === "Outside Company Location" ||
                    record.out_address === "Unknown Location"
                      ? `${record.out_latitude || "-"}, ${record.out_longitude || "-"}`
                      : record.out_address || "—"}
                  </td>

                  <td>{record.approvalDateTimeOut}</td>
                  <td>
                  <button
                  className="note-btn"
                  onClick={() => {
                    setSelectedRecord(record);
                    setNoteText(record.admin_note || "");
                    setShowHistoryModal(false);
                    setShowNoteModal(true);
                  }}
                >
                  {record.admin_note ? "View Note" : "Add Note"}
                </button>
                </td>
                </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{/* //new */}

{showNoteModal && (
  <div className="note-overlay">
    <div className="note-box">
      <h3>Add Note</h3>

      <textarea
        placeholder="Write your note here..."
        value={noteText}
        onChange={(e) => setNoteText(e.target.value)}
      />

      <div className="note-buttons">
        <button
          onClick={async () => {
            try {
              if (!selectedRecord?.id) return;

              const attendanceRef = doc(db, "attendance", selectedRecord.id);

              await updateDoc(attendanceRef, {
                admin_note: noteText,
                note_updated_at: new Date()
              });

              console.log("Note saved successfully");

              setShowNoteModal(false);
              setNoteText("");

            } catch (error) {
              console.error("Error saving note:", error);
            }
          }}
        >
          Save
        </button>

        <button onClick={() => setShowNoteModal(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}


{(showPresentModal || showAbsentModal) && (
  <div className="custom-modal-overlay">
    <div className="custom-modal-box">
      <h3>
        📋 Mark {showPresentModal ? "Present" : "Absent"} - Select Users & Dates
      </h3>

      <button
        className="custom-clear-btn"
        onClick={() => {
          if (showPresentModal) setShowPresentModal(false);
          else setShowAbsentModal(false);
        }}
      >
        ❌ Close
      </button>

      {eligibleUsers.length === 0 ? (
        <p style={{ marginTop: '20px', color: 'red' }}>
          ⚠️ No eligible users to display.
        </p>
      ) : (
        <table className="custom-admin-table">
          <thead>
            <tr>
              <th>Emp ID</th>
              <th>Name</th>
              <th>Role</th>
              <th>Select Date</th>
            </tr>
          </thead>
          <tbody>
            {eligibleUsers.map((user) => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.Name || user.name || "N/A"}</td>
                <td>{user.Role || "N/A"}</td>
                <td>
                  <input
                    type="date"
                    value={
                      showPresentModal
                        ? selectedPresentDates[user.id] || ""
                        : selectedAbsentDates[user.id] || ""
                    }
                    onChange={(e) => {
                      const date = e.target.value;
                      if (showPresentModal) {
                        setSelectedPresentDates((prev) => ({
                          ...prev,
                          [user.id]: date,
                        }));
                      } else {
                        setSelectedAbsentDates((prev) => ({
                          ...prev,
                          [user.id]: date,
                        }));
                      }
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <button
        className="custom-mark-btn"
        onClick={showPresentModal ? handleMarkPresent : handleMarkAbsent}
      >
        ✅ Mark {showPresentModal ? "Present" : "Absent"}
      </button>
    </div>
  </div>
)}
{deleteModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>🗑 Remove Employee</h2>

      {/* Search Input with Suggestions */}
      <div className="relative mb-2">
        <input
          type="text"
          placeholder="Enter Employee ID or Name"
          value={deleteEmpId}
          onChange={handleSearchChange}
          className="admin-input w-full"
        />

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg z-10">
            {suggestions.map((emp, index) => (
              <li
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectSuggestion(emp)}
              >
                {emp.empId} - {emp.Name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="admin-button" onClick={fetchEmployeeDetails}>
        🔍 Search Employee
      </button>

      {empToDelete && (
        <div className="employee-details mt-3 border-t pt-3">
          <p><b>Name:</b> {empToDelete.Name}</p>
          <p><b>Role:</b> {empToDelete.Role}</p>
          <p><b>Username:</b> {empToDelete.username}</p>
          <p><b>Mobile:</b> {empToDelete.mobile}</p>

          <button className="admin-button delete-btn mt-3" onClick={handleDeleteEmployee}>
            🚨 Confirm Remove
          </button>
        </div>
      )}

      <button className="admin-button mt-3" onClick={() => setDeleteModal(false)}>
        ✖ Close
      </button>
    </div>
  </div>
)}


{showEditModal && editEmployee && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>Edit Employee</h2>

      <label>Emp. ID</label>
      <input
        type="text"
        value={editEmployee.id}
        onChange={(e) => setEditEmployee({ ...editEmployee, id: e.target.value })}
      />

      <label>Name</label>
      <input
        type="text"
        value={editEmployee.Name}
        onChange={(e) => setEditEmployee({ ...editEmployee, Name: e.target.value })}
      />

      <label>Designation</label>
      <input
        type="text"
        value={editEmployee.Role}
        onChange={(e) => setEditEmployee({ ...editEmployee, Role: e.target.value })}
      />
      <label>Sub-Designation</label>
      <input
        type="text"
        value={editEmployee.subRole}
        onChange={(e) => setEditEmployee({ ...editEmployee, subRole: e.target.value })}
      />
      <label>Weekly Off</label>
      <select
        className="modal-input"
        value={editEmployee.weeklyOff || ""}
        onChange={(e) =>
          setEditEmployee({ ...editEmployee, weeklyOff: e.target.value })
        }
      >
        <option value="">Select Day</option>
        <option value="Sunday">Sunday</option>
        <option value="Monday">Monday</option>
        <option value="Tuesday">Tuesday</option>
        <option value="Wednesday">Wednesday</option>
        <option value="Thursday">Thursday</option>
        <option value="Friday">Friday</option>
        <option value="Saturday">Saturday</option>
      </select>

      <div className="modal-actions">
        <button onClick={() => setShowEditModal(false)}>Cancel</button>
        <button onClick={() => handleSaveEdit(editEmployee)}>Save</button>
      </div>
    </div>
  </div>
)}
{/* {showSalaryModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h2>💰 Salary Calculator</h2> */}

      {/* Search Employee by ID */}
      {/* <input
        type="text"
        placeholder="Enter Employee ID (username)"
        value={searchEmpId}
        onChange={(e) => setSearchEmpId(e.target.value)}
        className="input-box"
      />

      <button
        className="btn-action"
        onClick={async () => {
          setLoadingSalary(true);
          setSalaryError("");
          setSalaryDetails(null);

          try {
            // 🔹 Step 1: Fetch Employee Data from Users
            const q = query(
              collection(db, "Users"),
              where("username", "==", searchEmpId)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
              setSalaryError("⚠️ Employee not found!");
              return;
            }

            const userData = snapshot.docs[0].data();
            const empID = userData.username;

            // 🔹 Step 2: Fetch Attendance for last month
            const attQuery = query(
              collection(db, "attendance"),
              where("employee_id", "==", empID)
            );
            const attSnap = await getDocs(attQuery);
            const allAttendance = attSnap.docs.map((doc) => doc.data());

            if (allAttendance.length === 0) {
              setSalaryError("⚠️ No attendance records found!");
              return;
            }

            // Pick last completed month
            const grouped = {};
            allAttendance.forEach((record) => {
              if (!record.timestamp) return;
              const attDate = record.timestamp.toDate
                ? record.timestamp.toDate()
                : new Date(record.timestamp);

              const monthKey = attDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              });

              if (!grouped[monthKey]) {
                grouped[monthKey] = {
                  month: monthKey,
                  totalDays: new Date(attDate.getFullYear(), attDate.getMonth() + 1, 0).getDate(),
                  sundays: 0,
                  present: 0,
                  absent: 0,
                };
              }

              // 🔹 Compute unified status
              let status = "pending"; // default
              if (record.statusIn && record.statusOut) {
                status =
                  record.statusIn === "approved" && record.statusOut === "approved"
                    ? "approved"
                    : "pending";
              } else if (record.status) {
                status = record.status;
              }

              // Count present / absent based on unified status
              if (status === "approved") grouped[monthKey].present++;
              else if (status === "disapproved") grouped[monthKey].absent++;
            });


            // Find last month data
            // Find last *completed* month (second-to-last in sorted list)
              const sortedMonths = Object.keys(grouped).sort(
                (a, b) => new Date(a) - new Date(b)
              );

              if (sortedMonths.length < 2) {
                setSalaryError("⚠️ No previous month data available!");
                setLoadingSalary(false);
                return;
              }

              const lastMonthKey = sortedMonths[sortedMonths.length - 2];
              const lastMonthData = grouped[lastMonthKey];


            // Count Sundays
            const [monthName, year] = lastMonthKey.split(" ");
            const monthIndex = new Date(`${monthName} 1, ${year}`).getMonth();
            let sundayCount = 0;
            for (let day = 1; day <= lastMonthData.totalDays; day++) {
              const d = new Date(year, monthIndex, day);
              if (d.getDay() === 0) sundayCount++;
            }
            lastMonthData.sundays = sundayCount;

            // Salary Calculation
            const totalSalary = userData.salary;
            const perDaySalary = totalSalary / lastMonthData.totalDays;
            const effectiveDays = lastMonthData.present + lastMonthData.sundays;
            const finalSalary = (perDaySalary * effectiveDays).toFixed(2);

            setSalaryDetails({
              ...userData,
              ...lastMonthData,
              totalSalary,
              perDaySalary: perDaySalary.toFixed(2),
              effectiveDays,
              finalSalary,
            });
          } catch (err) {
            console.error(err);
            setSalaryError("❌ Error calculating salary");
          } finally {
            setLoadingSalary(false);
          }
        }}
      > */}
        {/* {loadingSalary ? "Calculating..." : "🔍 Calculate Salary"}
      </button> */}

      {/* Errors */}
      {/* {salaryError && <p className="error-text">{salaryError}</p>} */}

      {/* Salary Output */}
      {/* {salaryDetails && (
        <div className="salary-info">
          <h3>Salary Calculation</h3>
          <p><b>Month:</b> {salaryDetails.month}</p>
          <p><b>Total Salary (Fixed):</b> ₹{salaryDetails.totalSalary}</p>
          <p><b>Total Days:</b> {salaryDetails.totalDays}</p>
          <p><b>Sundays:</b> {salaryDetails.sundays}</p>
          <p><b>Present Days:</b> {salaryDetails.present}</p>
          <p><b>Effective Days (Present + Sundays):</b> {salaryDetails.effectiveDays}</p>
          <p><b>Per Day Salary:</b> ₹{salaryDetails.perDaySalary}</p>
          <h3>✅ Final In-hand Salary: ₹{salaryDetails.finalSalary}</h3>
        </div>
      )}

      <button className="close-btn" onClick={() => setShowSalaryModal(false)}>
        Close
      </button>
    </div>
  </div>
)} */}
{showOtpModal && (
  <div className="modal-overlay">
    <div className="modal-box">
      <h3>🔑 Enter OTP</h3>
      <input
        type="text"
        value={enteredOtp}
        onChange={(e) => setEnteredOtp(e.target.value)}
        className="admin-input mb-2"
        placeholder="Enter OTP"
      />
      <button className="admin-button" onClick={handleVerifyOtp}>
        Verify OTP
      </button>
      <button
        className="admin-button mt-2"
        onClick={() => setShowOtpModal(false)}
      >
        ✖ Cancel
      </button>
    </div>
  </div>
)}


      </div>
      
    </div>
    
  );
}
//last one