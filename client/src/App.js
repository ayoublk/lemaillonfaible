import React, { useEffect } from 'react';
import io from 'socket.io-client';

function App() {
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect', () => {
      console.log('Connecté au serveur');
    });
    return () => socket.disconnect();
  }, []);

  return (
    <div className="App">
      <h1>Le Maillon Faible Online</h1>
    </div>
  );
}

export default App;