import useSocket from "./useSocket";

export default function useSendMessage(currentUserId) {
  const { socket } = useSocket();

  const sendMessage = ({ text, toId, onSuccess }) => {
    if (!text.trim() || !toId || !socket) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
    });

    if (onSuccess) onSuccess();
  };

  return { sendMessage };
}
