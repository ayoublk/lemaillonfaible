import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';

const Lobby = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    const savedPartieId = localStorage.getItem('partieId');
    const savedJoueurId = localStorage.getItem('joueurId');
    if (savedPartieId && savedJoueurId) {
      dispatch({ 
        type: 'SET_PARTIE_INFO', 
        payload: { 
          partieId: savedPartieId, 
          joueurId: savedJoueurId, 
          nom: state.nom 
        } 
      });
    }
    console.log("État du jeu au montage du Lobby:", state);
    if (!state.partieId) {
      console.error("ID de partie manquant dans le Lobby");
      navigate('/');
      return;
    }

    // Rejoindre la salle du lobby
    socket.emit('joinLobby', { partieId: state.partieId, joueurId: state.joueurId });

    // Écouter les mises à jour de la liste des joueurs
    socket.on('updatePlayerList', (updatedPlayers) => {
      console.log("Mise à jour de la liste des joueurs:", updatedPlayers);
      dispatch({ type: 'UPDATE_PLAYERS', payload: updatedPlayers });
    });

    // Vérifier si le joueur est l'hôte
    socket.on('hostStatus', (status) => {
      dispatch({ type: 'SET_HOST_STATUS', payload: status });
    });

    // Écouter le démarrage du jeu
    socket.on('gameStarted', () => {
      navigate('/game');
    });

    return () => {
      socket.off('updatePlayerList');
      socket.off('hostStatus');
      socket.off('gameStarted');
    };
  }, [state.partieId, state.joueurId, dispatch, navigate]);

  const startGame = () => {
    socket.emit('startGame', { partieId: state.partieId });
  };

  return (
    <div>
      <h2>Lobby</h2>
      <p>ID de la partie: {state.partieId || "ID non disponible"}</p>
      <h3>Joueurs :</h3>
      {state.joueurs.length === 0 ? (
        <p>Aucun joueur n'a encore rejoint la partie.</p>
      ) : (
        <ul>
          {state.joueurs.map((player) => (
            <li key={player.id}>{player.nom}</li>
          ))}
        </ul>
      )}
      {state.isHost && <button onClick={startGame}>Démarrer la partie</button>}
    </div>
  );
};

export default Lobby;