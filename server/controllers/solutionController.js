const pool = require('../database');

const getSolution = async (req, res) =>{
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
        console.log("error fetching solutions:", error);
        res.status(500).json({ message: "Error fetching solutions"});
    }
};

module.exports = {getSolution};