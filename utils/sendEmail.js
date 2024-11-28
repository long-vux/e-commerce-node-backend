const nodemailer = require('nodemailer')

module.exports = async (email, subject, text) => {
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
      text, 
    }
    await transporter.sendMail(mailOptions);

    console.log('Email sent successfully')
  } catch (error) {
    console.log('Email not sent')
    console.log(error)
    return false
  }
}
