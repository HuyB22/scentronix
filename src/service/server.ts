import axios from "axios";
import { Server, SERVERS } from "../shared/server";
import { NO_ONLINE_SERVER } from "../error/error";
import { REQUEST_TIMEOUT } from "../shared/constant";

/**
 * Ping a server to see if it is online
 * @param {Server} server
 * @returns {Promise<Server>}
 */
export function pingServerAsync(server: Server): Promise<Server> {
  return axios
    .get(server.url, {
      timeout: REQUEST_TIMEOUT,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      validateStatus: (status) => {
        /* 
          Only resolve status 200-299
          However, redirect response will return the last destination status
          instead of 300-399 so it will still pass
          Not sure if I have to handle this case
        */
        return isStatusOk(status);
      },
    })
    .then((response) => {
      return Promise.resolve(server);
    })
    .catch((error) => {
      // Could log the error if necessary
      return Promise.reject(error);
    });
}

/**
 * Ping all servers which are available to the app
 * @returns {Promise<Server>[]}
 */
export function pingAllServersAsync(): Promise<Server>[] {
  const pings: Promise<Server>[] = [];
  for (const server of SERVERS) {
    const request: Promise<Server> = pingServerAsync(server);
    pings.push(request);
  }

  return pings;
}

/**
 * Iterate through the servers' responses to choose an online server with the lowest priority
 * @param {PromiseSettledResult<Server>[]} results
 * @returns {Promise<string | Server>}
 */
export function chooseLowestPriorityServerAsync(
  results: PromiseSettledResult<Server>[]
): Promise<string | Server> {
  let chosenServer: Server | null = null;
  for (const result of results) {
    // We discard any ping which is rejected
    if (result.status !== "fulfilled") {
      // Could log the error in result.reason if necessary
      continue;
    }

    const server = result.value;
    if (!server) {
      continue;
    }

    if (!chosenServer || server.priority < chosenServer.priority) {
      chosenServer = server;
    }
  }

  if (!chosenServer) {
    return Promise.reject(NO_ONLINE_SERVER);
  }

  return Promise.resolve(chosenServer);
}

/**
 * Check if response status is OK
 * @param {number} status
 * @returns {boolean}
 */
function isStatusOk(status: number): boolean {
  return 200 <= status && status <= 299;
}
