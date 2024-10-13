import React, { createContext, useContext, useReducer } from 'react';

const GameContext = createContext();

const initialState = {
  partieId: null,
  joueurId: null,
  nom: '',
  phase: 'lobby', // 'lobby', 'manche', 'vote', 'faceAFace', 'mortSubite'
  joueurs: [],
  mancheActuelle: 0,
  question: null,
  cagnotte: 0,
  cagnotteManche: 0,
  chaineCourante: 0,
  tourActuel: 0,
  timer: 0,
  votesEnCours: {},
  resultatsVote: null,
  scoreFaceAFace: [],
  gagnant: null,
  isHost: false, // Ajout de isHost à l'état initial
};

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PARTIE_INFO':
      console.log("Mise à jour de l'état avec les infos de la partie:", action.payload);
      return { ...state, partieId: action.payload.partieId, joueurId: action.payload.joueurId, nom: action.payload.nom };
    case 'UPDATE_PLAYERS':
      return { ...state, joueurs: action.payload };
    case 'START_MANCHE':
      return { ...state, phase: 'manche', mancheActuelle: state.mancheActuelle + 1, cagnotteManche: 0, chaineCourante: 0 };
    case 'SET_QUESTION':
      return { ...state, question: action.payload };
    case 'UPDATE_CAGNOTTE':
      return { ...state, cagnotte: action.payload.cagnotte, cagnotteManche: action.payload.cagnotteManche };
    case 'UPDATE_CHAINE':
      return { ...state, chaineCourante: action.payload };
    case 'START_VOTE':
      return { ...state, phase: 'vote', votesEnCours: {} };
    case 'RECORD_VOTE':
      return { ...state, votesEnCours: { ...state.votesEnCours, [action.payload.votant]: action.payload.votePour } };
    case 'END_VOTE':
      return { ...state, resultatsVote: action.payload, phase: 'manche' };
    case 'START_FACE_A_FACE':
      return { ...state, phase: 'faceAFace', scoreFaceAFace: action.payload.scores };
    case 'UPDATE_FACE_A_FACE_SCORE':
      return { ...state, scoreFaceAFace: action.payload };
    case 'START_MORT_SUBITE':
      return { ...state, phase: 'mortSubite' };
    case 'END_GAME':
      return { ...state, phase: 'fin', gagnant: action.payload };
    case 'SET_HOST_STATUS':
      return { ...state, isHost: action.payload };
    default:
      return state;
  }
}

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => useContext(GameContext);