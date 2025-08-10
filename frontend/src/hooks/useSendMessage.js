import useSocket from "./useSocket";

export default function useSendMessage() {
  const { socket } = useSocket();

  const sendMessage = ({ chatId, text, imageUrl, imagePublicId }) => {
    if (!socket) return;
    const clean = (text ?? "").trim();
    if (!clean && !imageUrl) return;

    socket.emit("send_message", {
      chatId,
      text: clean,
      imageUrl: imageUrl || null,
      imagePublicId: imagePublicId || null,
    });
  };

  return { sendMessage };
}
