import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDocs,
  setDoc,
  query,
  where,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./managerpanel.css";

const Managerpanel = () => {
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
  const [leaveUpdateModal, setLeaveUpdateModal] = useState(false);
  const [leaveUpdateData, setLeaveUpdateData] = useState({
    employeeId: "",
    name: "",
    leaveType: "paid",
    count: 0,
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "leaveRequests"), (snapshot) => {
      const allData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => new Date(b.timestamp?.toDate?.()) - new Date(a.timestamp?.toDate?.()));

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
      setRequestHistory(allData);
    });

    return () => unsubscribe();
  }, []);


useEffect(() => {
  const fetchName = async () => {
    if (leaveUpdateData.employeeId.trim() === "") return;

    const q = query(
      collection(db, "Users"), // ✅ correct collection
where("username", "==", leaveUpdateData.employeeId.trim())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const user = snapshot.docs[0].data();
      setLeaveUpdateData((prev) => ({ ...prev, name: user.Name })); // ✅ use `Name` from Firestore
    } else {
      setLeaveUpdateData((prev) => ({ ...prev, name: "" })); // clear if not found
    }
  };

  fetchName();
}, [leaveUpdateData.employeeId]);



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


  const handleAddLeavesToEmployee = async () => {
  // Map lowercase name to capital Name
  const { employeeId, name, leaveType, count } = leaveUpdateData;
  const Name = name; // ✅ Create a capitalized variable

  console.log("leaveUpdateData:", leaveUpdateData);

  if (!employeeId || !Name || Number(count) <= 0) {
    toast.error("Please fill all fields correctly!");
    return;
  }

  if (leaveType.toLowerCase() !== "paid") {
    toast.error("❌ Only Paid Leaves can be added!");
    return;
  }

  try {
    const today = new Date();
    const dateKey = today.toISOString().split("T")[0];
    const customDocId = `${employeeId}_${dateKey}`;

    const leaveRef = doc(db, "remainingLeaves", customDocId);

    const snapshot = await getDocs(
      query(collection(db, "remainingLeaves"), where("employeeId", "==", employeeId))
    );

    let existingBalance = 0;
    if (!snapshot.empty) {
      const docSnap = snapshot.docs.find((d) => d.id === customDocId);
      if (docSnap) {
        existingBalance = docSnap.data()?.balance?.Paid || 0;
      }
    }

    const updatedBalance = existingBalance + Number(count);

    await setDoc(leaveRef, {
      employeeId,
      Name, // ✅ Use the mapped Name
      balance: { Paid: updatedBalance },
      updatedAt: today.toISOString(),
    });

    toast.success(`✅ Added ${count} Paid leaves for ${employeeId}`);
    setLeaveUpdateModal(false);
    setLeaveUpdateData({ employeeId: "", name: "", leaveType: "paid", count: 0 }); // still lowercase, since that's how your state is set
  } catch (error) {
    console.error("Error updating Paid leaves:", error);
    toast.error("❌ Failed to update Paid leaves. Please try again.");
  }
};


  return (
    <div className="wrapper">
      <div className="topBar">
        <div className="topLeftButtons">
          {/* <button className="topButton" onClick={() => setModalOpen(true)}>Add Member</button> */}
          <button className="topButton" onClick={() => setLeaveUpdateModal(true)}>Add Leaves</button>
        </div>
        <div className="topLeftButtons">
          <button className="topButton" onClick={() => navigate(-1)}>Back</button>
          <button className="topButton" onClick={() => navigate("/")}>Logout</button>
        </div>
      </div>

      <div className="page">
  {/* Left: Leave Requests */}
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


  {/* Right: Two stacked tables */}
  <div className="rightPanel">
    <div className="tableContainer scrollable">
      <h2 className="heading">On Leave Today</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Emp. ID</th>
            <th>Name</th>
            <th>From</th>
            <th>To</th>
            <th>Leave Days</th>
            <th>Alternate</th>
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

    <div className="tableContainer scrollable">
      <h2 className="heading">Your History</h2>
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
          {requestHistory.map((req) => (
            <tr key={req.id}>
              <td>{req.username}</td>
              <td>{req.Name}</td>
              <td>{req.fromDate}</td>
              <td>{req.toDate}</td>
              <td>{req.reason}</td>
              <td style={{ fontWeight: "bold", color: req.status === "approved" ? "green" : req.status === "rejected" ? "red" : "#555" }}>
                {req.status}
              </td>
              <td>{req.approvedBy || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
</div>
      {leaveUpdateModal && (
        <div className="modalOverlay">
          <div className="modal">
            <input className="input" placeholder="Employee ID" value={leaveUpdateData.employeeId} onChange={(e) => setLeaveUpdateData({ ...leaveUpdateData, employeeId: e.target.value })} />
            <input className="input" placeholder="Name" value={leaveUpdateData.name} readOnly />
            <select className="input" value={leaveUpdateData.leaveType} onChange={(e) => setLeaveUpdateData({ ...leaveUpdateData, leaveType: e.target.value })}>
              <option value="Paid">Paid</option>
              
            </select>
            <input className="input" type="number" placeholder="Number of Leaves" value={leaveUpdateData.count} onChange={(e) => setLeaveUpdateData({ ...leaveUpdateData, count: e.target.value })} />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button className="submitBtn" onClick={handleAddLeavesToEmployee}>Add Leaves</button>
              <button className="submitBtn cancelBtn" onClick={() => { setLeaveUpdateModal(false); setLeaveUpdateData({ employeeId: "", name: "", leaveType: "paid", count: 0 }); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} />
    </div>
  );
};

export default Managerpanel;
