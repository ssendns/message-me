import useSocket from "./useSocket";
import SOCKET_EVENTS from "../services/socketEvents";

export default function useSendMessage() {
  const { socket } = useSocket();

  const sendMessage = ({ chatId, text, imageUrl, imagePublicId }) => {
    if (!socket) return;
    const clean = (text ?? "").trim();
    if (!clean && !imageUrl) return;

    socket.emit(SOCKET_EVENTS.SEND_MESSAGE, {
      chatId,
      text: clean,
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
    });
  };

  return { sendMessage };
}
