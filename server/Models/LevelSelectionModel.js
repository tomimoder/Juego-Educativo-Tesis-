const express = require("express");
const router = express.Router();
const mysql = require("mysql");

// Conexión a la base de datos
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    database: "Test-Game"
});

db.connect((err) => {
    if (err) {
        console.error("Error al conectar a la base de datos:", err);
    } else {
        console.log("Conexión a la base de datos establecida desde LevelSelectionModel.js");
    }
});

// Obtener todos los niveles con progreso del usuario
router.get("/progress/:userId", (req, res) => {
    const userId = req.params.userId;
    const query = `
        SELECT 
            l.id, 
            l.name, 
            l.description,
            l.instructions,
            l.image_url,
            l.time_limit,
            l.difficulty,
            CASE 
                WHEN l.id = 1 THEN true
                ELSE COALESCE(up.is_unlocked, false)
            END as is_unlocked,
            COALESCE(up.stars, 0) as stars
        FROM 
            Levels l
        LEFT JOIN 
            UserProgress up ON l.id = up.level_id AND up.user_id = ?
        ORDER BY 
            l.id
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching levels with progress:', err);
            return res.status(500).json({ error: "Error al obtener los niveles" });
        }
        const levels = results.map(row => ({
            level: row.id,
            name: row.name,
            description: row.description,
            instructions: row.instructions,
            imageUrl: row.image_url,
            timeLimit: row.time_limit,
            difficulty: row.difficulty,
            unlocked: row.is_unlocked === 1,
            stars: row.stars
        }));
        res.json(levels);
    });
});

// Desbloquear el siguiente nivel
router.post("/unlock", (req, res) => {
    const { userId, currentLevelId } = req.body;

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: "Error al desbloquear el siguiente nivel" });
        }

        // Actualizar el progreso del nivel actual
        const updateCurrentQuery = `
            INSERT INTO UserProgress (user_id, level_id, is_unlocked, stars)
            VALUES (?, ?, true, 0)
            ON DUPLICATE KEY UPDATE is_unlocked = true
        `;
        db.query(updateCurrentQuery, [userId, currentLevelId], (err) => {
            if (err) {
                return db.rollback(() => {
                    console.error('Error updating current level:', err);
                    res.status(500).json({ error: "Error al actualizar el nivel actual" });
                });
            }

            // Desbloquear el siguiente nivel
            const nextLevelId = currentLevelId + 1;
            const unlockNextQuery = `
                INSERT INTO UserProgress (user_id, level_id, is_unlocked, stars)
                SELECT ?, ?, true, 0
                FROM Levels
                WHERE id = ?
                ON DUPLICATE KEY UPDATE is_unlocked = true
            `;
            db.query(unlockNextQuery, [userId, nextLevelId, nextLevelId], (err) => {
                if (err) {
                    return db.rollback(() => {
                        console.error('Error unlocking next level:', err);
                        res.status(500).json({ error: "Error al desbloquear el siguiente nivel" });
                    });
                }

                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            console.error('Error committing transaction:', err);
                            res.status(500).json({ error: "Error al finalizar la transacción" });
                        });
                    }
                    res.json({ success: true });
                });
            });
        });
    });
});

// Actualizar el progreso de un nivel
router.post("/updateProgress", (req, res) => {
    const { userId, levelId, stars } = req.body;
    const query = `
        INSERT INTO UserProgress (user_id, level_id, is_unlocked, stars)
        VALUES (?, ?, true, ?)
        ON DUPLICATE KEY UPDATE 
            is_unlocked = true,
            stars = GREATEST(stars, ?)
    `;
    db.query(query, [userId, levelId, stars, stars], (err) => {
        if (err) {
            console.error('Error updating level progress:', err);
            return res.status(500).json({ error: "Error al actualizar el progreso del nivel" });
        }
        res.json({ success: true });
    });
});

module.exports = router;