import WebSocket from 'ws';

const socket = new WebSocket("ws://localhost:3000/", "vite-hmr");

socket.addEventListener("message", async ({ data }) => {
  const payload = JSON.parse(data);
});