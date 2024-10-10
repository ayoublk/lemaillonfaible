// Importation des modules nécessaires
const fs = require('fs');
const csv = require('csv-parser');
const { db, ajouterQuestion } = require('./database');

// Chemin vers le fichier CSV
const CSV_FILE_PATH = './questions.csv';

// Fonction pour mélanger un tableau (utilisée pour les réponses)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

let questionCount = 0;
let rowCount = 0;

console.log('Début de la lecture du fichier CSV');

// Lecture du fichier CSV
fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' }) // Essayons avec utf8
    .on('error', (error) => {
        console.error('Erreur lors de la lecture du fichier CSV:', error);
    })
    .pipe(csv({ separator: ';', headers: ['question', 'bonne_reponse', 'mauvaise_reponse1', 'mauvaise_reponse2', 'mauvaise_reponse3'] }))
    .on('data', (row) => {
        rowCount++;
        console.log(`\nLigne ${rowCount} lue:`);
        console.log(JSON.stringify(row, null, 2));

        const { question, bonne_reponse, mauvaise_reponse1, mauvaise_reponse2, mauvaise_reponse3 } = row;

        // Vérification que tous les champs nécessaires sont présents
        if (!question || !bonne_reponse || !mauvaise_reponse1 || !mauvaise_reponse2 || !mauvaise_reponse3) {
            console.log('Ligne ignorée car incomplète');
            return;
        }

        // Mélange les réponses
        const reponses = shuffleArray([bonne_reponse, mauvaise_reponse1, mauvaise_reponse2, mauvaise_reponse3]);
        const reponseCorrecte = reponses.indexOf(bonne_reponse) + 1;

        console.log('Tentative d\'ajout de la question:', question);
        console.log('Réponses:', reponses);
        console.log('Index de la réponse correcte:', reponseCorrecte);

        // Appel de la fonction pour ajouter la question à la base de données
        ajouterQuestion(question, reponses, reponseCorrecte)
            .then(() => {
                questionCount++;
                console.log(`Question ajoutée avec succès. Total: ${questionCount}`);
            })
            .catch((err) => {
                console.error('Erreur lors de l\'ajout de la question:', err);
            });
    })
    .on('end', () => {
        console.log('\nLecture du CSV terminée');
        console.log(`Nombre total de lignes lues: ${rowCount}`);
        console.log(`Nombre total de questions ajoutées: ${questionCount}`);

        // Vérification finale du nombre de questions dans la base
        setTimeout(() => {
            db.all("SELECT COUNT(*) as count FROM questions", [], (err, rows) => {
                if (err) {
                    console.error("Erreur lors du comptage des questions:", err.message);
                } else {
                    console.log(`Nombre de questions dans la base: ${rows[0].count}`);
                }
                db.close((err) => {
                    if (err) {
                        console.error("Erreur lors de la fermeture de la base de données:", err.message);
                    } else {
                        console.log("Base de données fermée avec succès");
                    }
                });
            });
        }, 1000);
    });