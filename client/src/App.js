import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import io from 'socket.io-client';
import { GameProvider } from './contexts/GameContext';
import Home from './components/Home';
import Lobby from './components/Lobby';
import Game from './components/Game/Game';

function App() {
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('Connecté au serveur');
    });
    return () => socket.disconnect();
  }, []);

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