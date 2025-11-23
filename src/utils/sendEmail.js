// src/utils/sendEmail.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (to, subject, html) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER, // Hostinger email
      pass: process.env.EMAIL_PASS, // Hostinger mailbox password
    },
  });

  await transporter.verify();
  console.log("SMTP connection ok");

  await transporter.sendMail({
    from: `"Your Company" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

export default sendEmail;
