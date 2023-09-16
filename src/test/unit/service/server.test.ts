import * as serverService from "../../../service/server";
import axios, { AxiosError } from "axios";
import { SERVERS, Server } from "../../../shared/server";
import { NO_ONLINE_SERVER } from "../../../error/error";

jest.mock("axios");
/*
  Mock const SERVERS so the test doesn't depend on the variable
  since the value can change in the future (add or remove server)
*/
jest.mock("../../../shared/server", () => ({
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

describe("pingServerAsync", () => {
  afterEach(() => {
    mAxiosGet.mockRestore();
  });

  it("should reject with the error when ping failed", () => {
    const error: AxiosError = new AxiosError();
    const server: Server = {
      url: "https://does-not-work.perfume.new",
      priority: 1,
    };
    mAxiosGet.mockRejectedValueOnce(error);

    return expect(serverService.pingServerAsync(server)).rejects.toEqual(error);
  });

  it("should resolve with the server when there is a response with status 200", () => {
    const server: Server = {
      url: "https://does-not-work.perfume.new",
      priority: 1,
    };
    mAxiosGet.mockResolvedValueOnce({ status: 200 });

    return expect(serverService.pingServerAsync(server)).resolves.toEqual(server);
  });
});

describe("pingAllServersAsync", () => {
  it("should return a list of promise corresponding to the number of servers", () => {
    const pings: Promise<Server>[] = [];
    mAxiosGet.mockResolvedValue({ status: 200 });
    for (const server of SERVERS) {
      const request: Promise<Server> = serverService.pingServerAsync(server);
      pings.push(request);
    }

    return expect(serverService.pingAllServersAsync()).toEqual(pings);
  });
});

describe("chooseLowestPriorityServerAsync", () => {
  describe("rejects with error: No servers are online", () => {
    afterEach(() => {
      mAxiosGet.mockRestore();
    });

    it("when all PromiseSettledResult rejected", () => {
      mAxiosGet.mockRejectedValue(new AxiosError());
      const pings: Promise<Server>[] = serverService.pingAllServersAsync();

      const chosenServerResult: Promise<string | Server> = Promise.allSettled(
        pings
      ).then((results) =>
        serverService.chooseLowestPriorityServerAsync(results)
      );

      return expect(chosenServerResult).rejects.toBe(NO_ONLINE_SERVER)
    });
  });

  describe("resolves with the server with the lowest priority", () => {
    afterEach(() => {
      mAxiosGet.mockRestore();
    });

    it("when all PromiseSettledResults fulfilled", () => {
      mAxiosGet.mockResolvedValue({ status: 200 });
      const pings: Promise<Server>[] = serverService.pingAllServersAsync();

      const expected: Server = {
        url: "https://does-not-work.perfume.new",
        priority: 1,
      };

      const chosenServerResult: Promise<string | Server> = Promise.allSettled(
        pings
      ).then((results) =>
        serverService.chooseLowestPriorityServerAsync(results)
      );

      return expect(chosenServerResult).resolves.toEqual(expected)
    });

    it("when some PromiseSettledResults fulfilled", () => {
      /*
        PromiseSettledResult of ping server with priority 1, 3 rejected
        PromiseSettledResult of ping server with priority 2, 4 fulfilled
      */
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });

      const pings: Promise<Server>[] = serverService.pingAllServersAsync();

      const expected: Server = {
        url: "https://offline.scentronix.com",
        priority: 2,
      };

      const chosenServerResult: Promise<string | Server> = Promise.allSettled(
        pings
      ).then((results) =>
        serverService.chooseLowestPriorityServerAsync(results)
      );

      return expect(chosenServerResult).resolves.toEqual(expected)
    });

    it("when only 1 PromiseSettledResult fulfilled", () => {
      /*
        PromiseSettledResult of ping server with priority 1, 2, 4 rejected
        PromiseSettledResult of ping server with priority 3 fulfilled
      */
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockRejectedValueOnce(new AxiosError());
      mAxiosGet.mockResolvedValueOnce({ status: 200 });
      mAxiosGet.mockRejectedValueOnce(new AxiosError());

      const pings: Promise<Server>[] = serverService.pingAllServersAsync();

      const expected: Server = {
        url: "http://app.scnt.me",
        priority: 3,
      };

      const chosenServerResult: Promise<string | Server> = Promise.allSettled(
        pings
      ).then((results) =>
        serverService.chooseLowestPriorityServerAsync(results)
      );

      return expect(chosenServerResult).resolves.toEqual(expected)
    });
  });
});
