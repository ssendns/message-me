import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import SocketContext from "./SocketContext";
import SOCKET_EVENTS from "../services/socketEvents";

export default function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const socketInstance = io("http://localhost:3000", {
      withCredentials: true,
    });

    setSocket(socketInstance);
    console.log("socket instance created!", socketInstance);

    socketInstance.on("connect", () => {
      setIsReady(true);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket || !isReady) return;
    const id = Number(localStorage.getItem("id"));
    if (!id) return;
    socket.emit(SOCKET_EVENTS.JOIN, { userId: id });
  }, [socket, isReady]);

  useEffect(() => {
    if (!socket) return;
    const onErr = (err) => console.error("[socket error]", err);
    socket.on(SOCKET_EVENTS.ERROR, onErr);
    return () => socket.off(SOCKET_EVENTS.ERROR, onErr);
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, isReady }}>
      {children}
    </SocketContext.Provider>
  );
}
