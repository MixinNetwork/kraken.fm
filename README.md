# kraken.fm

Kraken is an instant audio space and conferencing service, no registration required.

Anyone can start a room anonymously, the room creator can control who is able to talk, and by default all other people are muted.

## Development

At first, get the [kraken server code](https://github.com/MixinNetwork/kraken) and start the engine locally.

Start a static web server to serve the repo directory. One of the easiest ways to do this for our purposes is to use Python.

Ensure Python 3 is installed and change to the directory of this repo. Run the command:

```bash
$ python3 -m http.server
```

You should see the prompt that server is listening on port 8000:

```bash
Serving HTTP on 0.0.0.0 port 8000 ...
```

Open your browser, start a room from `http://localhost:8000`.

Room URLs now carry an end-to-end encryption secret in the URL fragment, for example
`http://localhost:8000/?space=demo&checksum=...#key=...`.
The `#key` fragment is not sent to the Kraken RPC server and must be preserved when sharing room links.

If you want E2EE to work in Firefox and other modern browsers, use a secure context:
`https://...` or `http://localhost:...`.
Serving the app from a plain `http://` LAN or public IP address disables WebCrypto AES and E2EE will not start.

## HTTPS Dev Server

This repo includes a no-dependency local HTTPS server for E2EE testing.

Generate a development certificate:

```bash
npm run cert:https
```

Start the HTTPS server:

```bash
npm run dev:https
```

By default the server listens on `https://localhost:8443`.
It also prints local network URLs that match the generated certificate SAN list.

Optional environment variables:

```bash
HTTPS_PORT=9443 HTTPS_HOST=0.0.0.0 npm run dev:https
```
