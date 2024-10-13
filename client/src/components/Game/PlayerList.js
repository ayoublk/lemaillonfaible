import React from 'react';

const PlayerList = ({ players, currentPlayer }) => {
  return (
    <div className="player-list">
      <h3>Joueurs</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id} className={player.id === currentPlayer ? 'current-player' : ''}>
            {player.nom} {player.estElimine && '(Éliminé)'}
            {player.id === currentPlayer && ' (Tour actuel)'}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;