import {
  createMessage as apiCreateMessage,
  editMessage as apiEditMessage,
  deleteMessage as apiDeleteMessage,
} from "../services/api";

export default function useMessage() {
  const token = localStorage.getItem("token");

  const sendMessage = async ({ chatId, text, imageUrl, imagePublicId }) => {
    if (!token) return;
    const clean = (text ?? "").trim();
    if (!clean && !imageUrl) return;

    return apiCreateMessage({
      chatId,
      token,
      text: clean,
      imageUrl: imageUrl ?? null,
      imagePublicId: imagePublicId ?? null,
    });
  };

  const editMessage = async ({
    chatId,
    messageId,
    text,
    imageUrl,
    imagePublicId,
  }) => {
    if (!token) return;

    return apiEditMessage({
      chatId,
      messageId,
      token,
      text,
      imageUrl,
      imagePublicId,
    });
  };

  const deleteMessage = async ({ chatId, messageId }) => {
    if (!token) return;
    return apiDeleteMessage({ chatId, messageId, token });
  };

  return { sendMessage, editMessage, deleteMessage };
}
