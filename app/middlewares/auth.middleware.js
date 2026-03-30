const jwt = require("jsonwebtoken");
const ApiError = require("../api-error");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return next(new ApiError(401, "Bạn chưa đăng nhập!"));
  }

  try {
    const decoded = jwt.verify(token, "contactbook_secret_key");
    req.userId = decoded.id;
    next();
  } catch (error) {
    return next(
      new ApiError(403, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn"),
    );
  }
};

module.exports = verifyToken;
