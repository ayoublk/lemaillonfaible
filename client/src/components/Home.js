import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import io from 'socket.io-client';

// Créer une seule instance de socket pour tout le composant
const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  upgrade: false
});

const Home = () => {
  // États locaux pour le nom du joueur et l'ID de la partie
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');
  
  // Hook de navigation et contexte du jeu
  const navigate = useNavigate();
  const { setGameState } = useGame();

  // Effet pour gérer les événements de connexion
  useEffect(() => {
    socket.on('connect', () => {
        console.log('Connecté au serveur depuis Home');
        socket.emit('testEvent', 'Hello Server');
    });

    socket.on('disconnect', (reason) => {
        console.log('Déconnecté du serveur:', reason);
    });

    socket.on('connect_error', (error) => {
        console.log('Erreur de connexion:', error.message);
    });

    socket.on('error', (error) => {
        console.log('Erreur Socket.IO:', error);
    });

    return () => {
        socket.off('connect');
        socket.off('disconnect');
        socket.off('connect_error');
        socket.off('error');
    };
}, []);

  // Fonction pour créer une nouvelle partie
  const handleCreateGame = () => {
    socket.emit('creerPartie', { nombreJoueurs: 8 }, (response) => {
      if (response.success) {
        // Mise à jour de l'état global du jeu
        setGameState({ partieId: response.partieId, joueurId: response.joueurId, nom: playerName });
        // Navigation vers le lobby
        navigate('/lobby');
      } else {
        alert('Erreur lors de la création de la partie');
      }
    });
  };

  // Fonction pour rejoindre une partie existante
  const handleJoinGame = () => {
    socket.emit('rejoindrePartie', { partieId: gameId, nomJoueur: playerName }, (response) => {
      if (response.success) {
        // Mise à jour de l'état global du jeu
        setGameState({ partieId: gameId, joueurId: response.joueurId, nom: playerName });
        // Navigation vers le lobby
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