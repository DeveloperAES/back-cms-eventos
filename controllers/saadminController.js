import db from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// ✅ Registrar Super Admin
export const registrarSaadmin = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    const [existe] = await db.query("SELECT * FROM saadmins WHERE email = ?", [email]);
    if (existe.length > 0) {
      return res.status(400).json({ error: "El email ya está registrado" });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await db.query(
      "INSERT INTO saadmins (nombre, email, password_hash) VALUES (?, ?, ?)",
      [nombre, email, password_hash]
    );

    res.json({ mensaje: "✅ Super Admin creado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al registrar Super Admin" });
  }
};

// ✅ Login Super Admin
export const loginSaadmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query("SELECT * FROM saadmins WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "Credenciales inválidas" });
    }

    const saadmin = rows[0];
    const passwordValida = await bcrypt.compare(password, saadmin.password_hash);
    if (!passwordValida) {
      return res.status(400).json({ error: "Contraseña incorrecta" });
    }

    const token = jwt.sign(
      { id: saadmin.id, rol: "saadmin" },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES || "7d" }
    );

    res.json({
      mensaje: "✅ Login correcto",
      saadmin: { id: saadmin.id, nombre: saadmin.nombre, email: saadmin.email },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al hacer login" });
  }
};
