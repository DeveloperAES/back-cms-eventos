import express from "express";
import {
  asignarAdminEvento,
  quitarAdminEvento,
  listarAdminsPorEvento,
  listarEventosPorAdmin
} from "../controllers/asignacionesController.js";
import { verificarToken, autorizarRol } from "../middlewares/auth.js";

const router = express.Router();

// 🔒 Solo SAADMIN puede asignar o remover
router.post("/", verificarToken, autorizarRol("saadmin"), asignarAdminEvento);
router.delete("/", verificarToken, autorizarRol("saadmin"), quitarAdminEvento);
router.get("/:evento_id", verificarToken, autorizarRol("saadmin"), listarAdminsPorEvento);
router.get("/admin/:admin_id", verificarToken, autorizarRol("saadmin"), listarEventosPorAdmin);


export default router;
