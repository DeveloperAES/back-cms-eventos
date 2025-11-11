import db from "../config/db.js";
import QRCode from "qrcode";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { enviarCorreo } from "../utils/mailer.js";


const BASE_URL = process.env.BASE_URL || "http://localhost:4000";

/* ======================================================
   REGISTRO DE USUARIO EN EVENTO
====================================================== */
export const registrarUsuarioEvento = async (req, res) => {
  try {
    const { evento_id, dni, nombres, apellidos, correo_corporativo, telefono, empresa } = req.body;

    // 🧩 Validación básica
    if (!evento_id || !dni || !nombres || !apellidos || !correo_corporativo) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 👤 Buscar o crear usuario
    let [usuarioRows] = await db.query("SELECT * FROM usuarios WHERE dni = ?", [dni]);
    let usuario_id;

    if (usuarioRows.length === 0) {
      const password = crypto.randomBytes(4).toString("hex");
      const password_hash = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        `INSERT INTO usuarios (dni, nombres, apellidos, correo_corporativo, telefono, empresa, password_hash)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [dni, nombres, apellidos, correo_corporativo, telefono, empresa, password_hash]
      );

      usuario_id = result.insertId;
    } else {
      usuario_id = usuarioRows[0].id;
    }

    // 🔢 Calcular número de intento (para control interno)
    const [intentosPrevios] = await db.query(
      "SELECT COUNT(*) AS total FROM registro_eventos WHERE evento_id = ? AND usuario_id = ?",
      [evento_id, usuario_id]
    );

    const intent_number = intentosPrevios[0].total + 1;

    // 📝 Registrar nuevo intento
    await db.query(
      "INSERT INTO registro_eventos (evento_id, usuario_id, intent_number) VALUES (?, ?, ?)",
      [evento_id, usuario_id, intent_number]
    );

    res.json({
      mensaje: "✅ Registro realizado correctamente",
      usuario_id,
      intent_number,
    });
  } catch (error) {
    console.error("❌ Error en registrarUsuarioEvento:", error);
    res.status(500).json({ error: "Error al registrar usuario en el evento" });
  }
};


/* ======================================================
   CONFIRMAR REGISTRO Y ENVIAR QR
====================================================== */
export const confirmarRegistro = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener datos
    const [rows] = await db.query(
      `SELECT 
      r.*, 
      u.nombres, 
      u.apellidos, 
      u.dni,
      u.correo_corporativo, 
      e.nombre AS evento
   FROM registro_eventos r
   JOIN usuarios u ON u.id = r.usuario_id
   JOIN eventos e ON e.id = r.evento_id
   WHERE r.id = ?`,
      [id]
    );


    if (rows.length === 0) return res.status(404).json({ error: "Registro no encontrado" });

    const registro = rows[0];
    const uniqueCode = crypto.randomUUID();
    const qrURL = `${BASE_URL}/api/registros/validar/${uniqueCode}`;

    // Generar QR como buffer
    const qrBuffer = await QRCode.toBuffer(qrURL);

    // Generar password temporal
    const password = crypto.randomBytes(4).toString("hex");

    // Guardar en BD
    await db.query(
      `UPDATE registro_eventos
       SET qr_code = ?, qr_code_url = ?, qr_image = ?, password = ?, estado = 'confirmado', fecha_confirmacion = NOW()
       WHERE id = ?`,
      [uniqueCode, qrURL, qrBuffer, password, id]
    );

    // HTML del correo
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;padding:20px;border-radius:8px;">
        <h2 style="color:#0078D7;">¡Hola ${registro.nombres}!</h2>
        <p>Tu registro al evento <strong>${registro.evento}</strong> ha sido confirmado ✅.</p>
        <p><strong>DNI:</strong> ${registro.dni || "N/A"}<br/>
           <strong>Contraseña:</strong> ${password}</p>
        <p>Presenta este código QR en la entrada:</p>
        <div style="text-align:center;">
          <img src="cid:qrimg" alt="QR de acceso" style="width:200px;height:200px;" />
        </div>
        <p>O usa este enlace: <a href="${qrURL}">${qrURL}</a></p>
        <hr>
        <p style="font-size:12px;color:#777;">Correo automático generado por Xplora Eventos</p>
      </div>
    `;

    // Enviar correo
    await enviarCorreo(
      registro.correo_corporativo,
      `Confirmación de asistencia - ${registro.evento}`,
      html,
      [{ filename: "qr.png", content: qrBuffer, cid: "qrimg" }]
    );

    res.json({ mensaje: "✅ Confirmación enviada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al confirmar registro" });
  }
};

/* ======================================================
   REENVIAR RECORDATORIOS
====================================================== */
export const reenviarRecordatorios = async (req, res) => {
  try {
    const { evento_id } = req.body;

    if (!evento_id) {
      return res.status(400).json({ error: "Falta el ID del evento" });
    }

    // Buscar usuarios confirmados en ese evento
    const [usuarios] = await db.query(
      `SELECT 
          u.id AS usuario_id,
          u.nombres, 
          u.apellidos,
          u.correo_corporativo,
          u.dni,
          e.nombre AS evento,
          e.fecha_inicio AS fecha_evento,
          r.qr_code_url,
          r.qr_code,
          r.estado
       FROM registro_eventos r
       JOIN usuarios u ON u.id = r.usuario_id
       JOIN eventos e ON e.id = r.evento_id
       WHERE r.evento_id = ? AND r.estado = 'confirmado'`,
      [evento_id]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ error: "No hay usuarios confirmados para este evento" });
    }

    let reenviados = 0;

    for (const u of usuarios) {
      // Generar QR si no existe o regenerar
      let qrBuffer = null;
      let qr_code_url = u.qr_code_url;

      if (!qr_code_url) {
        const newCode = crypto.randomUUID();
        qr_code_url = `${BASE_URL}/api/registros/validar/${newCode}`;
        qrBuffer = await QRCode.toBuffer(qr_code_url);

        await db.query(
          `UPDATE registro_eventos 
           SET qr_code = ?, qr_code_url = ?, estado = 'confirmado'
           WHERE usuario_id = ? AND evento_id = ?`,
          [newCode, qr_code_url, u.usuario_id, evento_id]
        );
      } else {
        qrBuffer = await QRCode.toBuffer(qr_code_url);
      }

      const fechaEvento = new Date(u.fecha_evento).toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Armar el correo
      const html = `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #ddd;padding:20px;border-radius:8px;">
          <h2 style="color:#0078D7;">Hola ${u.nombres} ${u.apellidos},</h2>
          <p>Gracias por confirmar tu participación en el evento <strong>${u.evento}</strong>.</p>
          <p><strong>Fecha del evento:</strong> ${fechaEvento}</p>
          <p>Este es un recordatorio para que no te pierdas esta gran experiencia. ¡Te esperamos!</p>
          <div style="text-align:center;margin-top:15px;">
            <p>Presenta este código QR en la entrada:</p>
            <img src="cid:qrimg" alt="QR de acceso" style="width:200px;height:200px;" />
          </div>
          <hr>
          <p style="font-size:12px;color:#777;">Correo automático generado por Xplora Eventos</p>
        </div>
      `;

      const enviado = await enviarCorreo(
        u.correo_corporativo,
        `Recordatorio de asistencia - ${u.evento}`,
        html,
        [
          {
            filename: "qr.png",
            content: qrBuffer,
            cid: "qrimg",
          },
        ]
      );

      if (enviado) reenviados++;
    }

    res.json({
      ok: true,
      mensaje: `📩 Recordatorios reenviados: ${reenviados}/${usuarios.length}`,
    });
  } catch (error) {
    console.error("❌ Error en reenviarRecordatorios:", error);
    res.status(500).json({ error: "Error al reenviar recordatorios" });
  }
};
/* ======================================================
   VALIDAR ASISTENCIA (QR SCAN)
====================================================== */
export const validarAsistencia = async (req, res) => {
  try {
    const { uuid } = req.params;

    // Buscar registro por código del QR
    const [rows] = await db.query(
      "SELECT r.*, u.nombres, u.apellidos, e.nombre AS evento_nombre FROM registro_eventos r JOIN usuarios u ON u.id = r.usuario_id JOIN eventos e ON e.id = r.evento_id WHERE r.qr_code = ?",
      [uuid]
    );

    if (rows.length === 0) {
      return res.status(404).send(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>QR no válido</title>
            <style>
              body { font-family: Arial; text-align: center; margin-top: 50px; }
              .error { color: red; font-size: 22px; }
            </style>
          </head>
          <body>
            <h2 class="error">❌ Código no válido</h2>
            <p>No se encontró ningún registro asociado a este QR.</p>
          </body>
        </html>
      `);
    }

    const registro = rows[0];

    // Verificar si ya asistió
    if (registro.estado === "asistio") {
      return res.send(`
        <html>
          <head>
            <meta charset="utf-8" />
            <title>Asistencia ya registrada</title>
            <style>
              body { font-family: Arial; text-align: center; margin-top: 50px; }
              .warn { color: orange; font-size: 22px; }
            </style>
          </head>
          <body>
            <h2 class="warn">⚠️ Este participante ya fue marcado como asistido</h2>
            <p><strong>${registro.nombres} ${registro.apellidos}</strong></p>
            <p>Evento: ${registro.evento_nombre}</p>
            <p>Fecha registrada: ${new Date(registro.fecha_asistencia).toLocaleString("es-PE")}</p>
          </body>
        </html>
      `);
    }

    // Actualizar estado y fecha
    await db.query(
      "UPDATE registro_eventos SET estado = 'asistio', fecha_asistencia = NOW() WHERE id = ?",
      [registro.id]
    );

    // Mostrar confirmación
    res.send(`
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Asistencia confirmada</title>
          <style>
            body { font-family: Arial; text-align: center; margin-top: 50px; }
            .ok { color: green; font-size: 24px; }
          </style>
        </head>
        <body>
          <h2 class="ok">✅ Asistencia confirmada</h2>
          <p><strong>${registro.nombres} ${registro.apellidos}</strong></p>
          <p>Evento: ${registro.evento_nombre}</p>
          <p>Fecha: ${new Date().toLocaleString("es-PE")}</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("❌ Error en validarAsistencia:", error);
    res.status(500).send(`
      <html>
        <head><meta charset="utf-8" /><title>Error</title></head>
        <body>
          <h2>⚠️ Error al confirmar asistencia</h2>
          <p>${error.message}</p>
        </body>
      </html>
    `);
  }
};