import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';

const Lobby = () => {
  const { state, dispatch } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    // Rejoindre la salle du lobby
    socket.emit('joinLobby', { partieId: state.partieId, joueurId: state.joueurId });

    // Écouter les mises à jour de la liste des joueurs
    socket.on('updatePlayerList', (updatedPlayers) => {
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
      <p>ID de la partie: {state.partieId}</p>
      <h3>Joueurs :</h3>
      <ul>
        {state.joueurs.map((player) => (
          <li key={player.id}>{player.nom}</li>
        ))}
      </ul>
      {state.isHost && <button onClick={startGame}>Démarrer la partie</button>}
    </div>
  );
};

export default Lobby;