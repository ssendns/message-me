const prisma = require("../utils/db");
const { createMessage } = require("../utils/createMessage");

const sendMessage = async (req, res) => {
  const { toId, content } = req.body;
  const fromId = req.user.userId;

  if (!toId || !content) {
    return res.status(400).json({ error: "missing fields" });
  }

  try {
    const message = await createMessage(fromId, toId, content);
    res.status(201).json({ message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
};

const getMessagesWithUser = async (req, res) => {
  const toId = parseInt(req.params.toId);
  const myId = req.user.userId;

  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromId: myId, toId: toId },
          { fromId: toId, toId: myId },
        ],
      },
      orderBy: { createdAt: "asc" },
    });

    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteMessage = async (req, res) => {
  const messageId = Number(req.params.id);
  const userId = req.user.userId;

  const message = await prisma.message.findUnique({ where: { id: messageId } });

  if (!message) {
    return res.status(404).json({ error: "message not found" });
  }

  if (message.fromId !== userId) {
    return res
      .status(403)
      .json({ error: "you can only delete your own messages" });
  }

  await prisma.message.delete({ where: { id: messageId } });

  res.status(204).send();
};

module.exports = { sendMessage, getMessagesWithUser, deleteMessage };
