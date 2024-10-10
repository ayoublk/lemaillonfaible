const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Serveur du Maillon Faible en ligne');
});

io.on('connection', (socket) => {
  console.log('Un client s\'est connecté');
});

server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});