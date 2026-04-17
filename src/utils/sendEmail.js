const { Resend } = require("resend");

const sendOtpEmail = async (email, otp) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!process.env.EMAIL_FROM) {
    throw new Error("EMAIL_FROM is not configured");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: `Mood Fresh <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Your Mood Fresh OTP",
    html: `
      <div style="font-family: Arial, sans-serif; text-align: center;">
        <h2>Mood Fresh Login</h2>
        <p>Your OTP is:</p>
        <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">
          ${otp}
        </p>
        <p>This OTP is valid for 5 minutes.</p>
        <p style="margin-top: 20px; font-size: 12px; color: gray;">
          If you didn’t request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

module.exports = sendOtpEmail;
