const bcrypt = require("bcryptjs");
const prisma = require("../../utils/prisma");
const generateToken = require("../../utils/generateToken");

const signUp = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "missing fields" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
    },
  });

  const token = generateToken(user.id);

  res.status(201).json({
    user: { id: user.id, username: user.username, token },
  });
};

const logIn = async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) return res.status(400).json({ error: "invalid credentials" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "invalid credentials" });

  const token = generateToken(user.id);

  res.status(200).json({
    user: { id: user.id, username: user.username, token },
  });
};

module.exports = { signUp, logIn };
