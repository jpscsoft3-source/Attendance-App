// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import Login from './components/Login';
// import Dashboard from './components/Dashboard';
// import AttendancePage from './components/AttendancePage';
// import AdminPanel from './components/AdminPanel'; // ✅ Import your AdminPage component
// import Loginleave from './components/Loginleave';
// import Manager from './pages/manager';
// import Managerpanel from './pages/managerpanel';
// import SupervisorReq from './pages/supervisor-req';
// import Request from './pages/request';
// import SupervisorPanel from './pages/supervisorpanel';

// function App() {
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/dashboard" element={<Dashboard />} />
//         <Route path="/AttendancePage" element={<AttendancePage />} />
//         <Route path="/AdminPanel" element={<AdminPanel />} /> {/* ✅ New route added */}
//         <Route path="/Loginleave" element={<Loginleave />} /> {/* ✅ New route added */}
//         <Route path="/manager" element={<Manager />} /> {/* ✅ New route added */}
//         <Route path="/managerpanel" element={<Managerpanel />} /> {/* ✅ New route added */}
//         <Route path="/request" element={<Request />} /> {/* ✅ New route added */}
//         <Route path="/supervisor-req" element={<SupervisorReq />} /> {/* ✅ New route added */}
//         <Route path="/supervisorpanel" element={<SupervisorPanel />} /> {/* ✅ New route added */}




//       </Routes>
//     </Router>
//   );
// }

// export default App;
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AttendancePage from './components/AttendancePage';
import AdminPanel from './components/AdminPanel';
import Loginleave from './components/Loginleave';
import Manager from './pages/manager';
import Managerpanel from './pages/managerpanel';
import SupervisorReq from './pages/supervisor-req';
import Request from './pages/request';
import SupervisorPanel from './pages/supervisorpanel';
import WorkerLinkPage from './components/WorkerLinkPage';

// ✅ Toast import
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      {/* ✅ ToastContainer should be outside Routes but inside Router */}
      <ToastContainer position="top-center" autoClose={3000} />

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/AttendancePage" element={<AttendancePage />} />
        <Route path="/AdminPanel" element={<AdminPanel />} />
        <Route path="/Loginleave" element={<Loginleave />} />
        <Route path="/manager" element={<Manager />} />
        <Route path="/managerpanel" element={<Managerpanel />} />
        <Route path="/request" element={<Request />} />
        <Route path="/supervisor-req" element={<SupervisorReq />} />
        <Route path="/supervisorpanel" element={<SupervisorPanel />} />
        <Route path="/worker-link" element={<WorkerLinkPage />} />
        

      </Routes>
    </Router>
  );
}

export default App;

//sa
//c300
