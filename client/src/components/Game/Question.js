import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

const VotingPhase = () => {
  const { state, dispatch } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [playSelect] = useSound('/sounds/select.mp3', { volume: 0.5 });
  const [playVote] = useSound('/sounds/vote.mp3', { volume: 0.7 });

  const handleVote = () => {
    if (selectedPlayer) {
      socket.emit('vote', { partieId: state.partieId, votantId: state.joueurId, votePourId: selectedPlayer });
      dispatch({ type: 'RECORD_VOTE', payload: { votant: state.joueurId, votePour: selectedPlayer } });
      playVote();
    }
  };

  return (
    <motion.div
      className="voting-phase"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h3>Phase de vote</h3>
      <p>Choisissez le joueur que vous souhaitez éliminer :</p>
      <AnimatePresence>
        <motion.ul className="players-list">
          {state.joueurs.filter(player => !player.estElimine && player.id !== state.joueurId).map((player) => (
            <motion.li
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.button 
                onClick={() => {
                  setSelectedPlayer(player.id);
                  playSelect();
                }}
                className={selectedPlayer === player.id ? 'selected' : ''}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {player.nom}
              </motion.button>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>
      <motion.button
        onClick={handleVote}
        disabled={!selectedPlayer}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="vote-button"
      >
        Voter
      </motion.button>
    </motion.div>
  );
};

export default VotingPhase;