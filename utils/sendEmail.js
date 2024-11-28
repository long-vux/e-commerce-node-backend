const nodemailer = require('nodemailer')

module.exports = async (email, subject, htmlContent) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html: htmlContent, 
    }
    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully')
  } catch (error) {
    console.log('Email not sent')
    console.log(error)
    return false
  }
}
