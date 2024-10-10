const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { db, getQuestionsAleatoires } = require('./database');


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

// Exemple d'utilisation de la base de données
app.get('/questions', (req, res) => {
    getQuestionsAleatoires(5, (err, questions) => {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la récupération des questions' });
        } else {
            res.json(questions);
        }
    });
});

server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});