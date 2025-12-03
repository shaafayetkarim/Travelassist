
import nodemailer from 'nodemailer';

// Create transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// Function to send trip creation email
export const sendTripCreationEmail = async (userEmail: string, userName: string, tripDescription: string) => {
  try {
    const mailOptions = {
      from: 'tripadvisorcse471@gmail.com',
      to: userEmail,
      subject: 'Trip Created Successfully',
      text: `Trip has been created for ${userName},\n\nDescription & Safety Tips: ${tripDescription}\n\nThank you for using our service!`
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};