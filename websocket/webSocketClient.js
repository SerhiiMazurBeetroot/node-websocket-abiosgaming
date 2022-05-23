const WebSocket = require('ws');
const axios = require("axios");
const qs = require("querystring");

const { CLIENT_ID, CLIENT_SECRET, SUBSCRIPTION_ID } = require('../config');
const timestamp = () => new Date().toISOString().replace('T', ' ').substr(0, 19);

// Websocket Abios client
function WebSocketClient() {
  let ws;
  let timeout;
  let connecting = false;
  let backoff = 250;

  const init = async ()  => {
    let token = await getAbiosToken();
    let url = `wss://ws.abiosgaming.com/v0?access_token=${token}&subscription_id=${SUBSCRIPTION_ID}`;
    
    console.error(timestamp(), 'WebSocketClient :: connecting');
    connecting = false;
    if (ws !== undefined) {
      ws.removeAllListeners();
    }
    ws = new WebSocket(url);

    const heartbeat = () => {
      if (timeout !== undefined) {
        clearTimeout(timeout);
        timeout = undefined;
      }
      timeout = setTimeout(() => ws.terminate(), 35000);
    };

    ws.on('ping', () => {
      console.log(timestamp(), 'WebSocketClient :: pinged');
      heartbeat();
    });

    ws.on('open', (e) => {
      if (typeof this.onOpen === 'function') {
        this.onOpen();
      } else {
        console.log(timestamp(), 'WebSocketClient :: opened');
      }
      heartbeat();
    });

    ws.on('message', (e) => {
      if (typeof this.onMessage === 'function') {
        this.onMessage(e);
      } else {
        console.log(timestamp(), 'WebSocketClient :: messaged');
      }
      heartbeat();
    });

    ws.on('close', (e) => {
      if (e.code !== 1000) {
        if (connecting === false) { // abnormal closure
          backoff = backoff === 8000 ? 250 : backoff * 2;
          setTimeout(() => init(), backoff);
          connecting = true;
        }
      } else if (typeof this.onClose === 'function') {
        this.onClose();
      } else {
        console.error(timestamp(), 'WebSocketClient :: closed');
        console.error(e);
      }
    });

    ws.on('error', (e) => {
      if (e.code === 'ECONREFUSED') {
        if (connecting === false) { // abnormal closure
          backoff = backoff === 8000 ? 250 : backoff * 2;
          setTimeout(() => init(), backoff);
          connecting = true;
        }
      } else if (typeof this.onError === 'function') {
        this.onError(e);
      } else {
        console.error(timestamp(), 'WebSocketClient :: errored');
        console.error(e);
      }
    });
    this.send = ws.send.bind(ws);
  };
  init();
}

// Get Abios token
const getAbiosToken = async () => { 
  try {
    const response = await axios.post('https://api.abiosgaming.com/v2/oauth/access_token',
      qs.stringify({
        'grant_type': 'client_credentials',
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
      })
    );
    return response.data.access_token;
  } catch (error) {
    console.error(error.code)
  }
}

module.exports = WebSocketClient;
