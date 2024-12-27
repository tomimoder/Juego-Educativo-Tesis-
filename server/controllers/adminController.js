const pool = require('../database');

const getChatGroups = async (req, res) => {
  try {
    const [groups] = await pool.query(`
      SELECT cg.id, cg.name, COUNT(ucg.user_id) as userCount
      FROM ChatGroups cg
      LEFT JOIN UserChatGroups ucg ON cg.id = ucg.chat_group_id
      GROUP BY cg.id
    `);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching chat groups:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const [users] = await pool.query(`
      SELECT u.id, u.nombre, u.apellido, u.status, s.name as school_name
      FROM Users u
      LEFT JOIN Schools s ON u.school_id = s.id
    `);
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const createChatGroup = async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO ChatGroups (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId, name });
  } catch (error) {
    console.error('Error creating chat group:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const assignUser = async (req, res) => {
  const { userId, groupId } = req.body;
  try {
    await pool.query(
      'INSERT INTO UserChatGroups (user_id, chat_group_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE chat_group_id = ?',
      [userId, groupId, groupId]
    );
    res.status(200).json({ message: 'User assigned successfully' });
  } catch (error) {
    console.error('Error assigning user to group:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const resetGame = async (req, res) => {
  try {
    await pool.query('DELETE FROM UserChatGroups');
    await pool.query('DELETE FROM Messages');
    await pool.query('UPDATE Users SET status = "waiting"');
    res.status(200).json({ message: 'Game reset successfully' });
  } catch (error) {
    console.error('Error resetting game:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const uploadStudents = async (req, res) => {
  const { students } = req.body;
  try {
    for (const student of students) {
      await pool.query('INSERT INTO Users (name, school_id) VALUES (?, ?)', [student.name, student.school_id]);
    }
    res.status(200).json({ message: 'Students uploaded successfully' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

module.exports = { getChatGroups, getUsers, createChatGroup, assignUser, resetGame, uploadStudents };
