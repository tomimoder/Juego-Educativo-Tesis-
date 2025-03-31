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
        const { userId, levelId, solutionData, description } = req.body;

        if (!userId || !levelId || !solutionData || !description) {
            return res.status(400).json({ message: "Faltan datos requeridos" });
        }

        const [result] = await pool.query(
            'INSERT INTO UserTangramSolutions (user_id, level_id, solution_data, description) VALUES (?, ?, ?, ?)',
            [userId, levelId, JSON.stringify(solutionData), description]
        );

        // Aquí asignas usuarios
        try {
            await assignUsersToSolution(result.insertId, userId);
        } catch (assignmentError) {
            console.warn("Advertencia: No se asignaron usuarios automáticamente", assignmentError.message);
        }

        res.status(201).json({
            message: "Solution saved successfully",
            solutionId: result.insertId
        });

    } catch (error) {
        console.error("Error saving solution:", error);
        res.status(500).json({ message: "Error saving solution" });
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
                Users.nombre,
                Users.apellido
            FROM UserTangramSolutions ut
            INNER JOIN (
                SELECT user_id, MAX(created_at) as max_date
                FROM UserTangramSolutions
                WHERE level_id = ?
                GROUP BY user_id
            ) latest ON ut.user_id = latest.user_id 
                     AND ut.created_at = latest.max_date
            JOIN Users ON ut.user_id = Users.id
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
            `INSERT INTO SolutionRatings (solution_id, user_id, rating, comment)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE rating = ?, comment = ?`,
            [solutionId, userId, rating, comment, rating, comment]
        );

        const [ratings] = await pool.query(
            `SELECT AVG(rating) as avg_rating, COUNT(*) as total
             FROM SolutionRatings
             WHERE solution_id = ?`,
            [solutionId]
        );

        await pool.query(
            `UPDATE UserTangramSolutions 
             SET average_rating = ?, total_ratings = ?
             WHERE id = ?`,
            [ratings[0].avg_rating, ratings[0].total, solutionId]
        );

        await pool.query('COMMIT');

        res.json({
            message: "Rating saved successfully",
            newAverage: ratings[0].avg_rating,
            totalRatings: ratings[0].total
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        console.error("Error saving rating:", error);
        res.status(500).json({ message: "Error saving rating" });
    }
};

const checkUserRating = async (req, res) => {
    const { solutionId, userId } = req.params;
    
    try {
        const [rating] = await pool.query(
            'SELECT * FROM SolutionRatings WHERE solution_id = ? AND user_id = ?',
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
        FROM UserTangramSolutions uts
        INNER JOIN (
            SELECT user_id, level_id, MAX(created_at) AS latest
            FROM UserTangramSolutions
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
            `SELECT solution_data FROM UserTangramSolutions`
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
            FROM UserTangramSolutions uts
            INNER JOIN (
                SELECT user_id, level_id, MAX(average_rating) AS max_rating
                FROM UserTangramSolutions
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
             FROM SolutionAssignments sa 
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

        // Ahora seleccionar solo usuarios del mismo nivel_curso, estado "playing" y distintos al autor
        const [availableUsers] = await pool.query(
            'SELECT id, nombre, apellido FROM users WHERE id != ? AND status = ? AND nivel_curso = ?',
            [authorUserId, 'playing', authorNivelCurso]
        );

        if (availableUsers.length === 0) {
            throw new Error(`No hay usuarios en estado "playing" del nivel "${authorNivelCurso}" para asignar.`);
        }

        const assignmentsCount = Math.min(numAssignments, availableUsers.length);
        const shuffledUsers = availableUsers.sort(() => 0.5 - Math.random());
        const selectedUsers = shuffledUsers.slice(0, assignmentsCount);

        const assignments = selectedUsers.map(user => [solutionId, user.id]);

        await pool.query(
            'INSERT INTO SolutionAssignments (solution_id, user_id) VALUES ?',
            [assignments]
        );

        console.log(`✅ Solución #${solutionId} asignada automáticamente a usuarios del curso ${authorNivelCurso}:`);
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
            FROM UserTangramSolutions uts
            INNER JOIN (
                SELECT uts.user_id, MAX(uts.created_at) AS latest_date
                FROM UserTangramSolutions uts
                INNER JOIN SolutionAssignments sa ON sa.solution_id = uts.id
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
    getAssignedSolutions
}