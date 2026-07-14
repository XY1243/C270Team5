const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function buildConfirmationEmailHtml({ eventName, startTime, endTime, location, ticketCount, eventId }) {
  return `<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; background:#f6f8fa; padding:24px;">
    <div style="max-width:600px; margin:auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 2px 12px rgba(0,0,0,.08);">
      <div style="background:#2563eb; color:#fff; padding:24px;">
        <h1 style="margin:0;">🎉 Booking Confirmed!</h1>
        <p style="margin:8px 0 0; opacity:0.9;">You're going to ${eventName}</p>
      </div>
      <div style="padding:24px; color:#374151;">
        <table style="width:100%; border-collapse:collapse; margin-bottom:16px;">
          <tr><td style="padding:8px 0; color:#6b7280; width:120px;"><strong>Event</strong></td><td>${eventName}</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;"><strong>Date & Time</strong></td><td>${startTime}${endTime ? ` – ${endTime}` : ''}</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;"><strong>Location</strong></td><td>${location || 'TBA'}</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;"><strong>Tickets</strong></td><td style="font-weight:bold; color:#16a34a;">${ticketCount} ticket(s)</td></tr>
          <tr><td style="padding:8px 0; color:#6b7280;"><strong>Booking #</strong></td><td style="font-weight:bold; color:#6366f1;">EF-${eventId}</td></tr>
        </table>
        <p>A Google Calendar event has been added to your account automatically when available.</p>
      </div>
      <div style="background:#f3f4f6; padding:16px 24px; text-align:center; font-size:12px; color:#9ca3af;">
        Sent by EventFinder
      </div>
    </div>
  </body>
</html>`;
}

async function sendConfirmationEmail({ to, eventName, startTime, endTime, location, ticketCount, eventId }) {
  if (!to) {
    return { success: false, skipped: true };
  }

  const html = buildConfirmationEmailHtml({
    eventName,
    startTime,
    endTime,
    location,
    ticketCount,
    eventId,
  });

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || 'EventFinder <noreply@eventfinder.local>',
      to,
      subject: `🎟️ Booking Confirmed — ${eventName}`,
      html,
      text: `Booking Confirmed!\n\nYou are booked for "${eventName}" on ${startTime}${endTime ? ' – ' + endTime : ''} at ${location || 'TBA'}.\nTickets: ${ticketCount}\nBooking #: EF-${eventId}`,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('[EmailService] sendConfirmationEmail error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  buildConfirmationEmailHtml,
  sendConfirmationEmail,
};
