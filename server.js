const express = require('express');
const { WebSocketServer, fetchUserToken } = require('./websocket/webSocketServer');

const { PORT } = require('./config');

// Create the server
const server = express()

// Serve the static files in the `/public` directory.
server.use(express.static("public"))

// Create an endpoint for authentication.
server.get('/auth', (req, res) => {
  res.send(fetchUserToken(req));
})

// Begin listening for requests.
const expressServer = server.listen(PORT, () => console.log(`Server running on port: ${PORT}`) )

// The server mounts to the `/ws` route of the Express JS server.
new WebSocketServer(expressServer);
