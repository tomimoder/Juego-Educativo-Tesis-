const pool = require('../database');

const getSchools = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM schools');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Error fetching schools', details: error.message });
  }
};

const getStudents = async (req, res) => {
  const { schoolId } = req.params;
  const { nivel_curso } = req.query;

  if (!schoolId) {
    return res.status(400).json({ error: 'Falta el schoolId' });
  }

  try {
    let query = 'SELECT id, nombre, apellido FROM users WHERE school_id = ?';
    let params = [schoolId];

    if (nivel_curso) {
      query += ' AND nivel_curso = ?';
      params.push(nivel_curso);
    }

    const [students] = await pool.query(query, params);
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Error fetching students', details: error.message });
  }
};

module.exports = { getSchools, getStudents };