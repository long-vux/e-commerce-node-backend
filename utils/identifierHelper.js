const { parsePhoneNumberFromString } = require('libphonenumber-js');

function parseIdentifier(identifier) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  let query = {};

  if (emailRegex.test(identifier)) {
    query.email = identifier;
  } else {
    const parsedPhoneNumber = parsePhoneNumberFromString(identifier, 'VN');
    if (!parsedPhoneNumber || !parsedPhoneNumber.isValid()) {
      return { error: { status: 400, message: 'Invalid email or phone number' } };
    }
    query.phone = parsedPhoneNumber.number; // Ensure this matches your schema
  }

  return { query };
}

module.exports = { parseIdentifier };