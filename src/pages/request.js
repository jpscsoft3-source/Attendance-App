import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiLogOut } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import "./request.css";

const Request = () => {
 const navigate = useNavigate();

 const [remainingLeaves, setRemainingLeaves] = useState({ Paid: 0 });
   const [dynamicRemainingLeaves, setDynamicRemainingLeaves] = useState({ Paid: 0 });



  // Read from localStorage only
  const username = localStorage.getItem("username");
  const Name = localStorage.getItem("employeeName");
  const Role = localStorage.getItem("userRole");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!username || !Name || !Role) {
      navigate("/");
    }
  }, [username, Name, Role, navigate]);

 const [formData, setFormData] = useState({
  username: username || "",
  Name: Name || "",
  fromDate: "",
  toDate: "",
  leaveDays: "",
  leaveType: "",
  reason: "",
  alternatePerson: "",
  approvingAuthority: "",
});


  const [leaveHistory, setLeaveHistory] = useState([]);

  useEffect(() => {
    if (formData.fromDate && formData.toDate) {
      const from = new Date(formData.fromDate);
      const to = new Date(formData.toDate);
      if (to >= from) {
        const diffDays =
          Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
        setFormData((prev) => ({ ...prev, leaveDays: diffDays }));
      } else {
        setFormData((prev) => ({ ...prev, leaveDays: "" }));
      }
    }
  }, [formData.fromDate, formData.toDate]);

  useEffect(() => {
    if (!username) return;

    const q = query(
      collection(db, "leaveRequests"),
      where("username", "==", username)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs
        .map((doc) => doc.data())
        .sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds); // Sort by latest
      setLeaveHistory(data);
    });

    return () => unsubscribe(); // Cleanup on unmount
  }, [username]);
