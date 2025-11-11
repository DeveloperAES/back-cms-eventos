import db from "../config/db.js";
import bcrypt from "bcrypt";



// ✅ Registro de usuario (público)
export const registrarUsuario = async (req, res) => {
  try {
    const { dni, nombres, apellidos, correo_corporativo, telefono, empresa, evento_id } = req.body;

    if (!dni || !nombres || !apellidos || !correo_corporativo || !evento_id) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // 1️⃣ Verificar si el usuario ya existe
    const [existe] = await db.query("SELECT id FROM usuarios WHERE dni = ?", [dni]);
    let usuarioId;

    if (existe.length > 0) {
      usuarioId = existe[0].id;
    } else {
      // 2️⃣ Crear nuevo usuario con contraseña aleatoria
      const passwordGenerada = Math.random().toString(36).substring(2, 8);
      const password_hash = await bcrypt.hash(passwordGenerada, 10);

      const [insert] = await db.query(
        "INSERT INTO usuarios (dni, nombres, apellidos, correo_corporativo, telefono, empresa, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [dni, nombres, apellidos, correo_corporativo, telefono, empresa, password_hash]
      );

      usuarioId = insert.insertId;
    }

    // 3️⃣ Registrar participación en el evento
    await db.query(
      "INSERT INTO registro_eventos (evento_id, usuario_id) VALUES (?, ?)",
      [evento_id, usuarioId]
    );

    res.json({ mensaje: "✅ Usuario registrado al evento correctamente", usuario_id: usuarioId });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "El usuario ya está registrado en este evento" });
    }
    console.error(error);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
};
