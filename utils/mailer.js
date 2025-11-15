import nodemailer from "nodemailer";
import sgMail from "@sendgrid/mail";


import axios from "axios";


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// export async function enviarCorreo(destinatario, asunto, html, attachments = []) {
//   try {
//     const info = await transporter.sendMail({
//       from: `"Booom Eventos" <${process.env.SMTP_USER}>`,
//       to: destinatario,
//       subject: asunto,
//       html,
//       attachments,
//     });
//     console.log("📨 Correo enviado:", info.messageId);
//     return true;
//   } catch (error) {
//     console.error("❌ Error enviando correo:", error);
//     return false;
//   }
// }



// export async function enviarCorreo(destinatario, asunto, html) {
//   try {
//     const response = await axios.post(
//       "https://xplorasmtpservice-test.azurewebsites.net/mail/send-qr",
//       {
//         Html: html,
//         Correo: destinatario,
//         Asunto: asunto
//       },
//       {
//         headers: {
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     console.log("📨 Correo enviado vía servicio SMTP:", response.data);
//     return true;
//   } catch (error) {
//     console.error("❌ Error enviando correo vía servicio SMTP:", error.response?.data || error.message);
//     return false;
//   }
// }

sgMail.setApiKey(process.env.SENDGRID_API_KEY);


export async function enviarCorreo(destinatario, asunto, html, attachments = []) {
  try {
    const msg = {
      to: destinatario,
      from: process.env.SENDGRID_FROM, // Debe ser un correo verificado en SendGrid
      subject: asunto,
      html,
      attachments: attachments.map((file) => ({
        content: file.content.toString("base64"),
        filename: file.filename,
        type: file.type || "application/octet-stream",
        disposition: "attachment",
      })),
    };

    const response = await sgMail.send(msg);

    console.log("📨 Correo enviado (SendGrid):", response[0].statusCode);
    return true;
  } catch (error) {
    console.error("❌ Error enviando correo SENDGRID:", error.response?.body || error);
    return false;
  }
}