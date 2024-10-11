import React, { createContext, useState, useContext } from 'react';

const GameContext = createContext();

export const GameProvider = ({ children }) => {
  const [gameState, setGameState] = useState({
    partieId: null,
    joueurId: null,
    phase: 'lobby', // 'lobby', 'manche', 'vote', 'faceAFace'
    joueurs: [],
    question: null,
    cagnotte: 0,
  });

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);