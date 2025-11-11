import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ✅ Crear admin (solo SAADMIN)
export const crearAdmin = async (req, res) => {
  try {
    const { nombre, email, telefono, password } = req.body;

    // Validamos campos mínimos
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Verificar si ya existe
    const [existe] = await db.query("SELECT * FROM admins WHERE email = ?", [email]);
    if (existe.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO admins (nombre, email, telefono, password_hash) VALUES (?, ?, ?, ?)",
      [nombre, email, telefono, password_hash]
    );

    res.json({ mensaje: "✅ Admin creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al crear admin" });
  }
};

// ✅ Actualizar admin existente
export const actualizarAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, telefono, password } = req.body;

    const [admin] = await db.query("SELECT * FROM admins WHERE id = ?", [id]);
    if (admin.length === 0) {
      return res.status(404).json({ error: "Admin no encontrado" });
    }

    // Si se envía nueva contraseña, la encriptamos
    let password_hash = admin[0].password_hash;
    if (password && password.trim() !== "") {
      password_hash = await bcrypt.hash(password, 10);
    }

    await db.query(
      "UPDATE admins SET nombre = ?, email = ?, telefono = ?, password_hash = ? WHERE id = ?",
      [nombre, email, telefono, password_hash, id]
    );

    res.json({ mensaje: "✅ Admin actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar admin" });
  }
};

// ✅ Eliminar admin (solo SAADMIN)
export const eliminarAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si existe
    const [admin] = await db.query("SELECT * FROM admins WHERE id = ?", [id]);
    if (admin.length === 0) {
      return res.status(404).json({ error: "Admin no encontrado" });
    }

    // Eliminar relaciones (opcional para limpiar tabla intermedia)
    await db.query("DELETE FROM eventos_admins WHERE admin_id = ?", [id]);

    // Eliminar admin
    await db.query("DELETE FROM admins WHERE id = ?", [id]);

    res.json({ mensaje: "✅ Admin eliminado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al eliminar admin" });
  }
};


// ✅ Listar todos los admins (solo SAADMIN)
// ✅ Listar todos los admins con total de eventos asignados
export const listarAdmins = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        a.nombre,
        a.email,
        a.telefono,
        a.activo,
        a.creado_en,
        COUNT(ea.evento_id) AS total_eventos
      FROM admins a
      LEFT JOIN eventos_admins ea ON a.id = ea.admin_id
      GROUP BY a.id
      ORDER BY a.nombre ASC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener admins" });
  }
};



// ✅ Cambiar estado activo/inactivo
export const cambiarEstadoAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    await db.query("UPDATE admins SET activo = ? WHERE id = ?", [activo, id]);
    res.json({ mensaje: "✅ Estado del admin actualizado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al actualizar estado" });
  }
};

//Esto es para el admin login a un evento
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar que se envíen ambos campos
    if (!email || !password) {
      return res.status(400).json({ error: "Faltan email o contraseña" });
    }

    const [result] = await db.query(
      "SELECT * FROM admins WHERE email = ? AND activo = 1",
      [email]
    );

    if (!result || result.length === 0) {
      return res.status(404).json({ error: "❌ Admin no encontrado o inactivo" });
    }

    // ⚠️ Aquí estaba el error: result es un arreglo
    const admin = result[0];

    // Comparar contraseñas
    const passwordValida = await bcrypt.compare(password, admin.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "❌ Credenciales incorrectas" });
    }

    // Buscar eventos asignados
    const [eventos] = await db.query(
      `SELECT e.id, e.nombre, e.slug, e.fecha_inicio, e.fecha_fin
       FROM eventos_admins ea
       JOIN eventos e ON e.id = ea.evento_id
       WHERE ea.admin_id = ?`,
      [admin.id]
    );

    // Generar token
    const token = jwt.sign(
      { id: admin.id, rol: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      mensaje: "✅ Login exitoso",
      token,
      admin: {
        id: admin.id,
        nombre: admin.nombre,
        email: admin.email,
        eventos
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el login de admin" });
  }
};


// ✅ Obtener los eventos del admin autenticado
export const obtenerMisEventos = async (req, res) => {
  try {
    const adminId = req.user.id;

    const [eventos] = await db.query(
      `SELECT e.id, e.nombre, e.slug, e.fecha_inicio, e.fecha_fin, e.activo
       FROM eventos_admins ea
       JOIN eventos e ON e.id = ea.evento_id
       WHERE ea.admin_id = ?`,
      [adminId]
    );

    res.json({
      admin_id: adminId,
      eventos
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al obtener tus eventos" });
  }
};