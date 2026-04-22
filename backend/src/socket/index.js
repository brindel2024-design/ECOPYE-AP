const jwt = require('jsonwebtoken');

const connectedUsers = new Map();

const initSocket = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Non autorisé'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    connectedUsers.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);

    socket.on('disconnect', () => {
      connectedUsers.delete(socket.userId);
    });
  });
};

const notifyUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = { initSocket, notifyUser, connectedUsers };
