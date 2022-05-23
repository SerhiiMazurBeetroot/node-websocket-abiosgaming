# Node.js WebSocket Server

- Creates a Node.js server

- WebSocketClient connects to the Abios WebSocket Push API.

- WebSocketServer creates its own WebSocket Server, which send all the messages from the Abios to connected users.

- Users from your site are connect to your WebSocketServer and receive all updates from Abios.

<br>

# 1. Requirements
 
1. Install Docker v20.10+ [Linux,](https://docs.docker.com/engine/installation) 
[Docker for Mac,](https://docs.docker.com/engine/installation/mac)
[Docker for Windows](https://docs.docker.com/engine/installation/windows)

2. For Linux additionally install [Docker Compose](https://docs.docker.com/compose/install) v1.29+

<br>

# 2. Quickstart
1. Clone the repository

<br>

2. Set up your variables in the .env file

<br>

3. Run docker container

```bash
docker-compose up -d --build
```

4. To visit the "test client application", and receive all the messages from Abios, open

```
http://localhost:5000/
```

5. Sign in with test user

```properties
username: userA
password: userA
```

<br>

# 3. Project tree

```
├── .env.example               
├── server.js                  
├── config.js                   
├── userCredentials.json       
├── Dockerfile                  
├── docker-compose.yml          
├── websocket                   
|    └── webSocketClient.js   
|    └── webSocketServer.js   
└── public                     
     └── index.html           
     └── script.js            
     └── style.css            
```
