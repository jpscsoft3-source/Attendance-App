// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const axios = require('axios');

// const app = express();
// app.use(cors());
// app.use(express.json());

// const CUSTOMER_ID = 'C-0E536C63037446A';
// const KEY = 'QWF5dXNoNDVA';
// const API_BASE_URL = 'https://cpaas.messagecentral.com';

// let mcToken = null; // Store token temporarily

// async function getAuthToken() {
//   if (mcToken) return mcToken;

//   try {
//     const res = await axios.get(`${API_BASE_URL}/auth/v1/authentication/token`, {
//       params: {
//         country: 'IN',
//         customerId: CUSTOMER_ID,
//         key: KEY,
//         scope: 'NEW'
//       },
//       headers: { accept: '*/*' }
//     });
//     mcToken = res.data.token;
//     console.log('✅ New MessageCentral token generated:', mcToken);
//     return mcToken;
//   } catch (err) {
//     console.error('❌ Error generating token:', err.response?.data || err.message);
//     throw new Error('Failed to generate MessageCentral token');
//   }
// }

// // Send OTP
// app.post('/send-otp', async (req, res) => {
//   const { phone } = req.body;
//   if (!phone) return res.status(400).json({ success: false, message: 'Phone number required' });

//   try {
//     const token = await getAuthToken();
//     const response = await axios.post(
//       `${API_BASE_URL}/verification/v3/send`,
//       {},
//       {
//         params: {
//           countryCode: '91',
//           customerId: CUSTOMER_ID,
//           flowType: 'SMS',
//           mobileNumber: phone
//         },
//         headers: { authToken: token }
//       }
//     );

//     const verificationId = response.data.verificationId;
//     res.json({ success: true, verificationId });
//   } catch (err) {
//     console.error('❌ Error sending OTP:', err.response?.data || err.message);
//     res.status(500).json({ success: false, message: 'Failed to send OTP' });
//   }
// });

// // Verify OTP
// app.post('/verify-otp', async (req, res) => {
//   const { phone, verificationId, otp } = req.body;
//   if (!phone || !verificationId || !otp)
//     return res.status(400).json({ success: false, message: 'Missing params' });

//   try {
//     const token = await getAuthToken();
//     const response = await axios.get(`${API_BASE_URL}/verification/v3/validateOtp`, {
//       params: {
//         countryCode: '91',
//         mobileNumber: phone,
//         verificationId,
//         customerId: CUSTOMER_ID,
//         code: otp
//       },
//       headers: { authToken: token }
//     });

//     if (response.data.status === 'VERIFICATION_COMPLETED') {
//       res.json({ success: true, message: 'OTP verified' });
//     } else {
//       res.status(401).json({ success: false, message: 'Invalid OTP' });
//     }
//   } catch (err) {
//     console.error('❌ Error verifying OTP:', err.response?.data || err.message);
//     res.status(500).json({ success: false, message: 'Failed to verify OTP' });
//   }
// });

// app.get('/', (req, res) => res.send('🚀 Backend running ✅'));
// app.listen(3001, () => console.log('🚀 Server running on port 3001'));
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();

// ✅ Enable CORS for both local & deployed frontend
app.use(cors({
  origin: [
    "http://localhost:3000",                    // local React dev
    "https://jpscube-attendance-leave.netlify.app" // 🚫 no trailing slash here!
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ✅ Explicitly handle preflight requests
app.options('*', cors());

app.use(express.json());

// Cache token for 5 minutes
const tokenCache = new NodeCache({ stdTTL: 5 * 60 });
const otpMap = new Map();

const CUSTOMER_ID = process.env.CUSTOMER_ID;
const KEY = process.env.KEY;
const API_BASE_URL = 'https://cpaas.messagecentral.com';

// ✅ Generate new token if not cached
async function getAuthToken() {
  let token = tokenCache.get('mcToken');
  if (token) return token;

  try {
    const res = await axios.get(`${API_BASE_URL}/auth/v1/authentication/token`, {
      params: {
        country: 'IN',
        customerId: CUSTOMER_ID,
        key: KEY,
        scope: 'NEW',
      },
      headers: { accept: '*/*' },
    });

    token = res.data.token;
    tokenCache.set('mcToken', token);
    console.log('✅ New MessageCentral token generated');
    return token;
  } catch (err) {
    console.error('❌ Error generating token:', err.response?.data || err.message);
    throw new Error('Failed to generate MessageCentral token');
  }
}

// ✅ Send OTP route
app.post('/send-otp', async (req, res) => {
  try {
    let { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'Phone number is required' });

    // Normalize phone number
    phone = phone.replace(/\D/g, ''); // keep digits only
    if (phone.length !== 10) {
      return res.status(400).json({ success: false, message: 'Invalid mobile number format' });
    }

    console.log('📨 Sending OTP to:', `+91${phone}`);

    const token = await getAuthToken();

    const sendResponse = await axios.post(`${API_BASE_URL}/verification/v3/send`, null, {
      params: {
        countryCode: '91',
        customerId: CUSTOMER_ID,
        flowType: 'SMS',
        mobileNumber: phone,
      },
      headers: { authToken: token },
    });

    const verificationId = sendResponse.data?.data?.verificationId;
    if (!verificationId) throw new Error('No verificationId returned');

    otpMap.set(phone, { verificationId, token });
    setTimeout(() => otpMap.delete(phone), 5 * 60 * 1000);

    console.log(`✅ OTP sent to +91${phone}, verificationId: ${verificationId}`);
    res.json({ success: true, message: 'OTP sent', verificationId });
  } catch (err) {
    console.error('❌ Error sending OTP:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// ✅ Verify OTP route
app.post('/verify-otp', async (req, res) => {
  try {
    let { phone, otp } = req.body;
    phone = phone.replace(/\D/g, ''); // normalize
    console.log('🔍 Verifying OTP for:', `+91${phone}`);

    const entry = otpMap.get(phone);
    if (!entry) return res.status(401).json({ success: false, message: 'OTP expired or not sent' });

    const { verificationId, token } = entry;

    const verifyResponse = await axios.get(`${API_BASE_URL}/verification/v3/validateOtp`, {
      params: {
        countryCode: '91',
        mobileNumber: phone,
        verificationId,
        customerId: CUSTOMER_ID,
        code: otp,
      },
      headers: { authToken: token },
    });

    const status = verifyResponse.data?.data?.verificationStatus;
    console.log('🔍 Verification status:', status);

    if (status === 'VERIFICATION_COMPLETED' || status === 'SUCCESS') {
      otpMap.delete(phone);
      console.log('✅ OTP verified successfully');
      res.json({ success: true, message: 'OTP verified' });
    } else {
      console.log('❌ OTP verification failed');
      res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
  } catch (err) {
    console.error('❌ Error verifying OTP:', err.response?.data || err.message);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
});

// ✅ Health check
app.get('/', (req, res) => res.send('🚀 Backend is running ✅'));

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
