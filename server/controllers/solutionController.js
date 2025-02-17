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
    const  levelId = req.params.levelId;
    const currentUserId = req.params.userId;

    try{
        const [solutions] = await pool.query(
            `SELECT DISTINCT
                UserTangramSolutions.id,
                UserTangramSolutions.solution_data,
                UserTangramSolutions.description,
                UserTangramSolutions.created_at,
                Users.nombre,
                Users.apellido,
                Users.id as user_id
            FROM UserTangramSolutions 
            JOIN Users ON UserTangramSolutions.user_id = Users.id
            WHERE UserTangramSolutions.level_id = ?
            AND UserTangramSolutions.user_id != ?
            AND UserTangramSolutions.id IN (
                SELECT MAX(id)
                FROM UserTangramSolutions
                GROUP BY user_id
            )
            ORDER BY UserTangramSolutions.created_at DESC
            LIMIT 10`,
            [levelId, currentUserId]
        );
        res.json(solutions);
    } catch(error){
        console.log("Error fetching latest solutions", error);
        res.status(500).json({ message: "Error fetching latest solutions"});
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
    getRandomSolutionFromAll
}