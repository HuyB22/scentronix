export interface Server {
  url: string;
  priority: number;
}

/* 
  Note:
  The server https://offline.scentronix.com seems not to be able
  to be connected because of SSL certificate validation.
  If we disable the validation, then the server can be connected
  and it will return a 404 response. But since doing that is a security problem,
  I'll just assume the server cannot be connected anyway.
*/
export const SERVERS: Server[] = [
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
