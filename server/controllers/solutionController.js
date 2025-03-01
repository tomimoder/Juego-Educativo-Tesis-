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
    try{
        console.log("Datos recibidos", req.body);

        const { userId, levelId, solutionData, description } = req.body;

        if(!userId || !levelId || !solutionData || !description){
            console.log('Faltan datos requeridos:', { userId, levelId, solutionData, description });
            return res.status(400).json({
                message: "Faltan datos requeridos",
                missing: {
                    userId: !userId,
                    levelId: !levelId,
                    solutionData: !solutionData,
                    description: !description
                }
            });
        }
        const [result] = await pool.query(
            'INSERT INTO UserTangramSolutions (user_id, level_id, solution_data, description) VALUES (?, ?, ?, ?)',
            [userId, levelId, JSON.stringify(solutionData), description]
        );
        res.status(201).json({
            message: "Solution saved successfully",
            solutionId: result.insertId
        });

    } catch(error){
        console.log("Error saving solution", error);
        res.status(500).json({ message: "Error saving solution"});
    }
}

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
                uts.average_rating, 
                uts.total_ratings, 
                uts.user_id, 
                COALESCE(u.nombre, 'Desconocido') AS nombre, 
                COALESCE(u.apellido, 'Desconocido') AS apellido
            FROM UserTangramSolutions uts
            LEFT JOIN users u ON uts.user_id = u.id
            ORDER BY uts.average_rating DESC
        `);

        console.log("📌 Datos obtenidos de la base de datos:", ratings);

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
module.exports = {
    getSolution,
    saveUserSolution,
    getLatestSolutions,
    getRandomSolutionFromAll,
    rateSolution,
    checkUserRating,
    getAverageRatings
}