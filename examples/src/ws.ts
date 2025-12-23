import * as VENTEA from 'ventea';

const socket = new WebSocket('ws://127.0.0.1:8080');

(window as any).ws = socket;
console.log(socket);

// Connection opened
socket.addEventListener('open', (event) => {
    socket.send('Hello Server!');
});

// Listen for messages
socket.addEventListener('message', (event) => {
    console.log('Message from server ', event.data);
});