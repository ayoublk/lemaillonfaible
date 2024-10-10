const sqlite3 = require('sqlite3').verbose();

// Créer une nouvelle instance de base de données
const db = new sqlite3.Database('./maillon_faible.sqlite', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données', err.message);
    } else {
        console.log('Connecté à la base de données SQLite');
    }
});

// Initialiser les tables de la base de données
db.serialize(() => {
    // Créer la table des questions
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        reponse1 TEXT NOT NULL,
        reponse2 TEXT NOT NULL,
        reponse3 TEXT NOT NULL,
        reponse4 TEXT NOT NULL,
        reponse_correcte INTEGER NOT NULL
    )`);

    // Créer la table des joueurs
    db.run(`CREATE TABLE IF NOT EXISTS joueurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        score INTEGER DEFAULT 0
    )`);

    // Créer la table des parties
    db.run(`CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_debut DATETIME DEFAULT CURRENT_TIMESTAMP,
        statut TEXT DEFAULT 'en_attente'
    )`);

    console.log('Tables créées avec succès');
});

// Fonction pour ajouter une question
function ajouterQuestion(question, reponses, reponseCorrecte, callback) {
    const sql = `INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, reponse_correcte) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [question, ...reponses, reponseCorrecte], (err) => {
        if (err) {
            console.error('Erreur lors de l\'ajout de la question', err.message);
            callback(err);
        } else {
            console.log('Question ajoutée avec succès');
            callback(null);
        }
    });
}

// Fonction pour récupérer des questions aléatoires
function getQuestionsAleatoires(nombre, callback) {
    const sql = `SELECT * FROM questions ORDER BY RANDOM() LIMIT ?`;
    db.all(sql, [nombre], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des questions', err.message);
            callback(err, null);
        } else {
            callback(null, rows);
        }
    });
}

// Exporter les fonctions et l'objet db pour les utiliser dans d'autres fichiers
module.exports = {
    db,
    ajouterQuestion,
    getQuestionsAleatoires
};