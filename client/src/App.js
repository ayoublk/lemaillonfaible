// import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
// import io from 'socket.io-client';
import { GameProvider } from './contexts/GameContext';
import Home from './components/Home'; // Assurez-vous que le chemin est correct
import Lobby from './components/Lobby';



// Composants simplifiés pour le test
const Game = () => <div>Game</div>;

function App() {
  return (
    <GameProvider>
      <Router>
        <div className="App">
          <h1>Le Maillon Faible Online</h1>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </div>
      </Router>
    </GameProvider>
  );
}

export default App;