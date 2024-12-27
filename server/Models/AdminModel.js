const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "Test-Game"
});

class AdminModel {
  static async getAllChatGroups() {
    try {
      const [groups] = await db.query(`
        SELECT cg.id, cg.name, COUNT(ucg.user_id) as userCount
        FROM ChatGroups cg
        LEFT JOIN UserChatGroups ucg ON cg.id = ucg.chat_group_id
        GROUP BY cg.id
      `);
      return groups;
    } catch (error) {
      console.error('Error fetching chat groups:', error);
      throw error;
    }
  }

  static async createChatGroup(name) {
    try {
      const [result] = await db.query('INSERT INTO ChatGroups (name) VALUES (?)', [name]);
      return { id: result.insertId, name };
    } catch (error) {
      console.error('Error creating chat group:', error);
      throw error;
    }
  }

  static async getAllUsers() {
    try {
      const [users] = await db.query(`
        SELECT u.id, u.nombre, us.nombre as state
        FROM Users u
        JOIN UserStates us ON u.state_id = us.id
      `);
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  static async assignUserToGroup(userId, groupId) {
    try {
      await db.query(
        'INSERT INTO UserChatGroups (user_id, chat_group_id) VALUES (?, ?) ON DUPLICATE KEY UPDATE chat_group_id = ?',
        [userId, groupId, groupId]
      );
    } catch (error) {
      console.error('Error assigning user to group:', error);
      throw error;
    }
  }

  static async resetGame() {
    try {
      await db.query('DELETE FROM UserChatGroups');
      await db.query('DELETE FROM Messages');
      await db.query('UPDATE Users SET state_id = (SELECT id FROM UserStates WHERE name = "Esperando")');
    } catch (error) {
      console.error('Error resetting game:', error);
      throw error;
    }
  }

  static async getAllSchools() {
    try {
      const [schools] = await db.query('SELECT * FROM Schools');
      return schools;
    } catch (error) {
      console.error('Error in getAllSchools:', error);
      throw error;
    }
  }

  static async createSchool(name) {
    try {
      const [result] = await db.query('INSERT INTO Schools (name) VALUES (?)', [name]);
      return { id: result.insertId, name };
    } catch (error) {
      console.error('Error creating school:', error);
      throw new Error(`Database error: ${error.message}`); // Más información del error
    }
  }
  

  static async uploadStudents(students) {
    try {
      for (const student of students) {
        await db.query('INSERT INTO Users (name, school_id) VALUES (?, ?)', [student.name, student.school_id]);
      }
    } catch (error) {
      console.error('Error uploading students:', error);
      throw error;
    }
  }
}

module.exports = AdminModel;