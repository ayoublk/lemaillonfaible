import React, { useEffect, useState } from 'react';
import { useGame } from '../contexts/GameContext';
import socket from '../services/socket';
import Question from './Question';
import PlayerList from './PlayerList';
import VotingPhase from './VotingPhase';
import FaceToFace from './FaceToFace';
import Timer from './Timer';

const Game = () => {
  const { state, dispatch } = useGame();
  const [currentPlayer, setCurrentPlayer] = useState(null);

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
  }, []);

  const handleQuestionReceived = (question) => {
    dispatch({ type: 'SET_QUESTION', payload: question });
  };

  const handlePlayerTurn = (playerId) => {
    setCurrentPlayer(playerId);
  };

  const handleUpdateGameState = (gameState) => {
    dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
  };

  const handleStartVoting = () => {
    dispatch({ type: 'START_VOTE' });
  };

  const handleStartFaceToFace = (players) => {
    dispatch({ type: 'START_FACE_A_FACE', payload: { scores: players.map(p => ({ id: p.id, score: 0 })) } });
  };

  const handleGameOver = (winner) => {
    dispatch({ type: 'END_GAME', payload: winner });
  };

  const handleAnswer = (answer) => {
    socket.emit('playerAnswer', { 
      partieId: state.partieId, 
      joueurId: state.joueurId, 
      reponse: answer 
    });
  };

  const handleBank = () => {
    socket.emit('playerBank', { 
      partieId: state.partieId, 
      joueurId: state.joueurId 
    });
  };

  const renderGamePhase = () => {
    switch (state.phase) {
      case 'manche':
        return (
          <>
            <Question 
              question={state.question} 
              onAnswer={handleAnswer} 
              isCurrentPlayer={currentPlayer === state.joueurId}
            />
            <button onClick={handleBank} disabled={currentPlayer !== state.joueurId}>Banque</button>
          </>
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
    <div>
      <h2>Le Maillon Faible - Manche {state.mancheActuelle}/8</h2>
      <PlayerList players={state.joueurs} currentPlayer={currentPlayer} />
      <Timer initialTime={state.timer} />
      <div>Cagnotte totale : {state.cagnotte}</div>
      <div>Cagnotte de la manche : {state.cagnotteManche}</div>
      <div>Chaîne actuelle : {state.chaineCourante}</div>
      {renderGamePhase()}
    </div>
  );
};

const GameOver = ({ winner }) => (
  <div>
    <h3>Partie terminée!</h3>
    <p>Le gagnant est : {winner.nom}</p>
    <p>Montant remporté : {winner.montant}</p>
  </div>
);

export default Game;