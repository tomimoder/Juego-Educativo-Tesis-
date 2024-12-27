const { Server } = require("socket.io");
const pool = require('../database');

let waitingUser = null;

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log(`Nueva conexión - Socket ID: ${socket.id}`);

    socket.on("joinChat", async ({ userId }) => {
      console.log(`Usuario ${userId} intentando unirse al chat`);
      let connection;
      try {
        connection = await pool.getConnection();

        const [existingGroup] = await connection.query(
          `SELECT chat_group_id FROM UserChatGroups WHERE user_id = ?`, [userId]
        );

        if (existingGroup.length > 0) {
          const chatGroupId = existingGroup[0].chat_group_id;
          socket.join(`chatGroup_${chatGroupId}`);
          console.log(`Usuario ${userId} se ha unido al grupo de chat existente ${chatGroupId}`);
          socket.emit('chatGroupJoined', { chatGroupId });
        } else {
          if (waitingUser === null) {
            waitingUser = { socket, userId };
            socket.emit('waiting', { message: 'Esperando a otro usuario para emparejar...' });
            console.log(`Usuario ${userId} esperando pareja`);
          } else {
            const socket1 = waitingUser.socket;
            const socket2 = socket;
            const userId1 = waitingUser.userId;
            const userId2 = userId;
            waitingUser = null;

            const [result] = await connection.query('SELECT MAX(id) as maxId FROM ChatGroups');
            const chatGroupId = (result[0].maxId || 0) + 1;

            await connection.beginTransaction();

            await connection.query(
              'INSERT INTO ChatGroups (id, name) VALUES (?, ?)',
              [chatGroupId, `Chat Group ${chatGroupId}`]
            );

            await connection.query(
              'INSERT INTO UserChatGroups (chat_group_id, user_id) VALUES (?, ?), (?, ?)',
              [chatGroupId, userId1, chatGroupId, userId2]
            );

            await connection.commit();

            socket1.join(`chatGroup_${chatGroupId}`);
            socket2.join(`chatGroup_${chatGroupId}`);

            console.log(`Emparejados en grupo ${chatGroupId} - Enviando evento a usuarios ${userId1} y ${userId2}`);
            socket1.emit('chatGroupJoined', { chatGroupId });
            socket2.emit('chatGroupJoined', { chatGroupId });
          }
        }
      } catch (error) {
        if (connection) await connection.rollback();
        console.error('Error al unir al usuario al grupo de chat:', error);
        socket.emit('error', { message: 'Error al unirse al grupo de chat. Intenta de nuevo.' });
        if (waitingUser && waitingUser.socket.id === socket.id) {
          waitingUser = null;
        }
      } finally {
        if (connection) connection.release();
      }
    });

    socket.on('pieceMoved', ({ groupId, pieceId, position }) => {
      socket.to(`chatGroup_${groupId}`).emit('pieceMoved', { pieceId, position });
    });

    socket.on("sendMessage", async (message) => {
      const { chatGroupId, content, userId, nombre, apellido } = message;

      try {
        let connection = await pool.getConnection();
        await connection.query(
          'INSERT INTO messages (user_id, chat_group_id, content) VALUES (?, ?, ?)',
          [userId, chatGroupId, content]
        );
        connection.release();

        const newMessage = {
          userId,
          nombre,
          apellido,
          content,
          chatGroupId,
          timestamp: new Date()
        };
        io.to(`chatGroup_${chatGroupId}`).emit("newMessage", newMessage);

      } catch (error) {
        console.error('Error al enviar mensaje:', error);
        socket.emit('error', { message: 'Error al enviar el mensaje' });
      }
    });

    socket.on("disconnect", () => {
      console.log(`Usuario desconectado - Socket ID: ${socket.id}`);
      if (waitingUser && waitingUser.socket.id === socket.id) {
        waitingUser = null;
      }
    });
  });

  return io;
}

module.exports = { initializeSocket };