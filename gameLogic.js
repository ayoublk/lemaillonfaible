const { 
    creerPartie, 
    ajouterJoueur, 
    commencerManche, 
    enregistrerTour, 
    eliminerJoueur, 
    mettreAJourCagnotte, 
    getQuestionsAleatoires 
} = require('./database');
const EventEmitter = require('events');

/**
 * Classe représentant la logique du jeu "Le Maillon Faible"
 */

class MaillonFaibleGame extends EventEmitter {
     /**
     * Crée une instance du jeu
     * @param {SocketIO.Server} io - L'instance de Socket.IO pour la communication en temps réel
     */
    constructor(io) {
        this.io = io;
        this.parties = new Map();
    }

    /**
     * Démarre une nouvelle partie
     * @param {number} nombreJoueurs - Le nombre de joueurs dans la partie
     * @returns {Promise<string>} L'ID de la nouvelle partie
     */
    async demarrerPartie(nombreJoueurs) {
        const partieId = await creerPartie();
        this.parties.set(partieId, {
            id: partieId,
            joueurs: [],
            mancheActuelle: 0,
            cagnotte: 0,
            questions: [],
            tourActuel: 0,
            chaineCourante: 0
        });
        return partieId;
    }
    /**
     * Ajoute un nouveau joueur à une partie
     * @param {string} partieId - L'ID de la partie
     * @param {string} nomJoueur - Le nom du joueur à ajouter
     * @param {string} socketID - L'ID du socket
     */
    async ajouterJoueur(partieId, nomJoueur, socketId) {
        const joueurId = await ajouterJoueur(nomJoueur, partieId);
        const partie = this.parties.get(partieId);
        partie.joueurs.push({ id: joueurId, nom: nomJoueur, estElimine: false, estDeconnecte: false, socketId: socketId });
        this.io.to(partieId).emit('nouveauJoueur', { id: joueurId, nom: nomJoueur });
    }

     /**
     * Démarre une nouvelle manche dans une partie
     * @param {string} partieId - L'ID de la partie
     */
    async demarrerManche(partieId) {
        const partie = this.parties.get(partieId);
        partie.mancheActuelle++;
        partie.tourActuel = 0;
        partie.chaineCourante = 0;
        // Commence une nouvelle manche de 3 minutes (180 secondes)
        const mancheId = await commencerManche(partieId, partie.mancheActuelle, 180); // 3 minutes par manche
        // Récupère 20 questions aléatoires pour cette manche
        partie.questions = await new Promise((resolve) => getQuestionsAleatoires(20, (err, questions) => resolve(questions)));
        // Informe tous les clients que la manche a démarré et envoie les questions
        this.io.to(partieId).emit('mancheDemarree', { mancheId, nombreQuestions: partie.questions.length });
    }

    // Gère le déroulement d'un tour de jeu, y compris la mise à jour de la chaîne de bonnes réponses et la possibilité de banquer.
    async jouerTour(partieId, joueurId, reponseCorrecte, aBanque) {
        const partie = this.parties.get(partieId);
        partie.tourActuel++;

        if (aBanque) {
            await this.banquer(partieId);
        }

        if (reponseCorrecte) {
            partie.chaineCourante = Math.min(partie.chaineCourante + 1, 8); // Max 8 dans la chaîne
        } else {
            partie.chaineCourante = 0;
        }

        const valeursTour = [0, 20, 50, 100, 200, 300, 450, 600, 800];
        const valeurTour = valeursTour[partie.chaineCourante];

        await enregistrerTour(partie.mancheActuelle, joueurId, partie.questions[partie.tourActuel - 1].id, reponseCorrecte, aBanque);

        this.io.to(partieId).emit('tourJoue', {
            joueurId,
            reponseCorrecte,
            aBanque,
            valeurTour,
            cagnotte: partie.cagnotte
        });

        if (partie.tourActuel >= partie.questions.length) {
            await this.terminerManche(partieId);
        }
    }

    // Permet d'ajouter le montant actuel de la chaîne à la cagnotte.
    async banquer(partieId) {
        const partie = this.parties.get(partieId);
        const valeursTour = [0, 20, 50, 100, 200, 300, 450, 600, 800];
        const montantAjoute = valeursTour[partie.chaineCourante];
        partie.cagnotte += montantAjoute;
        partie.chaineCourante = 0;
        await mettreAJourCagnotte(partieId, montantAjoute);
    }

