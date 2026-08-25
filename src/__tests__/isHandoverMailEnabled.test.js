import { isHandoverMailEnabled } from "../utils/assetHelpers";

test("should return false when assignmentType is not employee", () => {
  const asset = {
    // yahan kya daalega?
    assignmentType: "department",
    assignedToId: "123",
    approvalRequests: [{ status: "approved" }],
  };
  expect(isHandoverMailEnabled(asset)).toBe(false);
});

test("should return false when assignedToId is missing", () => {
  const asset = {
    assignmentType: "employee",
    // assignedToId missing
    approvalRequests: [{ status: "approved" }],
  };
  expect(isHandoverMailEnabled(asset)).toBe(false);
});

test("should return true when there are no approval requests", () => {
  const asset = {
    assignmentType: "employee",
    assignedToId: "123",
    // approvalRequests missing
  };
  expect(isHandoverMailEnabled(asset)).toBe(true);
});

test("should return true when latest approval request is approved", () => {
  const asset = {
    assignmentType: "employee",
    assignedToId: "123",
    approvalRequests: [{ status: "approved" }],
  };
  expect(isHandoverMailEnabled(asset)).toBe(true);
});

test("should return false when latest approval request is not approved", () => {
  const asset = {
    assignmentType: "employee",
    assignedToId: "123",
    approvalRequests: [{ status: "pending" }],
  };
  expect(isHandoverMailEnabled(asset)).toBe(false);
});

test("should return false when latest approval request is rejected", () => {
  const asset = {
    assignmentType: "employee",
    assignedToId: "123",
    approvalRequests: [{ status: "rejected" }],
  };
  expect(isHandoverMailEnabled(asset)).toBe(false);
});

test("should check only the latest approval request", () => {
  const asset = {
    assignmentType: "employee",
    assignedToId: "123",
    approvalRequests: [
      { status: "pending" },
      { status: "approved" }, // old request
      // latest request
    ],
  };
  expect(isHandoverMailEnabled(asset)).toBe(false); // because latest is pending
});