useEffect(() => {
  const fetchLeaves = async () => {
    const leaves = await calculateRemainingLeaves();
    setRemainingLeaves(leaves);
  };
  fetchLeaves();
}, []);

  useEffect(() => {
    if (username && Name && Role) {
      localStorage.setItem("username", username);
      localStorage.setItem("employeeName", Name);
      localStorage.setItem("userRole", Role);
    } else {
      const storedId = localStorage.getItem("username");
      const storedName = localStorage.getItem("employeeName");
      const storedRole = localStorage.getItem("userRole");
      if (storedId && storedName && storedRole) {
        setFormData((prev) => ({
          ...prev,
          username: storedId,
          Name: storedName,
          Role: storedRole,
        }));
      } else {
        navigate("/");
      }
    }
  }, [username, Name, Role, navigate]);

  const calculateRemainingLeaves = async () => {
    try {
      const username = localStorage.getItem("username");
      console.log("🔎 Username from localStorage:", username);

      if (!username) return { Paid: 0 };

      const leavesRef = collection(db, "remainingLeaves");
      const q = query(leavesRef, where("employeeId", "==", username));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        console.log("✅ Firestore data found:", data);
        return data.balance || { Paid: 0 };
      } else {
        console.warn("⚠️ No leave record found for", username);
        return { Paid: 0 };
      }
    } catch (error) {
      console.error("❌ Error fetching remaining leaves:", error);
      return { Paid: 0 };
    }
  };

  useEffect(() => {
    const fetchLeaves = async () => {
      const leaves = await calculateRemainingLeaves();
      setDynamicRemainingLeaves(leaves);
    };
    fetchLeaves();
  }, []);

  const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData((prev) => ({ ...prev, [name]: value }));
};


  const handleSubmit = async (e) => {
    e.preventDefault();

    for (const key in formData) {
      if (!formData[key]) {
        toast.error(`Please fill ${key}`, { position: "top-center" });
        return;
      }
    }

    if (new Date(formData.fromDate) < new Date().setHours(0, 0, 0, 0)) {
      toast.error("From Date cannot be in the past", {
        position: "top-center",
      });
      return;
    }

    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      toast.error("To Date cannot be selected before From Date", {
        position: "top-center",
      });
      return;
    }

    if (dynamicRemainingLeaves[formData.leaveType] <= 0) {
      toast.error(`No remaining ${formData.leaveType} leaves`, {
        position: "top-center",
      });
      return;
    }



    try {
      await addDoc(collection(db, "leaveRequests"), {
        ...formData,
        status: "pending",
        timestamp: serverTimestamp(),
      });

      toast.success("Submitted!", {
        position: "top-center",
        autoClose: 1500,
      });

      // setTimeout(() => {
      //   navigate("/leave-summary", {
      //     state: {
      //       data: formData,
      //       Role: Role, // Pass Role explicitly
      //     },
      //   });
      // }, 1800);
      setTimeout(() => {
  // Reset form after success
  setFormData({
    fromDate: "",
    toDate: "",
    leaveType: "",
    reason: "",
    leaveDays: "",
      approvingAuthority: "",

    alternatePerson: "",
  });
}, 1800);

    } catch (error) {
      console.error("Error submitting leave request:", error);
      toast.error("Submission failed. Please try again.");
    }
  };

  const handleClear = () => {
    setFormData((prev) => ({
      username: prev.username,
      Name: prev.Name,
      fromDate: "",
      toDate: "",
      leaveDays: "",
      leaveType: "",
      reason: "",
      alternatePerson: "",
      approvingAuthority: "",
    }));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "approved";
      case "rejected":
        return "rejected";
      default:
        return "pending";
    }
  };

  const isLeaveTypeDisabled = (type) => {
  const selectedDays = parseInt(formData.leaveDays);
  const available = dynamicRemainingLeaves[type] || 0;
  return !selectedDays || selectedDays > available;
};


  return (
    <div className="page">
      <div className="logoutWrapper">
        <button onClick={handleLogout} className="logoutBtn">
          <FiLogOut size={18} />
          Logout
        </button>
      </div>

      <div className="contentWrapper">
        <form onSubmit={handleSubmit} className="container">
          <h3 className="heading">Request Form</h3>

          {[
  { label: "Employee ID", Name: "username" },
  { label: "Name", Name: "Name" },
  { label: "From Date", Name: "fromDate", type: "date" },
  { label: "To Date", Name: "toDate", type: "date" },
].map(({ label, Name, type = "text" }) => (
  <div key={Name} className="row">
    <label className="label">{label}:</label>

    {(Name === "username" || Name === "Name") ? (
      <input
        type="text"
        name={Name}
        value={formData[Name]}
        disabled
        className="input"
      />
    ) : (
      <input
  type={type}
  name={Name}                     // ✅ Corrected
  value={formData[Name]}
  onChange={handleChange}
  className="input"
  min={
    Name === "fromDate"
      ? new Date().toISOString().split("T")[0]
      : Name === "toDate" && formData.fromDate
      ? formData.fromDate
      : new Date().toISOString().split("T")[0]
  }
/>

    )}
  </div>
))}



          <div className="row">
            <label className="label">Leave Days:</label>
            <input
              type="number"
              Name="leaveDays"
              value={formData.leaveDays}
              readOnly
              className="input readOnly"
            />
          </div>

          <div className="row">
  <label className="label">Type of Leave:</label>
  <select
    name="leaveType" // ✅ small 'n' (React requires lowercase for HTML attributes)
    value={formData.leaveType}
    onChange={handleChange}
    className="select"
  >
    <option disabled value="">
      Select Leave Type
    </option>

    {/* ✅ Only Paid Leave fetched from Firestore */}
    {Object.keys(dynamicRemainingLeaves).map((type) => {
      const disabled = isLeaveTypeDisabled(type);
      return (
        <option key={type} value={type} disabled={disabled}>
          {type} {disabled ? `(Not Available)` : ""}
        </option>
      );
    })}
  </select>
</div>
          <div className="row">
            <label className="label">Reason:</label>
            <textarea
              Name="reason"
              rows="3"
              value={formData.reason}
              onChange={handleChange}
              className="textarea"
            />
          </div>

          <div className="row">
            <label className="label">Alternate Person:</label>
            <input
              type="text"
              name="alternatePerson"
              value={formData.alternatePerson}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div className="row">
            <label className="label">Approving Authority:</label>
            <select
              Name="approvingAuthority"
              value={formData.approvingAuthority}
              onChange={handleChange}
              className="select"
            >
              <option value="" disabled>Select Approving Authority</option>
              <option value="Manager">Manager</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>


          <div className="buttonRow">
            <button type="submit" className="button" onClick={handleSubmit}>
              Submit
            </button>
            <button type="button" className="button" onClick={handleClear}>
              Clear
            </button>
          </div>
        </form>

        <div className="rightSection">
          <div className="dashboard">
      <h3 className="heading">Remaining Leaves</h3>
      <div className="cardGrid">
        {Object.entries(dynamicRemainingLeaves).map(([type, count]) => (
          <div key={type} className="card">
            <h4>{type}</h4>
            <p>{Math.max(0, count)}</p>
          </div>
        ))}

        <div className="card total">
          <h4>Total</h4>
          <p>
            {Object.values(dynamicRemainingLeaves).reduce(
              (sum, val) => sum + Math.max(0, val),
              0
            )}
          </p>
        </div>
      </div>
    </div>

          <div className="history">
            <h3 className="heading">Leave History</h3>
            <div className="tableWrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>From</th>
                    <th>To</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveHistory.map((entry, i) => (
                    <tr key={i}>
                      <td>{entry.fromDate}</td>
                      <td>{entry.toDate}</td>
                      <td>{entry.leaveType}</td>
                      <td>
                        <span className={`status ${getStatusStyle(entry.status)}`}>
                          {entry.status || "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Request;
