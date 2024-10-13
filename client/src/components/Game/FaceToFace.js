import React from 'react';
import { useGame } from '../contexts/GameContext';
import Question from './Question';
import { motion } from 'framer-motion';
import socket from '../services/socket';

const FaceToFace = () => {
  const { state, dispatch } = useGame();

  const handleAnswer = (answer) => {
    socket.emit('faceToFaceAnswer', {
      partieId: state.partieId,
      joueurId: state.joueurId,
      reponse: answer
    });
  };

  return (
    <motion.div
      className="face-to-face"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h3
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Face à Face Final
      </motion.h3>
      <motion.div
        className="scores"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {state.scoreFaceAFace.map((player) => (
          <motion.div
            key={player.id}
            initial={{ x: -20 }}
            animate={{ x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {state.joueurs.find(j => j.id === player.id).nom}: {player.score}
          </motion.div>
        ))}
      </motion.div>
      <Question 
        question={state.question} 
        onAnswer={handleAnswer}
        isCurrentPlayer={state.joueurId === state.joueurActuel}
      />
    </motion.div>
  );
};

export default FaceToFace;