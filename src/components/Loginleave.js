// import { useState } from "react";
// import { useNavigate } from 'react-router-dom';
// import { db } from "../firebase";
// import { collection, query, where, getDocs } from "firebase/firestore";
// import "./Loginleave.css";
// import { FiEye,FiEyeOff } from "react-icons/fi";

// const Loginleave = () => {
//   const [formData, setFormData] = useState({ username: '', password: '' });
//   const [error, setError] = useState('');
//   const [showPassword, setShowPassword] = useState(false);

//   const navigate = useNavigate();

//   const handleChange = (e) => {
//     setFormData((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = async (e) => {
//   e.preventDefault();

//   const username = formData.username.trim();
//   const password = formData.password.trim();

//   if (!username || !password) {
//     setError("Please enter Employee ID and Password");
//     return;
//   }

//   console.log("Attempting login with:", { username, password });

//   try {
//     const q = query(
//       collection(db, "Users"),
//       where("username", "==", username),
//       where("password", "==", password)
//     );

//     const querySnapshot = await getDocs(q);

//     if (querySnapshot.empty) {
//       setError("username");
//       return;
//     }

//     const userData = querySnapshot.docs[0].data();
//     const { name, Role } = userData;

//     // Save user to local storage
//     localStorage.setItem("user", JSON.stringify({ username, name, Role }));

//     // Navigate based on Role
//     if (Role === "Manager") {
//       navigate("/manager", {
//         state: {
//           username,
//           name,
//           Role,
//         },
//       });
//     } else if (Role === "employee") {
//       navigate("/request", {
//         state: {
//           username,
//           name,
//           Role,
//         },
//       });
//     }
//     else if (Role === "supervisor") {
//       navigate("/supervisor-req", {
//         state: {
//           username,
//           name,
//           Role,
//         },
//       });
//     }

//     // supervisor
//     else {
//       setError("Unknown Role. Access denied.");
//     }

//   } catch (error) {
//     console.error("Login error:", error);
//     setError("Something went wrong. Please try again.");
//   }
// };




//  return (
//   <div className="">
//     <form onSubmit={handleSubmit} className="login-form">
//       <h2 className="login-heading">Login</h2>
//       {error && <div className="login-error">{error}</div>}

//       <div className="login-row">
//         <label htmlFor="username" className="login-label">username:</label>
//         <input
//           id="username"
//           type="text"
//           name="username"
//           placeholder="Id"
//           value={formData.username}
//           onChange={handleChange}
//           className="login-input"
//         />
//       </div>

// <div className="login-row">
//   <label htmlFor="password" className="login-label">Password:</label>
//   <div className="password-wrapper">
//     <input
//       id="password"
//       type={showPassword ? "text" : "password"}
//       name="password"
//       placeholder="Password"
//       value={formData.password}
//       onChange={handleChange}
//       className="login-input password-input"
//     />
    
//   </div>
// </div>


//       <button type="submit" className="login-button">Login</button>
//     </form>
//   </div>
// );
// };


// export default Loginleave;
// // import { useState } from "react";
// // import { useNavigate } from 'react-router-dom';
// // import { db } from "../firebase";
// // import { collection, query, where, getDocs } from "firebase/firestore";
// // import "./Login.css";
// // import { FiEye, FiEyeOff } from "react-icons/fi";

// // const Loginleave = () => {
// //   const [formData, setFormData] = useState({ employeeId: '', password: '' });
// //   const [error, setError] = useState('');
// //   const [showPassword, setShowPassword] = useState(false);

// //   const navigate = useNavigate();

// //   const handleChange = (e) => {
// //     setFormData((prev) => ({
// //       ...prev,
// //       [e.target.name]: e.target.value,
// //     }));
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     const employeeId = formData.employeeId.trim();
// //     const password = formData.password.trim();

// //     if (!employeeId || !password) {
// //       setError("Please enter Employee ID and password");
// //       return;
// //     }

// //     console.log("Trying to login with:", { employeeId, password });

// //     try {
// //       const q = query(
// //         collection(db, "Users"),
// //         where("employeeId", "==", employeeId),
// //         where("password", "==", password)
// //       );

// //       const querySnapshot = await getDocs(q);

// //       if (querySnapshot.empty) {
// //         setError("Invalid Employee ID or Password");
// //         return;
// //       }

// //       const userData = querySnapshot.docs[0].data();
// //       const { name, Role } = userData;

// //       localStorage.setItem("user", JSON.stringify({
// //         employeeId,
// //         name,
// //         Role
// //       }));

// //       if (Role === "employee") {
// //         navigate("/request", {
// //           state: {
// //             employeeId,
// //             name,
// //             Role,
// //           },
// //         });
// //       } else if (Role === "supervisor") {
// //         navigate("/supervisor-req", {
// //           state: {
// //             employeeId,
// //             name,
// //             Role,
// //           },
// //         });
// //       } else if (Role === "manager") {
// //         navigate("/manager", {
// //           state: {
// //             employeeId,
// //             name,
// //             Role,
// //           },
// //         });
// //       } else {
// //         setError("Unknown user Role.");
// //       }

// //     } catch (error) {
// //       console.error("Login error:", error);
// //       setError("Something went wrong. Try again.");
// //     }
// //   };


// //   return (
// //     <div className="login-container">
// //       <form onSubmit={handleSubmit} className="login-form">
// //         <h2 className="login-heading">Login</h2>
// //         {error && <div className="login-error">{error}</div>}

// //         <div className="login-row">
// //           <label htmlFor="employeeId" className="login-label">EmployeeId:</label>
// //           <input
// //             id="employeeId"
// //             type="text"
// //             name="employeeId"
// //             placeholder="Id"
// //             value={formData.employeeId}
// //             onChange={handleChange}
// //             className="login-input"
// //           />
// //         </div>

// //         <div className="login-row">
// //           <label htmlFor="password" className="login-label">Password:</label>
// //           <div className="password-wrapper">
// //             <input
// //               id="password"
// //               type={showPassword ? "text" : "password"}
// //               name="password"
// //               placeholder="Password"
// //               value={formData.password}
// //               onChange={handleChange}
// //               className="login-input password-input"
// //             />
// //             <button
// //               type="button"
// //               className="password-toggle"
// //               onClick={() => setShowPassword((prev) => !prev)}
// //             >
// //               {showPassword ? <FiEyeOff /> : <FiEye />}
// //             </button>
// //           </div>
// //         </div>


// //         <button type="submit" className="login-button">Login</button>
// //       </form>
// //     </div>
// //   );
// // };


// // export default Loginleave;