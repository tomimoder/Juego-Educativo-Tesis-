// Import your database connection
const pool = require('../database/index'); // Adjust to your database connection

// Add this function to your existing controller
const getWaitingUsers = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Query to get users who are waiting in chatrooms
    const [rows] = await connection.query(`
      SELECT 
        cg.id as chatRoomId,
        u1.id as waitingUserId,
        CONCAT(u1.nombre, ' ', u1.apellido) as waitingUserName,
        u2.id as waitingForUserId,
        CONCAT(u2.nombre, ' ', u2.apellido) as waitingForUserName,
        u1.nivel_curso,
        cg.created_at as waitingSince
      FROM ChatGroups cg
      JOIN userchatgroups ucg1 ON cg.id = ucg1.chat_group_id
      JOIN users u1 ON ucg1.user_id = u1.id
      LEFT JOIN userchatgroups ucg2 ON cg.id = ucg2.chat_group_id AND ucg1.user_id != ucg2.user_id
      LEFT JOIN users u2 ON ucg2.user_id = u2.id
      WHERE 
        (SELECT COUNT(*) FROM userchatgroups WHERE chat_group_id = cg.id) = 1
        OR u2.id IS NULL
      ORDER BY cg.created_at DESC
    `);
    
    connection.release();
    
    res.json(rows);
  } catch (error) {
    console.error("Error fetching waiting users:", error);
    res.status(500).json({ error: "Failed to fetch waiting users" });
  }
};

// Export the function along with your other controller functions
module.exports = {
  // Your existing exports
  getWaitingUsers
};