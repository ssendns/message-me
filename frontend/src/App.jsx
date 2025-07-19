import SocketProvider from "./context/SocketProvider";
import RouterWrapper from "./RouterWrapper";

export default function App() {
  return (
    <SocketProvider>
      <RouterWrapper />
    </SocketProvider>
  );
}
