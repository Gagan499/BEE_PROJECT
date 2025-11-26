import { verifyToken } from "../routes/jwtutils.js";

function adminAuth(req, res, next) {
  // First check authentication
  let token = req.cookies?.token;
  if (!token) {
    const authHeader = req.headers["authorization"] || req.headers["Authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring("Bearer ".length);
    }
  }

  if (!token) {
    const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/') || req.headers['accept']?.includes('application/json');
    if (isApiRequest) {
      return res.status(401).json({ success: false, message: "Access denied, no token provided" });
    } else {
      return res.redirect('/api/login');
    }
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    
    // Check if user is admin (name === "Admin")
    if (req.user && req.user.name === "Admin") {
      next();
    } else {
      // Not admin - redirect or send error
      const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/') || req.headers['accept']?.includes('application/json');
      if (isApiRequest) {
        return res.status(403).json({ success: false, message: "Access denied. Admin only." });
      } else {
        return res.status(403).render("error.ejs", { 
          message: "Access Denied", 
          error: "This page is only accessible to administrators." 
        });
      }
    }
  } catch (err) {
    const isApiRequest = req.path.startsWith('/api/') || req.originalUrl.startsWith('/api/') || req.headers['accept']?.includes('application/json');
    if (err.name === "TokenExpiredError") {
      if (isApiRequest) {
        return res.status(401).json({ success: false, message: "Token expired" });
      } else {
        return res.redirect('/api/login');
      }
    }
    if (isApiRequest) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      return res.redirect('/api/login');
    }
  }
}

export default adminAuth;

