const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const wrapEmail = (title, body) => `
  <div style="font-family: Arial, sans-serif; background-color: #f5f7fb; padding: 24px; color: #1f2937;">
    <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background: #0f172a; color: #ffffff; padding: 20px 24px;">
        <h2 style="margin: 0; font-size: 22px;">Performix Notification</h2>
      </div>
      <div style="padding: 24px;">
        <h3 style="margin-top: 0; color: #111827;">${title}</h3>
        <div style="font-size: 15px; line-height: 1.7;">${body}</div>
      </div>
    </div>
  </div>
`;

const sendMailSafe = async ({ to, subject, html }) => {
  try {
    if (
      !process.env.EMAIL_HOST ||
      !process.env.EMAIL_PORT ||
      !process.env.EMAIL_USER ||
      !process.env.EMAIL_PASS ||
      !to
    ) {
      return { success: false, message: 'Email config missing or recipient unavailable' };
    }

    await transporter.sendMail({
      from: `"Performix" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { success: false, message: error.message };
  }
};

const sendGoalSubmissionEmail = async ({ to, employeeName, managerName }) => {
  try {
    return await sendMailSafe({
      to,
      subject: `Goal sheet submitted by ${employeeName}`,
      html: wrapEmail(
        'Goal Sheet Submitted',
        `<p>Hello ${managerName || 'Manager'},</p>
         <p>${employeeName} has submitted a goal sheet for your review in Performix.</p>
         <p>Please log in to review and take the next action.</p>`
      ),
    });
  } catch (error) {
    console.error('Goal submission email failed:', error.message);
    return { success: false, message: error.message };
  }
};

const sendGoalApprovalEmail = async ({ to, employeeName }) => {
  try {
    return await sendMailSafe({
      to,
      subject: 'Your goal sheet has been approved',
      html: wrapEmail(
        'Goal Sheet Approved',
        `<p>Hello ${employeeName},</p>
         <p>Your goal sheet has been approved in Performix.</p>
         <p>You can now proceed with check-ins during the active review windows.</p>`
      ),
    });
  } catch (error) {
    console.error('Goal approval email failed:', error.message);
    return { success: false, message: error.message };
  }
};

const sendGoalRejectionEmail = async ({
  to,
  employeeName,
  managerName,
  reason,
}) => {
  try {
    return await sendMailSafe({
      to,
      subject: 'Your goal sheet was returned for rework',
      html: wrapEmail(
        'Goal Sheet Returned',
        `<p>Hello ${employeeName},</p>
         <p>${managerName || 'Your manager'} has returned your goal sheet for updates.</p>
         <p><strong>Reason:</strong> ${reason || 'Please review and resubmit your goals.'}</p>
         <p>Please update the sheet in Performix and resubmit it.</p>`
      ),
    });
  } catch (error) {
    console.error('Goal rejection email failed:', error.message);
    return { success: false, message: error.message };
  }
};

const sendCheckInReminderEmail = async ({ to, employeeName, quarter }) => {
  try {
    return await sendMailSafe({
      to,
      subject: `${quarter} check-in reminder`,
      html: wrapEmail(
        'Check-In Reminder',
        `<p>Hello ${employeeName},</p>
         <p>This is a reminder that the ${quarter} check-in window is nearing closure.</p>
         <p>Please submit your updates in Performix as soon as possible.</p>`
      ),
    });
  } catch (error) {
    console.error('Check-in reminder email failed:', error.message);
    return { success: false, message: error.message };
  }
};

const sendEscalationEmail = async ({
  to,
  role,
  triggerType,
  employeeName,
  daysOverdue,
}) => {
  try {
    return await sendMailSafe({
      to,
      subject: `Escalation: ${triggerType.replace(/_/g, ' ')}`,
      html: wrapEmail(
        'Escalation Alert',
        `<p>Hello ${role},</p>
         <p>An escalation has been triggered in Performix for <strong>${employeeName}</strong>.</p>
         <p><strong>Trigger:</strong> ${triggerType.replace(/_/g, ' ')}</p>
         <p><strong>Days overdue:</strong> ${daysOverdue}</p>
         <p>Please review and take action.</p>`
      ),
    });
  } catch (error) {
    console.error('Escalation email failed:', error.message);
    return { success: false, message: error.message };
  }
};

module.exports = {
  sendGoalSubmissionEmail,
  sendGoalApprovalEmail,
  sendGoalRejectionEmail,
  sendCheckInReminderEmail,
  sendEscalationEmail,
};
