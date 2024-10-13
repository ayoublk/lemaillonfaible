import io from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

export const socket = io(SOCKET_URL, {
  transports: ['websocket'],
  upgrade: false
});

socket.on('connect', () => {
  console.log('Connecté au serveur');
});

socket.on('disconnect', (reason) => {
  console.log('Déconnecté du serveur:', reason);
});

socket.on('connect_error', (error) => {
  console.log('Erreur de connexion:', error.message);
});

socket.on('error', (error) => {
  console.log('Erreur Socket.IO:', error);
});

export default socket;