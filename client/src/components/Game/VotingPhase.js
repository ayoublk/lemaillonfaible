import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';

const VotingPhase = () => {
  const { state, dispatch } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const handleVote = () => {
    if (selectedPlayer) {
      socket.emit('vote', { partieId: state.partieId, votantId: state.joueurId, votePourId: selectedPlayer });
      dispatch({ type: 'RECORD_VOTE', payload: { votant: state.joueurId, votePour: selectedPlayer } });
    }
  };

  return (
    <div className="voting-phase">
      <h3>Phase de vote</h3>
      <p>Choisissez le joueur que vous souhaitez éliminer :</p>
      <ul>
        {state.joueurs.filter(player => !player.estElimine && player.id !== state.joueurId).map((player) => (
          <li key={player.id}>
            <button 
              onClick={() => setSelectedPlayer(player.id)}
              className={selectedPlayer === player.id ? 'selected' : ''}
            >
              {player.nom}
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleVote} disabled={!selectedPlayer}>Voter</button>
    </div>
  );
};

export default VotingPhase;