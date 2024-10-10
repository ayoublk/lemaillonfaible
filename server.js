const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const MaillonFaibleGame = require('./gameLogic');
const { db } = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Créer une instance du jeu
const game = new MaillonFaibleGame(io);

app.get('/', (req, res) => {
  res.send('Serveur du Maillon Faible en ligne');
});

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Un client s\'est connecté');

// Créer une nouvelle partie
socket.on('creerPartie', async (data, callback) => {
    try {
      const partieId = await game.demarrerPartie(data.nombreJoueurs);
      socket.join(partieId);
      callback({ success: true, partieId });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Rejoindre une partie
socket.on('rejoindrePartie', async (data, callback) => {
    try {
      await game.ajouterJoueur(data.partieId, data.nomJoueur);
      socket.join(data.partieId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Démarrer une manche
socket.on('demarrerManche', async (data, callback) => {
    try {
      await game.demarrerManche(data.partieId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Jouer un tour
socket.on('jouerTour', async (data, callback) => {
    try {
      await game.jouerTour(data.partieId, data.joueurId, data.reponseCorrecte, data.aBanque);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Voter pour éliminer un joueur
socket.on('voter', async (data, callback) => {
    try {
      game.enregistrerVote(data.partieId, data.votantId, data.votePourId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

  // Répondre à une question du face-à-face
  socket.on('repondreFaceAFace', async (data, callback) => {
    try {
      // Implémenter la logique pour traiter la réponse du face-à-face
      // Cette fonctionnalité devra être ajoutée à gameLogic.js
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });
});

// Route existante pour récupérer des questions aléatoires
app.get('/questions', (req, res) => {
    getQuestionsAleatoires(5, (err, questions) => {
        if (err) {
            res.status(500).json({ error: 'Erreur lors de la récupération des questions' });
        } else {
            res.json(questions);
        }
    });
});

// Route pour créer une nouvelle partie
app.post('/api/parties', async (req, res) => {
    try {
        const partieId = await creerPartie();
        res.status(201).json({ id: partieId, message: 'Partie créée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la création de la partie', error: error.message });
    }
});

// Route pour ajouter un nouveau joueur
app.post('/api/joueurs', async (req, res) => {
    try {
        const { nom, partieId } = req.body;
        const joueurId = await ajouterJoueur(nom, partieId);
        res.status(201).json({ id: joueurId, nom, message: 'Joueur ajouté avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'ajout du joueur', error: error.message });
    }
});

// Route pour récupérer la liste des joueurs
app.get('/api/joueurs', (req, res) => {
    db.all('SELECT * FROM joueurs', [], (err, rows) => {
        if (err) {
            res.status(500).json({ message: 'Erreur lors de la récupération des joueurs', error: err.message });
        } else {
            res.json(rows);
        }
    });
});

/* REDONANCE AVEC LA GESTION PAR SOCKET.IO

// Route pour commencer une manche
app.post('/api/parties/:partieId/manches', async (req, res) => {
    try {
        const { partieId } = req.params;
        const { numeroManche, dureeManche } = req.body;
        const mancheId = await commencerManche(partieId, numeroManche, dureeManche);
        res.status(201).json({ id: mancheId, message: 'Manche commencée avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors du démarrage de la manche', error: error.message });
    }
});

// Route pour enregistrer un tour
app.post('/api/manches/:mancheId/tours', async (req, res) => {
    try {
        const { mancheId } = req.params;
        const { joueurId, questionId, reponseCorrecte, aBanque } = req.body;
        const tourId = await enregistrerTour(mancheId, joueurId, questionId, reponseCorrecte, aBanque);
        res.status(201).json({ id: tourId, message: 'Tour enregistré avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'enregistrement du tour', error: error.message });
    }
});

// Route pour éliminer un joueur
app.put('/api/joueurs/:id/eliminer', async (req, res) => {
    try {
        const { id } = req.params;
        const { mancheElimination } = req.body;
        await eliminerJoueur(id, mancheElimination);
        res.json({ message: 'Joueur éliminé avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'élimination du joueur', error: error.message });
    }
});

// Route pour mettre à jour la cagnotte
app.put('/api/parties/:id/cagnotte', async (req, res) => {
    try {
        const { id } = req.params;
        const { montant } = req.body;
        await mettreAJourCagnotte(id, montant);
        res.json({ message: 'Cagnotte mise à jour avec succès' });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la mise à jour de la cagnotte', error: error.message });
    }
});
*/

server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});