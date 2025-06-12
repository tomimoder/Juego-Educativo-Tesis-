const pool = require('../database');
const cookieParser = require("cookie-parser");
const scheduledStatusChanges = new Map();

const login = async (req, res) => {
  console.log("📩 Datos recibidos en login:", req.body);

  const { schoolId, nombre, apellido, nivel_curso } = req.body;

  if (!schoolId || !nombre || !apellido || !nivel_curso) {
    return res.status(400).json({ error: "Faltan datos en la petición" });
  }

  try {
    const [users] = await pool.query(
      "SELECT * FROM users WHERE nombre = ? AND apellido = ? AND school_id = ? AND nivel_curso = ?",
      [nombre, apellido, schoolId, nivel_curso]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: "Credenciales inválidas" });
    }

    const user = users[0];

    // 🔸 Actualizar status a 'playing'
    await pool.query("UPDATE users SET status = 'playing' WHERE id = ?", [user.id]);

    // 🔹 Guardar usuario en cookie HTTPOnly
    res.cookie("userSession", JSON.stringify({
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      schoolId: user.school_id,
      nivel_curso: user.nivel_curso, // Incluir nivel_curso en la cookie
      status: "waiting"
    }), {
      httpOnly: true,
      secure: false, // ⚠ Cambiar a `true` si usas HTTPS
      sameSite: "Lax",
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

  if (!userId || !status || !['waiting', 'playing', 'idle'].includes(status)) {
    return res.status(400).json({ message: 'Datos inválidos o incompletos' });
  }

  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, userId]);
    console.log(`✅ Estado actualizado: Usuario ${userId} → ${status}`);

    if (status === 'playing') {
      if (scheduledStatusChanges.has(userId)) {
        clearTimeout(scheduledStatusChanges.get(userId));
      }

      const timer = setTimeout(async () => {
        await pool.query('UPDATE users SET status = ? WHERE id = ?', ['idle', userId]);
        console.log(`🔔 Usuario ${userId} cambiado automáticamente a 'idle' tras 72 horas.`);
        scheduledStatusChanges.delete(userId);
      }, 72 * 60 * 60 * 1000);

      scheduledStatusChanges.set(userId, timer);
    }

    res.json({ message: 'Estado actualizado correctamente' });
  } catch (error) {
    console.error("Error actualizando estado:", error);
    res.status(500).json({ message: 'Error actualizando estado' });
  }
};

const updateUserLevel = async (req, res) => {
  const { levelId } = req.body;

  const userSession = req.cookies.userSession;
  if (!userSession) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  let user;
  try {
    user = JSON.parse(userSession);
    if (!user.id) throw new Error("Usuario inválido en la cookie");
  } catch (error) {
    console.error("❌ Error leyendo la cookie:", error);
    return res.status(400).json({ error: "Error en la autenticación del usuario" });
  }

  if (!levelId) {
    return res.status(400).json({ error: "Falta el levelId" });
  }

  try {
    const [result] = await pool.query(
      "UPDATE users SET current_level_id = ? WHERE id = ?",
      [levelId, user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    console.log(`✅ current_level_id actualizado para usuario ${user.id}: ${levelId}`);
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error actualizando current_level_id:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

const getLevelProgress = async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: "Falta el userId" });
  }

  try {
    const [levels] = await pool.query("SELECT * FROM levels");
    const [userLevels] = await pool.query(
      "SELECT * FROM user_levels WHERE user_id = ?",
      [userId]
    );

    const progress = levels.map((level) => {
      const userLevel = userLevels.find((ul) => ul.level_id === level.id);
      return {
        level: level.id,
        name: level.name,
        unlocked: userLevel ? true : level.id === 1,
        stars: userLevel ? userLevel.stars : 0,
        completed: userLevel ? userLevel.completed : 0,
      };
    });

    res.json(progress);
  } catch (error) {
    console.error("❌ Error obteniendo progreso de niveles:", error);
    res.status(500).json({ error: "Error en el servidor" });
  }
};

module.exports = { login, getSolutionsByLevel, updateUserStatus, getCurrentUser, updateUserLevel, getLevelProgress };