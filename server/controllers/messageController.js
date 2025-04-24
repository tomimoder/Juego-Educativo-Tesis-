// controllers/messageController.js
const pool = require('../database');
const { logAction } = require('./solutionController'); // Importar logAction

// Función interna para guardar mensaje y registrar log
const saveMessageInternal = async (chatGroupId, userId, content, nombre) => {
  try {
    if (!chatGroupId || !userId || !content || !nombre) {
      throw new Error('Faltan datos requeridos');
    }

    const [result] = await pool.query(
      'INSERT INTO messages (chat_group_id, user_id, content, user_name ) VALUES (?, ?, ?, ?)',
      [chatGroupId, userId, content, nombre]
    );

    // Registrar log
    await logAction(userId, 'SEND_MESSAGE', {
      chatGroupId,
      messageId: result.insertId,
      content,
      timestamp: new Date().toISOString(),
    });

    return result.insertId;
  } catch (error) {
    console.error('Error guardando mensaje:', error);
    throw error;
  }
};

// Controlador REST
const saveMessage = async (req, res) => {
  try {
    const { chatGroupId, userId, content, nombre, apellido } = req.body;
    const messageId = await saveMessageInternal(chatGroupId, userId, content, nombre, apellido);
    res.status(201).json({ message: 'Mensaje guardado', messageId });
  } catch (error) {
    res.status(500).json({ message: 'Error guardando mensaje' });
  }
};

module.exports = { saveMessage, saveMessageInternal };