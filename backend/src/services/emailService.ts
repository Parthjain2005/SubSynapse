import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'SubSynapse <noreply@subsynapse.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
    console.log(`✉️  Email sent to ${options.to}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const sendWelcomeEmail = async (email: string, name: string): Promise<void> => {
  const html = `
    <h1>Welcome to SubSynapse, ${name}!</h1>
    <p>Thank you for joining SubSynapse - the smart way to share subscription costs.</p>
    <p>You've received <strong>1000 free credits</strong> to get started!</p>
    <p>Start exploring subscription groups and save money today.</p>
    <p>Best regards,<br>The SubSynapse Team</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to SubSynapse!',
    html,
  });
};

export const sendPaymentSuccessEmail = async (email: string, amount: number, newBalance: number): Promise<void> => {
  const html = `
    <h1>Payment Successful!</h1>
    <p>Your payment has been processed successfully.</p>
    <p><strong>Amount Added:</strong> ₹${amount}</p>
    <p><strong>New Balance:</strong> ${newBalance} credits</p>
    <p>Thank you for using SubSynapse!</p>
    <p>Best regards,<br>The SubSynapse Team</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Payment Successful - SubSynapse',
    html,
  });
};

export const sendGroupJoinedEmail = async (
  email: string,
  groupName: string,
  username: string,
  password: string
): Promise<void> => {
  const html = `
    <h1>Successfully Joined ${groupName}!</h1>
    <p>Congratulations! You've joined the subscription group.</p>
    <h3>Your Credentials:</h3>
    <p><strong>Username:</strong> ${username}</p>
    <p><strong>Password:</strong> ${password}</p>
    <p>Keep these credentials safe and don't share them with others.</p>
    <p>Best regards,<br>The SubSynapse Team</p>
  `;

  await sendEmail({
    to: email,
    subject: `Welcome to ${groupName} - SubSynapse`,
    html,
  });
};

export const sendGroupApprovedEmail = async (email: string, groupName: string): Promise<void> => {
  const html = `
    <h1>Your Group Has Been Approved!</h1>
    <p>Great news! Your subscription group "<strong>${groupName}</strong>" has been approved by our admin team.</p>
    <p>It's now live and visible to all users on SubSynapse.</p>
    <p>Best regards,<br>The SubSynapse Team</p>
  `;

  await sendEmail({
    to: email,
    subject: 'Group Approved - SubSynapse',
    html,
  });
};

export const sendWithdrawalStatusEmail = async (
  email: string,
  amount: number,
  status: 'approved' | 'rejected',
  notes?: string
): Promise<void> => {
  const html = `
    <h1>Withdrawal Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h1>
    <p>Your withdrawal request for <strong>${amount} credits</strong> has been ${status}.</p>
    ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
    ${status === 'approved' ? '<p>The amount will be transferred to your UPI ID shortly.</p>' : ''}
    <p>Best regards,<br>The SubSynapse Team</p>
  `;

  await sendEmail({
    to: email,
    subject: `Withdrawal ${status === 'approved' ? 'Approved' : 'Rejected'} - SubSynapse`,
    html,
  });
};

export default sendEmail;
