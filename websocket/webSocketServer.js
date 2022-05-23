const WebSocket = require('ws');
const fs = require('fs');
const url = require('url');
const jwt = require('jsonwebtoken');

const { JWT_SECRET } = require('../config');
const WebSocketClient = require('./webSocketClient');
let rawdata = fs.readFileSync('userCredentials.json');
let userCredentials = JSON.parse(rawdata);

function WebSocketServer(expressServer) {
  // Create an empty list that can be used to store WebSocket clients.
  let wsClients = [];

  function heartbeat() {
    this.isAlive = true;
  }

  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Websocket server
  const wss = new WebSocket.Server({ server: expressServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    ws.isAlive = true;
    ws.on('pong', heartbeat);

    const token = url.parse(req.url, true).query.token;
    let wsUsername = "";

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
          ws.close();
        } else {
          wsClients[token] = ws;
          wsUsername = decoded.username;
        }
    });

    ws.on('message', (data) => {
      for (const [token, client] of Object.entries(wsClients)) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
          if (err) {
            client.send("Error: Your token is no longer valid. Please reauthenticate.");
            client.close();
          } else {
            client.send(wsUsername + ": " + data);
          }
        });
      }
    });

    ws.on('ping', function ping() {
      console.log('pong')
  
    });
  });

  wss.on('close', function close() {
    clearInterval(interval);
  });

  wss.onMessage = (event) => {
    console.log('event: ', event)
  };

  // Websocket Abios client
  const socketAbios = new WebSocketClient();
  socketAbios.onMessage = (event) => {
    // send updates to clients connected to our webSocket server
    wss.clients.forEach((client) => {      
      client.send(event);
    });
  };
}

// Check request credentials, and create a JWT if there is a match.
const fetchUserToken = (req) => {
  for (i=0; i<userCredentials.length; i++) {
    if (userCredentials[i].username == req.query.username
      && userCredentials[i].password == req.query.password) {
      return jwt.sign(
        {
          "sub": userCredentials[i].userId,
          "username": req.query.username
        },
        JWT_SECRET,
        { expiresIn: 1 * 24 * 60 * 60 * 1000 } // Expire the token after 1 day.
      );
    }
  }

  return "Error: No matching user credentials found.";
}

module.exports = {  WebSocketServer, fetchUserToken };
