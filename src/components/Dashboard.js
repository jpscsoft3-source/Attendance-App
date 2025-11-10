// import { useNavigate } from 'react-router-dom';

// const Dashboard = () => {
//   const navigate = useNavigate();

//   const handleLeaveNavigation = () => {
//     const role = localStorage.getItem('Role');

//     if (!role) {
//       alert('User role not found. Please login again.');
//       navigate('/');
//       return;
//     }

// switch (role.trim().toLowerCase()) {
//       case 'employee':
//         navigate('/request');         // Employee leave request form
//         break;
//       case 'supervisor':
//         navigate('/supervisor-req'); // Supervisor panel
//         break;
//       case 'Manager':
//         navigate('/manager');    // Manager panel
//         break;
//       default:
//         navigate('/manager');
//     }
//   };

//   return (
//     <div style={{ textAlign: 'center', marginTop: '10%' }}>
//       <h2>Welcome to Attendance & Leave Management</h2>
//       <button onClick={() => navigate('/AttendancePage')}>Attendance</button>
//       <br /><br />
//       <button onClick={handleLeaveNavigation}>Leave</button>
//     </div>
//   );
// };

// export default Dashboard;
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Always re-fetch from localStorage on mount
    const name = localStorage.getItem('employeeName');
    const responsible = localStorage.getItem('responsible');

    if (!name || !responsible) {
      // Give localStorage a short chance to settle before redirect
      setTimeout(() => {
        const nameRetry = localStorage.getItem('employeeName');
        const respRetry = localStorage.getItem('responsible');

        if (!nameRetry || !respRetry) {
          alert('Session expired. Please login again.');
          navigate('/');
        } else {
          setEmployeeName(nameRetry);
          setLoading(false);
        }
      }, 200);
    } else {
      setEmployeeName(name);
      setLoading(false);
    }
  }, [navigate]);

  const handleLeaveNavigation = () => {
    const responsible = localStorage.getItem('responsible')?.trim().toLowerCase();
    if (!responsible) {
      alert('Session missing. Please login again.');
      navigate('/');
      return;
    }

    switch (responsible) {
      case 'employee': navigate('/request'); break;
      case 'supervisor': navigate('/supervisor-req'); break;
      case 'manager': navigate('/manager'); break;
      default: navigate('/manager');
    }
  };

  const handleAttendanceNavigation = () => {
    const responsible = localStorage.getItem('responsible')?.trim().toLowerCase();
    if (!responsible) {
      alert('Session missing. Please login again.');
      navigate('/');
      return;
    }

    if (responsible === 'manager') {
      navigate('/adminpanel');
    } else {
      navigate('/AttendancePage');
    }
  };

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="dashboard-container">
      <button className="back-button" onClick={() => navigate(-1)}>⬅️ Back</button>
      <h1 className="welcome-text">Welcome, {employeeName} 👋</h1>
      <div className="dashboard-buttons">
        <button className="dashboard-button" onClick={handleAttendanceNavigation}>📋 Attendance</button>
        <button className="dashboard-button" onClick={handleLeaveNavigation}>📝 Leave</button>
      </div>
    </div>
  );
};

export default Dashboard;
