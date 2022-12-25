var isAlpha = function (ch) {
  return typeof ch === "string" && ch.length === 1 && /[A-Za-z]/.test(ch);
};

const isEmpty = (value) => {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "object" && Object.keys(value).length === 0) ||
    (typeof value === "string" && value.trim().length === 0)
  );
};

const isLenBetweenRange = (text, openingRange, closingRange) => {
  if (text.length >= openingRange && text.length <= closingRange) return true;
  return false;
};

module.exports.isLenBetweenRange = isLenBetweenRange;
module.exports.isEmpty = isEmpty;
module.exports.isAlpha = isAlpha;
