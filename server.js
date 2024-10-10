const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { 
    db, 
    getQuestionsAleatoires, 
    ajouterJoueur, 
    creerPartie,
    commencerManche,
    enregistrerTour,
    eliminerJoueur,
    mettreAJourCagnotte
} = require('./database');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Serveur du Maillon Faible en ligne');
});

io.on('connection', (socket) => {
  console.log('Un client s\'est connecté');
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

server.listen(PORT, () => {
  console.log(`Serveur en écoute sur le port ${PORT}`);
});