const pool = require('../database');
const { logAction } = require('./solutionController');

const voteAlternative = async (req, res) => {
  const { solutionId, userId, word } = req.body;

  if (!solutionId || !userId || !word) {
    return res.status(400).json({ message: 'Faltan datos' });
  }

  try {
    // Verificar si ya votó
    const [existing] = await pool.query(
      'SELECT * FROM solution_alternative_votes WHERE solution_id = ? AND user_id = ?',
      [solutionId, userId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Ya has votado en esta solución' });
    }

    // Guardar voto
    await pool.query(
      'INSERT INTO solution_alternative_votes (solution_id, user_id, word) VALUES (?, ?, ?)',
      [solutionId, userId, word]
    );

    // Registrar log
    await logAction(userId, 'VOTE_ALTERNATIVE', {
      solutionId,
      word,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({ message: 'Voto registrado' });
  } catch (error) {
    console.error('Error votando por alternativa:', error);
    res.status(500).json({ message: 'Error registrando voto' });
  }
};

module.exports = { voteAlternative };
