# DEMO Video 
[![Watch the video](https://drive.google.com/file/d/1eaLlMoyKppGSRfAqnO40KXdl9pk9VtxQ/view?usp=sharing)](https://drive.google.com/file/d/1W0CVmpUjIRg-Xjd6FpWwQ70QvdFZhLy_/view?usp=sharing)



# TCP Chat Server

This is a tiny TCP chat server written in Node.js with nothing but the built-in `net` module. Every client talks plain text over a socket—no HTTP, no frameworks, no database.

## Requirements

- Node.js 18 or newer 

## Run the Server

```powershell
node server.js
```

The server listens on port `4000` by default. To change the port, set the `PORT` environment variable before starting:

```powershell
$env:PORT=5000; node server.js
```

## Connect Clients

Use TCP client `ncat`

```
ncat localhost 4000
```

## Protocol Overview

- `LOGIN <username>` – authenticate. Responds with `OK` or `ERR username-taken`.
- `MSG <text>` – broadcast message. Server relays `MSG <username> <text>` to all users.
- `WHO` – list active users. Server replies with `USER <username>` per user.
- `PING` – heartbeat; server responds with `PONG`.
- On disconnect, remaining users see `INFO <username> disconnected`.

Commands are case-insensitive and the server trims any leading/trailing whitespace so things stay tidy.

## Example Session

**Client 1**
```
 ncat localhost 4000
LOGIN Naman
OK
MSG hi everyone!
```

**Client 2**
```
 ncat localhost 4000
LOGIN Yudi
OK
MSG hello Naman!
WHO
USER Naman
USER Yudi
```

**Client 1 Output**
```
MSG Yudi hello Naman!
USER Naman
USER Yudi
INFO Yudi disconnected
```

**Client 2 Output**
```
MSG Naman hi everyone!
INFO Naman disconnected
```

## Notes

- Empty lines are ignored instead of causing errors.
- Mistyped commands get a friendly `ERR unknown-command`.
- Each socket is handled independently, so you can open as many terminals as your machine can handle.
 
