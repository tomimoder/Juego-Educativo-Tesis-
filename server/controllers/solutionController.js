const pool = require('../database');

const getSolution = async (req, res) => {
    const levelId = req.params.levelId;

    try{
         const [solutions] = await pool.query(
            'SELECT nombre_figura, coordenadas, orientacion FROM TangramSolutions WHERE nivel_id = ?',
            [levelId]
         );
         if(solutions.length === 0){
            return res.status(404).json({ message: "No solution found for this level"});
         }

         res.json(solutions);
    } catch(error){
        console.log("error fetching solution", error);
        res,statys(500).json({ message: "Error fetching solution"});
    }
};

const saveUserSolution = async (req, res) => {
    try {
      const { userId, levelId, solutionData, description, description_details, startTime } = req.body;
  
      if (!userId || !levelId || !solutionData || !description || !description_details || !startTime) {
        return res.status(400).json({ message: 'Faltan datos requeridos' });
      }
  
      const start = new Date(startTime);
      const end = new Date();
      const timeSpent = Math.round((end - start) / 1000); // Tiempo en segundos
  
      const [result] = await pool.query(
        'INSERT INTO usertangramsolutions (user_id, level_id, solution_data, description, description_details) VALUES (?, ?, ?, ?, ?)',
        [userId, levelId, JSON.stringify(solutionData), description, description_details]
      );
  
      // Registrar log
      await logAction(userId, 'SAVE_SOLUTION', {
        levelId,
        solutionId: result.insertId,
        description,
        description_details,
        timeSpent,
        timestamp: end.toISOString(),
      });
  
      // Asignar usuarios
      try {
        await assignUsersToSolution(result.insertId, userId);
      } catch (assignmentError) {
        console.warn('Advertencia: No se asignaron usuarios automáticamente', assignmentError.message);
      }
  
      res.status(201).json({
        message: 'Solution saved successfully',
        solutionId: result.insertId,
      });
    } catch (error) {
      console.error('Error saving solution:', error);
      res.status(500).json({ message: 'Error saving solution' });
    }
  };


const getLatestSolutions = async (req, res) => {
    const levelId = req.params.levelId;
    const currentUserId = req.query.userId;
    
    try {
        // Obtener solo la última solución de cada usuario
        const [solutions] = await pool.query(
            `SELECT DISTINCT
                ut.*,
                users.nombre,
                users.apellido
            FROM usertangramsolutions ut
            INNER JOIN (
                SELECT user_id, MAX(created_at) as max_date
                FROM usertangramsolutions
                WHERE level_id = ?
                GROUP BY user_id
            ) latest ON ut.user_id = latest.user_id 
                     AND ut.created_at = latest.max_date
            JOIN users ON ut.user_id = users.id
            WHERE ut.level_id = ?
                AND ut.user_id != ?
            ORDER BY ut.created_at DESC`,
            [levelId, levelId, currentUserId]
        );
        
        res.json({
            solutions,
            total: solutions.length
        });
    } catch (error) {
        console.error("Error fetching solutions:", error);
        res.status(500).json({ message: "Error fetching solutions" });
    }
};


