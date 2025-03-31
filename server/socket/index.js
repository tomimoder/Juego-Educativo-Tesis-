const { Server } = require("socket.io");
const pool = require("../database");
const cookie = require("cookie");

let waitingUser = null;
const groupSolutions = {};
const groups = {}; // información de los grupos conectados
const shuffle = require('lodash.shuffle'); 

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
    origin: 'https://magisters.pages.dev', //https://magisters.pages.dev
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
    
        const [existingGroup] = await connection.query(
          `SELECT chat_group_id FROM UserChatGroups WHERE user_id = ?`, [user.id]
        );
    
        // Usuario ya tiene grupo
        if (existingGroup.length > 0) {
          const chatGroupId = existingGroup[0].chat_group_id;
          socket.join(`chatGroup_${chatGroupId}`);
          socket.emit("chatGroupJoined", { chatGroupId });
    
          if (!groups[chatGroupId]) {
            groups[chatGroupId] = {
              players: [],
              piecesAssigned: false,
              assignments: {}
            };
          }
    
          let player = groups[chatGroupId].players.find(p => p.userId === user.id);
          if (!player) {
            player = { socketId: socket.id, userId: user.id };
            groups[chatGroupId].players.push(player);
          } else {
            player.socketId = socket.id;
          }
    
          if (!groups[chatGroupId].piecesAssigned && groups[chatGroupId].players.length === 2) {
            const piecesIds = shuffle([1, 2, 3, 4, 5, 6, 7]);
            const assignmentPlayer1 = piecesIds.slice(0, 4);
            const assignmentPlayer2 = piecesIds.slice(4);
    
            groups[chatGroupId].assignments[groups[chatGroupId].players[0].socketId] = assignmentPlayer1;
            groups[chatGroupId].assignments[groups[chatGroupId].players[1].socketId] = assignmentPlayer2;
    
            groups[chatGroupId].piecesAssigned = true;
    
            io.to(groups[chatGroupId].players[0].socketId).emit("piecesAssignment", { pieces: assignmentPlayer1 });
            io.to(groups[chatGroupId].players[1].socketId).emit("piecesAssignment", { pieces: assignmentPlayer2 });
    
            console.log(`📤 Piezas asignadas (grupo existente): Usuario ${groups[chatGroupId].players[0].userId} => ${assignmentPlayer1}, Usuario ${groups[chatGroupId].players[1].userId} => ${assignmentPlayer2}`);
          } else if (groups[chatGroupId].assignments[socket.id]) {
            const pieces = groups[chatGroupId].assignments[socket.id];
            socket.emit("piecesAssignment", { pieces });
            console.log(`📤 Piezas reasignadas a usuario ${user.id}:`, pieces);
          } else {
            console.log(`⌛ Esperando al segundo jugador para reasignar piezas (usuario ${user.id})`);
          }
    
          return;
        }
    
        // Obtener nivel_curso del usuario actual
        const [userResult] = await connection.query(
          `SELECT nivel_curso FROM users WHERE id = ?`, [user.id]
        );
    
        const userNivelCurso = userResult[0]?.nivel_curso;
    
        if (!userNivelCurso) {
          socket.emit("error", { message: "Tu usuario no tiene nivel asignado." });
          return;
        }
    
        if (waitingUser === null) {
          // Ahora guardamos también el nivel del usuario que espera
          waitingUser = { socket, userId: user.id, nivel_curso: userNivelCurso };
          socket.emit("waiting", { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
          console.log(`⌛ Usuario ${user.id} esperando pareja del nivel ${userNivelCurso}`);
        } else {
          // Verificar que el usuario actual y waitingUser tengan el mismo nivel_curso
          if (waitingUser.nivel_curso !== userNivelCurso) {
            socket.emit("waiting", { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
            console.log(`🚫 Usuario ${user.id} (${userNivelCurso}) no coincide con nivel ${waitingUser.nivel_curso} del usuario en espera`);
            return;
          }
    
          const socket1 = waitingUser.socket;
          const socket2 = socket;
          const userId1 = waitingUser.userId;
          const userId2 = user.id;
          waitingUser = null;
    
          const [result] = await connection.query("SELECT MAX(id) as maxId FROM ChatGroups");
          const chatGroupId = (result[0].maxId || 0) + 1;
          
          if (userId1 === userId2) {
            socket.emit("error", { message: "No puedes emparejar contigo mismo. Usa una cuenta distinta." });
            return;
          }

          await connection.beginTransaction();
          await connection.query("INSERT INTO ChatGroups (id, name) VALUES (?, ?)", [chatGroupId, `Chat Group ${chatGroupId}`]);
          await connection.query(
            "INSERT INTO UserChatGroups (chat_group_id, user_id) VALUES (?, ?), (?, ?)",
            [chatGroupId, userId1, chatGroupId, userId2]
          );
          await connection.commit();
    
          socket1.join(`chatGroup_${chatGroupId}`);
          socket2.join(`chatGroup_${chatGroupId}`);
    
          socket1.emit("chatGroupJoined", { chatGroupId });
          socket2.emit("chatGroupJoined", { chatGroupId });
    
          const piecesIds = shuffle([1, 2, 3, 4, 5, 6, 7]);
          const assignmentPlayer1 = piecesIds.slice(0, 4);
          const assignmentPlayer2 = piecesIds.slice(4);
    
          groups[chatGroupId] = {
            players: [
              { socketId: socket1.id, userId: userId1 },
              { socketId: socket2.id, userId: userId2 },
            ],
            piecesAssigned: true,
            assignments: {
              [socket1.id]: assignmentPlayer1,
              [socket2.id]: assignmentPlayer2,
            }
          };
    
          io.to(socket1.id).emit("piecesAssignment", { pieces: assignmentPlayer1 });
          io.to(socket2.id).emit("piecesAssignment", { pieces: assignmentPlayer2 });
    
          console.log(`📤 Piezas asignadas: Usuario ${userId1} => ${assignmentPlayer1}, Usuario ${userId2} => ${assignmentPlayer2}`);
        }
    
      } catch (error) {
        if (connection) await connection.rollback();
        socket.emit("error", { message: "Error al unirse al grupo de chat. Intenta de nuevo." });
        console.error("Error:", error);
        if (waitingUser && waitingUser.userId === user.id) waitingUser = null;
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
    socket.on("requestRandomSolution", async ({ groupId, levelId }) => {
      try {
        if (groupSolutions[groupId]) {
          console.log(`📡 Reenviando solución existente para grupo ${groupId}`);
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", groupSolutions[groupId]);
          return;
        }
    
        const connection = await pool.getConnection();
    
        const [solutions] = await connection.query(
          `
          SELECT uts.solution_data
          FROM usertangramsolutions uts
          INNER JOIN (
            SELECT user_id, level_id, MAX(average_rating) AS max_rating
            FROM usertangramsolutions
            WHERE level_id < ?
            GROUP BY user_id, level_id
          ) best ON uts.user_id = best.user_id 
                 AND uts.level_id = best.level_id
                 AND uts.average_rating = best.max_rating
          ORDER BY uts.average_rating DESC, uts.total_ratings DESC
          LIMIT 5
          `,
          [levelId]
        );
    
        connection.release();
    
        if (solutions.length > 0) {
          const randomIndex = Math.floor(Math.random() * solutions.length);
          const selectedSolution = solutions[randomIndex].solution_data;
    
          groupSolutions[groupId] = selectedSolution;
    
          console.log(`📡 Asignando nueva solución destacada al grupo ${groupId}:`, selectedSolution);
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", selectedSolution);
        } else {
          console.warn("⚠️ No se encontraron soluciones destacadas disponibles");
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", []);
        }
      } catch (error) {
        console.error("❌ Error obteniendo solución destacada:", error);
      }
    });
    
  });

  return io;
}

module.exports = { initializeSocket };
