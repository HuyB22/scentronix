import axios, { AxiosError } from "axios";
import { findServer } from "../..";
import { NO_ONLINE_SERVER } from "../../error/error";
import { Server } from "../../shared/server";

jest.mock("axios");
/*
  Mock const SERVERS so the test doesn't depend on the variable
  since the value can change in the future (add or remove server)
*/
jest.mock("../../shared/server", () => ({
  get SERVERS() {
    return [
      {
        url: "https://does-not-work.perfume.new",
        priority: 1,
      },
      {
        url: "https://gitlab.com",
        priority: 4,
      },
      {
        url: "http://app.scnt.me",
        priority: 3,
      },
      {
        url: "https://offline.scentronix.com",
        priority: 2,
      },
    ];
  },
}));
const mAxiosGet = jest.mocked(axios.get);

describe("findServer", () => {
  describe("rejects with error: No servers are online", () => {
    afterEach(() => {
      mAxiosGet.mockRestore();
    });

    it("when all requests failed (timeout or invalid response)", () => {
      mAxiosGet.mockRejectedValue(new AxiosError());

      return expect(findServer()).rejects.toBe(NO_ONLINE_SERVER);
    });
  });

  describe("resolves with the server with the lowest priority", () => {
    afterEach(() => {
      mAxiosGet.mockRestore();
    });

    it("when all requests have response status 200", () => {
      mAxiosGet.mockResolvedValue({ status: 200 });
      const expected: Server = {
        url: "https://does-not-work.perfume.new",
        priority: 1,
      };

      return expect(findServer()).resolves.toEqual(expected);
    });

    it("when some requests have response status 200", () => {
      /*
        Server with priority 1, 3 ping failed (timeout or have invalid response status)
        Server with priority 2, 4 have response status 200
      */
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });

      const expected: Server = {
        url: "https://offline.scentronix.com",
        priority: 2,
      };

      return expect(findServer()).resolves.toEqual(expected);
    });

    it("when only 1 request has response status 200", () => {
      /*
        Server with priority 1, 2, 4 ping failed (timeout or have invalid response status)
        Server with priority 3 have response status 200
      */
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });
      mAxiosGet.mockRejectedValueOnce(new AxiosError());

      const expected: Server = {
        url: "http://app.scnt.me",
        priority: 3,
      };

      return expect(findServer()).resolves.toEqual(expected);
    });
  });
});
