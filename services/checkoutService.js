// const client = require('../config/twilio');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendSms = async (phoneNumber, carrierDomain, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: `${phoneNumber}@${carrierDomain}`,
    text: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('SMS sent: ' + info.response);
  });
};

const generateRandomPassword = (length = 8) => {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex') // Convert to hexadecimal format
    .slice(0, length); // Return the required number of characters
};

module.exports = {
  generateRandomPassword,
  sendSms
};