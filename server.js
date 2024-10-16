const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const MaillonFaibleGame = require('./gameLogic');
const { db, getQuestionsAleatoires, creerPartie, ajouterJoueur } = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Permet toutes les origines en développement
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Créer une instance du jeu
const game = new MaillonFaibleGame(io);

app.get('/', (req, res) => {
  res.send('Serveur du Maillon Faible en ligne');
});

// Fonction pour gérer la déconnexion d'un joueur
async function handlePlayerDisconnect(socket) {
    try {
      // Trouver la partie et le joueur associés à ce socket
      const partieId = Array.from(socket.rooms).find(room => room !== socket.id);
      if (!partieId) return; // Le socket n'était dans aucune salle de jeu
  
      const partie = game.parties.get(partieId);
      if (!partie) return; // La partie n'existe plus
  
      const joueurDeconnecte = partie.joueurs.find(j => j.socketId === socket.id);
      if (!joueurDeconnecte) return; // Le joueur n'est pas trouvé dans la partie
  
      // Marquer le joueur comme déconnecté
      joueurDeconnecte.estDeconnecte = true;
  
      // Informer les autres joueurs de la déconnexion
      socket.to(partieId).emit('joueurDeconnecte', {
        joueurId: joueurDeconnecte.id,
        nom: joueurDeconnecte.nom
      });
  
      // Vérifier si la partie peut continuer
      const joueursConnectes = partie.joueurs.filter(j => !j.estDeconnecte && !j.estElimine);
      if (joueursConnectes.length < 2) {
        // Terminer la partie si moins de 2 joueurs connectés
        await game.terminerPartie(partieId, 'Trop peu de joueurs connectés');
      } else if (partie.phaseActuelle === 'enCours') {
        // Si la partie est en cours, passer au joueur suivant si c'était le tour du joueur déconnecté
        if (partie.joueurActuel && partie.joueurActuel.id === joueurDeconnecte.id) {
          await game.passerAuJoueurSuivant(partieId);
        }
      }
      // Note: Si la partie est en phase de vote ou de face-à-face, vous devrez gérer ces cas spécifiquement
    } catch (error) {
      console.error('Erreur lors de la gestion de la déconnexion:', error);
    }
  }

// Gestion des connexions Socket.IO
io.on('connection', (socket) => {
  console.log('Un client s\'est connecté', socket.id);

socket.on('testEvent', (msg) => {
  console.log('Message reçu du client:', msg);
  socket.emit('testResponse', 'Hello from server');
});

// Gérer les déconnexions
socket.on('disconnect', async () => {
    console.log('Un client s\'est déconnecté', socket.id);
    await handlePlayerDisconnect(socket);
  });

socket.on('disconnect', (reason) => {
  console.log('Déconnexion:', socket.id, 'Raison:', reason);
});
  
socket.on('error', (error) => {
  console.error('Erreur Socket.IO:', error);
});

socket.on('connect_error', (err) => {
  console.log(`connect_error due to ${err.message}`);
});

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
      await game.ajouterJoueur(data.partieId, data.nomJoueur, socket.id);
      socket.join(data.partieId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Démarrer une manche
socket.on('demarrerManche', async (data, callback) => {
  try {
    const mancheInfo = await game.demarrerManche(data.partieId);
    io.to(data.partieId).emit('updateGameState', mancheInfo);
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});

// Jouer un tour
socket.on('jouerTour', async (data, callback) => {
  try {
    const tourInfo = await game.jouerTour(data.partieId, data.joueurId, data.reponseCorrecte, data.aBanque);
    io.to(data.partieId).emit('updateGameState', tourInfo);
    
    if (tourInfo.nouvelleQuestion) {
      io.to(data.partieId).emit('questionReceived', tourInfo.nouvelleQuestion);
    }
    
    if (tourInfo.prochainJoueur) {
      io.to(data.partieId).emit('playerTurn', tourInfo.prochainJoueur);
    }
    
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});

// Voter pour éliminer un joueur
socket.on('voter', async (data, callback) => {
  try {
    const voteInfo = game.enregistrerVote(data.partieId, data.votantId, data.votePourId);
    if (voteInfo.voteTermine) {
      io.to(data.partieId).emit('startVoting', voteInfo.resultatVote);
    }
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});


 // Démarrer le face-à-face
 socket.on('demarrerFaceAFace', async (data, callback) => {
  try {
    const faceAFaceInfo = await game.demarrerFaceAFace(data.partieId);
    io.to(data.partieId).emit('startFaceToFace', faceAFaceInfo);
    callback({ success: true });
  } catch (error) {
    callback({ success: false, error: error.message });
  }
});

// Répondre à une question du face-à-face
socket.on('repondreFaceAFace', async (data, callback) => {
    try {
      const resultat = await game.repondreFaceAFace(data.partieId, data.joueurId, data.reponse);
      callback({ success: true, resultat });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
  });

// Démarrer la mort subite
socket.on('demarrerMortSubite', async (data, callback) => {
    try {
      await game.demarrerMortSubite(data.partieId);
      callback({ success: true });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

// Répondre à une question de mort subite
socket.on('repondreMortSubite', async (data, callback) => {
    try {
      const resultat = await game.repondreMortSubite(data.partieId, data.joueurId, data.reponse);
      callback({ success: true, resultat });
    } catch (error) {
      callback({ success: false, error: error.message });
    }
});

socket.on('joinLobby', ({ partieId, joueurId }) => {
  socket.join(partieId);
  const partie = game.parties.get(partieId);
  if (partie) {
    io.to(partieId).emit('updatePlayerList', partie.joueurs);
    // Vérifier si le joueur est l'hôte (premier joueur)
    const isHost = partie.joueurs[0].id === joueurId;
    socket.emit('hostStatus', isHost);
  }
});

socket.on('startGame', ({ partieId }) => {
  const partie = game.parties.get(partieId);
  if (partie) {
    partie.statut = 'enCours';
    io.to(partieId).emit('gameStarted');
  }
});

// Gestionnaire pour la fin de partie
game.on('gameOver', (partieId, winner) => {
  io.to(partieId).emit('gameOver', winner);
});


});

io.on("connect_error", (err) => {
  console.log(`connect_error due to ${err.message}`);
});

app.get('/test', (req, res) => {
  res.send('Server is running');
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


server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});