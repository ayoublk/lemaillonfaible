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

    // Activer le mode autocommit (devrait être activé par défaut, mais on s'en assure)
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA synchronous = NORMAL;");

    // Créer la table des questions
    db.run(`CREATE TABLE IF NOT EXISTS questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT NOT NULL,
        reponse1 TEXT NOT NULL,
        reponse2 TEXT NOT NULL,
        reponse3 TEXT NOT NULL,
        reponse4 TEXT NOT NULL,
        reponse_correcte INTEGER NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erreur lors de la création de la table:', err.message);
        } else {
            console.log('Table questions créée ou déjà existante');
        }
    });
    

     // Nouvelle table pour les joueurs
     db.run(`CREATE TABLE IF NOT EXISTS joueurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        partie_id INTEGER,
        est_elimine BOOLEAN DEFAULT 0,
        manche_elimination INTEGER,
        FOREIGN KEY(partie_id) REFERENCES parties(id)
    )`);

    // Table pour les parties (si nécessaire pour votre jeu)
    db.run(`CREATE TABLE IF NOT EXISTS parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_debut DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_fin DATETIME,
        statut TEXT DEFAULT 'en_attente',
        cagnotte_totale INTEGER DEFAULT 0,
        manche_actuelle INTEGER DEFAULT 1
    )`);

    // Table pour les tours
    db.run(`CREATE TABLE IF NOT EXISTS tours (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        manche_id INTEGER,
        joueur_id INTEGER,
        question_id INTEGER,
        reponse_correcte BOOLEAN,
        a_banque BOOLEAN,
        FOREIGN KEY(manche_id) REFERENCES manches(id),
        FOREIGN KEY(joueur_id) REFERENCES joueurs(id),
        FOREIGN KEY(question_id) REFERENCES questions(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS manches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        partie_id INTEGER,
        numero_manche INTEGER,
        duree_secondes INTEGER,
        cagnotte_manche INTEGER DEFAULT 0,
        FOREIGN KEY(partie_id) REFERENCES parties(id)
    )`);
    

    console.log('Tables créées avec succès');
});

// Fonction pour ajouter une question à la base de données
function ajouterQuestion(question, reponses, reponseCorrecte) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO questions (question, reponse1, reponse2, reponse3, reponse4, reponse_correcte) 
                     VALUES (?, ?, ?, ?, ?, ?)`;
        console.log('Exécution de la requête SQL:', sql);
        console.log('Avec les paramètres:', [question, ...reponses, reponseCorrecte]);
        db.run(sql, [question, ...reponses, reponseCorrecte], function(err) {
            if (err) {
                console.error('Erreur SQL lors de l\'ajout de la question:', err);
                reject(err);
            } else {
                console.log(`Question insérée avec l'ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

// Fonction pour créer une nouvelle partie
function creerPartie() {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO parties (statut) VALUES ('en_attente')`, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
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

// Fonction pour ajouter un joueur
function ajouterJoueur(nom, partieId) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO joueurs (nom, partie_id) VALUES (?, ?)`;
        db.run(sql, [nom, partieId], function(err) {
            if (err) {
                console.error('Erreur lors de l\'ajout du joueur:', err.message);
                reject(err);
            } else {
                console.log(`Joueur ajouté avec l'ID: ${this.lastID}`);
                resolve(this.lastID);
            }
        });
    });
}

// Fonction pour commencer une manche
function commencerManche(partieId, numeroManche, dureeManche) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO manches (partie_id, numero_manche, duree_secondes) VALUES (?, ?, ?)`,
            [partieId, numeroManche, dureeManche], function(err) {
            if (err) {
                reject(err);
            } else {
                db.run(`UPDATE parties SET manche_actuelle = ? WHERE id = ?`, [numeroManche, partieId], (updateErr) => {
                    if (updateErr) {
                        reject(updateErr);
                    } else {
                        resolve(this.lastID);
                    }
                });
            }
        });
    });
}

// Fonction pour enregistrer un tour (tour = chaque personne qui répond)
function enregistrerTour(mancheId, joueurId, questionId, reponseCorrecte, aBanque) {
    return new Promise((resolve, reject) => {
        db.run(`INSERT INTO tours (manche_id, joueur_id, question_id, reponse_correcte, a_banque) 
                VALUES (?, ?, ?, ?, ?)`,
            [mancheId, joueurId, questionId, reponseCorrecte, aBanque], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

// Fonction pour éliminer un joueur
function eliminerJoueur(joueurId, mancheElimination) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE joueurs SET est_elimine = 1, manche_elimination = ? WHERE id = ?`,
            [mancheElimination, joueurId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}

// Fonction pour mettre à jour la cagnotte
function mettreAJourCagnotte(partieId, montant) {
    return new Promise((resolve, reject) => {
        db.run(`UPDATE parties SET cagnotte_totale = cagnotte_totale + ? WHERE id = ?`,
            [montant, partieId], function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this.changes);
            }
        });
    });
}



// Exporter les fonctions et l'objet db
module.exports = {
    db,
    ajouterJoueur,
    ajouterQuestion,
    getQuestionsAleatoires,
    creerPartie,
    commencerManche,
    enregistrerTour,
    eliminerJoueur,
    mettreAJourCagnotte,
};