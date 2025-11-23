// src/controllers/quoteController.js
import QuoteRequest from "../models/QuoteRequest.js";
import sendEmail from "../utils/sendEmail.js";

export const addQuote = async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;

    // basic validation
    if (!name || !phone || !email || !message) {
      return res.status(400).json({ message: "name, phone, email and message are required" });
    }

    const newQuote = new QuoteRequest({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
    });

    await newQuote.save();

    // send notification email to admin (best-effort)
    try {
      const adminHtml = `
        <h2>New quote request</h2>
        <p><strong>Name:</strong> ${escapeHtml(newQuote.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(newQuote.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(newQuote.email)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(newQuote.message).replace(/\n/g, "<br/>")}</p>
        <p>Submitted at: ${new Date(newQuote.createdAt).toLocaleString()}</p>
      `;

      // admin recipient: prefer QUOTE_NOTIFICATION_EMAIL, fall back to EMAIL_USER or ADMIN_EMAIL
      const adminTo = process.env.EMAIL_USER;

      await sendEmail(adminTo, "New Quote Request", adminHtml);

      const userHtml = `
          <p>Hi ${escapeHtml(newQuote.name)},</p>
          <p>Thanks — we've received your quote request. Our team will contact you shortly.</p>
          <hr/>
          <p><strong>Your message:</strong></p>
          <p>${escapeHtml(newQuote.message).replace(/\n/g, "<br/>")}</p>
        `;
      // send to user (best-effort)
      await sendEmail(newQuote.email, "Quote request received", userHtml);
    } catch (mailErr) {
      console.error("quoteController: email send failed", mailErr);
      // don't fail the request if email fails; return created with warning
      return res.status(201).json({
        message: "Quote request saved but notification email failed",
        quote: newQuote,
      });
    }

    res.status(201).json({ message: "Quote request created", quote: newQuote });
  } catch (err) {
    console.error("addQuote error:", err);
    res.status(500).json({ message: "Failed to create quote request" });
  }
};

export const getQuotes = async (req, res) => {
  try {
    const list = await QuoteRequest.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    console.error("getQuotes error:", err);
    res.status(500).json({ message: "Could not retrieve quote requests" });
  }
};

export const deleteQuote = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: "Quote id required" });

    const found = await QuoteRequest.findById(id);
    if (!found) return res.status(404).json({ message: "Quote not found" });

    await found.deleteOne();
    res.json({ message: "Quote deleted" });
  } catch (err) {
    console.error("deleteQuote error:", err);
    res.status(500).json({ message: "Failed to delete quote" });
  }
};

// small helper to escape basic HTML characters to avoid breaking email markup
function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
