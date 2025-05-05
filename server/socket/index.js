// socket/index.js
const { Server } = require('socket.io');
const pool = require('../database');
const cookie = require('cookie');
const { saveMessageInternal } = require('../controllers/messageController');
const shuffle = require('lodash.shuffle');

let waitingUsers = [];
const groupSolutions = {};
const groups = {};

function initializeSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://192.168.7.203:3000',
        'https://magisters.pages.dev',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🛜 Nueva conexión - Socket ID: ${socket.id}`);

    // Obtener la cookie de sesión del usuario
    const cookies = cookie.parse(socket.handshake.headers.cookie || '');
    if (!cookies.userSession) {
      console.log('❌ Usuario no autenticado en WebSocket');
      socket.emit('error', { message: 'Usuario no autenticado en WebSocket' });
      return;
    }

    let user;
    try {
      user = JSON.parse(cookies.userSession);
      if (!user.id) throw new Error('Usuario inválido en la cookie');
    } catch (error) {
      console.error('❌ Error leyendo la cookie:', error);
      socket.emit('error', { message: 'Error en la autenticación del chat' });
      return;
    }

    console.log(`✅ Usuario ${user.id} conectado con Socket ID: ${socket.id}`);

    // Función para emitir la lista de grupos activos
    async function emitGroupsUpdate() {
      let connection;
      try {
        connection = await pool.getConnection();

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

        const groupsData = {};
        groupRows.forEach((row) => {
          if (!groupsData[row.chat_group_id]) {
            groupsData[row.chat_group_id] = {
              chatGroupId: row.chat_group_id,
              users: [],
              status: 'waiting',
            };
          }
          groupsData[row.chat_group_id].users.push({
            userId: row.user_id,
            name: `${row.nombre} ${row.apellido}`,
            nivel_curso: row.nivel_curso,
            current_level_id: row.current_level_id || null,
          });
        });

        Object.values(groupsData).forEach((group) => {
          if (group.users.length === 2) {
            const [user1, user2] = group.users;
            if (user1.current_level_id === user2.current_level_id) {
              group.status = 'connected';
            } else {
              group.status = 'waiting';
              group.waitingDetails =
                user1.current_level_id > user2.current_level_id
                  ? `${user1.name} (Nivel ${user1.current_level_id}) espera a ${user2.name} (Nivel ${user2.current_level_id})`
                  : `${user2.name} (Nivel ${user2.current_level_id}) espera a ${user1.name} (Nivel ${user1.current_level_id})`;
            }
          }
        });

        io.emit('groupsUpdate', Object.values(groupsData));
      } catch (error) {
        console.error('❌ Error emitiendo actualización de grupos:', error);
      } finally {
        if (connection) connection.release();
      }
    }

    // Manejar evento joinChat
    socket.on('joinChat', async () => {
      console.log(`👤 Usuario ${user.id} intentando unirse al chat`);

      let connection;
      try {
        connection = await pool.getConnection();

        const [existingGroup] = await connection.query(
          `SELECT chat_group_id FROM userchatgroups WHERE user_id = ?`,
          [user.id]
        );

        if (existingGroup.length > 0) {
          const chatGroupId = existingGroup[0].chat_group_id;
          socket.join(`chatGroup_${chatGroupId}`);
          socket.emit('chatGroupJoined', { chatGroupId });

           // Obtener el nivel del compañero
          const [members] = await connection.query(`
            SELECT user_id, current_level_id 
            FROM users u
            JOIN userchatgroups ucg ON u.id = ucg.user_id
            WHERE ucg.chat_group_id = ?
          `, [chatGroupId]);

          const partner = members.find((m) => m.user_id !== user.id);
          if (partner) {
            socket.emit('partnerLevelUpdate', { partnerLevel: partner.current_level_id });
          }

          if (!groups[chatGroupId]) {
            groups[chatGroupId] = {
              players: [],
              piecesAssigned: false,
              assignmentsByUser: {},
            };
          }

          let player = groups[chatGroupId].players.find((p) => p.userId === user.id);
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

            io.to(groups[chatGroupId].players[0].socketId).emit('piecesAssignment', { pieces: assignmentPlayer1 });
            io.to(groups[chatGroupId].players[1].socketId).emit('piecesAssignment', { pieces: assignmentPlayer2 });

            console.log(
              `📤 Piezas asignadas (grupo existente): Usuario ${groups[chatGroupId].players[0].userId} => ${assignmentPlayer1}, Usuario ${
                groups[chatGroupId].players[1].userId
              } => ${assignmentPlayer2}`
            );
          } else {
            const player = groups[chatGroupId].players.find((p) => p.userId === user.id);
            if (player) {
              const assigned = groups[chatGroupId].assignmentsByUser[user.id];
              if (assigned) {
                socket.emit('piecesAssignment', { pieces: assigned });
                console.log(`♻️ Piezas reasignadas a ${user.id} tras reconexión:`, assigned);
              } else {
                console.log(`⌛ Usuario ${user.id} ya registrado pero sin piezas asignadas todavía`);
              }
            } else {
              console.log(`❌ Usuario ${user.id} no está en memoria en players del grupo ${chatGroupId}`);
            }
          }

          await emitGroupsUpdate();
          return;
        }

        const [userResult] = await connection.query(`SELECT nivel_curso, nombre, apellido FROM users WHERE id = ?`, [user.id]);

        const userNivelCurso = userResult[0]?.nivel_curso;
        const userName = userResult[0]?.nombre;
        const userLastName = userResult[0]?.apellido;

        if (!userNivelCurso) {
          socket.emit('error', { message: 'Tu usuario no tiene nivel asignado.' });
          return;
        }

        if (waitingUsers.length === 0) {
          waitingUsers.push({
            socket: socket,
            userId: user.id,
            nivel_curso: userNivelCurso,
            waitingSince: new Date(),
            userName: userName + ' ' + userLastName,
          });

          io.emit('waitingUserUpdate', waitingUsers.map((u) => ({
            waitingUserId: u.userId,
            waitingUserName: u.userName,
            nivel_curso: u.nivel_curso,
            waitingSince: u.waitingSince,
          })));

          socket.emit('waiting', { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
          console.log(`⌛ Usuario ${user.id} esperando pareja del nivel ${userNivelCurso}`);
        } else {
          const waitingUser = waitingUsers.find((u) => u.nivel_curso === userNivelCurso);

          if (!waitingUser) {
            waitingUsers.push({
              socket: socket,
              userId: user.id,
              userName: userName + ' ' + userLastName,
              nivel_curso: userNivelCurso,
              waitingSince: new Date(),
            });

            io.emit('waitingUserUpdate', waitingUsers.map((u) => ({
              waitingUserId: u.userId,
              waitingUserName: u.userName,
              nivel_curso: u.nivel_curso,
              waitingSince: u.waitingSince,
            })));

            socket.emit('waiting', { message: `Esperando a otro usuario de ${userNivelCurso} para emparejar...` });
            console.log(`🚫 Usuario ${user.id} no coincide con nivel ${waitingUser?.nivel_curso} del usuario en espera`);
            return;
          }

          const socket1 = waitingUser.socket;
          const socket2 = socket;
          const userId1 = waitingUser.userId;
          const userId2 = user.id;

          waitingUsers = waitingUsers.filter((u) => u.userId !== userId1);

          io.emit('waitingUserUpdate', waitingUsers.map((u) => ({
            waitingUserId: u.userId,
            waitingUserName: u.userName,
            nivel_curso: u.nivel_curso,
            waitingSince: u.waitingSince,
          })));

          const [result] = await connection.query('SELECT MAX(id) as maxId FROM ChatGroups');
          const chatGroupId = (result[0].maxId || 0) + 1;

          await connection.beginTransaction();
          await connection.query('INSERT INTO ChatGroups (id, name) VALUES (?, ?)', [chatGroupId, `Chat Group ${chatGroupId}`]);
          await connection.query(
            'INSERT INTO userchatgroups (chat_group_id, user_id) VALUES (?, ?), (?, ?)',
            [chatGroupId, userId1, chatGroupId, userId2]
          );
          await connection.commit();

          socket1.join(`chatGroup_${chatGroupId}`);
          socket2.join(`chatGroup_${chatGroupId}`);

          socket1.emit('chatGroupJoined', { chatGroupId });
          socket2.emit('chatGroupJoined', { chatGroupId });

          // Obtener el nivel del compañero de cada uno
          socket1.emit('partnerLevelUpdate', { partnerLevel: userNivelCurso }); // socket1 recibe nivel de user (el que recién se conectó)
          socket2.emit('partnerLevelUpdate', { partnerLevel: waitingUser.nivel_curso }); // socket2 recibe nivel del que estaba esperando


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
            },
          };

          io.to(socket1.id).emit('piecesAssignment', { pieces: assignmentPlayer1 });
          io.to(socket2.id).emit('piecesAssignment', { pieces: assignmentPlayer2 });

          console.log(`📤 Piezas asignadas: Usuario ${userId1} => ${assignmentPlayer1}, Usuario ${userId2} => ${assignmentPlayer2}`);

          await emitGroupsUpdate();
        }
      } catch (error) {
        if (connection) await connection.rollback();
        socket.emit('error', { message: 'Error al unirse al grupo de chat. Intenta de nuevo.' });
        console.error('Error:', error);
      } finally {
        if (connection) connection.release();
      }
    });

    // Evento para retransmitir piezas movidas
    socket.on('pieceMoved', async ({ groupId, pieceId, position, rotation }) => {
      let connection;
      try {
        connection = await pool.getConnection();
        // Obtener los niveles actuales de los usuarios en el grupo
        const [groupUsers] = await connection.query(
          `
          SELECT u.id, u.current_level_id
          FROM userchatgroups ucg
          JOIN users u ON ucg.user_id = u.id
          WHERE ucg.chat_group_id = ?
        `,
          [groupId]
        );

        // Verificar que hay dos usuarios y que ambos están en el nivel 2 o 4
        if (groupUsers.length === 2) {
          const [user1, user2] = groupUsers;
          if (
            user1.current_level_id === user2.current_level_id &&
            (user1.current_level_id === 2 || user1.current_level_id === 4)
          ) {
            console.log(`📡 Servidor retransmitiendo: Pieza ${pieceId} en grupo ${groupId}`);
            console.log(`📍 Posición recibida -> x: ${position?.x}, y: ${position?.y}, rotación: ${rotation}`);
            socket.to(`chatGroup_${groupId}`).emit('pieceMoved', { pieceId, position, rotation });
          } else {
            console.log(
              `🚫 Movimiento de pieza bloqueado: Los usuarios no están en el mismo nivel o no están en nivel 2 o 4 (user1: ${user1.current_level_id}, user2: ${user2.current_level_id})`
            );
            socket.emit('error', {
              message: 'No puedes mover piezas porque los niveles no coinciden o no son 2 o 4.',
            });
          }
        } else {
          console.log(`🚫 Movimiento de pieza bloqueado: Grupo ${groupId} no tiene dos usuarios.`);
          socket.emit('error', { message: 'No hay suficientes usuarios en el grupo para mover piezas.' });
        }
      } catch (error) {
        console.error('❌ Error procesando movimiento de pieza:', error);
        socket.emit('error', { message: 'Error procesando el movimiento de la pieza.' });
      } finally {
        if (connection) connection.release();
      }
    });

    // Evento para enviar mensajes en el chat
    socket.on('sendMessage', async ({ chatGroupId, content, userId, nombre, apellido }) => {
      try {
        const messageId = await saveMessageInternal(chatGroupId, userId, content, nombre, apellido);
        const message = { chat_group_id: chatGroupId, userId, content, nombre, apellido, id: messageId };
        io.to(`chatGroup_${chatGroupId}`).emit('newMessage', message);
      } catch (error) {
        console.error('Error enviando mensaje:', error);
        socket.emit('error', { message: 'Error enviando mensaje' });
      }
    });

    // Evento para obtener una solución aleatoria
    socket.on('requestRandomSolution', async ({ groupId, levelId }) => {
      try {
        if (groupSolutions[groupId]) {
          console.log(`📡 Reenviando solución existente para grupo ${groupId}`);
          io.to(`chatGroup_${groupId}`).emit('randomSolutionAssigned', groupSolutions[groupId]);
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
          io.to(`chatGroup_${groupId}`).emit('randomSolutionAssigned', { solution: selectedSolution, description });
        } else {
          console.warn('⚠️ No se encontraron soluciones destacadas disponibles');
          io.to(`chatGroup_${groupId}`).emit('randomSolutionAssigned', { solution: [], description: '' });
        }
      } catch (error) {
        console.error('❌ Error obteniendo solución destacada:', error);
      }
    });

    socket.on('performAction', (data) => {
      const chatGroupId = data.chatGroupId;
      const group = groups[chatGroupId];

      if (group && !group.piecesAssigned) {
        socket.emit('error', { message: 'Aún no se han asignado las piezas. Espera un momento.' });
        return;
      }

      console.log('Acción permitida: Las piezas ya están asignadas.');
    });

    socket.on('updateUserLevel', async ({ userId, levelId }) => {
      let connection;
      try {
        connection = await pool.getConnection();
    
        // Convertir levelId a número
        const numericLevelId = Number(levelId);
    
        // Actualizar el nivel del usuario en la base de datos
        const [updateResult] = await connection.query(
          `UPDATE users SET current_level_id = ? WHERE id = ?`,
          [numericLevelId, userId]
        );
        console.log(`✅ Nivel actualizado para usuario ${userId}: ${numericLevelId}`, {
          rowsAffected: updateResult.affectedRows,
        });
    
        // Verificar que la actualización fue exitosa
        if (updateResult.affectedRows === 0) {
          throw new Error(`No se encontró usuario con id ${userId}`);
        }
    
        // Obtener el grupo de chat del usuario
        const [groupResult] = await connection.query(
          `SELECT chat_group_id FROM userchatgroups WHERE user_id = ?`,
          [userId]
        );
    
        if (groupResult.length > 0) {
          const chatGroupId = groupResult[0].chat_group_id;
    
          // Obtener los miembros del grupo
          const [members] = await connection.query(
            `SELECT user_id FROM userchatgroups WHERE chat_group_id = ? AND user_id != ?`,
            [chatGroupId, userId]
          );
    
          if (members.length > 0) {
            const partnerId = members[0].user_id;
            // Notificar al compañero con el nivel como número
            io.to(`chatGroup_${chatGroupId}`).emit('partnerLevelUpdate', { partnerLevel: numericLevelId });
            console.log(`📤 Notificando a grupo ${chatGroupId} que usuario ${userId} está en nivel ${numericLevelId}`);
          }
    
          // Forzar actualización de grupos
          await emitGroupsUpdate();
          console.log(`🔄 Forzando actualización de grupos tras cambio de nivel para usuario ${userId}`);
        }
      } catch (error) {
        console.error('❌ Error en updateUserLevel:', {
          error: error.message,
          userId,
          levelId,
        });
        socket.emit('error', { message: `Error al actualizar el nivel: ${error.message}` });
      } finally {
        if (connection) connection.release();
      }
    });

    socket.on('disconnect', async () => {
      console.log(`❌ Usuario desconectado - Socket ID: ${socket.id}`);

      const index = waitingUsers.findIndex((u) => u.socket.id === socket.id);

      if (index !== -1) {
        const removedUser = waitingUsers.splice(index, 1)[0];
        io.emit('waitingUserUpdate', waitingUsers.map((u) => ({
          waitingUserId: u.userId,
          waitingUserName: u.userName,
          nivel_curso: u.nivel_curso,
          waitingSince: u.waitingSince,
        })));
        console.log(`⌛ Usuario ${removedUser.userId} ha dejado la lista de espera`);
      }

      await emitGroupsUpdate();
    });

    setInterval(emitGroupsUpdate, 10000);
  });

  return io;
}

module.exports = { initializeSocket };