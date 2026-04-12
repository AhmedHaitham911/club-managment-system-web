import { normalizeUser, toBackendRole, toFrontendRole } from "../../src/lib/auth-user";

describe("auth-user", () => {
  it("maps backend user payload to frontend shape", () => {
    const normalized = normalizeUser({
      _id: "u1",
      displayName: "Club Admin",
      role: "admin",
      status: "approved",
      profileImageUrl: "https://img.test/a.png",
    });

    expect(normalized).toMatchObject({
      id: "u1",
      _id: "u1",
      name: "Club Admin",
      role: "Officer",
      backendRole: "admin",
      status: "Approved",
      avatar: "https://img.test/a.png",
    });
  });

  it("falls back to member defaults for unknown values", () => {
    expect(toFrontendRole("something-else")).toBe("Member");
    expect(toBackendRole("something-else")).toBe("user");
  });
});
