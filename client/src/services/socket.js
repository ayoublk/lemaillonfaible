/*import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  upgrade: false,
  reconnection: true,
  forceNew: true
});

export const connectSocket = () => {
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};

export const subscribeToEvent = (event, callback) => {
  socket.on(event, callback);
};

export const emitEvent = (event, data) => {
  socket.emit(event, data);
};

export default socket;*/