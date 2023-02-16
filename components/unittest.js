const assert = require("assert");
const { validateRequests } = require("./validation");
describe("validation", () => {
  it("handles required", () => {
    const options = {
      username: {
        required: {
          value: true,
          error: "The input is required",
        },
      },
    };
    const inputs = { username: "" };
    assert(validateRequests(inputs, options), {
      username: "The input is required",
    });
  });
});
test();
