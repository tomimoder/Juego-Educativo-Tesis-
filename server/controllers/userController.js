const pool = require('../database');
const cookieParser = require("cookie-parser");



const login = async (req, res) => {
  console.log("📩 Datos recibidos en login:", req.body);

  const { schoolId, nombre, apellido } = req.body;

  if (!schoolId || !nombre || !apellido) {
    return res.status(400).json({ error: "Faltan datos en la petición" });
  }

  try {
    const [users] = await pool.query(
      "SELECT * FROM Users WHERE nombre = ? AND apellido = ? AND school_id = ?",
      [nombre, apellido, schoolId]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];

    // 🔹 Guardar usuario en cookie HTTPOnly
    res.cookie("userSession", JSON.stringify({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      schoolId: user.school_id,
      status: "waiting"
    }), {
      httpOnly: true, // 🔥 Bloquear acceso desde el frontend por seguridad
      secure: false, // ⚠ Cambiar a `true` si usas HTTPS
      sameSite: "Lax", // Permitir cookies en diferentes rutas
      maxAge: 86400000 // 1 día
    });

    console.log("✅ Cookie de usuario almacenada:", user);

    res.json({ success: true, user });

  } catch (error) {
    console.error("❌ Error en login:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const getCurrentUser = (req, res) => {
  try {
    const userSession = req.cookies.userSession;
    if (!userSession) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }
    const user = JSON.parse(userSession);
    res.json(user);
  } catch (error) {
    console.error("❌ Error obteniendo usuario:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
};




const getSolutionsByLevel = async (req, res) => {
  const { levelId, userId } = req.query;

  if (!levelId) {
    return res.status(400).json({ error: "Falta el levelId" });
  }

  try {
    console.log(`📌 Obteniendo soluciones para el nivel: ${levelId}, usuario: ${userId}`);

    let query = `SELECT * FROM Solutions WHERE level_id = ?`;
    let params = [levelId];

    // Si se proporciona `userId`, filtrar por usuario
    if (userId) {
      query += ` AND user_id = ?`;
      params.push(userId);
    }

    const [solutions] = await pool.query(query, params);

    console.log("📌 Soluciones encontradas en la BD:", solutions);

    res.json({ solutions, total: solutions.length });
  } catch (error) {
    console.error("❌ Error obteniendo soluciones:", error);
    res.status(500).json({ error: "Error en el servidor" });
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

module.exports = { login, getSolutionsByLevel, updateUserStatus, getCurrentUser };
