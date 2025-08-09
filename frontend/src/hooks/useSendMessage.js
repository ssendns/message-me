import useSocket from "./useSocket";

export default function useSendMessage(currentUserId) {
  const { socket } = useSocket();

  const sendMessage = ({ text, imageUrl, imagePublicId, toId }) => {
    if (!text.trim() && !imageUrl) return;

    socket.emit("send_message", {
      from: currentUserId,
      to: toId,
      text,
      imageUrl,
      imagePublicId,
    });
  };

  return { sendMessage };
}
