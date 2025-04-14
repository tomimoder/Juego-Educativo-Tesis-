const { Server } = require("socket.io");
const pool = require("../database");
const cookie = require("cookie");

let waitingUsers = [];
const groupSolutions = {};
const groups = {};
const shuffle = require('lodash.shuffle');

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://192.168.7.203:3000',
        'https://magisters.pages.dev'
      ],
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
      if (!user.id) throw new Error("Usuario invalido en la cookie");
    } catch (error) {
      console.error("❌ Error leyendo la cookie:", error);
      socket.emit("error", { message: "Error en la autenticación del chat" });
      return;
    }

    console.log(`✅ Usuario ${user.id} conectado con Socket ID: ${socket.id}`);

    // 🔹 Función para emitir la lista de grupos activos
    async function emitGroupsUpdate() {
      let connection;
      try {
        connection = await pool.getConnection();

        // Obtener todos los grupos y sus usuarios
        const [groupRows] = await connection.query(`
          SELECT 
            ucg.chat_group_id, 
            ucg.user_id,
            u.nombre, 
            u.apellido, 
            u.nivel_curso,
            u.current_level_id
          FROM userchatgroups ucg
          JOIN users u ON ucg.user_id = u.id
        `);

        // Organizar los datos por grupo
        const groupsData = {};
        groupRows.forEach(row => {
          if (!groupsData[row.chat_group_id]) {
            groupsData[row.chat_group_id] = {
              chatGroupId: row.chat_group_id,
              users: [],
              status: "waiting"
            };
          }
          groupsData[row.chat_group_id].users.push({
            userId: row.user_id,
            name: `${row.nombre} ${row.apellido}`,
            nivel_curso: row.nivel_curso,
            current_level_id: row.current_level_id || null
          });
        });

        // Determinar el estado del grupo
        Object.values(groupsData).forEach(group => {
          if (group.users.length === 2) {
            const [user1, user2] = group.users;
            if (user1.current_level_id === user2.current_level_id) {
              group.status = "connected";
            } else {
              group.status = "waiting";
              // Identificar quién espera a quién
              if (user1.current_level_id > user2.current_level_id) {
                group.waitingDetails = `${user1.name} (Nivel ${user1.current_level_id}) espera a ${user2.name} (Nivel ${user2.current_level_id})`;
              } else {
                group.waitingDetails = `${user2.name} (Nivel ${user2.current_level_id}) espera a ${user1.name} (Nivel ${user1.current_level_id})`;
              }
            }
          }
        });

        // Emitir la lista de grupos a todos los clientes
        io.emit("groupsUpdate", Object.values(groupsData));
      } catch (error) {
        console.error("❌ Error emitiendo actualización de grupos:", error);
      } finally {
        if (connection) connection.release();
      }
    }

    // 🔹 Manejar evento `joinChat`
    socket.on("joinChat", async () => {
      console.log(`👤 Usuario ${user.id} intentando unirse al chat`);

      let connection;
      try {
        connection = await pool.getConnection();

        const [existingGroup] = await connection.query(
          `SELECT chat_group_id FROM userchatgroups WHERE user_id = ?`, [user.id]
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
              assignmentsByUser: {}
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

            groups[chatGroupId].assignmentsByUser[groups[chatGroupId].players[0].userId] = assignmentPlayer1;
            groups[chatGroupId].assignmentsByUser[groups[chatGroupId].players[1].userId] = assignmentPlayer2;

            groups[chatGroupId].piecesAssigned = true;

            io.to(groups[chatGroupId].players[0].socketId).emit("piecesAssignment", { pieces: assignmentPlayer1 });
            io.to(groups[chatGroupId].players[1].socketId).emit("piecesAssignment", { pieces: assignmentPlayer2 });

            console.log(`📤 Piezas asignadas (grupo existente): Usuario ${groups[chatGroupId].players[0].userId} => ${assignmentPlayer1}, Usuario ${groups[chatGroupId].players[1].userId} => ${assignmentPlayer2}`);
          } else {
            const player = groups[chatGroupId].players.find(p => p.userId === user.id);
            if (player) {
              const assigned = groups[chatGroupId].assignmentsByUser[user.id];

              if (assigned) {
                socket.emit("piecesAssignment", { pieces: assigned });
                console.log((`♻️ Piezas reasignadas a ${user.id} tras reconexión:`, assigned));
              } else {
                console.log(`⌛ Usuario ${user.id} ya registrado pero sin piezas asignadas todavía`);
              }
            } else {
              console.log(`❌ Usuario ${user.id} no está en memoria en players del grupo ${chatGroupId}`);
            }
          }

          // Emitir actualización de grupos después de unirse
          await emitGroupsUpdate();
          return;
        }

        // Obtener nivel_curso del usuario actual
        const [userResult] = await connection.query(
          `SELECT nivel_curso, nombre, apellido FROM users WHERE id = ?`, [user.id]
        );

        const userNivelCurso = userResult[0]?.nivel_curso;
        const userName = userResult[0]?.nombre;
        const userLastName = userResult[0]?.apellido;

        if (!userNivelCurso) {
          socket.emit("error", { message: "Tu usuario no tiene nivel asignado." });
          return;
        }

        // Si no hay usuarios en espera, el usuario se coloca en espera
        if (waitingUsers.length === 0) {
          waitingUsers.push({
            socket: socket,
            userId: user.id,
            nivel_curso: userNivelCurso,
            waitingSince: new Date(),
            userName: userName + ' ' + userLastName
          });

          io.emit("waitingUserUpdate", waitingUsers.map(u => ({
            waitingUserId: u.userId,
            waitingUserName: u.userName,
            nivel_curso: u.nivel_curso,
            waitingSince: u.waitingSince,
          })));

          socket.emit("waiting", { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
          console.log(`⌛ Usuario ${user.id} esperando pareja del nivel ${userNivelCurso}`);
        } else {
          // Verificar que el usuario actual y waitingUsers tengan el mismo nivel_curso
          const waitingUser = waitingUsers.find(u => u.nivel_curso === userNivelCurso);

          if (!waitingUser) {
            waitingUsers.push({
              socket: socket,
              userId: user.id,
              userName: userName + ' ' + userLastName,
              nivel_curso: userNivelCurso,
              waitingSince: new Date()
            });

            io.emit("waitingUserUpdate", waitingUsers.map(u => ({
              waitingUserId: u.userId,
              waitingUserName: u.userName,
              nivel_curso: u.nivel_curso,
              waitingSince: u.waitingSince
            })));

            socket.emit("waiting", { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
            console.log(`🚫 Usuario ${user.id} no coincide con nivel ${waitingUser.nivel_curso} del usuario en espera`);
            return;
          }

          // Emparejar usuario con el primero de la lista
          const socket1 = waitingUser.socket;
          const socket2 = socket;
          const userId1 = waitingUser.userId;
          const userId2 = user.id;

          // Eliminar al usuario de la lista de espera
          waitingUsers = waitingUsers.filter(u => u.userId !== userId1);

          io.emit("waitingUserUpdate", waitingUsers.map(u => ({
            waitingUserId: u.userId,
            waitingUserName: u.userName,
            nivel_curso: u.nivel_curso,
            waitingSince: u.waitingSince
          })));

          // Crear grupo de chat y asignar piezas
          const [result] = await connection.query("SELECT MAX(id) as maxId FROM ChatGroups");
          const chatGroupId = (result[0].maxId || 0) + 1;

          await connection.beginTransaction();
          await connection.query("INSERT INTO ChatGroups (id, name) VALUES (?, ?)", [chatGroupId, `Chat Group ${chatGroupId}`]);
          await connection.query(
            "INSERT INTO userchatgroups (chat_group_id, user_id) VALUES (?, ?), (?, ?)",
            [chatGroupId, userId1, chatGroupId, userId2]
          );
          await connection.commit();

          // Unir sockets a la sala
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

          // Emitir actualización de grupos después de crear uno nuevo
          await emitGroupsUpdate();
        }

      } catch (error) {
        if (connection) await connection.rollback();
        socket.emit("error", { message: "Error al unirse al grupo de chat. Intenta de nuevo." });
        console.error("Error:", error);
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

      // Validar si el grupo existe y tiene a los dos jugadores conectados
      const group = groups[chatGroupId];
      if (!group || group.players.length < 2) {
        socket.emit("error", { message: "No puedes enviar mensajes hasta que tu compañero se conecte, por favor cuando puedas mover las piezas reinica para poder hablar." });
        return;
      }

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
    socket.on("disconnect", async () => {
      console.log(`❌ Usuario desconectado - Socket ID: ${socket.id}`);

      // Buscar al usuario desconectado en la lista de waitingUsers
      const index = waitingUsers.findIndex(u => u.socket.id === socket.id);

      if (index !== -1) {
        // Eliminar al usuario de la lista de espera
        const removedUser = waitingUsers.splice(index, 1)[0];

        // Emitir la lista actualizada de usuarios en espera
        io.emit("waitingUserUpdate", waitingUsers.map(u => ({
          waitingUserId: u.userId,
          waitingUserName: u.userName,
          nivel_curso: u.nivel_curso,
          waitingSince: u.waitingSince,
        })));

        console.log(`⌛ Usuario ${removedUser.userId} ha dejado la lista de espera`);
      }

      // Emitir actualización de grupos después de la desconexión
      await emitGroupsUpdate();
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
          SELECT uts.solution_data, uts.description
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
          const description = solutions[randomIndex].description;

          groupSolutions[groupId] = { solution: selectedSolution, description };

          console.log(`📡 Asignando nueva solución destacada al grupo ${groupId}:`, selectedSolution);
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", { solution: selectedSolution, description });
        } else {
          console.warn("⚠️ No se encontraron soluciones destacadas disponibles");
          io.to(`chatGroup_${groupId}`).emit("randomSolutionAssigned", { solution: [], description: "" });
        }
      } catch (error) {
        console.error("❌ Error obteniendo solución destacada:", error);
      }
    });

    socket.on("performAction", (data) => {
      const chatGroupId = data.chatGroupId;

      // Verifica si el grupo existe y si las piezas han sido asignadas
      const group = groups[chatGroupId];

      if (group && !group.piecesAssigned) {
        // Si las piezas no han sido asignadas, envía un mensaje de error
        socket.emit("error", { message: "Aún no se han asignado las piezas. Espera un momento." });
        return;
      }

      // Si las piezas han sido asignadas, continúa con la acción deseada
      console.log("Acción permitida: Las piezas ya están asignadas.");
    });

    // Actualizar periódicamente la lista de grupos
    setInterval(emitGroupsUpdate, 10000);
  });

  return io;
}

module.exports = { initializeSocket };