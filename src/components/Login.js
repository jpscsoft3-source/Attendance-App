// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { db } from '../firebase';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import './Login.css';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import emailjs from 'emailjs-com';
// import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [otpMode, setOtpMode] = useState(false);
//   const [otpEmail, setOtpEmail] = useState('');
//   const [sentOtp, setSentOtp] = useState('');
//   const [enteredOtp, setEnteredOtp] = useState('');
//   const [otpVerified, setOtpVerified] = useState(false);
//   const [isManager, setIsManager] = useState(false);

//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const q = query(
//         collection(db, 'Users'),
//         where('username', '==', username),
//         where('password', '==', password)
//       );
//       const snapshot = await getDocs(q);

//       if (!snapshot.empty) {
//         const doc = snapshot.docs[0];
//         const userData = doc.data();

//         localStorage.setItem('username', userData.username);
//         localStorage.setItem('employeeName', userData.Name);
//         localStorage.setItem('Role', userData.Role);

//         navigate('/dashboard');
//       } else {
//         alert('Invalid username or password!');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       alert('Something went wrong during login.');
//     }
//   };

//   const sendOtp = async () => {
//     if (!otpEmail) return alert("Enter your email first");

//     try {
//       const q = query(collection(db, "Users"), where("email", "==", otpEmail));
//       const snapshot = await getDocs(q);

//       if (snapshot.empty) {
//         alert("No user found with this email");
//         return;
//       }

//       const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
//       setSentOtp(generatedOtp);

//       const templateParams = {
//         email: otpEmail,
//         otp: generatedOtp,
//       };

//       await emailjs.send(
//         "service_cyxq5xy",
//         "template_dpvntlb",
//         templateParams,
//         "kfBJwJFitnzCYRehg"
//       );

//       alert("OTP has been sent to your email.");
//     } catch (err) {
//       console.error("OTP email error:", err);
//       alert("Failed to send OTP. Please try again.");
//     }
//   };

//   const verifyOtp = async () => {
//     if (enteredOtp !== sentOtp) {
//       alert('Invalid OTP');
//       return;
//     }

//     try {
//       const q = query(collection(db, 'Users'), where('email', '==', otpEmail));
//       const snapshot = await getDocs(q);
//       const doc = snapshot.docs[0];
//       const userData = doc.data();

//       localStorage.setItem('username', userData.username);
//       localStorage.setItem('employeeName', userData.Name);
//       localStorage.setItem('Role', userData.Role);

//       setOtpVerified(true);
//       navigate('/dashboard');
//     } catch (err) {
//       console.error('OTP login failed', err);
//     }
//   };

//   const handleOtpEmailChange = async (e) => {
//     const email = e.target.value;
//     setOtpEmail(email);
//     setIsManager(false);

//     if (!email || !email.includes('@')) return;

//     try {
//       const q = query(collection(db, "Users"), where("email", "==", email));
//       const snapshot = await getDocs(q);

//       if (!snapshot.empty) {
//         const user = snapshot.docs[0].data();
//         const role = user?.Role?.toLowerCase();
//         if (role === 'manager') {
//           setIsManager(true);
//         }
//       }
//     } catch (err) {
//       console.error("Error checking role:", err);
//     }
//   };

//   return (
//     <div className="">
//       <div className="login-card">
//         <h2>🔒 Welcome</h2>
//         <p>Please log in to continue</p>

//         <form onSubmit={handleLogin}>
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//           />

//           <div className="password-wrapper">
//             <input
//               type={showPassword ? 'text' : 'password'}
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//             <span
//               className="toggle-password"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
//             </span>
//           </div>

//           <button type="submit">Login</button>
//         </form>

//         <br />
//         <button onClick={() => setOtpMode(true)}>Login with OTP</button>
//       </div>

//       {otpMode && (
//         <div className="otp-modal">
//           <div className="otp-content">
//             <h3>OTP Login</h3>
//             <input
//               type="email"
//               placeholder="Enter your email"
//               value={otpEmail}
//               onChange={handleOtpEmailChange}
//               className="input"
//             />

//             <button
//               onClick={sendOtp}
//               disabled={!isManager}
//               style={{
//                 cursor: !isManager ? 'not-allowed' : 'pointer',
//                 opacity: !isManager ? 0.6 : 1
//               }}
//             >
//               Send OTP
//             </button>

