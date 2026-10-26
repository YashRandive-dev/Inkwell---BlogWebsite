const nodemailer = require('nodemailer');

// Sends an email. If SMTP is not configured (local development), the message is printed
// to the server console instead so features like password reset can still be tested.
const sendEmail = async ({ to, subject, text, html, replyTo }) => {
  if (!process.env.SMTP_HOST) {
    console.log('\n--- Email (SMTP not configured, printing instead) ---');
    console.log(`To: ${to}\nSubject: ${subject}\n${text}`);
    console.log('-----------------------------------------------------\n');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST.trim(),
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: (process.env.SMTP_PASS || '').replace(/\s+/g, '') }, // Gmail shows App Passwords with spaces
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
    replyTo,
  });
};

module.exports = sendEmail;
