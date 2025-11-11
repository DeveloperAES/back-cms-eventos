import db from "../config/db.js";

// ✅ Asignar admin a evento
export const asignarAdminEvento = async (req, res) => {
  try {
    const { evento_id, admin_id } = req.body;

    if (!evento_id || !admin_id) {
      return res.status(400).json({ error: "Faltan datos: evento_id y admin_id son requeridos" });
    }

    // Verificar que existan el evento y el admin
    const [evento] = await db.query("SELECT id FROM eventos WHERE id = ?", [evento_id]);
    const [admin] = await db.query("SELECT id FROM admins WHERE id = ?", [admin_id]);

    if (evento.length === 0 || admin.length === 0) {
      return res.status(404).json({ error: "Evento o admin no encontrado" });
    }

    // Evitar duplicados
    const [yaAsignado] = await db.query(
      "SELECT id FROM eventos_admins WHERE evento_id = ? AND admin_id = ?",
      [evento_id, admin_id]
    );
    if (yaAsignado.length > 0) {
      return res.status(400).json({ error: "Este admin ya está asignado a este evento" });
    }

    await db.query(
      "INSERT INTO eventos_admins (evento_id, admin_id) VALUES (?, ?)",
      [evento_id, admin_id]
    );

    res.json({ mensaje: "✅ Admin asignado al evento correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al asignar admin a evento" });
  }
};

// ✅ Quitar asignación
export const quitarAdminEvento = async (req, res) => {
  try {
    const { evento_id, admin_id } = req.body;

    await db.query(
      "DELETE FROM eventos_admins WHERE evento_id = ? AND admin_id = ?",
      [evento_id, admin_id]
    );

    res.json({ mensaje: "✅ Admin removido del evento correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al quitar admin de evento" });
  }
};

// ✅ Listar admins asignados a un evento
export const listarAdminsPorEvento = async (req, res) => {
  try {
    const { evento_id } = req.params;

    const [rows] = await db.query(
      `SELECT a.id, a.nombre, a.email, a.telefono
       FROM eventos_admins ea
       INNER JOIN admins a ON ea.admin_id = a.id
       WHERE ea.evento_id = ?`,
      [evento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar admins del evento" });
  }
};

// ✅ Listar eventos asignados a un admin
export const listarEventosPorAdmin = async (req, res) => {
  try {
    const { admin_id } = req.params;

    const [rows] = await db.query(
      `SELECT e.id, e.nombre, e.slug, e.fecha_inicio, e.fecha_fin, e.activo
       FROM eventos_admins ea
       INNER JOIN eventos e ON ea.evento_id = e.id
       WHERE ea.admin_id = ?`,
      [admin_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al listar eventos del admin" });
  }
};



