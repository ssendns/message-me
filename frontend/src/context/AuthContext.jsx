import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";
import SOCKET_EVENTS from "../services/socketEvents";

const SOCKET_URL = "http://localhost:3000";
const LS_TOKEN = "token";
const LS_ID = "id";
const LS_USERNAME = "username";
const LS_AVATAR = "avatarUrl";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(null);
  const [user, setUser] = useState({
    id: null,
    username: null,
    avatarUrl: null,
  });
  const [socket, setSocket] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const connectingRef = useRef(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const id = localStorage.getItem("id");
    const username = localStorage.getItem("username");
    const avatarUrl = localStorage.getItem("avatarUrl");
    if (token) setTokenState(token);
    if (id || username || avatarUrl) {
      setUser({
        id: id ? Number(id) : null,
        username: username || null,
        avatarUrl: avatarUrl || null,
      });
    }
  }, []);

  const persistToken = useCallback((token) => {
    if (!token) localStorage.removeItem("token");
    else localStorage.setItem("token", token);
  }, []);

  const persistUser = useCallback((user) => {
    if (!user) {
      localStorage.removeItem("id");
      localStorage.removeItem("username");
      localStorage.removeItem("avatarUrl");
      return;
    }
    if (user.id != null) localStorage.setItem("id", String(user.id));
    else localStorage.removeItem("id");

    if (user.username != null) localStorage.setItem("username", user.username);
    else localStorage.removeItem("username");

    if (user.avatarUrl) localStorage.setItem("avatarUrl", user.avatarUrl);
    else localStorage.removeItem("avatarUrl");
  }, []);

  const setToken = useCallback(
    (token) => {
      setTokenState(token);
      persistToken(token);
    },
    [persistToken]
  );

  const updateUser = useCallback(
    (patch) => {
      setUser((prev) => {
        const next = { ...prev, ...patch };
        persistUser(next);
        return next;
      });
    },
    [persistUser]
  );

  const login = useCallback(
    ({ token, user }) => {
      setTokenState(token);
      persistToken(token);
      const packed = {
        id: Number(user.id),
        username: user.username || null,
        avatarUrl: user.avatarUrl || null,
      };
      setUser(packed);
      persistUser(packed);
    },
    [persistToken, persistUser]
  );

  const logout = useCallback(() => {
    setTokenState(null);
    setUser({ id: null, username: null, avatarUrl: null });
    persistToken(null);
    persistUser(null);
    setIsReady(false);
    setSocket((soket) => {
      if (soket) {
        try {
          soket.disconnect();
        } catch {}
      }
      return null;
    });
  }, [persistToken, persistUser]);

  useEffect(() => {
    if (!token) {
      setSocket((soket) => {
        if (soket) {
          try {
            soket.disconnect();
          } catch {}
        }
        return null;
      });
      setIsReady(false);
      return;
    }

    if (connectingRef.current) return;
    connectingRef.current = true;

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      autoConnect: true,
      auth: { token },
      withCredentials: true,
    });

    const onConnect = () => {
      setIsReady(true);
      const userId = user?.id || Number(localStorage.getItem("id"));
      if (userId) {
        socket.emit(SOCKET_EVENTS.JOIN, { userId });
      }
    };
    const onDisconnect = () => setIsReady(false);
    const onError = (err) => console.error("[socket error]", err);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(SOCKET_EVENTS.ERROR, onError);

    setSocket(socket);
    connectingRef.current = false;

    return () => {
      try {
        socket.off("connect", onConnect);
        socket.off("disconnect", onDisconnect);
        socket.off(SOCKET_EVENTS.ERROR, onError);
        socket.disconnect();
      } catch {}
      setSocket(null);
      setIsReady(false);
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      socket,
      isReady,
      isAuthenticated: Boolean(token && user?.id),
      setToken,
      updateUser,
      login,
      logout,
    }),
    [token, user, socket, isReady, setToken, updateUser, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
