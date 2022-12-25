const path = require("path");
const { isAlpha, isEmpty, isLenBetweenRange } = require(path.join(
  __dirname,
  "./common"
));

const pastDateValidation = (date) => {
  if (!date) {
    return 0;
  }

  var regexp = /^(\d+)(.)$/g;
  const match = date.match(regexp);

  if (
    !match ||
    match.length !== 1 ||
    !isAlpha(match[0].substr(match[0].length - 1))
  ) {
    return false;
  }

  return true;
};

const validateEmail = (email) => {
  if (isEmpty(email)) return { email: "Email is required" };
  if (
    !String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
  )
    return { email: "Email is not valid" };
  return null;
};

const validatePassword = (password) => {
  if (isEmpty(password)) return { password: "Password is required" };
  let error = [];
  if (!isLenBetweenRange(password, 8, 20))
    return { password: "Password should be between 8 and 20 characters" };
  if (!/[A-Z]+/.test(password))
    error.push("Password must contain one of A-Z characters");
  if (!/[a-z]+/.test(password))
    error.push("Password must contain one of a-z characters");
  if (!/[0-9]+/.test(password))
    error.push("Password must contain one of 0-9 numbers");
  if (!/[\W]+/.test(password))
    error.push("Password must contain one of special characters");
  if (error.length > 0) return { password: error };
  return null;
};

const textLength = (text, min, max, errorTitle) => {
  if (text && isLenBetweenRange(text, min, max)) return null;
  return {
    [errorTitle]: `${errorTitle} must be between ${min} and ${max} characters`,
  };
};

const isValidOption = (text, array, errorTitle) => {
  if (isEmpty(text))
    return {
      [errorTitle]: `${errorTitle} is required`,
    };
  if (!array.includes(text.toLowerCase()))
    return {
      [errorTitle]: `${errorTitle} is not valid`,
    };
  return null;
};

const validatePhonenumber = (phonenumer) => {
  if (isEmpty(phonenumer)) return { phonenumer: "phonenumber is required" };
  if (
    !/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(
      phonenumer
    )
  )
    return { phonenumer: "phonenumber is not valid" };
  return null;
};

const validateCurrency = (currency, errorTitle) => {
  if (isEmpty(currency)) return { [errorTitle]: `${errorTitle} is required` };
  if (!/^\$?(([1-9]\d{0,2}(,\d{3})*)|0)?\.\d{1,2}$/.test(currency))
    return { [errorTitle]: `${errorTitle} is not valid` };
  return null;
};
module.exports.pastDateValidation = pastDateValidation;
module.exports.validateEmail = validateEmail;
module.exports.validatePassword = validatePassword;
module.exports.textLength = textLength;
module.exports.isValidOption = isValidOption;
module.exports.validatePhonenumber = validatePhonenumber;
module.exports.validateCurrency = validateCurrency;
