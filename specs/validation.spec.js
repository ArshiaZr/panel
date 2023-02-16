const { validateRequests } = require("../components/validation");
const { isEmpty } = require("../validations/common");
const expect = require("chai").expect;

describe("validation", () => {
  it("handles required", () => {
    const options = [
      {
        type: "text",
        title: "username",
        required: {
          value: true,
          error: "The input is required",
        },
      },
      {
        type: "password",
        title: "password",
        required: {
          value: true,
          error: "The input is required",
        },
      },
    ];
    const inputs = { username: "", password: "" };
    expect(validateRequests(inputs, options)).to.deep.equal({
      username: "The input is required",
      password: "The input is required",
    });
  });
  it("length handler(lower)", () => {
    const options = [
      {
        type: "text",
        title: "username",
        required: {
          value: true,
          error: "The input is required",
        },
        length: {
          value: [8, 20],
          error: "The length shoud be between 8, 20",
        },
      },
    ];
    const inputs = { username: "aaaaaaa" };
    expect(validateRequests(inputs, options)).to.deep.equal({
      username: "The length shoud be between 8, 20",
    });
  });
  it("length handler(between)", () => {
    const options = [
      {
        type: "text",
        title: "username",
        required: {
          value: true,
          error: "The input is required",
        },
        length: {
          value: [8, 20],
          error: "The length shoud be between 8, 20",
        },
      },
    ];

    const inputs = { username: "aaaaaaaaaaaaaaaaaaaa" };
    expect(validateRequests(inputs, options)).to.deep.equal({});
  });
  it("length handler(over)", () => {
    const options = [
      {
        type: "text",
        title: "username",
        required: {
          value: true,
          error: "The input is required",
        },
        length: {
          value: [8, 20],
          error: "The length shoud be between 8, 20",
        },
      },
    ];
    const inputs = { username: "aaaaaaaaaaaaaaaaaaaaa" };
    expect(validateRequests(inputs, options)).to.deep.equal({
      username: "The length shoud be between 8, 20",
    });
  });
  it("password handler", () => {
    const options = [
      {
        type: "password",
        title: "password",
        required: {
          value: true,
          error: "The input is required",
        },
        length: {
          value: [8, 20],
        },
      },
    ];
    const inputs = { password: "aaaaaaaa&" };
    expect(validateRequests(inputs, options)).to.deep.equal({
      password: "Password must contain one of A-Z characters",
    });
  });
  it("phonenumber handler", () => {
    const options = [
      {
        title: "phonenumber",
        type: "phonenumber",
        required: {
          value: true,
          error: "The input is required",
        },
        error: "The phone number is not valid",
      },
    ];
    const inputs = { phonenumber: "+16473034246" };
    expect(validateRequests(inputs, options)).to.deep.equal({});
  });
  it("email handler", () => {
    const options = [
      {
        type: "email",
        title: "email",
        required: {
          value: true,
          error: "The input is required",
        },
        error: "The email is not Valid",
      },
    ];
    const inputs = { email: "a@c.com" };
    expect(validateRequests(inputs, options)).to.deep.equal({});
  });
  it("date handler", () => {
    const options = [
      {
        type: "date",
        title: "to",
        required: {
          value: true,
          error: "The input is required",
        },
        error: "a",
      },
    ];
    const inputs = { to: "31/02/2022" };
    expect(validateRequests(inputs, options)).to.deep.equal({
      to: "a",
    });
  });
});
