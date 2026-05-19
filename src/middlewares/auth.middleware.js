const jwt = require("jsonwebtoken");

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        message: "Unauthorized",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT PAYLOAD:", decoded);
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      message: "Invalid or expired token",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      status: "error",
      message: "Admin access only",
    });
  }

  next();
};

const requireDeliveryAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "DELIVERY_BOY") {
      return res.status(403).json({ status: "error", message: "Delivery boy access only" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Invalid or expired token" });
  }
};

module.exports = { requireAuth, requireAdmin, requireDeliveryAuth };
