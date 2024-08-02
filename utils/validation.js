const NAME_REGEX = /^[A-Za-z\s]{3,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isValidName = (name) => NAME_REGEX.test(name);
const isValidEmail = (email) => EMAIL_REGEX.test(email);

module.exports = { isValidName, isValidEmail };
