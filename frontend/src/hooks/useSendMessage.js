import useSocket from "./useSocket";
import useChatList from "./useChatList";

export default function useSendMessage(currentUserId) {
  const { socket } = useSocket();
  const { refreshChats } = useChatList();

  const sendMessage = ({ text, toId, onSuccess }) => {
    if (!text.trim() || !toId || !socket) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
    });

    refreshChats();

    if (onSuccess) onSuccess();
  };

  return { sendMessage };
}
