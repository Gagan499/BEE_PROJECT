import dotenv from "dotenv";
import { verifyToken } from "../routes/jwtutils.js";

dotenv.config();

function authenticator(req, res, next) {
  // Prefer cookie token; fallback to Authorization: Bearer <token>
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring("Bearer ".length);
    }
  }

  if (!token) {
    // Check if this is an API request or page request
    const isApiRequest = req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json');
    
    if (isApiRequest) {
      return res.status(401).json({ error: "Access denied, no token provided" });
    } else {
      // Redirect to login for page requests
      return res.redirect('/api/login');
    }
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // attach user data
    next();
  } catch (err) {
    // Check if this is an API request or page request
    const isApiRequest = req.path.startsWith('/api/') || req.headers['accept']?.includes('application/json');
    
    if (err.name === "TokenExpiredError") {
      const expiredAt = err.expiredAt?.getTime?.() ?? Date.now();
      const secondsAgo = Math.floor((Date.now() - expiredAt) / 1000);
      
      if (isApiRequest) {
        return res.status(401).json({
          error: `Token expired ${secondsAgo} seconds ago`,
          expired_at: new Date(expiredAt).toISOString(),
        });
      } else {
        return res.redirect('/api/login');
      }
    }
    
    if (isApiRequest) {
      return res.status(401).json({ error: "Invalid token" });
    } else {
      return res.redirect('/api/login');
    }
  }
}

export default authenticator;
