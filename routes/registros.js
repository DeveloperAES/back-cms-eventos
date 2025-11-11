import express from "express";
import {
  registrarUsuarioEvento,
  confirmarRegistro,
  reenviarRecordatorios,
  validarAsistencia,
} from "../controllers/registroController.js";
import { verificarToken, autorizarRol } from "../middlewares/auth.js";

const router = express.Router();

// Registro público (sin token)
router.post("/registrar", registrarUsuarioEvento);

// Confirmar asistencia (solo admin)
router.put("/:id/confirmar", verificarToken, autorizarRol("admin"), confirmarRegistro);

// Reenviar recordatorios (solo admin)
router.post("/reenviar", verificarToken, autorizarRol("admin"), reenviarRecordatorios);


// Validar QR (público, usado al escanear)
router.get("/validar/:uuid", validarAsistencia);


export default router;
