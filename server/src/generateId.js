const generateId = (bytes = 10) => require('crypto').randomBytes(bytes).toString('hex');

module.exports = generateId;