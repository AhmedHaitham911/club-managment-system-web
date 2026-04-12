import {
  clearStoredAuth,
  getStoredToken,
  getStoredUser,
  migrateLegacyAuthStorage,
  setStoredToken,
  setStoredUser,
} from "../../src/lib/auth-storage";

describe("auth-storage", () => {
  it("stores and reads token and user", () => {
    setStoredToken("abc.def.ghi");
    setStoredUser('{"id":"1"}');

    expect(getStoredToken()).toBe("abc.def.ghi");
    expect(getStoredUser()).toBe('{"id":"1"}');
  });

  it("clears both current and legacy keys", () => {
    localStorage.setItem("campus_club_access_token", "token");
    localStorage.setItem("campus_club_user", "{}");
    localStorage.setItem("token", "legacy-token");
    localStorage.setItem("user", "{}");

    clearStoredAuth();

    expect(localStorage.getItem("campus_club_access_token")).toBeNull();
    expect(localStorage.getItem("campus_club_user")).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("migrates legacy values once and removes legacy keys", () => {
    localStorage.setItem("token", "legacy.abc.def");
    localStorage.setItem("user", '{"name":"Legacy"}');

    migrateLegacyAuthStorage();

    expect(getStoredToken()).toBe("legacy.abc.def");
    expect(getStoredUser()).toBe('{"name":"Legacy"}');
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