    async passerAuJoueurSuivant(partieId) {
        const partie = this.parties.get(partieId);
        if (!partie) return;
    
        // Trouver le prochain joueur non éliminé et connecté
        let index = partie.joueurs.indexOf(partie.joueurActuel);
        do {
          index = (index + 1) % partie.joueurs.length;
        } while (partie.joueurs[index].estElimine || partie.joueurs[index].estDeconnecte);
    
        partie.joueurActuel = partie.joueurs[index];
    
        this.io.to(partieId).emit('nouveauJoueurActuel', {
          joueurId: partie.joueurActuel.id,
          nom: partie.joueurActuel.nom
        });
      }

    // Appelée à la fin d'une manche pour préparer la phase d'élimination.
    async terminerManche(partieId) {
        const partie = this.parties.get(partieId);
        
        // Informer les clients que la manche est terminée
        this.io.to(partieId).emit('mancheTerminee', {
            mancheNumero: partie.mancheActuelle,
            cagnotte: partie.cagnotte
        });

        // Initialiser la phase de vote
        partie.phaseVote = {
            votes: {},
            votesComptes: {}
        };

        // Informer les clients que la phase de vote commence
        this.io.to(partieId).emit('debutPhaseVote', {
            joueursVotants: partie.joueurs.filter(j => !j.estElimine).map(j => ({ id: j.id, nom: j.nom }))
        });

        // Attendre les votes (dans un cas réel, on utiliserait un timer)
        // Pour cet exemple, nous allons simuler l'attente avec une promesse
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 secondes pour voter

        // Compter les votes
        const resultatVote = this.compterVotes(partieId);

        // Eliminer le joueur avec le plus de votes
        if (resultatVote.joueurElimine) {
            await this.eliminerJoueur(partieId, resultatVote.joueurElimine.id);
        }

        // Informer les clients du résultat du vote
        this.io.to(partieId).emit('resultatVote', resultatVote);

        // Vérifier si la partie est terminée (2 joueurs restants)
        if (this.verifierFinPartie(partieId)) {
            // La partie est terminée, passer à la phase finale
            this.demarrerFaceAFace(partieId);
        } else {
            // Préparer la prochaine manche
            this.preparerProchaineManche(partieId);
        }
    }

    
    // Méthode pour enregistrer un vote
    enregistrerVote(partieId, votantId, votePourId) {
        const partie = this.parties.get(partieId);
        if (partie.phaseVote && !partie.joueurs.find(j => j.id === votantId).estElimine) {
            partie.phaseVote.votes[votantId] = votePourId;
            this.io.to(partieId).emit('voteEnregistre', { votantId });
        }
    }

    // Méthode pour compter les votes
    compterVotes(partieId) {
        const partie = this.parties.get(partieId);
        const votesComptes = {};

        // Compter les votes
        Object.values(partie.phaseVote.votes).forEach(votePourId => {
            votesComptes[votePourId] = (votesComptes[votePourId] || 0) + 1;
        });

        // Trouver le joueur avec le plus de votes
        let maxVotes = 0;
        let joueursMaxVotes = [];
        Object.entries(votesComptes).forEach(([joueurId, nombreVotes]) => {
            if (nombreVotes > maxVotes) {
                maxVotes = nombreVotes;
                joueursMaxVotes = [joueurId];
            } else if (nombreVotes === maxVotes) {
                joueursMaxVotes.push(joueurId);
            }
        });

        // En cas d'égalité, choisir aléatoirement
        const joueurElimineId = joueursMaxVotes[Math.floor(Math.random() * joueursMaxVotes.length)];
        const joueurElimine = partie.joueurs.find(j => j.id === joueurElimineId);

        return {
            votes: votesComptes,
            joueurElimine: joueurElimine
        };
    }

    // Méthode pour préparer la prochaine manche
    async preparerProchaineManche(partieId) {
        // Réinitialiser les variables nécessaires pour la prochaine manche
        const partie = this.parties.get(partieId);
        partie.chaineCourante = 0;
        partie.tourActuel = 0;

        // Informer les clients que la prochaine manche va commencer
        this.io.to(partieId).emit('preparationProchaineManche', {
            joueursRestants: partie.joueurs.filter(j => !j.estElimine).map(j => ({ id: j.id, nom: j.nom }))
        });

        // Commencer la prochaine manche après un court délai
        setTimeout(() => this.demarrerManche(partieId), 5000); // 5 secondes de pause entre les manches
    }

