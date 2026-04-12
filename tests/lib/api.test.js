import {
  api,
  AUTH_SESSION_EXPIRED_EVENT,
  clearAuthToken,
  setAuthToken,
} from "../../src/lib/api";
import axios from "axios";
import { setStoredToken } from "../../src/lib/auth-storage";

describe("api auth handling", () => {
  afterEach(() => {
    clearAuthToken();
  });

  it("sets and clears default authorization header", () => {
    setAuthToken("abc.def.ghi");
    expect(api.defaults.headers.common.Authorization).toBe("Bearer abc.def.ghi");

    clearAuthToken();
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
  });

  it("clears stored auth and emits session-expired event on invalid token response", async () => {
    const token = "abc.def.ghi";
    setStoredToken(token);
    setAuthToken(token);

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    const responseErrorHandler = api.interceptors.response.handlers[0].rejected;
    const error = {
      response: {
        status: 401,
        data: { message: "Unauthorized: invalid or expired token." },
      },
      config: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    };

    await expect(responseErrorHandler(error)).rejects.toBe(error);

    expect(localStorage.getItem("campus_club_access_token")).toBeNull();
    expect(api.defaults.headers.common.Authorization).toBeUndefined();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.any(Event));
    expect(dispatchSpy.mock.calls[0][0].type).toBe(AUTH_SESSION_EXPIRED_EVENT);
  });

  it("overwrites stale Authorization headers with the latest token", async () => {
    setStoredToken("new.token.value");
    setAuthToken("new.token.value");

    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const config = {
      headers: {
        Authorization: "Bearer old.token.value",
      },
    };

    const output = await requestHandler(config);
    expect(output.headers.Authorization).toBe("Bearer new.token.value");
  });

  it("prefers localStorage token over stale in-memory token", async () => {
    setAuthToken("old.token.value");
    setStoredToken("latest.token.value");

    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const output = await requestHandler({ headers: {} });

    expect(output.headers.Authorization).toBe("Bearer latest.token.value");
  });

  it("overwrites stale token when AxiosHeaders is used", async () => {
    setAuthToken("old.token.value");
    setStoredToken("latest.token.value");

    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const headers = new axios.AxiosHeaders({
      Authorization: "Bearer old.token.value",
    });
    const output = await requestHandler({ headers });

    expect(output.headers.get("Authorization")).toBe("Bearer latest.token.value");
  });
});
