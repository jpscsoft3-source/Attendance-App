// import React from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./leave-summary.css";

// const LeaveSummary = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const data = location.state?.data;
//   const from = location.state?.from || "request";
//   // eslint-disable-next-line
//   const Role = location.state?.Role || localStorage.getItem("userRole");

//   const handleBack = () => {
//     const route = from === "manager"
//       ? "/manager"
//       : from === "supervisor"
//         ? "/supervisor-req"
//         : "/request";

//     navigate(route, {
//       state: {
//         employeeId: data?.employeeId,
//         name: data?.name,
//         Role: data?.Role,
//       },
//     });
//   };


//   const formatLabel = (str) =>
//     str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

//   return (
//     <div className="summaryContainer">
//       <h2 className="summaryHeading">Leave Summary</h2>
//       {data &&
//         Object.entries(data).map(([key, value]) => (
//           <div className="summaryRow" key={key}>
//             <span className="summaryLabel">{formatLabel(key)}:</span>
//             <span className="summaryValue">{value}</span>
//           </div>
//         ))}

//       <div className="summaryButtonWrapper">
//         <button className="backButton" onClick={handleBack}>
//           Back to Home
//         </button>
//       </div>
//     </div>
//   );
// };

// export default LeaveSummary;

import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./leave-summary.css";

const LeaveSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const data = location.state?.data;
  const from = location.state?.from || "request";
  // eslint-disable-next-line
  const Role = location.state?.Role || localStorage.getItem("userRole");

  const handleBack = () => {
    const route = from === "manager"
      ? "/manager"
      : from === "supervisor"
        ? "/supervisor-req"
        : "/request";

    navigate(route, {
      state: {
        employeeId: data?.employeeId,
        name: data?.name,
        Role: data?.Role,
      },
    });
  };


  const formatLabel = (str) =>
    str.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());

  return (
    <div className="summaryContainer">
      <h2 className="summaryHeading">Leave Summary</h2>
      {data &&
        Object.entries(data).map(([key, value]) => (
          <div className="summaryRow" key={key}>
            <span className="summaryLabel">{formatLabel(key)}:</span>
            <span className="summaryValue">{value}</span>
          </div>
        ))}

      <div className="summaryButtonWrapper">
        <button className="backButton" onClick={handleBack}>
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default LeaveSummary;