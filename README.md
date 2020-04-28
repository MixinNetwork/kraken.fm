# kraken.fm

Kraken is an instant audio conferencing service, no registration required.

1. start your audio conferencing at `https://kraken.fm/ROOM-ID`
2. `ROOM-ID` could be anything, a simple word is good for a public room
3. refresh home page to get a random and anonymous `ROOM-ID` each time

## Development

1. Start a static web server to serve the repo directory.
2. Uncomment the line with `getUrlParam('room')` in `index.js`.
3. Access a room with `http://localhost:PORT/?room=ROOM-ID`.
