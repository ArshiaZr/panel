const FINANCIAL = "financial";
const STORE = "store";
const PRODUCTS = "products";
const WEB_ANALYTICS = "web-analytics";
const CUSTOMER_MANAGEMENT = "customer-management";
const EDIT = "edit";
const EMPLOYEES = "employees";
const ADD_ADMIN = "add-admin";
const DEL_ADMIN = "del-admin";
const CHNG_ROLE = "change-role";
const ENBL_ADMIN = "enable-disable-admin";
const DEL_EMP = "delete-employee";

const multer = require("multer");
// Upload policy
const upload = multer({
  dest: "./uploads",
  limits: 4 * 1000 * 1000,
});

module.exports.hierarchy = {
  administrator: [
    FINANCIAL,
    STORE,
    PRODUCTS,
    WEB_ANALYTICS,
    CUSTOMER_MANAGEMENT,
    EMPLOYEES,
    EDIT,
    ADD_ADMIN,
    CHNG_ROLE,
    DEL_ADMIN,
    ENBL_ADMIN,
    DEL_EMP,
  ],
  owner: [
    FINANCIAL,
    STORE,
    PRODUCTS,
    WEB_ANALYTICS,
    CUSTOMER_MANAGEMENT,
    EMPLOYEES,
    EDIT,
    DEL_EMP,
  ],
  headdepartment: [EMPLOYEES, DEL_EMP],
  support: [STORE, PRODUCTS, CUSTOMER_MANAGEMENT],
  employees: [],
};
module.exports.employerEmployee = {
  administrator: ["owner", "headdepartment", "support", "employees"],
  owner: ["headdepartment", "support"],
  support: [],
  employees: [],
};
module.exports.upload = upload;
module.exports.VERIFIED = "verified";
module.exports.ENABLED = "enabled";
module.exports.FINANCIAL = FINANCIAL;
module.exports.STORE = STORE;
module.exports.PRODUCTS = PRODUCTS;
module.exports.WEB_ANALYTICS = WEB_ANALYTICS;
module.exports.CUSTOMER_MANAGEMENT = CUSTOMER_MANAGEMENT;
module.exports.EDIT = EDIT;
module.exports.EMPLOYEES = EMPLOYEES;
module.exports.ADD_ADMIN = ADD_ADMIN;
module.exports.DEL_ADMIN = DEL_ADMIN;
module.exports.CHNG_ROLE = CHNG_ROLE;
module.exports.ENBL_ADMIN = ENBL_ADMIN;
module.exports.DEL_EMP = DEL_EMP;
