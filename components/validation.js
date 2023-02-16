function validateRequests(inputs, meters) {
  let errors = {};
  for (let i = 0; i < meters.length; i++) {
    let meter = meters[i];
    let input = inputs[meter.title];
    if (meter.required && meter.required.value && isEmpty(input)) {
      errors[meter.title] = meter.required.error;
      continue;
    }
    if (meter.type === "password") {
      let res = validatePassword(
        input,
        meter.length.value[0],
        meter.length.value[1]
      );
      if (!isEmpty(res)) {
        errors[meter.title] = res;
        continue;
      }
    }
    if (
      meter.length &&
      !validateLength(input, meter.length.value[0], meter.length.value[1])
    ) {
      errors[meter.title] = meter.length.error;
      continue;
    }
    if (meter.type === "phonenumber") {
      if (!isPhoneNumberValid(input)) {
        errors[meter.title] = meter.error;
        continue;
      }
    }
    if (meter.type === "email") {
      if (!isEmailValid(input)) {
        errors[meter.title] = meter.error;
        continue;
      }
    }
    if (meter.type === "date") {
      if (!isDateValid(input)) {
        errors[meter.title] = meter.error;
        continue;
      }
    }
    if (meter.type === "options") {
      if (
        meter.validOptions &&
        meter.validOptions.value &&
        meter.validOptions.value.includes(input.toLowerCase())
      ) {
        continue;
      } else {
        errors[meter.title] = meter.error;
      }
    }
  }
  return { isValid: isEmpty(errors), errors };
}

module.exports.validateRequests = validateRequests;

const isEmpty = (input) => {
  return (
    input === undefined ||
    input === null ||
    (typeof input === "object" && Object.keys(input).length === 0) ||
    (typeof input === "string" && input.trim().length === 0)
  );
};

const validateLength = (text, openingRange, closingRange) => {
  return text.length >= openingRange && text.length <= closingRange;
};

const validatePassword = (password, openingRange, closingRange) => {
  if (!validateLength(password, openingRange, closingRange)) {
    return `Password should be between ${openingRange} and ${closingRange}`;
  }
  if (!/[A-Z]+/.test(password))
    return "Password must contain one of A-Z characters";
  if (!/[a-z]+/.test(password))
    return "Password must contain one of a-z characters";
  if (!/[0-9]+/.test(password))
    return "Password must contain one of 0-9 numbers";
  if (!/[\W]+/.test(password))
    return "Password must contain one of special characters";
  return "";
};

const isPhoneNumberValid = (phonenumer) => {
  return /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/.test(
    phonenumer
  );
};

const isEmailValid = (email) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

function isDateValid(date) {
  let dateformat = /^(0?[1-9]|[1-2][0-9]|3[01])[\/](0?[1-9]|1[0-2])/;

  // Matching the date through regular expression
  if (date.match(dateformat)) {
    let operator = date.split("/");

    // Extract the string into month, date and year
    let datepart = [];
    if (operator.length > 1) {
      datepart = date.split("/");
    }
    let day = parseInt(datepart[0]);
    let month = parseInt(datepart[1]);
    let year = parseInt(datepart[2]);

    // Create a list of days of a month
    let ListofDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month == 1 || month > 2) {
      if (day > ListofDays[month - 1]) {
        return false;
      }
    } else if (month == 2) {
      let leapYear = false;
      if ((!(year % 4) && year % 100) || !(year % 400)) leapYear = true;
      if (leapYear == false && day >= 29) {
        return false;
      } else if (leapYear == true && day > 29) {
        return false;
      }
    }
  } else {
    return false;
  }
  return true;
}