const rateSolution = async (req, res) => {
    const { solutionId, userId, rating, comment } = req.body;
  
    try {
      await pool.query('START TRANSACTION');
  
      await pool.query(
        `INSERT INTO solutionratings (solution_id, user_id, rating, comment)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = ?, comment = ?`,
        [solutionId, userId, rating, comment, rating, comment]
      );
  
      const [ratings] = await pool.query(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total
         FROM solutionratings
         WHERE solution_id = ?`,
        [solutionId]
      );
  
      await pool.query(
        `UPDATE usertangramsolutions 
         SET average_rating = ?, total_ratings = ?
         WHERE id = ?`,
        [ratings[0].avg_rating, ratings[0].total, solutionId]
      );
  
      // Registrar log
      await logAction(userId, 'RATE_SOLUTION', {
        solutionId,
        rating,
        comment,
        timestamp: new Date().toISOString(),
      });
  
      await pool.query('COMMIT');
  
      res.json({
        message: 'Rating saved successfully',
        newAverage: ratings[0].avg_rating,
        totalRatings: ratings[0].total,
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      console.error('Error saving rating:', error);
      res.status(500).json({ message: 'Error saving rating' });
    }
  };

const checkUserRating = async (req, res) => {
    const { solutionId, userId } = req.params;
    
    try {
        const [rating] = await pool.query(
            'SELECT * FROM solutionratings WHERE solution_id = ? AND user_id = ?',
            [solutionId, userId]
        );
        
        res.json({ hasRated: rating.length > 0 });
    } catch (error) {
        console.error("Error checking rating:", error);
        res.status(500).json({ message: "Error checking rating" });
    }
};

const getAverageRatings = async (req, res) => {
    try {
      console.log("🔍 getAverageRatings: La función ha sido llamada");
  
      const [ratings] = await pool.query(`
        SELECT 
          u.id AS user_id,
          COALESCE(u.nombre, 'Desconocido') AS nombre,
          COALESCE(u.apellido, '') AS apellido,
          ROUND(AVG(uts.average_rating), 2) AS average_rating,
          SUM(uts.total_ratings) AS total_ratings
        FROM usertangramsolutions uts
        INNER JOIN (
            SELECT user_id, level_id, MAX(created_at) AS latest
            FROM usertangramsolutions
            GROUP BY user_id, level_id
        ) latest_per_level
        ON uts.user_id = latest_per_level.user_id 
           AND uts.level_id = latest_per_level.level_id
           AND uts.created_at = latest_per_level.latest
        INNER JOIN users u ON uts.user_id = u.id
        GROUP BY uts.user_id
        ORDER BY average_rating DESC
      `);
  
      console.log("📌 Ratings por usuario:", ratings);
  
      res.json({ ratings });
    } catch (error) {
      console.error("❌ Error fetching average ratings:", error);
      res.status(500).json({ message: "Error fetching average ratings" });
    }
  };
  





const getRandomSolutionFromAll = async (req, res) => {
    try {
        const [solutions] = await pool.query(
            `SELECT solution_data FROM usertangramsolutions`
        );

        if (solutions.length === 0) {
            return res.status(404).json({ message: "No solutions found in the database" });
        }

        // Selecciona una solución aleatoria
        const randomIndex = Math.floor(Math.random() * solutions.length);
        const randomSolution = solutions[randomIndex];

        res.json(randomSolution); // Devuelve la solución aleatoria
    } catch (error) {
        console.error("Error fetching random solution from all:", error);
        res.status(500).json({ message: "Error fetching random solution from all" });
    }
};

const getBestSolutions = async (req, res) => {
    const levelId = req.params.levelId;
    const limit = parseInt(req.query.limit) || 7;

    try {
        const [solutions] = await pool.query(
            `
            SELECT uts.*, u.nombre, u.apellido
            FROM usertangramsolutions uts
            INNER JOIN (
                SELECT user_id, level_id, MAX(average_rating) AS max_rating
                FROM usertangramsolutions
                WHERE level_id = ?
                GROUP BY user_id, level_id
            ) best ON uts.user_id = best.user_id 
                   AND uts.level_id = best.level_id
                   AND uts.average_rating = best.max_rating
            INNER JOIN users u ON uts.user_id = u.id
            ORDER BY uts.average_rating DESC, uts.total_ratings DESC
            LIMIT ?
            `,
            [levelId, limit]
        );

        res.json({
            solutions,
            total: solutions.length
        });
    } catch (error) {
        console.error("Error fetching best solutions:", error);
        res.status(500).json({ message: "Error fetching best solutions" });
    }
};

const getAssignmentsForSolution = async (req, res) => {
    const solutionId = req.params.solutionId;

    try {
        const [assignments] = await pool.query(
            `SELECT sa.*, u.nombre, u.apellido 
             FROM solutionassignments sa 
             JOIN users u ON sa.user_id = u.id 
             WHERE sa.solution_id = ?`,
            [solutionId]
        );

        res.json({ assignments });
    } catch (error) {
        console.error("Error fetching assignments:", error);
        res.status(500).json({ message: "Error fetching assignments" });
    }
};

const assignUsersToSolution = async (solutionId, authorUserId, numAssignments = 3) => {
    try {
        // Primero obtener nivel_curso del autor de la solución
        const [authorRows] = await pool.query('SELECT nivel_curso FROM users WHERE id = ?', [authorUserId]);
        const authorNivelCurso = authorRows[0]?.nivel_curso;

        if (!authorNivelCurso) {
            throw new Error('El autor no tiene un nivel de curso definido.');
        }

        // Obtener información de la solución para determinar si es colaborativa
        const [solutionRows] = await pool.query('SELECT level_id FROM usertangramsolutions WHERE id = ?', [solutionId]);
        const levelId = solutionRows[0]?.level_id;

        if (!levelId) {
            throw new Error('No se encontró información del nivel de la solución.');
        }

        // Determinar qué usuarios excluir
        let excludedUserIds = [authorUserId]; // Siempre excluir al autor

        // Si es un nivel colaborativo (4 o 5), excluir también al compañero
        if (levelId === 4 || levelId === 5) {
            const [partnerRows] = await pool.query(
                `SELECT ucg2.user_id as partner_id
                 FROM userchatgroups ucg1
                 JOIN userchatgroups ucg2 ON ucg1.chat_group_id = ucg2.chat_group_id
                 WHERE ucg1.user_id = ? AND ucg2.user_id != ?`,
                [authorUserId, authorUserId]
            );

            if (partnerRows.length > 0) {
                excludedUserIds.push(partnerRows[0].partner_id);
                console.log(`🔒 Nivel colaborativo detectado. Excluyendo al autor ${authorUserId} y su compañero ${partnerRows[0].partner_id}`);
            } else {
                console.warn(`⚠️ No se encontró compañero para el usuario ${authorUserId} en nivel colaborativo ${levelId}`);
            }
        }

        // Crear la condición de exclusión para la consulta
        const excludePlaceholders = excludedUserIds.map(() => '?').join(',');
        
        // Seleccionar usuarios disponibles excluyendo a todos los usuarios de la pareja
        const [availableUsers] = await pool.query(
            `SELECT id, nombre, apellido 
             FROM users 
             WHERE id NOT IN (${excludePlaceholders}) 
               AND status = ? 
               AND nivel_curso = ?`,
            [...excludedUserIds, 'playing', authorNivelCurso]
        );

        if (availableUsers.length === 0) {
            throw new Error(`No hay usuarios en estado "playing" del nivel "${authorNivelCurso}" disponibles para asignar (excluyendo ${levelId === 4 || levelId === 5 ? 'pareja colaborativa' : 'autor'}).`);
        }

        const assignmentsCount = Math.min(numAssignments, availableUsers.length);
        const shuffledUsers = availableUsers.sort(() => 0.5 - Math.random());
        const selectedUsers = shuffledUsers.slice(0, assignmentsCount);

        const assignments = selectedUsers.map(user => [solutionId, user.id]);

        await pool.query(
            'INSERT INTO solutionassignments (solution_id, user_id) VALUES ?',
            [assignments]
        );

        console.log(`✅ Solución #${solutionId} (Nivel ${levelId}) asignada automáticamente a usuarios del curso ${authorNivelCurso}:`);
        console.log(`🔒 Usuarios excluidos: ${excludedUserIds.join(', ')} ${levelId === 4 || levelId === 5 ? '(pareja colaborativa)' : '(autor)'}`);
        selectedUsers.forEach(user => {
            console.log(`→ Usuario ID: ${user.id}, Nombre: ${user.nombre} ${user.apellido}`);
        });

        return selectedUsers;
    } catch (error) {
        console.error("❌ Error asignando usuarios a solución:", error);
        throw error;
    }
};

const getAssignedSolutions = async (req, res) => {
    const { levelId, userId } = req.params;

    try {
        const [solutions] = await pool.query(
            `
            SELECT uts.*, u.nombre, u.apellido
            FROM usertangramsolutions uts
            INNER JOIN (
                SELECT uts.user_id, MAX(uts.created_at) AS latest_date
                FROM usertangramsolutions uts
                INNER JOIN solutionassignments sa ON sa.solution_id = uts.id
                WHERE sa.user_id = ? AND uts.level_id = ?
                GROUP BY uts.user_id
            ) AS latest_solutions
            ON uts.user_id = latest_solutions.user_id AND uts.created_at = latest_solutions.latest_date
            INNER JOIN users u ON uts.user_id = u.id
            WHERE uts.level_id = ?
            `,
            [userId, levelId, levelId]
        );

        res.json({ solutions });
    } catch (error) {
        console.error("❌ Error obteniendo últimas soluciones asignadas:", error);
        res.status(500).json({ message: "Error obteniendo soluciones asignadas" });
    }
};

//Funcion para registrar logs
const logAction = async (userId, action, details) => {
    try{
        await pool.query(
            'INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)',
            [userId, action, JSON.stringify(details)]
        );
        console.log(`✅ Log registrado: userId=${userId}, action=${action}`);
    } catch(error){
        console.error('❌ Error registrando log:', error);
    }
};


const logPieceMovement = async (req, res) => {
    try{
        const { userId, levelId, pieceId, position, rotation } = req.body;

        if (!userId || !levelId || !pieceId || !position || rotation === undefined){
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        await logAction(userId, 'MOVE_PIECE', {
            levelId,
            pieceId,
            position,
            rotation,
            timestamp: new Date().toISOString(),
        });

        res.status(200).json({ message: "Movimiento registrado" });
    } catch(error){
        console.error("Error registrando movimiento de pieza:", error);
        res.status(500).json({ message: "Error registrando movimiento de pieza" });
    }
};

const logLevelStart = async (req, res) => {
    try{
        const {userId, levelId} = req.body;

        if(!userId || !levelId){
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        await logAction(userId, 'START_LEVEL', {
            levelId,
            timestamp: new Date().toISOString(),
          });

        res.status(200).json({ message: "Inicio de nivel registrado" });
    } catch(error){
        console.error("Error registrando inicio de nivel:", error);
        res.status(500).json({ message: "Error registrando inicio de nivel" });
    }
};

const getMoveCount = async (req, res) => {
    try{
        const {userId, levelId} = req.body;

        if(!userId){
            return res.status(400).json({ message: "Faltan userId" });
        }

        let query = 'SELECT COUNT(*) as count FROM logs WHERE user_id = ? AND action = "MOVE_PIECE"';
        let params = [userId];

        if (levelId){
            query += ' AND JSON_EXTRACT(details, "$.levelId") = ?';
            params.push(levelId);
        }

        const [result] = await pool.query(query, params);

        res.json({ moveCount: result[0].count });
    } catch (error){
        console.error('Error contando movimientos:', error);
        res.status(500).json({ message: 'Error contando movimientos' });
    }
};





module.exports = {
    getSolution,
    saveUserSolution,
    getLatestSolutions,
    getRandomSolutionFromAll,
    rateSolution,
    checkUserRating,
    getAverageRatings,
    getBestSolutions,
    getAssignmentsForSolution,
    assignUsersToSolution,
    getAssignedSolutions,
    logAction,
    logPieceMovement,
    logLevelStart,
    getMoveCount
}