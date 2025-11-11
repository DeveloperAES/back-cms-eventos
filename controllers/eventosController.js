import pool from "../config/db.js";

export const crearEvento = async (req, res) => {
    try {
        const { nombre, slug, descripcion, logo_url, banner_url, fecha_inicio, fecha_fin } = req.body;
        const creado_por = req.user.id; // lo obtenemos del token

        await pool.query(
            "INSERT INTO eventos (nombre, slug, descripcion, logo_url, banner_url, fecha_inicio, fecha_fin, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [nombre, slug, descripcion, logo_url, banner_url, fecha_inicio, fecha_fin, creado_por]
        );

        res.json({ mensaje: "✅ Evento creado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al crear evento" });
    }
};
export const listarEventos = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nombre, slug, activo, fecha_inicio, fecha_fin, creado_en FROM eventos"
        );
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al listar eventos" });
    }
};


//Para actualizar los eventos
export const actualizarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, slug, descripcion, logo_url, banner_url, fecha_inicio, fecha_fin } = req.body;

        await pool.query(
            `UPDATE eventos SET nombre=?, slug=?, descripcion=?, logo_url=?, banner_url=?, fecha_inicio=?, fecha_fin=? WHERE id=?`,
            [nombre, slug, descripcion, logo_url, banner_url, fecha_inicio, fecha_fin, id]
        );

        res.json({ mensaje: "✅ Evento actualizado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al actualizar evento" });
    }
};


//Activar o desactivar los eventos
export const cambiarEstadoEvento = async (req, res) => {
  try {
    const { id } = req.params;
    // 👇 Convertir a número (1 o 0)
    const activo = req.body.activo ? 1 : 0;

    await pool.query("UPDATE eventos SET activo = ? WHERE id = ?", [activo, id]);
    res.json({ mensaje: `Evento ${activo ? "activado" : "desactivado"} correctamente` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al cambiar estado del evento" });
  }
};

//Eliminar eventos
export const eliminarEvento = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM eventos WHERE id = ?", [id]);
        res.json({ mensaje: "🗑️ Evento eliminado correctamente" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error al eliminar evento" });
    }
};



//Con esto obtenemos un evento por su slug
export const obtenerEventoPorSlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const [rows] = await pool.query(
      "SELECT * FROM eventos WHERE slug = ? LIMIT 1",
      [slug]
    );

    if (rows.length === 0)
      return res.status(404).json({ error: "Evento no encontrado" });

    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener evento" });
  }
};

