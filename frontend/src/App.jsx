import { AuthProvider } from "./context/AuthContext";
import RouterWrapper from "./RouterWrapper";

export default function App() {
  return (
    <AuthProvider>
      <RouterWrapper />
    </AuthProvider>
  );
}