    // Méthode pour démarrer le face-à-face final
    async demarrerFaceAFace(partieId) {
        const partie = this.parties.get(partieId);
        const finalistes = partie.joueurs.filter(j => !j.estElimine);

        // Réinitialiser les scores pour le face-à-face
        finalistes.forEach(f => f.scoreFaceAFace = 0);

        // Préparer les questions pour le face-à-face
        partie.questionsFaceAFace = await new Promise((resolve) => 
            getQuestionsAleatoires(10, (err, questions) => resolve(questions))
        );

        // Informer les clients du début du face-à-face
        this.io.to(partieId).emit('debutFaceAFace', {
            finalistes: finalistes.map(j => ({ id: j.id, nom: j.nom })),
            cagnotteTotale: partie.cagnotte
        });

        // Commencer les tours du face-à-face
        await this.jouerToursFaceAFace(partieId);
    }

    async repondreFaceAFace(partieId, joueurId, reponse) {
        const partie = this.parties.get(partieId);
        const finaliste = partie.joueurs.find(j => j.id === joueurId);
        
        if (!finaliste) {
            throw new Error('Joueur non trouvé');
        }
    
        const questionActuelle = partie.questionsFaceAFace[partie.tourActuel];
        
        if (!questionActuelle) {
            throw new Error('Question non trouvée');
        }
    
        const reponseCorrecte = reponse === questionActuelle.reponse_correcte;
    
        if (reponseCorrecte) {
            finaliste.scoreFaceAFace++;
        }
    
        const resultat = {
            joueurId: finaliste.id,
            reponseCorrecte,
            scoreActuel: finaliste.scoreFaceAFace,
            bonneReponse: questionActuelle.reponse_correcte
        };
    
        this.io.to(partieId).emit('resultatQuestionFaceAFace', resultat);
    
        return resultat;
    }
      
        // Modifiez la méthode repondreMortSubite existante
        async repondreMortSubite(partieId, joueurId, reponse) {
            const partie = this.parties.get(partieId);
            const question = partie.questionActuelleMortSubite;
            const reponseCorrecte = reponse === question.reponse_correcte;

            const resultat = { joueurId, reponseCorrecte, bonneReponse: question.reponse_correcte };
            
            // Émettre l'événement attendu par attendreReponseMortSubite
            this.emit(`reponseMortSubite:${partieId}:${joueurId}`, resultat);

            return resultat;
        }

