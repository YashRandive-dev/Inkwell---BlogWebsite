const asyncHandler = require('../utils/asyncHandler');
const sendEmail = require('../utils/sendEmail');
const { sendResponse } = require('../utils/response');

// The site owner's inbox (falls back to the SMTP user).
const inbox = () => process.env.EMAIL_FROM || process.env.SMTP_USER || 'owner@inkwell.local';

// POST /api/contact
const sendMessage = asyncHandler(async (req, res) => {
  const { name, email, subject, message } = req.body;
  await sendEmail({
    to: inbox(),
    replyTo: email,
    subject: `[Inkwell contact] ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
  sendResponse(res, 200, "Thanks for reaching out! We'll get back to you soon");
});

// POST /api/contact/subscribe  – newsletter box on the home page
const subscribe = asyncHandler(async (req, res) => {
  await sendEmail({
    to: inbox(),
    subject: 'New newsletter subscriber',
    text: `${req.body.email} subscribed to the Inkwell newsletter.`,
  });
  sendResponse(res, 200, "You're subscribed. Welcome aboard!");
});

module.exports = { sendMessage, subscribe };
