const fs = require('fs');
const csv = require('csv-parser');
const { db, ajouterQuestion } = require('./database');

const CSV_FILE_PATH = './questions.csv';

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

fs.createReadStream(CSV_FILE_PATH)
    .pipe(csv({ separator: ';' }))
    .on('data', (row) => {
        const { question, bonne_reponse, mauvaise_reponse1, mauvaise_reponse2, mauvaise_reponse3 } = row;

        // Vérification que tous les champs nécessaires sont présents et non vides
        if (!question || !bonne_reponse || !mauvaise_reponse1 || !mauvaise_reponse2 || !mauvaise_reponse3) {
            console.log('Ligne ignorée car incomplète:', row);
            return; // Passe à la ligne suivante
        }

        const reponses = shuffleArray([bonne_reponse, mauvaise_reponse1, mauvaise_reponse2, mauvaise_reponse3]);
        const reponseCorrecte = reponses.indexOf(bonne_reponse) + 1;

        ajouterQuestion(question, reponses, reponseCorrecte, (err) => {
            if (err) {
                console.error('Erreur lors de l\'ajout de la question:', question, err.message);
            } else {
                console.log('Question ajoutée avec succès:', question);
            }
        });
    })
    .on('end', () => {
        console.log('Importation des questions terminée');
        setTimeout(() => db.close(), 1000); // Attendre que toutes les insertions soient terminées
    });