//             <p
//               style={{
//                 color: 'red',
//                 marginTop: 8,
//                 fontSize: '0.9em',
//                 minHeight: '20px',
//                 opacity: !isManager && otpEmail ? 1 : 0,
//                 transition: 'opacity 0.2s ease'
//               }}
//             >
//               Only Managers are allowed to use OTP login.
//             </p>

//             {sentOtp && (
//               <>
//                 <input
//                   type="text"
//                   placeholder="Enter OTP"
//                   value={enteredOtp}
//                   onChange={(e) => setEnteredOtp(e.target.value)}
//                   className="input"
//                 />
//                 <button onClick={verifyOtp}>Verify OTP</button>
//               </>
//             )}

//             <button onClick={() => setOtpMode(false)} style={{ marginTop: 10 }}>Cancel</button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { db } from '../firebase';
// import { collection, getDocs, query, where } from 'firebase/firestore';
// import './Login.css';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';

// const Login = () => {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [otpMode, setOtpMode] = useState(false);

//   const [mobileNumber, setMobileNumber] = useState('');
//   const [isManager, setIsManager] = useState(false);
//   const [checkingRole, setCheckingRole] = useState(false);

//   const [sentOtp, setSentOtp] = useState('');
//   const [enteredOtp, setEnteredOtp] = useState('');
//   const [otpSent, setOtpSent] = useState(false);

//   const navigate = useNavigate();

//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const q = query(
//         collection(db, 'Users'),
//         where('username', '==', username),
//         where('password', '==', password)
//       );
//       const snapshot = await getDocs(q);

//       if (!snapshot.empty) {
//         const doc = snapshot.docs[0];
//         const userData = doc.data();

//         localStorage.setItem('username', userData.username);
//         localStorage.setItem('employeeName', userData.Name);
//         localStorage.setItem('Role', userData.Role);

//         navigate('/dashboard');
//       } else {
//         alert('Invalid username or password!');
//       }
//     } catch (error) {
//       console.error('Login error:', error);
//       alert('Something went wrong during login.');
//     }
//   };

//   // 🔍 Check Role as user types mobile number
//   useEffect(() => {
//     if (mobileNumber.length !== 10) {
//       setIsManager(false);
//       return;
//     }

//     const timeout = setTimeout(async () => {
//       setCheckingRole(true);
//       try {
//         const phone = '+91' + mobileNumber;
//         const q = query(collection(db, 'Users'), where('mobile', '==', phone));
//         const snapshot = await getDocs(q);
//         if (!snapshot.empty) {
//           const user = snapshot.docs[0].data();
//           setIsManager(user?.Role?.toLowerCase() === 'manager');
//         } else {
//           setIsManager(false);
//         }
//       } catch (err) {
//         console.error('Error checking role:', err);
//         setIsManager(false);
//       } finally {
//         setCheckingRole(false);
//       }
//     }, 500); // debounce

//     return () => clearTimeout(timeout);
//   }, [mobileNumber]);

//   const sendOtp = async () => {
//     const phone = '+91' + mobileNumber;
//     try {
//       const res = await fetch('http://localhost:3001/send-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ phone }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         alert('OTP sent successfully');
//         setSentOtp(data.otp || ''); // Optional if using mock
//         setOtpSent(true);
//       } else {
//         alert('Failed to send OTP');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('Error sending OTP');
//     }
//   };

//   const verifyOtp = async () => {
//     const phone = '+91' + mobileNumber;
//     try {
//       const res = await fetch('http://localhost:3001/verify-otp', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ phone, otp: enteredOtp }),
//       });

//       const data = await res.json();
//       if (data.success) {
//         const q = query(collection(db, 'Users'), where('mobile', '==', phone));
//         const snapshot = await getDocs(q);
//         const doc = snapshot.docs[0];
//         const userData = doc.data();

//         localStorage.setItem('username', userData.username);
//         localStorage.setItem('employeeName', userData.Name);
//         localStorage.setItem('Role', userData.Role);

//         navigate('/dashboard');
//       } else {
//         alert('Invalid OTP');
//       }
//     } catch (err) {
//       console.error(err);
//       alert('OTP verification failed');
//     }
//   };

