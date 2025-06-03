const pool = require('../database');
const { logAction } = require('./solutionController');

const voteAlternative = async (req, res) => {
  const { solutionId, userId, word, level } = req.body;

  if (!solutionId || !userId || !word || !level) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    let existing;
    if (level === '3') {
      // Verificar voto en tabla nivel 3
      [existing] = await pool.query(
        'SELECT * FROM solution_alternative_votes_level3 WHERE solution_id = ? AND user_id = ?',
        [solutionId, userId]
      );
    } else {
      // Verificar voto en tabla general
      [existing] = await pool.query(
        'SELECT * FROM solution_alternative_votes WHERE solution_id = ? AND user_id = ?',
        [solutionId, userId]
      );
    }

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya has votado en esta solución' });
    }

    // Insertar voto en la tabla correspondiente
    if (level === '3') {
      await pool.query(
        'INSERT INTO solution_alternative_votes_level3 (solution_id, user_id, word) VALUES (?, ?, ?)',
        [solutionId, userId, word]
      );
    } else {
      await pool.query(
        'INSERT INTO solution_alternative_votes (solution_id, user_id, word) VALUES (?, ?, ?)',
        [solutionId, userId, word]
      );
    }

    // Aquí puedes llamar al logAction si quieres, igual para ambos casos
    await logAction(userId, 'VOTE_ALTERNATIVE', {
      solutionId,
      word,
      level,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Voto registrado' });
  } catch (error) {
    console.error('Error votando por alternativa:', error);
    res.status(500).json({ message: 'Error registrando voto' });
  }
};



const saveLevel3Response = async (req, res) => {
  try {
    const {
      usuario_id,
      figura,
      alternativa1,
      alternativa2,
      justificacion,
      coordenadas
    } = req.body;

    if (!usuario_id || !figura || !alternativa1 || !coordenadas) {
      return res.status(400).json({ message: "Faltan datos requeridos en el cuerpo de la solicitud." });
    }

    // Insertar la solución en la tabla respuestas
    const [result] = await pool.query(`
      INSERT INTO respuestas (usuario_id, figura, alternativa1, alternativa2, justificacion, coordenadas, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      usuario_id,
      figura,
      alternativa1,
      alternativa2 || '',
      justificacion || '',
      JSON.stringify(coordenadas)
    ]);

    // Asignar la solución a tres usuarios distintos
    try {
      // Obtener tres usuarios distintos al creador de la respuesta
      const [users] = await pool.query(`
        SELECT id FROM users
        WHERE id != ?
        ORDER BY RAND()
        LIMIT 3
      `, [usuario_id]);

      if (users.length < 3) {
        throw new Error("No hay suficientes usuarios disponibles para asignar la solución.");
      }

      // Asignar la solución a cada usuario
      for (const user of users) {
        await pool.query(`
          INSERT INTO solutionassignmentslevel3 (solution_id, user_id, assigned_at, is_rated)
          VALUES (?, ?, NOW(), 0)
        `, [result.insertId, user.id]);

        console.log(`✅ Solución ID ${result.insertId} asignada correctamente al usuario ID ${user.id}`);
      }
    } catch (assignmentError) {
      console.error("❌ Error asignando solución en solutionassignmentslevel3:", assignmentError);
    }

    res.status(200).json({ message: "Respuesta guardada y asignada correctamente." });
  } catch (error) {
    console.error("❌ Error al guardar respuesta de nivel 3:", error);
    res.status(500).json({ message: "Error al guardar la respuesta." });
  }
};
const assignLevel3Solutions = async (req, res) => {
  const { userId, levelId } = req.params;

  if (levelId !== '3') {
    return res.status(400).json({ error: 'Esta ruta es solo para el nivel 3' });
  }

  try {
    const [solutions] = await pool.query(
      `
      SELECT id, usuario_id as user_id, figura as description, coordenadas, timestamp as created_at
      FROM respuestas
      WHERE usuario_id = ? AND id IN (
        SELECT solution_id FROM solutionassignments WHERE user_id = ?
      )
      ORDER BY timestamp DESC
      `,
      [userId, userId]
    );

    if (solutions.length === 0) {
      return res.status(404).json({ error: 'No se encontraron soluciones asignadas para el nivel 3' });
    }

    const formattedSolutions = solutions.map(row => ({
      id: row.id,
      user_id: row.user_id,
      description: row.description,
      solution_data: Array.isArray(row.coordenadas) ? row.coordenadas.map(piece => {
        const x = piece.x || 0;
        const y = piece.y || 0;
        const rotation = piece.rotation || 0;

        return {
          shape: piece.id || 'unknown',
          coordenadas: [{ x, y }],
          orientacion: rotation
        };
      }) : [],
      created_at: row.created_at,
      average_rating: 0,
      total_ratings: 0
    }));

    res.json({ solutions: formattedSolutions });
  } catch (error) {
    console.error('Error asignando soluciones del nivel 3:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};



module.exports = { voteAlternative, saveLevel3Response, assignLevel3Solutions };
