const jwt = require("jsonwebtoken");
const prisma = require("../../utils/prisma");

const ensureAutentification = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "authorization header missing or invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "server misconfigured" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = Number(decoded.userId);

    next();
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};

async function ensureUserExists(req, res, next) {
  const userId = Number(req.userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  req.userName = user.username;
  next();
}

module.exports = { ensureAutentification, ensureUserExists };
