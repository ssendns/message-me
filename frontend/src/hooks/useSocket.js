import { useAuth } from "../context/AuthContext";
export default function useSocket() {
  const { socket, isReady } = useAuth();
  return { socket, isReady };
}
