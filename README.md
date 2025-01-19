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
