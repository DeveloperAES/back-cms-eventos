import express from "express";
import { obtenerUsuariosPorEvento } from "../controllers/usuariosController.js";
import { verificarToken, autorizarRol } from "../middlewares/auth.js";

const router = express.Router();

// Solo admin autenticado puede listar usuarios de sus eventos
router.get("/evento/:eventoId", verificarToken, autorizarRol("admin"), obtenerUsuariosPorEvento);

export default router;