//   return (
//     <div>
//       <div className="login-card">
//         <h2>🔒 Welcome</h2>
//         <p>Please log in to continue</p>

//         <form onSubmit={handleLogin}>
//           <input
//             type="text"
//             placeholder="Username"
//             value={username}
//             onChange={(e) => setUsername(e.target.value)}
//             required
//           />

//           <div className="password-wrapper">
//             <input
//               type={showPassword ? 'text' : 'password'}
//               placeholder="Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               required
//             />
//             <span
//               className="toggle-password"
//               onClick={() => setShowPassword(!showPassword)}
//             >
//               <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
//             </span>
//           </div>

//           <button type="submit">Login</button>
//         </form>

//         <br />
//         <button onClick={() => setOtpMode(true)}>Login with OTP</button>
//       </div>

//       {otpMode && (
//         <div className="otp-modal">
//           <div className="otp-content">
//             <h3>OTP Login</h3>
//             <input
//               type="text"
//               placeholder="Enter Mobile Number"
//               value={mobileNumber}
//               onChange={(e) => {
//                 setMobileNumber(e.target.value);
//                 setOtpSent(false);
//               }}
//               className="input"
//             />

//             <button
//               onClick={sendOtp}
//               disabled={!isManager || checkingRole}
//               style={{
//                 cursor: !isManager ? 'not-allowed' : 'pointer',
//                 opacity: !isManager ? 0.6 : 1
//               }}
//             >
//               {checkingRole ? 'Checking...' : 'Send OTP'}
//             </button>

//             <p
//               style={{
//                 color: 'red',
//                 marginTop: 8,
//                 fontSize: '0.9em',
//                 minHeight: '20px',
//                 opacity: !isManager && mobileNumber ? 1 : 0,
//                 transition: 'opacity 0.2s ease'
//               }}
//             >
//               Only Managers can login using OTP.
//             </p>

//             {otpSent && (
//               <>
//                 <input
//                   type="text"
//                   placeholder="Enter OTP"
//                   value={enteredOtp}
//                   onChange={(e) => setEnteredOtp(e.target.value)}
//                   className="input"
//                 />
//                 <button onClick={verifyOtp}>Verify OTP</button>
//               </>
//             )}

//             <button onClick={() => setOtpMode(false)} style={{ marginTop: 10 }}>
//               Cancel
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Login;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import './Login.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import emailjs from 'emailjs-com';
import { useRef } from 'react';


const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpMode, setOtpMode] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [sentOtp, setSentOtp] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [checkingRole, setCheckingRole] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();
  

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    // Fetch all users whose username matches case-insensitive
    const q = query(collection(db, 'Users'));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      // Find the first user whose username matches ignoring case
      const doc = snapshot.docs.find(
        (d) => d.data().username.toLowerCase() === username.toLowerCase()
      );

      if (doc) {
        const userData = doc.data();

        // Check password (case-sensitive)
        if (userData.password === password) {
          localStorage.setItem('username', userData.username);
          localStorage.setItem('employeeName', userData.Name);
          localStorage.setItem('Role', userData.Role);
          localStorage.setItem('activeUser', userData.username);
          localStorage.setItem('responsible', userData.responsible);

          navigate('/dashboard');
        } else {
          alert('Invalid password!');
        }
      } else {
        alert('Invalid username!');
      }
    } else {
      alert('No users found in database!');
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Something went wrong during login.');
  }
};

  // Detect whether input is email or phone and check manager role
  useEffect(() => {
    const detect = async () => {
      setIsManager(false);
      setOtpSent(false);
      setCheckingRole(true);

      try {
        if (otpInput.includes('@')) {
          // Email case
          const q = query(collection(db, 'Users'), where('email', '==', otpInput));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const user = snapshot.docs[0].data();
            if (user?.Role === 'manager' || 'Manager') setIsManager(true);
          }
        } else if (/^\d{10}$/.test(otpInput)) {
          // Mobile case
          const phone = otpInput;
          const q = query(collection(db, 'Users'), where('mobile', '==', phone));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            const user = snapshot.docs[0].data();
            if (user?.Role === 'manager' || 'Manager' ) setIsManager(true);
          }
        }
      } catch (err) {
        console.error('Error detecting user role:', err);
      } finally {
        setCheckingRole(false);
      }
    };

    if (otpInput.length > 5) detect();
  }, [otpInput]);

  const generatedOtpRef = useRef(null); // place this at top of your component

