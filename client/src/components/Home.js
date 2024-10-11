import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { emitEvent } from '../services/socket';
import { useGame } from '../contexts/GameContext';

const Home = () => {
  // État local pour stocker le nom du joueur
  const [nomJoueur, setNomJoueur] = useState('');
  
  // Hook de navigation de React Router
  const navigate = useNavigate();
  
  // Utilisation du contexte du jeu
  const { setGameState } = useGame();

  // Fonction pour créer une nouvelle partie
  const creerPartie = () => {
    if (!nomJoueur.trim()) {
      alert("Veuillez entrer un nom de joueur");
      return;
    }
  
    console.log("Tentative de création de partie...");
    emitEvent('creerPartie', { nombreJoueurs: 8, nomJoueur }, (response) => {
      console.log("Réponse reçue:", response);
      if (response.success) {
        console.log("Partie créée avec succès. ID:", response.partieId);
        setGameState(prev => {
          const newState = {
            ...prev,
            partieId: response.partieId,
            joueurId: response.joueurId,
            phase: 'lobby'
          };
          console.log("Nouvel état du jeu:", newState);
          return newState;
        });
        navigate('/lobby');
      } else {
        console.error("Erreur lors de la création de la partie:", response.error);
        alert("Erreur lors de la création de la partie : " + response.error);
      }
    });
  };

  return (
    <div>
      <h1>Le Maillon Faible</h1>
      <input
        type="text"
        value={nomJoueur}
        onChange={(e) => setNomJoueur(e.target.value)}
        placeholder="Entrez votre nom"
      />
      <button onClick={creerPartie}>Créer une partie</button>
    </div>
  );
};

export default Home;