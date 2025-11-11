import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function enviarCorreo(destinatario, asunto, html, attachments = []) {
  try {
    const info = await transporter.sendMail({
      from: `"Booom Eventos" <${process.env.SMTP_USER}>`,
      to: destinatario,
      subject: asunto,
      html,
      attachments,
    });
    console.log("📨 Correo enviado:", info.messageId);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo:", error);
    return false;
  }
}
