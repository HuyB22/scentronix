import { Server } from "./shared/server";
import {
  pingAllServersAsync,
  chooseLowestPriorityServerAsync,
} from "./service/server";

/**
 * Ping multiple servers to choose an online server with lowest priority
 * @returns {Promise<string | Server>}
 */
export function findServer(): Promise<string | Server> {
  const pings: Promise<Server>[] = pingAllServersAsync();

  /*
   Sending GET requests concurrently
   This should be enough for I/O operation such as HTTP request
   If we need real parallel, we can use Worker Thread
  */
  const chosenServerResult: Promise<string | Server> = Promise.allSettled(
    pings
  ).then((results) => chooseLowestPriorityServerAsync(results));

  return chosenServerResult;
}
