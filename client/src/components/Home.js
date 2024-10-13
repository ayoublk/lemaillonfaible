import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';

const Home = () => {
  // États locaux pour le nom du joueur et l'ID de la partie
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  
  // Hook de navigation et contexte du jeu
  const navigate = useNavigate();
  const { state, dispatch } = useGame();  // Utilisation du hook useGame

  // Fonction pour créer une nouvelle partie
  const handleCreateGame = () => {
    socket.emit('creerPartie', { nombreJoueurs: 8 }, (response) => {
      console.log("Réponse du serveur pour creerPartie:", response);
      localStorage.setItem('partieId', response.partieId);
      localStorage.setItem('joueurId', response.joueurId);
      if (response.success) {
        console.log("Partie créée avec l'ID:", response.partieId);
        console.log("ID du joueur:", response.joueurId);
        dispatch({ 
          type: 'SET_PARTIE_INFO', 
          payload: { 
            partieId: response.partieId, 
            joueurId: response.joueurId, 
            nom: playerName 
          } 
        });
        setTimeout(() => {
          navigate('/lobby');
        }, 100);
      } else {
        console.error("Erreur lors de la création de la partie:", response.error);
        alert('Erreur lors de la création de la partie');
      }
    });
  };

  // Fonction pour rejoindre une partie existante
  const handleJoinGame = () => {
    socket.emit('rejoindrePartie', { partieId: gameId, nomJoueur: playerName }, (response) => {
      if (response.success) {
        dispatch({ 
          type: 'SET_PARTIE_INFO', 
          payload: { 
            partieId: gameId, 
            joueurId: response.joueurId, 
            nom: playerName 
          } 
        });
        navigate('/lobby');
      } else {
        alert('Erreur lors de la tentative de rejoindre la partie');
      }
    });
  };

  // Rendu du composant
  return (
    <div>
      <h2>Bienvenue au Maillon Faible Online</h2>
      <input
        type="text"
        placeholder="Votre nom"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button onClick={handleCreateGame}>Créer une nouvelle partie</button>
      <br />
      <input
        type="text"
        placeholder="ID de la partie"
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
      />
      <button onClick={handleJoinGame}>Rejoindre une partie</button>
    </div>
  );
};

export default Home;