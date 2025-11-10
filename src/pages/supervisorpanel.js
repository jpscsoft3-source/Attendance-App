import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  query,
  where,
  
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "./supervisorpanel.css";
import { ToastContainer, toast } from "react-toastify";


const SupervisorPanel = () => {
  const [requests, setRequests] = useState([]);
  const [onLeaveToday, setOnLeaveToday] = useState([]);
  const [requestHistory, setRequestHistory] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: "",
    employeeId: "",
    Role: "employee",
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const allData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const today = new Date().toISOString().split("T")[0];

      const approvedToday = allData.filter(
        (item) =>
          item.status === "approved" &&
          today >= item.fromDate &&
          today <= item.toDate
      );

      const pendingRequests = allData.filter((item) => item.status === "pending");

      setOnLeaveToday(approvedToday);
      setRequests(pendingRequests);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const allData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const historyData = allData
        .filter((item) => item.status === "approved" || item.status === "rejected")
        .sort((a, b) => new Date(b.fromDate) - new Date(a.fromDate));

      setRequestHistory(historyData);
    });

    return () => unsubscribe();
  }, []);

 const handleAction = async (id, action) => {
  const leaveRef = doc(db, "leaveRequests", id);
  const approverName = localStorage.getItem("employeeName") || "Unknown";

  try {
    // 1️⃣ Update leave request status first
    await updateDoc(leaveRef, {
      status: action,
      approvedBy: approverName,
    });

    // 2️⃣ If approved → deduct from remainingLeaves balance
    if (action === "approved") {
      // Fetch the leave request data (so we know employeeId and leaveDays)
      const reqSnap = await getDocs(
        query(collection(db, "leaveRequests"), where("__name__", "==", id))
      );

      if (!reqSnap.empty) {
        const reqData = reqSnap.docs[0].data();
        console.log("✅ Approving leave request for:", reqData.username, reqData);

        // Fetch remainingLeaves document for this employee
        const leavesRef = collection(db, "remainingLeaves");
        const q = query(leavesRef, where("employeeId", "==", reqData.username));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const docRef = snapshot.docs[0].ref;
          const data = snapshot.docs[0].data();

          const currentPaid = data.balance?.Paid ?? 0;
          const newPaid = Math.max(0, currentPaid - reqData.leaveDays);

          await updateDoc(docRef, {
            "balance.Paid": newPaid,
            updatedAt: new Date().toISOString(),
          });

          console.log(`✅ Remaining Paid leaves updated: ${currentPaid} → ${newPaid}`);
        } else {
          console.warn(`⚠️ No remainingLeaves document found for ${reqData.username}`);
        }
      }
    }

    toast.success(`✅ Leave ${action} successfully.`);
  } catch (error) {
    console.error("Error updating document:", error);
    toast.error("❌ Failed to update leave status.");
  }
};



  const handleAddMember = async () => {
    const { name, employeeId, password, Role } = newMember;

    if (!name || !employeeId || !password || !Role) {
      alert("All fields are required!");
      return;
    }

    try {
      await addDoc(collection(db, "Users"), newMember);
      setModalOpen(false);
      setNewMember({ name: "", employeeId: "", Role: "employee", password: "" });
    } catch (error) {
      console.error("Error adding member:", error);
    }
  };

  return (
    <div className="wrapper">
      <div className="topBar">
        {/* <button className="topButton" onClick={() => setModalOpen(true)}>Add Member</button> */}
        <div className="topLeftButtons">
          <button className="topButton" onClick={() => navigate(-1)}>Back</button>
          <button className="topButton" onClick={() => navigate("/")}>Logout</button>
        </div>
      </div>

      <div className="page">
        {/* LEFT: Leave Requests */}
        <div className="tableContainer scrollable left-panel">
  <h2 className="heading">Leave Requests</h2>
  <table className="table">
    <thead>
      <tr>
        <th>Emp. ID</th>
        <th>Name</th>
        <th>From</th>
        <th>To</th>
        <th>Reason</th>
        <th>Action</th>
      </tr>
    </thead>
    <tbody>
      {requests.map((req) => (
        <tr key={req.id}>
          <td>{req.username}</td> {/* Firestore field: username = EMP ID */}
          <td>{req.Name}</td>     {/* Firestore field: Name */}
          <td>{req.fromDate}</td>
          <td>{req.toDate}</td>
          <td>{req.reason}</td>
          <td>
            <button className="actionButton approveBtn" onClick={() => handleAction(req.id, "approved")}>Approve</button>
            <button className="actionButton rejectBtn" onClick={() => handleAction(req.id, "rejected")}>Reject</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


        {/* RIGHT: On Leave Today & History */}
        <div className="rightPanel">
          <div className="tableContainer">
            <h2 className="heading">On Leave Today</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Emp. ID</th>
                  <th>Name</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Leave Days</th>
                  <th>Alternate Person</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {onLeaveToday.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.username}</td>
                    <td>{emp.Name}</td>
                    <td>{emp.fromDate}</td>
                    <td>{emp.toDate}</td>
                    <td>{emp.leaveDays}</td>
                    <td>{emp.alternatePerson}</td>
                    <td>{emp.approvedBy || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="tableContainer">
            <h2 className="heading">Request History</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Emp. ID</th>
                  <th>Name</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Approved By</th>
                </tr>
              </thead>
              <tbody>
                {requestHistory.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.username}</td>
                    <td>{emp.Name}</td>
                    <td>{emp.fromDate}</td>
                    <td>{emp.toDate}</td>
                    <td>{emp.reason}</td>
                    <td className={emp.status === "approved" ? "approvedText" : "rejectedText"}>
                      {emp.status}
                    </td>
                    <td>{emp.approvedBy || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="modalOverlay">
          <div className="modal">
            <input className="input" placeholder="Employee ID" value={newMember.employeeId} onChange={(e) => setNewMember({ ...newMember, employeeId: e.target.value })} />
            <input className="input" placeholder="Name" value={newMember.name} onChange={(e) => setNewMember({ ...newMember, name: e.target.value })} />
            <input className="input" type="password" placeholder="Password" value={newMember.password} onChange={(e) => setNewMember({ ...newMember, password: e.target.value })} />
            <select className="input" value={newMember.Role} onChange={(e) => setNewMember({ ...newMember, Role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="supervisor">Supervisor</option>
            </select>
            <div className="modalButtons">
              <button className="submitBtn" onClick={handleAddMember}>Add Member</button>
              <button className="submitBtn cancelBtn" onClick={() => {
                setModalOpen(false);
                setNewMember({ name: "", employeeId: "", Role: "employee", password: "" });
              }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorPanel;