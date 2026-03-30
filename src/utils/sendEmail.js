// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// const sendOtpEmail = async (email, otp) => {
//   await resend.emails.send({
//     from: `Montoaklyn <${process.env.EMAIL_FROM}>`,
//     to: email,
//     subject: "Your Montoaklyn OTP",
//     html: `
//       <div style="font-family: Arial, sans-serif;">
//         <h2>Your OTP</h2>
//         <p style="font-size: 18px;"><b>${otp}</b></p>
//         <p>This OTP is valid for 5 minutes.</p>
//       </div>
//     `,
//   });
// };

// module.exports = sendOtpEmail;
