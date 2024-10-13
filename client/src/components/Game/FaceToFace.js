import React from 'react';
import { useGame } from '../contexts/GameContext';
import Question from './Question';

const FaceToFace = () => {
  const { state, dispatch } = useGame();

  const handleAnswer = (answer) => {
    // Logique pour gérer la réponse dans le face à face
    // Cela dépendra de la façon dont vous voulez implémenter cette phase
  };

  return (
    <div className="face-to-face">
      <h3>Face à Face Final</h3>
      <div className="scores">
        {state.scoreFaceAFace.map((player) => (
          <div key={player.id}>
            {state.joueurs.find(j => j.id === player.id).nom}: {player.score}
          </div>
        ))}
      </div>
      <Question 
        question={state.question} 
        onAnswer={handleAnswer}
        isCurrentPlayer={true} // Dans le face à face, le joueur peut toujours répondre
      />
    </div>
  );
};

export default FaceToFace;