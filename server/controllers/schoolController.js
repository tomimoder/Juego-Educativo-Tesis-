const pool = require('../database');

const getSchools = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Schools');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching schools:', error);
    res.status(500).json({ error: 'Error fetching schools', details: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const [students] = await pool.query(
      'SELECT * FROM Users WHERE school_id = ?',
      [req.params.schoolId]
    );
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Error fetching students', details: error.message });
  }
};

module.exports = { getSchools, getStudents };