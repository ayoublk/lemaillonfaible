const { ajouterJoueur, mettreAJourScoreJoueur, db } = require('./database');

async function testJoueurs() {
    try {
        // Ajouter un joueur (on suppose que la partie ID 1 existe)
        const joueurId = await ajouterJoueur('Alice', 1);
        console.log(`Nouveau joueur ajouté avec l'ID: ${joueurId}`);

        // Mettre à jour le score du joueur
        await mettreAJourScoreJoueur(joueurId, 100);
        console.log('Score du joueur mis à jour');

        // Vérifier les données dans la base
        db.get('SELECT * FROM joueurs WHERE id = ?', [joueurId], (err, row) => {
            if (err) {
                console.error('Erreur lors de la récupération du joueur:', err.message);
            } else {
                console.log('Données du joueur:', row);
            }
            db.close();
        });
    } catch (error) {
        console.error('Erreur lors du test:', error);
        db.close();
    }
}

testJoueurs();