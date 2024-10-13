import React, { useEffect, useState, useCallback } from 'react';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';
import Question from './Question';
import PlayerList from './PlayerList';
import VotingPhase from './VotingPhase';
import FaceToFace from './FaceToFace';
import Timer from './Timer';
import { motion, AnimatePresence } from 'framer-motion';
import useSound from 'use-sound';

const Game = () => {
  const { state, dispatch } = useGame();
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(state.timer);
  const [playCorrect] = useSound('/sounds/correct.mp3');
  const [playWrong] = useSound('/sounds/wrong.mp3');
  const [playBank] = useSound('/sounds/bank.mp3');

  const handleQuestionReceived = useCallback((question) => {
    dispatch({ type: 'SET_QUESTION', payload: question });
  }, [dispatch]);

  const handlePlayerTurn = useCallback((playerId) => {
    setCurrentPlayer(playerId);
  }, []);

  const handleUpdateGameState = useCallback((gameState) => {
    dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    setTimeLeft(gameState.timer);
  }, [dispatch]);

  const handleStartVoting = useCallback(() => {
    dispatch({ type: 'START_VOTE' });
  }, [dispatch]);

  const handleStartFaceToFace = useCallback((players) => {
    dispatch({ type: 'START_FACE_A_FACE', payload: { scores: players.map(p => ({ id: p.id, score: 0 })) } });
  }, [dispatch]);

  const handleGameOver = useCallback((winner) => {
    dispatch({ type: 'END_GAME', payload: winner });
  }, [dispatch]);

  useEffect(() => {
    socket.on('questionReceived', handleQuestionReceived);
    socket.on('playerTurn', handlePlayerTurn);
    socket.on('updateGameState', handleUpdateGameState);
    socket.on('startVoting', handleStartVoting);
    socket.on('startFaceToFace', handleStartFaceToFace);
    socket.on('gameOver', handleGameOver);

    return () => {
      socket.off('questionReceived');
      socket.off('playerTurn');
      socket.off('updateGameState');
      socket.off('startVoting');
      socket.off('startFaceToFace');
      socket.off('gameOver');
    };
  }, [handleQuestionReceived, handlePlayerTurn, handleUpdateGameState, handleStartVoting, handleStartFaceToFace, handleGameOver]);

  const handleAnswer = (answer) => {
    socket.emit('playerAnswer', { 
      partieId: state.partieId, 
      joueurId: state.joueurId, 
      reponse: answer 
    });
    if (answer === state.question.reponse_correcte) {
      playCorrect();
    } else {
      playWrong();
    }
  };

  const handleBank = () => {
    socket.emit('playerBank', { 
      partieId: state.partieId, 
      joueurId: state.joueurId 
    });
    playBank();
  };

  const renderGamePhase = () => {
    switch (state.phase) {
      case 'manche':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Question 
              question={state.question} 
              onAnswer={handleAnswer} 
              isCurrentPlayer={currentPlayer === state.joueurId}
            />
            {currentPlayer === state.joueurId && state.chaineCourante > 0 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleBank}
              >
                Banque
              </motion.button>
            )}
          </motion.div>
        );
      case 'vote':
        return <VotingPhase />;
      case 'faceAFace':
        return <FaceToFace />;
      case 'fin':
        return <GameOver winner={state.gagnant} />;
      default:
        return <div>En attente...</div>;
    }
  };

  return (
    <div className="game-container">
      <h2>Le Maillon Faible - Manche {state.mancheActuelle}/8</h2>
      <PlayerList players={state.joueurs} currentPlayer={currentPlayer} />
      <Timer initialTime={timeLeft} />
      <div className="game-info">
        <div>Cagnotte totale : {state.cagnotte}</div>
        <div>Cagnotte de la manche : {state.cagnotteManche}</div>
        <div>Chaîne actuelle : {state.chaineCourante}</div>
      </div>
      <AnimatePresence mode='wait'>
        {renderGamePhase()}
      </AnimatePresence>
    </div>
  );
};

const GameOver = ({ winner }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -50 }}
  >
    <h3>Partie terminée!</h3>
    <p>Le gagnant est : {winner.nom}</p>
    <p>Montant remporté : {winner.montant}</p>
  </motion.div>
);

export default Game;