      async jouerToursFaceAFace(partieId) {
        const partie = this.parties.get(partieId);
        const finalistes = partie.joueurs.filter(j => !j.estElimine);
        partie.tourActuel = 0;
    
        for (let i = 0; i < 5; i++) { // 5 questions par finaliste
            for (const finaliste of finalistes) {
                const question = partie.questionsFaceAFace[partie.tourActuel];
                
                // Envoyer la question au client
                this.io.to(partieId).emit('questionFaceAFace', {
                    joueurId: finaliste.id,
                    question: question.question,
                    reponses: [question.reponse1, question.reponse2, question.reponse3, question.reponse4]
                });
    
                // Attendre la réponse du client (avec un timeout)
                try {
                    await new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            reject(new Error('Temps écoulé'));
                        }, 10000); // 10 secondes pour répondre
    
                        this.io.to(partieId).once(`reponseFaceAFace:${finaliste.id}`, (reponse) => {
                            clearTimeout(timeout);
                            resolve(reponse);
                        });
                    });
                } catch (error) {
                    // Gérer le cas où le joueur n'a pas répondu à temps
                    this.io.to(partieId).emit('resultatQuestionFaceAFace', {
                        joueurId: finaliste.id,
                        reponseCorrecte: false,
                        scoreActuel: finaliste.scoreFaceAFace,
                        message: 'Temps écoulé'
                    });
                    continue; // Passer au joueur suivant
                }
    
                // La réponse a été reçue, on peut la traiter
                const resultat = await this.repondreFaceAFace(partieId, finaliste.id, reponse);
    
                partie.tourActuel++;
            }
        }
    
        // Déterminer le gagnant
        await this.determinerGagnantFaceAFace(partieId);
    }

    async determinerGagnantFaceAFace(partieId) {
        const partie = this.parties.get(partieId);
        const finalistes = partie.joueurs.filter(j => !j.estElimine);

        let gagnant;
        if (finalistes[0].scoreFaceAFace > finalistes[1].scoreFaceAFace) {
            gagnant = finalistes[0];
        } else if (finalistes[1].scoreFaceAFace > finalistes[0].scoreFaceAFace) {
            gagnant = finalistes[1];
        } else {
            // En cas d'égalité, passer en mort subite
            gagnant = await this.jouerMortSubite(partieId);
        }

        // Annoncer le gagnant
        this.io.to(partieId).emit('finPartie', {
            gagnant: { id: gagnant.id, nom: gagnant.nom },
            cagnotteTotale: partie.cagnotte
        });

        // Nettoyer les données de la partie
        this.parties.delete(partieId);
    }

    async jouerMortSubite(partieId) {
        const partie = this.parties.get(partieId);
        const finalistes = partie.joueurs.filter(j => !j.estElimine);
    
        while (true) {
            for (const finaliste of finalistes) {
                const question = await new Promise((resolve) => 
                    getQuestionsAleatoires(1, (err, questions) => resolve(questions[0]))
                );
    
                partie.questionActuelleMortSubite = question;
    
                // Envoyer la question au client
                this.io.to(partieId).emit('questionMortSubite', {
                    joueurId: finaliste.id,
                    question: question.question,
                    reponses: [question.reponse1, question.reponse2, question.reponse3, question.reponse4]
                });
    
                try {
                    // Attendre la réponse du client avec un timeout
                    const resultat = await this.attendreReponseMortSubite(partieId, finaliste.id);
                    
                    // Informer les clients du résultat
                    this.io.to(partieId).emit('resultatMortSubite', resultat);
    
                    if (!resultat.reponseCorrecte) {
                        // Le joueur a perdu
                        const gagnant = finalistes.find(f => f.id !== finaliste.id);
                        await this.terminerPartie(partieId, gagnant);
                        return gagnant;
                    }
                } catch (error) {
                    // Gérer le timeout ou d'autres erreurs
                    console.error(`Erreur lors de la réponse de ${finaliste.id}:`, error);
                    this.io.to(partieId).emit('resultatMortSubite', {
                        joueurId: finaliste.id,
                        reponseCorrecte: false,
                        message: 'Temps écoulé ou erreur'
                    });
                    const gagnant = finalistes.find(f => f.id !== finaliste.id);
                    await this.terminerPartie(partieId, gagnant);
                    return gagnant;
                }
            }
        }
    }

    // Nouvelle méthode pour attendre la réponse d'un joueur avec un timeout
    attendreReponseMortSubite(partieId, joueurId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Temps écoulé'));
            }, 10000); // 10 secondes pour répondre

            this.once(`reponseMortSubite:${partieId}:${joueurId}`, (resultat) => {
                clearTimeout(timeout);
                resolve(resultat);
            });
        });
    }


    // Gère l'élimination d'un joueur après le vote.
    async eliminerJoueur(partieId, joueurId) {
        const partie = this.parties.get(partieId);
        const joueur = partie.joueurs.find(j => j.id === joueurId);
        if (joueur) {
            joueur.estElimine = true;
            await eliminerJoueur(joueurId, partie.mancheActuelle);
            this.io.to(partieId).emit('joueurElimine', { joueurId, mancheElimination: partie.mancheActuelle });
        }
    }

    async terminerPartie(partieId, raison) {
        const partie = this.parties.get(partieId);
        if (!partie) return;
    
        this.io.to(partieId).emit('partieTerminee', {
          raison: raison,
          cagnotteTotale: partie.cagnotte
        });
    
        // Nettoyage de la partie
        this.parties.delete(partieId);
      }

    // Méthode pour vérifier si la partie est terminée (2 joueurs restants)
    verifierFinPartie(partieId) {
        const partie = this.parties.get(partieId);
        const joueursRestants = partie.joueurs.filter(j => !j.estElimine);
        if (joueursRestants.length === 2) {
            this.io.to(partieId).emit('partieTerminee', {
                finalistes: joueursRestants,
                cagnotteTotale: partie.cagnotte
            });
            return true;
        }
        return false;
    }
}

module.exports = MaillonFaibleGame;