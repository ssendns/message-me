const prisma = require("../utils/db");

const sendMessage = async (req, res) => {
  const { toId, content } = req.body;
  const fromId = req.user.userId;

  if (!toId || !content) {
    return res.status(400).json({ error: "missing fields" });
  }

  try {
    const message = await prisma.message.create({
      data: {
        fromId,
        toId,
        content,
      },
    });

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

module.exports = { sendMessage, getMessagesWithUser };
