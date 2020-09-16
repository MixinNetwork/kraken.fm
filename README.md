# kraken.fm

Kraken is an instant audio conferencing service, no registration required.

1. start your audio conferencing at `https://kraken.fm/ROOM-ID`
2. `ROOM-ID` could be anything, a simple word is good for a public room
3. refresh home page to get a random and anonymous `ROOM-ID` each time

## Development

At first, get the [kraken server code](https://github.com/MixinNetwork/kraken) and start the engine locally.

Start a static web server to serve the repo directory. One of the easiest ways to do this for our purposes is to use Python's SimpleHTTPServer.

Ensure Python installed and navigate to the directory of this repo. Run the command.

```bash
$ python2 -m SimpleHTTPServer
```

You should see the prompt that server is listening on port 8000.

```bash
Serving HTTP on 0.0.0.0 port 8000 ...
```

Open your browser, access a room with `http://localhost:8000/?room=ROOM-ID`.
