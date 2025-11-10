// const functions = require("firebase-functions");
// const admin = require("firebase-admin");
// const nodemailer = require("nodemailer");

// admin.initializeApp();
// const db = admin.firestore();

// // Setup Gmail SMTP
// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: "jpsc.soft1@gmail.com",             // ✅ your Gmail
//     pass: "harv xrrn hfsy mwss"           // ✅ 16-digit App Password
//   }
// });

// exports.sendDailyAttendanceLink = functions.https.onRequest(async (req, res) => {
//   try {
//     const token = Math.random().toString(36).substring(2, 12);
//     const now = admin.firestore.Timestamp.now();
//     const expiresAt = admin.firestore.Timestamp.fromMillis(now.toMillis() + 10 * 60 * 1000); // 10 mins

//     // Save to Firestore
//     await db.collection("daily_links").doc(token).set({
//       token,
//       type: "attendance",
//       createdAt: now,
//       expiresAt,
//     });

// const link = `http://localhost:3000/Login?token=${token}`;

//     // Send Email
//     await transporter.sendMail({
//       from: '"Attendance Bot" <jpsc.soft1@gmail.com>',
//       to: "jpsc.soft1@gmail.com",
//       subject: "⏰ Daily Attendance Link",
//       html: `<p>Click to mark attendance: <a href="${link}">${link}</a></p><p>This link expires in 10 minutes.</p>`
//     });

//     res.status(200).send("Email sent with link: " + link);
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Failed to send");
//   }
// });

const nodemailer = require("nodemailer");

exports.handler = async function (event, context) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "jpsc.soft1@gmail.com",
      pass: "harv xrrn hfsy mwss", // app password from Gmail
    },
  });

  const mailOptions = {
    from: "jpsc.soft1@gmail.com",
    to: "jpsc.soft1@gmail.com",
    subject: "📧 Netlify Email Test",
    html: `
      <p>This email was sent at ${new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}</p>
      <p><a href="https://attendance-leave.netlify.app/">Open Attendance</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: "✅ Email sent.",
    };
  } catch (error) {
    console.error("❌ Email error:", error);
    return {
      statusCode: 500,
      body: "❌ Failed to send email.",
    };
  }
};
