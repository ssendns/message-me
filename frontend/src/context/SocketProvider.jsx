import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import SocketContext from "./SocketContext";

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

  return (
    <SocketContext.Provider value={{ socket, isReady }}>
      {children}
    </SocketContext.Provider>
  );
}
