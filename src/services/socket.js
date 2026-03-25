import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:5000";

let socket = null;

export const connectSocket = (tenantId) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on("connect", () => {
    // Apne tenant room mein join karo
    socket.emit("join:tenant", tenantId);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