// Send OTP
const sendOtp = async () => {
  if (otpInput.includes('@')) {
    // Email OTP (EmailJS)
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const templateParams = { email: otpInput, otp: generatedOtp };

    try {
      await emailjs.send(
        "service_cyxq5xy",
        "template_dpvntlb",
        templateParams,
        "kfBJwJFitnzCYRehg"
      );
      alert('OTP sent to email.');
      setOtpSent(true);
      localStorage.setItem('emailOtp', generatedOtp);
    } catch (err) {
      console.error('Email OTP error:', err);
      alert('Failed to send email OTP.');
    }
  } else {
    // Mobile OTP
    const phone = otpInput; // just 10 digits
    try {
        const res = await fetch('https://otp-message-16.onrender.com/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone }),
        });


      const data = await res.json();
      if (data.success) {
        alert('OTP sent to mobile.');
        setOtpSent(true);
        localStorage.setItem('verificationId', data.verificationId);
      } else {
        alert('Failed to send OTP.');
      }
    } catch (err) {
      console.error(err);
      alert('Error sending OTP.');
    }
  }
};

// Verify OTP
const verifyOtp = async () => {
  if (otpInput.includes('@')) {
    // Email OTP verification
    const storedOtp = localStorage.getItem('emailOtp');
    if (enteredOtp.trim() === storedOtp) {
      // Firebase lookup...
    } else {
      alert('Invalid OTP');
    }
  } else {
    // Mobile OTP verification
    const phone = otpInput; // exact 10 digits
    try {
      const res = await fetch('https://otp-message-16.onrender.com/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: enteredOtp }),
      });


      const data = await res.json();
      if (data.success) {
        // Login user
        const q = query(collection(db, 'Users'), where('mobile', '==', phone));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data();
          localStorage.setItem('username', userData.username);
          localStorage.setItem('employeeName', userData.Name);
          localStorage.setItem('Role', userData.Role);
          localStorage.setItem('activeUser', userData.username);
          localStorage.setItem('responsible',userData.responsible)
          navigate('/dashboard');
        } else {
          alert('No user found with this mobile number');
        }
      } else {
        alert('Invalid OTP');
      }
    } catch (err) {
      console.error(err);
      alert('OTP verification failed');
    }
  }
};
  return (
    <div>
      <div className="login-card">
        <h2>🔒 Welcome</h2>
        <p>Please log in to continue</p>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </span>
          </div>
          <button className="admin-button" type="submit">Login</button>
        </form>

        <br />
        <button className="admin-button" onClick={() => setOtpMode(true)}>Login with OTP</button>
      </div>

      {otpMode && (
        <div className="otp-modal">
          <div className="otp-content">
            <h3>OTP Login</h3>
            <input
              
              type="text"
              placeholder="Enter Email or Mobile"
              value={otpInput}
              onChange={(e) => {
                setOtpInput(e.target.value);
                setOtpSent(false);
              }}
              className="input"
            />

            <button
              className="admin-button"
              onClick={(e) => {
                sendOtp();
                const btn = e.currentTarget; // ✅ store reference
                btn.classList.add("animate-green");
                

                // Remove after 10 sec
                setTimeout(() => {
                  btn.classList.remove("animate-green");
                }, 10000);

                // ✅ Call your existing function
                
              }}
              disabled={!isManager || checkingRole}
              style={{
                cursor: !isManager ? "not-allowed" : "pointer",
                opacity: !isManager ? 0.6 : 1,
              }}
            >
              {checkingRole ? "Checking..." : "Send OTP"}
            </button>


            <p style={{ color: 'red', fontSize: '0.9em', minHeight: '20px', marginTop: 8 }}>
              {!isManager && otpInput ? 'Only Managers are allowed to login via OTP.' : ''}
            </p>

            {otpSent && (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="input"
                />
                <button className="admin-button" onClick={verifyOtp}>Verify OTP</button>
              </>
            )}

            <button className="admin-button" onClick={() => setOtpMode(false)} style={{ marginTop: 10 }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login