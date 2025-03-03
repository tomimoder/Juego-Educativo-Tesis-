const { Server } = require("socket.io");
const pool = require("../database");
const cookie = require("cookie");

let waitingUser = null;
const groupSolutions = {};

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // 🔥 Asegurar que coincide con el frontend
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log(`🛜 Nueva conexión - Socket ID: ${socket.id}`);

    // 🔥 Obtener la cookie de sesión del usuario
    const cookies = cookie.parse(socket.handshake.headers.cookie || "");
    if (!cookies.userSession) {
      console.log("❌ Usuario no autenticado en WebSocket");
      socket.emit("error", { message: "Usuario no autenticado en WebSocket" });
      return;
    }

    let user;
    try {
      user = JSON.parse(cookies.userSession);
      if (!user.id) throw new Error("Usuario inválido en la cookie");
    } catch (error) {
      console.error("❌ Error leyendo la cookie:", error);
      socket.emit("error", { message: "Error en la autenticación del chat" });
      return;
    }

    console.log(`✅ Usuario ${user.id} conectado con Socket ID: ${socket.id}`);

    // 🔹 Manejar evento `joinChat`
    socket.on("joinChat", async () => {
      console.log(`👤 Usuario ${user.id} intentando unirse al chat`);
    
      let connection;
      try {
        connection = await pool.getConnection();
    
        // Buscar si el usuario ya está en un grupo de chat
        const [existingGroup] = await connection.query(
          `SELECT chat_group_id FROM UserChatGroups WHERE user_id = ?`, [user.id]
        );
    
        if (existingGroup.length > 0) {
          // Si el usuario ya tiene un grupo, se une a él
          const chatGroupId = existingGroup[0].chat_group_id;
          socket.join(`chatGroup_${chatGroupId}`);
          console.log(`✅ Usuario ${user.id} ya está en el grupo ${chatGroupId}`);
          socket.emit("chatGroupJoined", { chatGroupId });
          return;
        }
    
        // Si no está en ningún grupo, intentamos emparejarlo
        if (waitingUser === null) {
          waitingUser = { socket, userId: user.id };
          socket.emit("waiting", { message: "Esperando a otro usuario para emparejar..." });
          console.log(`⌛ Usuario ${user.id} esperando pareja`);
        } else {
          // Hay un usuario esperando, creamos un grupo para ambos
          const socket1 = waitingUser.socket;
          const socket2 = socket;
          const userId1 = waitingUser.userId;
          const userId2 = user.id;
          waitingUser = null; // Reiniciar variable de espera
    
          // Crear nuevo grupo en la base de datos
          const [result] = await connection.query("SELECT MAX(id) as maxId FROM ChatGroups");
          const chatGroupId = (result[0].maxId || 0) + 1;
    
          await connection.beginTransaction();
          await connection.query(
            "INSERT INTO ChatGroups (id, name) VALUES (?, ?)",
            [chatGroupId, `Chat Group ${chatGroupId}`]
          );
    
          await connection.query(
            "INSERT INTO UserChatGroups (chat_group_id, user_id) VALUES (?, ?), (?, ?)",
            [chatGroupId, userId1, chatGroupId, userId2]
          );
    
          await connection.commit();
    
          // Unir a los usuarios al grupo en Socket.IO
          socket1.join(`chatGroup_${chatGroupId}`);
          socket2.join(`chatGroup_${chatGroupId}`);
    
          console.log(`✅ Emparejados en grupo ${chatGroupId} - Usuarios ${userId1} y ${userId2}`);
          socket1.emit("chatGroupJoined", { chatGroupId });
          socket2.emit("chatGroupJoined", { chatGroupId });
        }
      } catch (error) {
        if (connection) await connection.rollback();
        console.error("❌ Error al unir al usuario al grupo de chat:", error);
        socket.emit("error", { message: "Error al unirse al grupo de chat. Intenta de nuevo." });
        
        // Si hay un error, aseguramos que `waitingUser` no quede en un estado inconsistente
        if (waitingUser && waitingUser.userId === user.id) {
          waitingUser = null;
        }
      } finally {
        if (connection) connection.release();
      }
    });

    // 🔹 Evento para retransmitir piezas movidas en el Tangram
    socket.on("pieceMoved", ({ groupId, pieceId, position, rotation }) => {
      console.log(`📡 Servidor retransmitiendo: Pieza ${pieceId} en grupo ${groupId}`);
      console.log(`📍 Posición recibida -> x: ${position?.x}, y: ${position?.y}, rotación: ${rotation}`);
      socket.to(`chatGroup_${groupId}`).emit("pieceMoved", { pieceId, position, rotation });
    });

    // 🔹 Evento para enviar mensajes en el chat
    socket.on("sendMessage", async (message) => {
      const { chatGroupId, content, userId, nombre, apellido } = message;

      try {
        let connection = await pool.getConnection();
        await connection.query(
          "INSERT INTO messages (user_id, chat_group_id, content) VALUES (?, ?, ?)",
          [userId, chatGroupId, content]
        );
        connection.release();

        const newMessage = {
          userId,
          nombre,
          apellido,
          content,
          chatGroupId,
          timestamp: new Date(),
        };
        io.to(`chatGroup_${chatGroupId}`).emit("newMessage", newMessage);
      } catch (error) {
        console.error("❌ Error al enviar mensaje:", error);
        socket.emit("error", { message: "Error al enviar el mensaje" });
      }
    });

    // 🔹 Evento de desconexión
    socket.on("disconnect", () => {
      console.log(`❌ Usuario desconectado - Socket ID: ${socket.id}`);
      if (waitingUser && waitingUser.socket.id === socket.id) {
        waitingUser = null;
      }
    });

    // 🔹 Evento para obtener una solución aleatoria
    socket.on("requestRandomSolution", async ({ groupId }) => {
      try {
        // Si ya existe una solución para este grupo, la reutilizamos
        if (groupSolutions[groupId]) {
          console.log(`📡 Reenviando solución existente para grupo ${groupId}`);
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", groupSolutions[groupId]);
          return;
        }
    
        // Obtener una solución aleatoria de la base de datos
        const connection = await pool.getConnection();
        const [solution] = await connection.query(
          "SELECT solution_data FROM usertangramsolutions ORDER BY RAND() LIMIT 1"
        );
        connection.release();
    
        if (solution.length > 0) {
          // Guardar la solución para este grupo
          groupSolutions[groupId] = solution[0].solution_data;
          console.log(`📡 Asignando nueva solución al grupo ${groupId}:`, solution[0].solution_data);
    
          // Enviar la misma solución a todos los jugadores del grupo
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", solution[0].solution_data);
        }
      } catch (error) {
        console.error("❌ Error obteniendo solución aleatoria:", error);
      }
    });
  });

  return io;
}

module.exports = { initializeSocket };
