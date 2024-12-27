const pool = require('../database');

const login = async (req, res) => {
  const { schoolId, nombre, apellido } = req.body;

  try {
    // Verificar si el usuario existe
    const [users] = await pool.query(
      'SELECT * FROM Users WHERE nombre = ? AND apellido = ? AND school_id = ?',
      [nombre, apellido, schoolId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Actualizar el estado del usuario en la base de datos
    await pool.query(
      'UPDATE Users SET status = ? WHERE id = ?',
      ['waiting', user.id]
    );

    // Enviar solo los datos del usuario sin token
    res.json({
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        schoolId: user.school_id,
        status: 'waiting'
      }
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
};

// Otros controladores permanecen igual
const getStudentsBySchool = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const [students] = await pool.query(
      'SELECT id, nombre, apellido FROM Users WHERE school_id = ?',
      [schoolId]
    );
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students', details: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { userId, status } = req.body;
  try {
    await pool.query(
      'UPDATE Users SET status = ? WHERE id = ?',
      [status, userId]
    );
    res.json({ message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status', details: error.message });
  }
};

module.exports = { login, getStudentsBySchool, updateUserStatus };
