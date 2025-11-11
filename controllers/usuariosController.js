import db from "../config/db.js";
import bcrypt from "bcrypt";


export const obtenerUsuariosPorEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;

    // Validar que el admin tenga acceso a ese evento
    const [check] = await db.query(
      `SELECT * FROM eventos_admins WHERE evento_id = ? AND admin_id = ?`,
      [eventoId, req.user.id]
    );

    if (!check || check.length === 0) {
      return res.status(403).json({ error: "No autorizado para este evento" });
    }

    // Traer solo el último intento por usuario para el evento
    const [usuarios] = await db.query(
      `
     SELECT re.id AS registroId,
       re.usuario_id AS id,
       re.nombres,
       re.apellidos,
       re.correo_corporativo,
       re.telefono,
       re.empresa,
       re.estado
      FROM registro_eventos re
      JOIN (
          SELECT usuario_id, MAX(intent_number) AS ultimo_intento
          FROM registro_eventos
          WHERE evento_id = ?
          GROUP BY usuario_id
      ) ultimos ON re.usuario_id = ultimos.usuario_id AND re.intent_number = ultimos.ultimo_intento
      WHERE re.evento_id = ?
            `,
      [eventoId, eventoId]
    );

    res.json({ eventoId, usuarios });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener usuarios del evento" });
  }
};


