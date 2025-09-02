import { verfyToken } from "../routes/jwtutils";

dotenv.config();

function authenticator(req, res, next) {
  const token = req.cookies.token;
  if (!token)
    return res.status(401).json({ error: "Access denied, no token provided" });

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // attach user data
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      const expiredAt = err.expiredAt.getTime();
      const secondsAgo = Math.floor((Date.now() - expiredAt) / 1000);
      return res.status(401).json({
        error: `Token expired ${secondsAgo} seconds ago`,
        expired_at: new Date(expiredAt).toISOString(),
      });
    }

    return res.status(401).json({ error: "Invalid token" });
  }
};

export default authenticator;
