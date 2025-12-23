require('dotenv').config();

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ code: 401, message: 'Authorization header missing' });
  }

  const token = authHeader.split(' ')[1]; // Bearer <token>
  const validSecret = process.env.SECRET;

  if (token !== validSecret) {
    // In future, check server-specific secret if needed
    return res.status(401).json({ code: 401, message: 'Invalid token' });
  }

  next();
};

module.exports = authMiddleware;
